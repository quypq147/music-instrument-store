import { mockClient } from "aws-sdk-client-mock";
import {
  DynamoDBDocumentClient,
  PutCommand,
  TransactWriteCommand,
} from "@aws-sdk/lib-dynamodb";
import { EventBridgeClient, PutEventsCommand } from "@aws-sdk/client-eventbridge";
import type { Context, SQSEvent } from "aws-lambda";

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

function buildSqsEvent(orders: Record<string, unknown>[]): SQSEvent {
  return {
    Records: orders.map((order, i) => ({
      messageId: `msg-${i}`,
      receiptHandle: `rh-${i}`,
      body: JSON.stringify(order),
      attributes: {},
      messageAttributes: {},
      md5OfBody: "",
      eventSource: "aws:sqs",
      eventSourceARN: "arn:aws:sqs:ap-southeast-1:000000000000:orders",
      awsRegion: "ap-southeast-1",
    })),
  } as unknown as SQSEvent;
}

async function invoke(event: SQSEvent) {
  return handler(event, {} as Context, () => undefined);
}

beforeEach(() => {
  ddbMock.reset();
  ebMock.reset();
  ddbMock.on(PutCommand).resolves({});
  ddbMock.on(TransactWriteCommand).resolves({});
  ebMock.on(PutEventsCommand).resolves({ FailedEntryCount: 0, Entries: [] });
});

describe("order-processing (CHK-06)", () => {
  it("lưu đơn PENDING với khóa GSI theo user và bắn OrderPlaced", async () => {
    await invoke(
      buildSqsEvent([
        {
          id: "ord-1",
          userId: "user-9",
          email: "kh@example.com",
          totalPrice: 750000,
          totalItems: 1,
          paymentMethod: "Stripe",
        },
      ])
    );

    const put = ddbMock.commandCalls(PutCommand)[0].args[0].input;
    expect(put.TableName).toBe("test-table");
    expect(put.Item).toEqual(
      expect.objectContaining({
        PK: "ORDER#ord-1",
        SK: "METADATA",
        GSI1PK: "USER#user-9",
        GSI1SK: "ORDER#ord-1",
        status: "PENDING",
      })
    );

    const entry = ebMock.commandCalls(PutEventsCommand)[0].args[0].input.Entries?.[0];
    expect(entry?.DetailType).toBe("OrderPlaced");
    expect(entry?.Source).toBe("com.musicstore.order");
    const detail = JSON.parse(entry?.Detail || "{}");
    expect(detail.orderId).toBe("ord-1");
    expect(detail.email).toBe("kh@example.com");
  });

  it("đơn không có userId thì không gán khóa GSI", async () => {
    await invoke(buildSqsEvent([{ orderId: "ord-2", paymentMethod: "Stripe" }]));

    const put = ddbMock.commandCalls(PutCommand)[0].args[0].input;
    expect(put.Item?.PK).toBe("ORDER#ord-2");
    expect(put.Item?.GSI1PK).toBeUndefined();
  });

  it("đơn COD trừ kho atomic bằng TransactWrite trước khi lưu", async () => {
    await invoke(
      buildSqsEvent([
        {
          id: "ord-cod-1",
          paymentMethod: "COD",
          items: [
            { productId: "p1", quantity: 2 },
            { productId: "p2", quantity: 1 },
          ],
        },
      ])
    );

    const transact = ddbMock.commandCalls(TransactWriteCommand)[0].args[0].input;
    expect(transact.TransactItems).toHaveLength(2);
    expect(transact.TransactItems?.[0]?.Update).toEqual(
      expect.objectContaining({
        Key: { PK: "PRODUCT#p1", SK: "INVENTORY" },
        ConditionExpression: "stock >= :qty",
        ExpressionAttributeValues: expect.objectContaining({ ":qty": 2 }),
      })
    );
    // Đơn vẫn được lưu sau khi trừ kho thành công
    expect(ddbMock.commandCalls(PutCommand)).toHaveLength(1);
  });

  it("đơn COD hết hàng → ném lỗi (SQS retry/DLQ), KHÔNG lưu đơn", async () => {
    ddbMock.on(TransactWriteCommand).rejects(
      Object.assign(new Error("Transaction cancelled"), {
        name: "TransactionCanceledException",
      })
    );

    await expect(
      invoke(
        buildSqsEvent([
          {
            id: "ord-cod-2",
            paymentMethod: "COD",
            items: [{ productId: "p1", quantity: 99 }],
          },
        ])
      )
    ).rejects.toThrow();

    expect(ddbMock.commandCalls(PutCommand)).toHaveLength(0);
    expect(ebMock.commandCalls(PutEventsCommand)).toHaveLength(0);
  });

  it("payload thiếu id/orderId → ném lỗi để đưa vào DLQ", async () => {
    await expect(
      invoke(buildSqsEvent([{ paymentMethod: "COD" }]))
    ).rejects.toThrow("Order payload must include an id or orderId");
  });
});
