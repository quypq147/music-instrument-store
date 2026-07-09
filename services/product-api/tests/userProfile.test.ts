import { mockClient } from "aws-sdk-client-mock";
import { DynamoDBDocumentClient, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import type { APIGatewayProxyEvent, Context } from "aws-lambda";
import { handler } from "../index";

const ddbMock = mockClient(DynamoDBDocumentClient);

function buildEvent(overrides: Partial<APIGatewayProxyEvent> = {}): APIGatewayProxyEvent {
  return {
    resource: "/users/profile",
    httpMethod: "PUT",
    path: "/users/profile",
    pathParameters: null,
    body: JSON.stringify({}),
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

describe("PUT /users/profile", () => {
  it("uploading only an avatar does not wipe out the existing name/phone/address", async () => {
    ddbMock.on(GetCommand).resolves({
      Item: {
        PK: "USER#user-1",
        SK: "PROFILE",
        userId: "user-1",
        email: "user1@example.com",
        name: "Nguyen Van A",
        phone: "0900000000",
        address: "123 Main St",
      },
    });
    ddbMock.on(PutCommand).resolves({});

    const result = await handler(
      buildEvent({ body: JSON.stringify({ avatarUrl: "https://bucket.s3.amazonaws.com/users/user-1/profile/x.jpg" }) }),
      {} as Context,
      () => {}
    );

    expect(result!.statusCode).toBe(200);
    const { profile } = JSON.parse(result!.body);
    expect(profile.name).toBe("Nguyen Van A");
    expect(profile.phone).toBe("0900000000");
    expect(profile.address).toBe("123 Main St");
    expect(profile.avatarUrl).toBe("https://bucket.s3.amazonaws.com/users/user-1/profile/x.jpg");
  });

  it("saving name/phone/address does not wipe out an existing avatarUrl", async () => {
    ddbMock.on(GetCommand).resolves({
      Item: {
        PK: "USER#user-1",
        SK: "PROFILE",
        userId: "user-1",
        email: "user1@example.com",
        name: "Old Name",
        phone: "",
        address: "",
        avatarUrl: "https://bucket.s3.amazonaws.com/users/user-1/profile/existing.jpg",
      },
    });
    ddbMock.on(PutCommand).resolves({});

    const result = await handler(
      buildEvent({ body: JSON.stringify({ name: "New Name", phone: "0911111111", address: "456 Side St" }) }),
      {} as Context,
      () => {}
    );

    expect(result!.statusCode).toBe(200);
    const { profile } = JSON.parse(result!.body);
    expect(profile.name).toBe("New Name");
    expect(profile.avatarUrl).toBe("https://bucket.s3.amazonaws.com/users/user-1/profile/existing.jpg");
  });

  it("preserves the existing role and ignores any role sent in the body", async () => {
    ddbMock.on(GetCommand).resolves({
      Item: {
        PK: "USER#user-1",
        SK: "PROFILE",
        userId: "user-1",
        email: "user1@example.com",
        name: "Nguyen Van A",
        phone: "",
        address: "",
        role: "Admin",
      },
    });
    ddbMock.on(PutCommand).resolves({});

    const result = await handler(
      buildEvent({ body: JSON.stringify({ name: "Updated Name", role: "Admin" }) }),
      {} as Context,
      () => {}
    );

    expect(result!.statusCode).toBe(200);
    const { profile } = JSON.parse(result!.body);
    expect(profile.role).toBe("Admin");

    const putCall = ddbMock.commandCalls(PutCommand)[0];
    expect(putCall.args[0].input.Item?.role).toBe("Admin");
  });

  it("does not let a self-service update grant a role that didn't already exist", async () => {
    ddbMock.on(GetCommand).resolves({
      Item: {
        PK: "USER#user-1",
        SK: "PROFILE",
        userId: "user-1",
        email: "user1@example.com",
        name: "Nguyen Van A",
        phone: "",
        address: "",
      },
    });
    ddbMock.on(PutCommand).resolves({});

    const result = await handler(
      buildEvent({ body: JSON.stringify({ name: "Updated Name", role: "Admin" }) }),
      {} as Context,
      () => {}
    );

    expect(result!.statusCode).toBe(200);
    const { profile } = JSON.parse(result!.body);
    expect(profile.role).toBeUndefined();
  });

  it("GET returns avatarUrl: \"\" in the default profile when none exists yet", async () => {
    ddbMock.on(GetCommand).resolves({ Item: undefined });

    const result = await handler(
      buildEvent({ httpMethod: "GET", body: null }),
      {} as Context,
      () => {}
    );

    expect(result!.statusCode).toBe(200);
    const { profile } = JSON.parse(result!.body);
    expect(profile.avatarUrl).toBe("");
  });
});
