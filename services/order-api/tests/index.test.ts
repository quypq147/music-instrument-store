import { mockClient } from "aws-sdk-client-mock";
import {
  DynamoDBDocumentClient,
  GetCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";

jest.mock("aws-xray-sdk-core", () => ({
  __esModule: true,
  default: {
    captureAWSv3Client: (client: unknown) => client,
    captureHTTPsGlobal: () => undefined,
    capturePromise: () => undefined,
    setContextMissingStrategy: () => undefined,
  },
}));

import { handler } from "../index";

const ddbMock = mockClient(DynamoDBDocumentClient);
const sqsMock = mockClient(SQSClient);

const validItems = [
  { productId: "p1", name: "Kèn Alto", price: 100000, quantity: 2 },
  { productId: "p2", name: "Dây đeo", price: 50000, quantity: 1 },
];

const validBody = {
  customer: { name: "Khách Test", phone: "0900000000", address: "123 Test" },
  items: validItems,
  paymentMethod: "COD",
};

function buildEvent(overrides: Partial<APIGatewayProxyEvent> = {}): APIGatewayProxyEvent {
  return {
    httpMethod: "POST",
    path: "/orders",
    headers: {},
    body: JSON.stringify(validBody),
    requestContext: {
      requestId: "req-1",
      authorizer: { claims: { sub: "user-1", email: "kh@example.com" } },
    },
    ...overrides,
  } as unknown as APIGatewayProxyEvent;
}

async function invoke(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  return (await handler(event, {} as Context, () => undefined)) as APIGatewayProxyResult;
}

beforeEach(() => {
  ddbMock.reset();
  sqsMock.reset();
  // Counter mã đơn ngắn (#1001, ...)
  ddbMock
    .on(UpdateCommand, { Key: { PK: "COUNTER#ORDER", SK: "METADATA" } })
    .resolves({ Attributes: { orderSeq: 7 } });
  sqsMock.on(SendMessageCommand).resolves({ MessageId: "m-1" });
});

describe("xác thực & validate (ORD)", () => {
  it("chưa đăng nhập (không có claims) → 401, không đẩy SQS", async () => {
    const res = await invoke(
      buildEvent({
        requestContext: { requestId: "req-1", authorizer: undefined } as never,
      })
    );
    expect(res.statusCode).toBe(401);
    expect(sqsMock.commandCalls(SendMessageCommand)).toHaveLength(0);
  });

  it("OPTIONS → 204", async () => {
    const res = await invoke(buildEvent({ httpMethod: "OPTIONS" }));
    expect(res.statusCode).toBe(204);
  });

  it("thiếu customer.address → 400", async () => {
    const res = await invoke(
      buildEvent({
        body: JSON.stringify({
          ...validBody,
          customer: { name: "A", phone: "1" },
        }),
      })
    );
    expect(res.statusCode).toBe(400);
  });

  it("items rỗng → 400", async () => {
    const res = await invoke(
      buildEvent({ body: JSON.stringify({ ...validBody, items: [] }) })
    );
    expect(res.statusCode).toBe(400);
  });

  it("quantity không phải số nguyên dương → 400", async () => {
    const res = await invoke(
      buildEvent({
        body: JSON.stringify({
          ...validBody,
          items: [{ ...validItems[0], quantity: 0 }],
        }),
      })
    );
    expect(res.statusCode).toBe(400);
  });
});

describe("tạo đơn thành công", () => {
  it("đẩy đơn vào SQS với danh tính từ JWT và trả 201 kèm orderNumber", async () => {
    const res = await invoke(buildEvent());

    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body.orderNumber).toBe(1007); // 1000 + orderSeq(7)
    expect(body.totalPrice).toBe(250000);
    expect(body.totalItems).toBe(3);
    expect(body.status).toBe("PENDING");

    const msg = sqsMock.commandCalls(SendMessageCommand)[0].args[0].input;
    const order = JSON.parse(msg.MessageBody || "{}");
    // Danh tính phải lấy từ JWT, không phải từ body client
    expect(order.userId).toBe("user-1");
    expect(order.email).toBe("kh@example.com");
    expect(order.PK).toBe(`ORDER#${body.orderId}`);
  });

  it("client tự khai userId trong body sẽ bị bỏ qua (chống giả mạo)", async () => {
    const res = await invoke(
      buildEvent({
        body: JSON.stringify({ ...validBody, userId: "hacker-999" }),
      })
    );

    expect(res.statusCode).toBe(201);
    const order = JSON.parse(
      sqsMock.commandCalls(SendMessageCommand)[0].args[0].input.MessageBody || "{}"
    );
    expect(order.userId).toBe("user-1");
  });
});

