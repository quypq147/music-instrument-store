import { mockClient } from "aws-sdk-client-mock";
import { DynamoDBDocumentClient, GetCommand, PutCommand, DeleteCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import type { APIGatewayProxyEvent, Context } from "aws-lambda";
import { handler } from "../index";

const ddbMock = mockClient(DynamoDBDocumentClient);

function buildEvent(overrides: Partial<APIGatewayProxyEvent> = {}): APIGatewayProxyEvent {
  return {
    resource: "/auth/device/verify",
    httpMethod: "POST",
    path: "/auth/device/verify",
    pathParameters: null,
    body: JSON.stringify({ deviceId: "device-abc", code: "123456" }),
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

beforeEach(() => {
  ddbMock.reset();
});

describe("POST /auth/device/verify", () => {
  it("returns 400 when no OTP has been requested", async () => {
    ddbMock.on(GetCommand).resolves({ Item: undefined });

    const result = await handler(buildEvent(), {} as Context, () => {});
    expect(result!.statusCode).toBe(400);
  });

  it("returns 400 for an expired OTP", async () => {
    ddbMock.on(GetCommand).resolves({
      Item: {
        code: "123456",
        expiresAt: new Date(Date.now() - 60 * 1000).toISOString(),
      },
    });

    const result = await handler(buildEvent(), {} as Context, () => {});
    expect(result!.statusCode).toBe(400);
  });

  it("returns 400 for an incorrect code", async () => {
    ddbMock.on(GetCommand).resolves({
      Item: {
        code: "999999",
        expiresAt: new Date(Date.now() + 60 * 1000).toISOString(),
        attempts: 0,
      },
    });
    ddbMock.on(UpdateCommand).resolves({});

    const result = await handler(buildEvent(), {} as Context, () => {});
    expect(result!.statusCode).toBe(400);
  });

  it("increments the attempt counter atomically on an incorrect code", async () => {
    ddbMock.on(GetCommand).resolves({
      Item: {
        code: "999999",
        expiresAt: new Date(Date.now() + 60 * 1000).toISOString(),
        attempts: 2,
      },
    });
    ddbMock.on(UpdateCommand).resolves({});

    await handler(buildEvent(), {} as Context, () => {});

    const updateCall = ddbMock.commandCalls(UpdateCommand)[0];
    expect(updateCall.args[0].input.Key?.SK).toBe("OTP");
    expect(updateCall.args[0].input.UpdateExpression).toContain("attempts");
    // Không được ghi đè cả item (Put) — chỉ update trường attempts.
    expect(ddbMock.commandCalls(PutCommand)).toHaveLength(0);
  });

  it("locks out and deletes the OTP after the max number of incorrect attempts", async () => {
    ddbMock.on(GetCommand).resolves({
      Item: {
        code: "999999",
        expiresAt: new Date(Date.now() + 60 * 1000).toISOString(),
        attempts: 5,
      },
    });
    ddbMock.on(DeleteCommand).resolves({});

    const result = await handler(buildEvent(), {} as Context, () => {});

    expect(result!.statusCode).toBe(400);
    expect(ddbMock.commandCalls(PutCommand)).toHaveLength(0);
    const deleteCall = ddbMock.commandCalls(DeleteCommand)[0];
    expect(deleteCall.args[0].input.Key?.SK).toBe("OTP");
  });

  it("trusts the device and deletes the OTP on a correct, unexpired code", async () => {
    ddbMock.on(GetCommand).resolves({
      Item: {
        code: "123456",
        expiresAt: new Date(Date.now() + 60 * 1000).toISOString(),
      },
    });
    ddbMock.on(PutCommand).resolves({});
    ddbMock.on(DeleteCommand).resolves({});

    const result = await handler(buildEvent(), {} as Context, () => {});

    expect(result!.statusCode).toBe(200);
    expect(JSON.parse(result!.body)).toEqual({ trusted: true });

    const putCall = ddbMock.commandCalls(PutCommand)[0];
    expect(putCall.args[0].input.Item?.SK).toBe("DEVICE#device-abc");

    const deleteCall = ddbMock.commandCalls(DeleteCommand)[0];
    expect(deleteCall.args[0].input.Key?.SK).toBe("OTP");
  });

  it("verifies and trusts Admin immediately without checking OTP", async () => {
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
    expect(JSON.parse(result!.body).message).toContain("verified automatically");
    expect(ddbMock.commandCalls(GetCommand)).toHaveLength(1);
  });

  it("verifies and trusts Staff immediately without checking OTP", async () => {
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
    expect(JSON.parse(result!.body).message).toContain("verified automatically");
    expect(ddbMock.commandCalls(GetCommand)).toHaveLength(1);
  });
});
