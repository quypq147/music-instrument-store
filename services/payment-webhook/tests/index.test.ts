import { mockClient } from "aws-sdk-client-mock";
import {
  DynamoDBDocumentClient,
  GetCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { EventBridgeClient, PutEventsCommand } from "@aws-sdk/client-eventbridge";
import { createHmac } from "crypto";
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
const ebMock = mockClient(EventBridgeClient);

const WEBHOOK_SECRET = "whsec_test_secret";

// Tạo header Stripe-Signature hợp lệ giống hệt thuật toán của Stripe:
// HMAC-SHA256 trên "<timestamp>.<rawBody>".
function stripeSignature(body: string, timestampSeconds?: number): string {
  const ts = timestampSeconds ?? Math.floor(Date.now() / 1000);
  const signature = createHmac("sha256", WEBHOOK_SECRET)
    .update(`${ts}.${body}`, "utf8")
    .digest("hex");
  return `t=${ts},v1=${signature}`;
}

function buildEvent(overrides: Partial<APIGatewayProxyEvent> = {}): APIGatewayProxyEvent {
  return {
    httpMethod: "POST",
    path: "/webhooks/stripe",
    headers: {},
    body: null,
    isBase64Encoded: false,
    requestContext: { requestId: "req-test-1" },
    ...overrides,
  } as unknown as APIGatewayProxyEvent;
}

async function invoke(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  return (await handler(event, {} as Context, () => undefined)) as APIGatewayProxyResult;
}

beforeEach(() => {
  ddbMock.reset();
  ebMock.reset();
  ddbMock.on(UpdateCommand).resolves({});
  ddbMock.on(GetCommand).resolves({ Item: undefined });
  ebMock.on(PutEventsCommand).resolves({ FailedEntryCount: 0, Entries: [] });
});

describe("routing chung", () => {
  it("từ chối method khác POST với 405", async () => {
    const res = await invoke(buildEvent({ httpMethod: "GET" }));
    expect(res.statusCode).toBe(405);
  });

  it("trả 404 cho route không tồn tại", async () => {
    const body = JSON.stringify({ type: "noop" });
    const res = await invoke(
      buildEvent({ path: "/webhooks/khac", body })
    );
    expect(res.statusCode).toBe(404);
  });
});

describe("Stripe webhook — xác thực chữ ký (CHK-05)", () => {
  it("thiếu header chữ ký → 400", async () => {
    const res = await invoke(
      buildEvent({ body: JSON.stringify({ type: "payment_intent.succeeded" }) })
    );
    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).message).toBe("Missing Stripe signature");
  });

  it("chữ ký sai → 400, không xử lý đơn", async () => {
    const body = JSON.stringify({ type: "payment_intent.succeeded" });
    const res = await invoke(
      buildEvent({
        body,
        headers: { "stripe-signature": "t=123,v1=deadbeef" },
      })
    );
    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).message).toBe("Invalid Stripe signature");
    expect(ddbMock.commandCalls(UpdateCommand)).toHaveLength(0);
    expect(ebMock.commandCalls(PutEventsCommand)).toHaveLength(0);
  });

  it("chữ ký đúng nhưng timestamp quá cũ (replay) → 400", async () => {
    const body = JSON.stringify({ type: "payment_intent.succeeded" });
    const staleTs = Math.floor(Date.now() / 1000) - 3600;
    const res = await invoke(
      buildEvent({
        body,
        headers: { "stripe-signature": stripeSignature(body, staleTs) },
      })
    );
    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).message).toBe("Invalid Stripe signature");
  });

  it("hỗ trợ body base64 (API Gateway proxy) với chữ ký tính trên raw body", async () => {
    const body = JSON.stringify({ type: "irrelevant.event" });
    const res = await invoke(
      buildEvent({
        body: Buffer.from(body, "utf8").toString("base64"),
        isBase64Encoded: true,
        headers: { "stripe-signature": stripeSignature(body) },
      })
    );
    expect(res.statusCode).toBe(200);
  });
});

