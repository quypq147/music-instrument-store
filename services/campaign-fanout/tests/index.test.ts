import { mockClient } from "aws-sdk-client-mock";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { SQSClient, SendMessageBatchCommand } from "@aws-sdk/client-sqs";

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

const campaignEvent = {
  detail: {
    campaignId: "camp-1",
    title: "Sale hè",
    message: "Giảm 20%",
    channel: "EMAIL",
    segment: "ALL",
  },
};

function orderItem(email?: string, phone?: string, optOut = false) {
  return {
    PK: `ORDER#${Math.random()}`,
    SK: "METADATA",
    email,
    customer: { phone, marketingOptOut: optOut },
  };
}

beforeEach(() => {
  ddbMock.reset();
  sqsMock.reset();
  sqsMock.on(SendMessageBatchCommand).resolves({ Successful: [], Failed: [] });
});

describe("campaign-fanout (ADM-07)", () => {
  it("loại trùng người nhận theo email và bỏ qua khách opt-out", async () => {
    ddbMock.on(ScanCommand).resolves({
      Items: [
        orderItem("a@example.com", "090"),
        orderItem("a@example.com", "090"), // trùng
        orderItem("b@example.com"),
        orderItem("optout@example.com", undefined, true), // opt-out
        orderItem(undefined, undefined), // không có cách liên hệ
      ],
    });

    await handler(campaignEvent);

    const batches = sqsMock.commandCalls(SendMessageBatchCommand);
    expect(batches).toHaveLength(1);
    const entries = batches[0].args[0].input.Entries ?? [];
    expect(entries).toHaveLength(2);
    const recipients = entries.map(
      (e) => JSON.parse(e.MessageBody || "{}").recipient.email
    );
    expect(recipients).toEqual(["a@example.com", "b@example.com"]);
  });

  it("chia batch tối đa 10 message theo giới hạn SQS", async () => {
    ddbMock.on(ScanCommand).resolves({
      Items: Array.from({ length: 25 }, (_, i) => orderItem(`u${i}@example.com`)),
    });

    await handler(campaignEvent);

    const batches = sqsMock.commandCalls(SendMessageBatchCommand);
    expect(batches).toHaveLength(3); // 10 + 10 + 5
    expect(batches[0].args[0].input.Entries).toHaveLength(10);
    expect(batches[2].args[0].input.Entries).toHaveLength(5);
  });

  it("quét hết các trang DynamoDB (LastEvaluatedKey)", async () => {
    ddbMock
      .on(ScanCommand)
      .resolvesOnce({
        Items: [orderItem("page1@example.com")],
        LastEvaluatedKey: { PK: "ORDER#x", SK: "METADATA" },
      })
      .resolvesOnce({ Items: [orderItem("page2@example.com")] });

    await handler(campaignEvent);

    expect(ddbMock.commandCalls(ScanCommand)).toHaveLength(2);
    const entries = sqsMock.commandCalls(SendMessageBatchCommand)[0].args[0].input.Entries ?? [];
    expect(entries).toHaveLength(2);
  });

  it("không có người nhận thì không gọi SQS", async () => {
    ddbMock.on(ScanCommand).resolves({ Items: [] });

    await handler(campaignEvent);

    expect(sqsMock.commandCalls(SendMessageBatchCommand)).toHaveLength(0);
  });
});