describe("mã giảm giá (CHK-02)", () => {
  const couponKey = { Key: { PK: "COUPON#SALE10", SK: "METADATA" } };
  const activeCoupon = {
    isActive: true,
    discountType: "percentage",
    discountValue: 10,
    usageCount: 0,
  };

  it("coupon percentage giảm đúng 10% tổng đơn", async () => {
    ddbMock.on(GetCommand, couponKey).resolves({ Item: activeCoupon });
    ddbMock.on(UpdateCommand, couponKey).resolves({});

    const res = await invoke(
      buildEvent({ body: JSON.stringify({ ...validBody, couponCode: "SALE10" }) })
    );

    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body.discountAmount).toBe(25000); // 10% của 250000
    expect(body.totalPrice).toBe(225000);
  });

  it("coupon không tồn tại → 400, không tạo đơn", async () => {
    ddbMock.on(GetCommand, couponKey).resolves({ Item: undefined });

    const res = await invoke(
      buildEvent({ body: JSON.stringify({ ...validBody, couponCode: "SALE10" }) })
    );

    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).message).toBe("Mã giảm giá không tồn tại.");
    expect(sqsMock.commandCalls(SendMessageCommand)).toHaveLength(0);
  });

  it("coupon hết hạn → 400", async () => {
    ddbMock.on(GetCommand, couponKey).resolves({
      Item: { ...activeCoupon, validUntil: "2020-01-01T00:00:00.000Z" },
    });

    const res = await invoke(
      buildEvent({ body: JSON.stringify({ ...validBody, couponCode: "SALE10" }) })
    );

    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).message).toBe("Mã giảm giá không còn hiệu lực.");
  });

  it("đơn dưới minOrderValue → 400 kèm số tiền tối thiểu", async () => {
    ddbMock.on(GetCommand, couponKey).resolves({
      Item: { ...activeCoupon, minOrderValue: 1000000 },
    });

    const res = await invoke(
      buildEvent({ body: JSON.stringify({ ...validBody, couponCode: "SALE10" }) })
    );

    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).message).toContain("tối thiểu");
  });

  it("hết lượt dùng khi tăng usageCount (race condition) → 400", async () => {
    ddbMock.on(GetCommand, couponKey).resolves({
      Item: { ...activeCoupon, usageLimit: 5, usageCount: 4 },
    });
    ddbMock.on(UpdateCommand, couponKey).rejects(
      Object.assign(new Error("The conditional request failed"), {
        name: "ConditionalCheckFailedException",
      })
    );

    const res = await invoke(
      buildEvent({ body: JSON.stringify({ ...validBody, couponCode: "SALE10" }) })
    );

    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).message).toBe("Mã giảm giá đã hết lượt sử dụng.");
    expect(sqsMock.commandCalls(SendMessageCommand)).toHaveLength(0);
  });

  it("coupon fixed amount không vượt quá tổng đơn", async () => {
    ddbMock.on(GetCommand, couponKey).resolves({
      Item: {
        ...activeCoupon,
        discountType: "fixed",
        discountValue: 999999999,
      },
    });
    ddbMock.on(UpdateCommand, couponKey).resolves({});

    const res = await invoke(
      buildEvent({ body: JSON.stringify({ ...validBody, couponCode: "SALE10" }) })
    );

    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body.discountAmount).toBe(250000);
    expect(body.totalPrice).toBe(0);
  });
});
