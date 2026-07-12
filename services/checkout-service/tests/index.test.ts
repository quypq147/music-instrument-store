import { mockClient } from "aws-sdk-client-mock";
import {
  DynamoDBDocumentClient,
  TransactWriteCommand,
} from "@aws-sdk/lib-dynamodb";
import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";

jest.mock("aws-xray-sdk-core", () => ({
  __esModule: true,
  default: {
    captureAWSv3Client: (client: unknown) => client,
    captureHTTPsGlobal: () => undefined,
    capturePromise: () => undefined,
    captureAsyncFunc: (_name: string, fn: (segment?: unknown) => unknown) => fn(undefined),
    setContextMissingStrategy: () => undefined,
  },
}));

import { handler } from "../index";

const ddbMock = mockClient(DynamoDBDocumentClient);

function buildEvent(overrides: Partial<APIGatewayProxyEvent> = {}): APIGatewayProxyEvent {
  return {
    httpMethod: "POST",
    path: "/checkout",
    headers: {},
    body: null,
    requestContext: { requestId: "req-1" },
    ...overrides,
  } as unknown as APIGatewayProxyEvent;
}

async function invoke(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  return (await handler(event, {} as Context, () => undefined)) as APIGatewayProxyResult;
}

const validBody = {
  items: [
    { productId: "p1", price: 100000, quantity: 2 },
    { productId: "p2", price: 50000, quantity: 1 },
  ],
  customer: { name: "Khách Test", phone: "0900000000", address: "123 Test" },
  paymentMethod: "Stripe",
  idempotencyKey: "idemp_abc123",
};

beforeEach(() => {
  ddbMock.reset();
  ddbMock.on(TransactWriteCommand).resolves({});
});

describe("validate request (CHK-03)", () => {
  it("OPTIONS → 204 (CORS preflight)", async () => {
    const res = await invoke(buildEvent({ httpMethod: "OPTIONS" }));
    expect(res.statusCode).toBe(204);
  });

  it("method khác POST → 405", async () => {
    const res = await invoke(buildEvent({ httpMethod: "GET" }));
    expect(res.statusCode).toBe(405);
  });

  it("thiếu body → 400", async () => {
    const res = await invoke(buildEvent());
    expect(res.statusCode).toBe(400);
  });

  it("items rỗng → 400", async () => {
    const res = await invoke(
      buildEvent({ body: JSON.stringify({ ...validBody, items: [] }) })
    );
    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).message).toBe("Missing or invalid items");
  });
});

describe("giữ chỗ tồn kho + idempotency (CHK-03)", () => {
  it("giữ chỗ atomic: trừ stock từng sản phẩm và ghi marker RESERVATION cuối cùng", async () => {
    const res = await invoke(buildEvent({ body: JSON.stringify(validBody) }));

    expect(res.statusCode).toBe(200);

    const transact = ddbMock.commandCalls(TransactWriteCommand)[0].args[0].input;
    expect(transact.TransactItems).toHaveLength(3); // 2 sản phẩm + 1 marker

    expect(transact.TransactItems?.[0]?.Update).toEqual(
      expect.objectContaining({
        Key: { PK: "PRODUCT#p1", SK: "INVENTORY" },
        ConditionExpression: "stock >= :qty",
        ExpressionAttributeValues: expect.objectContaining({ ":qty": 2 }),
      })
    );

    const marker = transact.TransactItems?.[2]?.Put;
    expect(marker?.Item).toEqual(
      expect.objectContaining({
        PK: "RESERVATION#abc123",
        SK: "METADATA",
        status: "RESERVED",
        idempotencyKey: "idemp_abc123",
      })
    );

    // Tổng tiền = 100000*2 + 50000*1
    const body = JSON.parse(res.body);
    expect(body.amount).toBe(250000);
    expect(body.idempotencyKey).toBe("idemp_abc123");
    // Stripe key là dummy nên trả mock client secret gắn với idempotency key
    expect(body.isMock).toBe(true);
    expect(body.clientSecret).toContain("idemp_abc123");
  });

  it("client gửi lại cùng idempotency key (chỉ marker fail) → vẫn 200, không giữ kho lần 2", async () => {
    ddbMock.on(TransactWriteCommand).rejects(
      Object.assign(new Error("Transaction cancelled"), {
        name: "TransactionCanceledException",
        CancellationReasons: [
          { Code: "None" },
          { Code: "None" },
          { Code: "ConditionalCheckFailed" }, // chỉ marker cuối fail
        ],
      })
    );

    const res = await invoke(buildEvent({ body: JSON.stringify(validBody) }));

    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).idempotencyKey).toBe("idemp_abc123");
  });

  it("sản phẩm hết hàng (condition stock fail) → 400 InventoryConflict", async () => {
    ddbMock.on(TransactWriteCommand).rejects(
      Object.assign(new Error("Transaction cancelled"), {
        name: "TransactionCanceledException",
        CancellationReasons: [
          { Code: "ConditionalCheckFailed" }, // sản phẩm 1 hết hàng
          { Code: "None" },
          { Code: "None" },
        ],
      })
    );

    const res = await invoke(buildEvent({ body: JSON.stringify(validBody) }));

    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).error).toBe("InventoryConflict");
  });

  it("lỗi DynamoDB khác → 500", async () => {
    ddbMock.on(TransactWriteCommand).rejects(new Error("Service unavailable"));

    const res = await invoke(buildEvent({ body: JSON.stringify(validBody) }));

    expect(res.statusCode).toBe(500);
  });

  it("không gửi idempotency key → tự sinh key mới", async () => {
    const res = await invoke(
      buildEvent({
        body: JSON.stringify({ ...validBody, idempotencyKey: undefined }),
      })
    );

    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).idempotencyKey).toMatch(/^idemp_/);
  });
});

describe("Momo (mock mode)", () => {
  it("trả về payUrl giả lập khi Momo chưa cấu hình key thật", async () => {
    const res = await invoke(
      buildEvent({
        body: JSON.stringify({ ...validBody, paymentMethod: "Momo" }),
      })
    );

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.isMock).toBe(true);
    expect(body.payUrl).toContain("method=Momo");
    expect(body.amount).toBe(250000);
  });
});
