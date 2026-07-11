import { mockClient } from "aws-sdk-client-mock";
import { DynamoDBDocumentClient, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";
import type { APIGatewayProxyEvent, Context } from "aws-lambda";
import { handler } from "../index";

const ddbMock = mockClient(DynamoDBDocumentClient);
const lambdaMock = mockClient(LambdaClient);

function buildEvent(overrides: Partial<APIGatewayProxyEvent> = {}): APIGatewayProxyEvent {
  return {
    resource: "/auth/device/check",
    httpMethod: "POST",
    path: "/auth/device/check",
    pathParameters: null,
    body: JSON.stringify({ deviceId: "device-abc" }),
    requestContext: {
      authorizer: {
        claims: {
          sub: "user-1",
          email: "user1@example.com",
        },
      },
    },
    ...overrides,
  } as unknown as APIGatewayProxyEvent;
}

// Payload mô phỏng notification Lambda trả về sau khi gửi email — sendOtpEmail giờ đọc
// statusCode trong payload (không chỉ FunctionError) nên mock thành công phải có payload 200.
function buildNotificationPayload(statusCode: number, status: string): Uint8Array {
  return Buffer.from(
    JSON.stringify({ statusCode, body: JSON.stringify({ status }) })
  );
}

beforeEach(() => {
  ddbMock.reset();
  lambdaMock.reset();
  lambdaMock.on(InvokeCommand).resolves({
    StatusCode: 200,
    Payload: buildNotificationPayload(200, "SENT") as never,
  });
});

describe("POST /auth/device/check", () => {
  it("returns 401 when not authenticated", async () => {
    const result = await handler(
      buildEvent({ requestContext: { authorizer: undefined } as any }),
      {} as Context,
      () => {}
    );
    expect(result!.statusCode).toBe(401);
  });

  it("trusts a device seen within the last 30 days without sending an OTP", async () => {
    ddbMock.on(GetCommand).resolves({
      Item: {
        PK: "USER#user-1",
        SK: "DEVICE#device-abc",
        deviceId: "device-abc",
        lastSeenAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
    });
    ddbMock.on(PutCommand).resolves({});

    const result = await handler(buildEvent(), {} as Context, () => {});

    expect(result!.statusCode).toBe(200);
    expect(JSON.parse(result!.body)).toEqual({ trusted: true });
    expect(lambdaMock.commandCalls(InvokeCommand)).toHaveLength(0);
  });

  it("treats a device unseen for over 30 days as untrusted and sends an OTP email", async () => {
    ddbMock.on(GetCommand).resolves({
      Item: {
        PK: "USER#user-1",
        SK: "DEVICE#device-abc",
        deviceId: "device-abc",
        lastSeenAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
      },
    });
    ddbMock.on(PutCommand).resolves({});

    const before = Date.now();
    const result = await handler(buildEvent(), {} as Context, () => {});
    const after = Date.now();

    expect(result!.statusCode).toBe(200);
    expect(JSON.parse(result!.body)).toEqual({ trusted: false });
    expect(lambdaMock.commandCalls(InvokeCommand)).toHaveLength(1);
    const invokePayload = JSON.parse(
      Buffer.from(lambdaMock.commandCalls(InvokeCommand)[0].args[0].input.Payload as Uint8Array).toString()
    );
    const emailBody = JSON.parse(invokePayload.body);
    expect(emailBody.recipient).toBe("user1@example.com");
    expect(emailBody.message).toMatch(/\d{6}/);

    const otpPut = ddbMock
      .commandCalls(PutCommand)
      .map((call) => call.args[0].input)
      .find((input) => (input.Item as Record<string, unknown>)?.SK === "OTP");
    expect(otpPut).toBeDefined();
    const otpItem = otpPut!.Item as Record<string, unknown>;
    expect(typeof otpItem.code).toBe("string");
    expect(otpItem.code).toMatch(/^\d{6}$/);
    expect(typeof otpItem.expiresAt).toBe("string");
    expect(otpItem.attempts).toBe(0);
    // ttl must be a Unix-seconds timestamp (DynamoDB TTL requirement), roughly now + 5 minutes.
    const expectedTtlSeconds = Math.floor((before + 5 * 60 * 1000) / 1000);
    expect(otpItem.ttl).toBeGreaterThanOrEqual(expectedTtlSeconds - 1);
    expect(otpItem.ttl).toBeLessThanOrEqual(Math.floor((after + 5 * 60 * 1000) / 1000) + 1);
  });

  it("treats a never-seen device as untrusted and sends an OTP email", async () => {
    ddbMock.on(GetCommand).resolves({ Item: undefined });
    ddbMock.on(PutCommand).resolves({});

    const result = await handler(buildEvent(), {} as Context, () => {});

    expect(result!.statusCode).toBe(200);
    expect(JSON.parse(result!.body)).toEqual({ trusted: false });
    expect(lambdaMock.commandCalls(InvokeCommand)).toHaveLength(1);
  });

  it("returns 400 when the device is untrusted but no email claim is present", async () => {
    ddbMock.on(GetCommand).resolves({ Item: undefined });
    ddbMock.on(PutCommand).resolves({});

    const result = await handler(
      buildEvent({
        requestContext: { authorizer: { claims: { sub: "user-1" } } } as any,
      }),
      {} as Context,
      () => {}
    );

    expect(result!.statusCode).toBe(400);
    expect(lambdaMock.commandCalls(InvokeCommand)).toHaveLength(0);
  });

  it("returns 500 when the notification Lambda fails to send the OTP email", async () => {
    ddbMock.on(GetCommand).resolves({ Item: undefined });
    ddbMock.on(PutCommand).resolves({});
    lambdaMock.on(InvokeCommand).resolves({ StatusCode: 200, FunctionError: "Unhandled" });

    const result = await handler(buildEvent(), {} as Context, () => {});

    expect(result!.statusCode).toBe(500);
    const body = JSON.parse(result!.body);
    expect(body.message).not.toMatch(/\d{6}/);
  });

  it("returns 500 when the notification Lambda reports the email was not delivered", async () => {
    ddbMock.on(GetCommand).resolves({ Item: undefined });
    ddbMock.on(PutCommand).resolves({});
    // Handler của notification bắt lỗi SES bên trong và trả statusCode lỗi trong payload,
    // không set FunctionError — trường hợp trước đây bị coi nhầm là gửi thành công.
    lambdaMock.on(InvokeCommand).resolves({
      StatusCode: 200,
      Payload: buildNotificationPayload(502, "SKIPPED") as never,
    });

    const result = await handler(buildEvent(), {} as Context, () => {});

    expect(result!.statusCode).toBe(500);
    const body = JSON.parse(result!.body);
    expect(body.message).not.toMatch(/\d{6}/);
  });

  it("returns 500 when the notification Lambda returns no payload", async () => {
    ddbMock.on(GetCommand).resolves({ Item: undefined });
    ddbMock.on(PutCommand).resolves({});
    lambdaMock.on(InvokeCommand).resolves({ StatusCode: 200 });

    const result = await handler(buildEvent(), {} as Context, () => {});

    expect(result!.statusCode).toBe(500);
  });

  it("trusts the device immediately for Admin role without OTP", async () => {
    ddbMock.on(GetCommand, {
      TableName: "test-table",
      Key: {
        PK: "USER#admin-1",
        SK: "PROFILE",
      },
    }).resolves({
      Item: {
        userId: "admin-1",
        name: "Test Admin",
      },
    });

    const result = await handler(
      buildEvent({
        requestContext: {
          authorizer: {
            claims: {
              sub: "admin-1",
              email: "admin@example.com",
              "cognito:groups": "Admin",
            },
          },
        },
      } as any),
      {} as Context,
      () => {}
    );

    expect(result!.statusCode).toBe(200);
    expect(JSON.parse(result!.body)).toEqual({ trusted: true });
    expect(ddbMock.commandCalls(GetCommand)).toHaveLength(1);
    expect(lambdaMock.commandCalls(InvokeCommand)).toHaveLength(0);
  });

  it("trusts the device immediately for Staff role without OTP", async () => {
    ddbMock.on(GetCommand, {
      TableName: "test-table",
      Key: {
        PK: "USER#staff-1",
        SK: "PROFILE",
      },
    }).resolves({
      Item: {
        userId: "staff-1",
        name: "Test Staff",
      },
    });

    const result = await handler(
      buildEvent({
        requestContext: {
          authorizer: {
            claims: {
              sub: "staff-1",
              email: "staff@example.com",
              "cognito:groups": "Staff",
            },
          },
        },
      } as any),
      {} as Context,
      () => {}
    );

    expect(result!.statusCode).toBe(200);
    expect(JSON.parse(result!.body)).toEqual({ trusted: true });
    expect(ddbMock.commandCalls(GetCommand)).toHaveLength(1);
    expect(lambdaMock.commandCalls(InvokeCommand)).toHaveLength(0);
  });
});
