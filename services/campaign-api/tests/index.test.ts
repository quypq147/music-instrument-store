import { mockClient } from "aws-sdk-client-mock";
import {
  DynamoDBDocumentClient,
  PutCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import { EventBridgeClient, PutEventsCommand } from "@aws-sdk/client-eventbridge";
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

function buildEvent(overrides: Partial<APIGatewayProxyEvent> = {}): APIGatewayProxyEvent {
  return {
    httpMethod: "POST",
    path: "/campaigns",
    headers: {},
    body: null,
    requestContext: {
      requestId: "req-1",
      authorizer: { claims: { "cognito:groups": "Admin" } },
    },
    ...overrides,
  } as unknown as APIGatewayProxyEvent;
}

async function invoke(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  return (await handler(event, {} as Context, () => undefined)) as APIGatewayProxyResult;
}

beforeEach(() => {
  ddbMock.reset();
  ebMock.reset();
  ddbMock.on(PutCommand).resolves({});
  ddbMock.on(ScanCommand).resolves({ Items: [] });
  ebMock.on(PutEventsCommand).resolves({ FailedEntryCount: 0, Entries: [] });
});

describe("phân quyền (ADM-07)", () => {
  it("user thường (không phải Admin/Staff) → 403", async () => {
    const res = await invoke(
      buildEvent({
        requestContext: {
          requestId: "req-1",
          authorizer: { claims: { "cognito:groups": "Users" } },
        } as never,
      })
    );
    expect(res.statusCode).toBe(403);
  });

  it("không có claims → 403", async () => {
    const res = await invoke(
      buildEvent({ requestContext: { requestId: "req-1" } as never })
    );
    expect(res.statusCode).toBe(403);
  });

  it("Staff được phép truy cập", async () => {
    const res = await invoke(
      buildEvent({
        httpMethod: "GET",
        requestContext: {
          requestId: "req-1",
          authorizer: { claims: { "cognito:groups": "Staff" } },
        } as never,
      })
    );
    expect(res.statusCode).toBe(200);
  });
});

describe("tạo & liệt kê chiến dịch", () => {
  it("POST thiếu tiêu đề/nội dung → 400", async () => {
    const res = await invoke(
      buildEvent({ body: JSON.stringify({ title: "", message: "" }) })
    );
    expect(res.statusCode).toBe(400);
  });

  it("POST hợp lệ → lưu QUEUED và bắn CampaignRequested", async () => {
    const res = await invoke(
      buildEvent({
        body: JSON.stringify({
          title: "Sale hè",
          message: "Giảm 20% toàn bộ saxophone",
          channel: "BOTH",
        }),
      })
    );

    expect(res.statusCode).toBe(201);
    const campaign = JSON.parse(res.body);
    expect(campaign.status).toBe("QUEUED");
    expect(campaign.channel).toBe("BOTH");
    expect(campaign.segment).toBe("ALL");

    const put = ddbMock.commandCalls(PutCommand)[0].args[0].input;
    expect(put.Item?.PK).toBe(`CAMPAIGN#${campaign.id}`);

    const entry = ebMock.commandCalls(PutEventsCommand)[0].args[0].input.Entries?.[0];
    expect(entry?.DetailType).toBe("CampaignRequested");
    expect(JSON.parse(entry?.Detail || "{}").campaignId).toBe(campaign.id);
  });

  it("channel không hợp lệ được chuẩn hóa về EMAIL", async () => {
    const res = await invoke(
      buildEvent({
        body: JSON.stringify({ title: "T", message: "M", channel: "PIGEON" }),
      })
    );
    expect(JSON.parse(res.body).channel).toBe("EMAIL");
  });

  it("GET trả danh sách sắp xếp mới nhất trước", async () => {
    ddbMock.on(ScanCommand).resolves({
      Items: [
        { id: "c1", createdAt: "2026-01-01T00:00:00.000Z" },
        { id: "c2", createdAt: "2026-06-01T00:00:00.000Z" },
      ],
    });

    const res = await invoke(buildEvent({ httpMethod: "GET" }));

    expect(res.statusCode).toBe(200);
    const list = JSON.parse(res.body);
    expect(list.map((c: { id: string }) => c.id)).toEqual(["c2", "c1"]);
  });
});
