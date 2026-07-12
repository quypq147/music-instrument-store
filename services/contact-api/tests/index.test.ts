import { mockClient } from "aws-sdk-client-mock";
import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";
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

const sesMock = mockClient(SESv2Client);

function buildEvent(overrides: Partial<APIGatewayProxyEvent> = {}): APIGatewayProxyEvent {
  return {
    httpMethod: "POST",
    path: "/contact",
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
  name: "Khách Test",
  phone: "0900000000",
  email: "khach@example.com",
  message: "Tôi cần tư vấn saxophone",
};

beforeEach(() => {
  sesMock.reset();
  sesMock.on(SendEmailCommand).resolves({ MessageId: "msg-1" });
});

describe("contact-api (CNT-01)", () => {
  it("OPTIONS → 204", async () => {
    const res = await invoke(buildEvent({ httpMethod: "OPTIONS" }));
    expect(res.statusCode).toBe(204);
  });

  it("method khác POST → 405", async () => {
    const res = await invoke(buildEvent({ httpMethod: "DELETE" }));
    expect(res.statusCode).toBe(405);
  });

  it("thiếu body → 400", async () => {
    const res = await invoke(buildEvent());
    expect(res.statusCode).toBe(400);
  });

  it("thiếu họ tên hoặc nội dung → 400", async () => {
    const res = await invoke(
      buildEvent({ body: JSON.stringify({ ...validBody, name: "" }) })
    );
    expect(res.statusCode).toBe(400);
    expect(sesMock.commandCalls(SendEmailCommand)).toHaveLength(0);
  });

  it("thiếu cả phone lẫn email → 400", async () => {
    const res = await invoke(
      buildEvent({
        body: JSON.stringify({ ...validBody, phone: "", email: "" }),
      })
    );
    expect(res.statusCode).toBe(400);
  });

  it("hợp lệ → gửi email SES tới inbox, reply-to là email khách, trả 200", async () => {
    const res = await invoke(buildEvent({ body: JSON.stringify(validBody) }));

    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).message).toBe("Đã gửi yêu cầu liên hệ thành công!");

    const sesInput = sesMock.commandCalls(SendEmailCommand)[0].args[0].input;
    expect(sesInput.FromEmailAddress).toBe("from@test.local");
    expect(sesInput.Destination?.ToAddresses).toEqual(["inbox@test.local"]);
    expect(sesInput.ReplyToAddresses).toEqual(["khach@example.com"]);
    expect(sesInput.Content?.Simple?.Subject?.Data).toContain("Khách Test");
  });

  it("khách không có email thì không gắn ReplyToAddresses", async () => {
    const res = await invoke(
      buildEvent({ body: JSON.stringify({ ...validBody, email: "" }) })
    );

    expect(res.statusCode).toBe(200);
    const sesInput = sesMock.commandCalls(SendEmailCommand)[0].args[0].input;
    expect(sesInput.ReplyToAddresses).toBeUndefined();
  });

  it("SES lỗi (vd. sandbox chưa verify — BUG-01) → 500 kèm thông điệp tiếng Việt", async () => {
    sesMock.on(SendEmailCommand).rejects(
      Object.assign(new Error("Email address is not verified"), {
        name: "MessageRejected",
      })
    );

    const res = await invoke(buildEvent({ body: JSON.stringify(validBody) }));

    expect(res.statusCode).toBe(500);
    expect(JSON.parse(res.body).message).toBe(
      "Không thể gửi yêu cầu liên hệ. Vui lòng thử lại sau."
    );
  });
});