describe("Stripe webhook — thanh toán thành công", () => {
  const orderId = "ord-123";
  const payload = {
    type: "payment_intent.succeeded",
    data: { object: { metadata: { orderId }, amount: 500000 } },
  };

  beforeEach(() => {
    // Đơn hàng có sẵn trong DB
    ddbMock
      .on(GetCommand, { TableName: "test-table", Key: { PK: `ORDER#${orderId}`, SK: "METADATA" } })
      .resolves({ Item: { id: orderId, email: "kh@example.com", totalPrice: 500000 } });
    // Marker giữ chỗ tồn kho đang RESERVED với 2 sản phẩm
    ddbMock
      .on(GetCommand, { TableName: "test-table", Key: { PK: `RESERVATION#${orderId}`, SK: "METADATA" } })
      .resolves({ Item: { status: "RESERVED", items: [{ productId: "p1", quantity: 2 }] } });
  });

  it("cập nhật trạng thái đơn, trừ reserved và bắn PaymentSucceeded", async () => {
    const body = JSON.stringify(payload);
    const res = await invoke(
      buildEvent({ body, headers: { "stripe-signature": stripeSignature(body) } })
    );

    expect(res.statusCode).toBe(200);

    const updates = ddbMock.commandCalls(UpdateCommand).map((c) => c.args[0].input);
    // 1. Đơn chuyển "Chờ lấy đơn"
    expect(updates).toContainEqual(
      expect.objectContaining({
        Key: { PK: `ORDER#${orderId}`, SK: "METADATA" },
        ExpressionAttributeValues: expect.objectContaining({ ":status": "Chờ lấy đơn" }),
      })
    );
    // 2. Marker RESERVED -> COMMITTED
    expect(updates).toContainEqual(
      expect.objectContaining({
        Key: { PK: `RESERVATION#${orderId}`, SK: "METADATA" },
        ExpressionAttributeValues: expect.objectContaining({ ":to": "COMMITTED" }),
      })
    );
    // 3. Trừ reserved của sản phẩm
    expect(updates).toContainEqual(
      expect.objectContaining({
        Key: { PK: "PRODUCT#p1", SK: "INVENTORY" },
        UpdateExpression: "SET reserved = reserved - :qty",
        ExpressionAttributeValues: { ":qty": 2 },
      })
    );

    // 4. Sự kiện PaymentSucceeded lên EventBridge
    const ebCalls = ebMock.commandCalls(PutEventsCommand);
    expect(ebCalls).toHaveLength(1);
    const entry = ebCalls[0].args[0].input.Entries?.[0];
    expect(entry?.DetailType).toBe("PaymentSucceeded");
    expect(entry?.EventBusName).toBe("test-bus");
    const detail = JSON.parse(entry?.Detail || "{}");
    expect(detail.id).toBe(orderId);
    expect(detail.amount).toBe(500000);
    expect(detail.email).toBe("kh@example.com");
  });

  it("webhook gửi lặp (marker đã COMMITTED) không trừ reserved lần hai", async () => {
    // Conditional update RESERVED -> COMMITTED thất bại vì đã COMMITTED trước đó
    ddbMock
      .on(UpdateCommand, { Key: { PK: `RESERVATION#${orderId}`, SK: "METADATA" } })
      .rejects(
        Object.assign(new Error("The conditional request failed"), {
          name: "ConditionalCheckFailedException",
        })
      );
    ddbMock
      .on(GetCommand, { TableName: "test-table", Key: { PK: `RESERVATION#${orderId}`, SK: "METADATA" } })
      .resolves({ Item: { status: "COMMITTED", items: [{ productId: "p1", quantity: 2 }] } });

    const body = JSON.stringify(payload);
    const res = await invoke(
      buildEvent({ body, headers: { "stripe-signature": stripeSignature(body) } })
    );

    expect(res.statusCode).toBe(200);
    const productUpdates = ddbMock
      .commandCalls(UpdateCommand)
      .map((c) => c.args[0].input)
      .filter((i) => String((i.Key as Record<string, unknown>)?.PK).startsWith("PRODUCT#"));
    expect(productUpdates).toHaveLength(0);
  });
});

describe("Stripe webhook — thanh toán thất bại hoàn kho", () => {
  const orderId = "ord-456";

  it("payment_intent.payment_failed → hoàn stock và nhả reserved", async () => {
    ddbMock
      .on(GetCommand, { TableName: "test-table", Key: { PK: `RESERVATION#${orderId}`, SK: "METADATA" } })
      .resolves({ Item: { status: "RELEASED", items: [{ productId: "p9", quantity: 3 }] } });

    const body = JSON.stringify({
      type: "payment_intent.payment_failed",
      data: { object: { metadata: { orderId } } },
    });
    const res = await invoke(
      buildEvent({ body, headers: { "stripe-signature": stripeSignature(body) } })
    );

    expect(res.statusCode).toBe(200);
    const updates = ddbMock.commandCalls(UpdateCommand).map((c) => c.args[0].input);
    // Marker RESERVED -> RELEASED
    expect(updates).toContainEqual(
      expect.objectContaining({
        Key: { PK: `RESERVATION#${orderId}`, SK: "METADATA" },
        ExpressionAttributeValues: expect.objectContaining({ ":to": "RELEASED" }),
      })
    );
    // Hoàn kho: stock += qty, reserved -= qty
    expect(updates).toContainEqual(
      expect.objectContaining({
        Key: { PK: "PRODUCT#p9", SK: "INVENTORY" },
        UpdateExpression: "SET stock = stock + :qty, reserved = reserved - :qty, updatedAt = :now",
        ExpressionAttributeValues: expect.objectContaining({ ":qty": 3 }),
      })
    );
    // Không bắn PaymentSucceeded khi thất bại
    expect(ebMock.commandCalls(PutEventsCommand)).toHaveLength(0);
  });
});

describe("Momo webhook (mock mode)", () => {
  it("resultCode = 0 → xử lý thanh toán thành công", async () => {
    const res = await invoke(
      buildEvent({
        path: "/webhooks/momo",
        body: JSON.stringify({ orderId: "ord-momo-1", resultCode: 0, amount: 200000 }),
      })
    );

    expect(res.statusCode).toBe(200);
    const updates = ddbMock.commandCalls(UpdateCommand).map((c) => c.args[0].input);
    expect(updates).toContainEqual(
      expect.objectContaining({
        Key: { PK: "ORDER#ord-momo-1", SK: "METADATA" },
        ExpressionAttributeValues: expect.objectContaining({ ":status": "Chờ lấy đơn" }),
      })
    );
  });

  it("resultCode khác 0 → đi nhánh hoàn kho, không cập nhật trạng thái đơn", async () => {
    const res = await invoke(
      buildEvent({
        path: "/webhooks/momo",
        body: JSON.stringify({ orderId: "ord-momo-2", resultCode: 1006 }),
      })
    );

    expect(res.statusCode).toBe(200);
    const orderStatusUpdates = ddbMock
      .commandCalls(UpdateCommand)
      .map((c) => c.args[0].input)
      .filter((i) => String((i.Key as Record<string, unknown>)?.PK).startsWith("ORDER#"));
    expect(orderStatusUpdates).toHaveLength(0);
  });
});
