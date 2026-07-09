import { mockClient } from "aws-sdk-client-mock";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";
import {
  CognitoIdentityProviderClient,
  ListUsersCommand,
  ListUsersInGroupCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import type { APIGatewayProxyEvent, Context } from "aws-lambda";
import { handler } from "../index";

const ddbMock = mockClient(DynamoDBDocumentClient);
const cognitoMock = mockClient(CognitoIdentityProviderClient);

function buildAdminListEvent(): APIGatewayProxyEvent {
  return {
    resource: "/users",
    httpMethod: "GET",
    path: "/users",
    pathParameters: null,
    body: null,
    requestContext: {
      authorizer: {
        claims: {
          sub: "admin-1",
          email: "admin@example.com",
          name: "Admin User",
          "cognito:groups": "Admin",
        },
      },
    },
  } as unknown as APIGatewayProxyEvent;
}

beforeEach(() => {
  ddbMock.reset();
  cognitoMock.reset();
  cognitoMock.on(ListUsersInGroupCommand).resolves({ Users: [] });
});

describe("GET /users (admin list)", () => {
  it("includes a Cognito user that has no DynamoDB PROFILE item yet, with name falling back to the email prefix", async () => {
    ddbMock.on(ScanCommand).resolves({ Items: [] });
    cognitoMock.on(ListUsersCommand).resolves({
      Users: [
        {
          Attributes: [
            { Name: "sub", Value: "user-without-profile" },
            { Name: "email", Value: "noprofile@example.com" },
            { Name: "name", Value: "" },
          ],
        },
      ],
    });

    const result = await handler(buildAdminListEvent(), {} as Context, () => {});
    const body = JSON.parse(result!.body);

    expect(body).toHaveLength(1);
    expect(body[0]).toMatchObject({
      userId: "user-without-profile",
      name: "noprofile",
      role: "User",
    });
  });

  it("prefers the existing DynamoDB PROFILE over the synthesized Cognito fallback", async () => {
    ddbMock.on(ScanCommand).resolves({
      Items: [
        {
          PK: "USER#user-1",
          SK: "PROFILE",
          userId: "user-1",
          email: "user1@example.com",
          name: "Real Name",
        },
      ],
    });
    cognitoMock.on(ListUsersCommand).resolves({
      Users: [
        {
          Attributes: [
            { Name: "sub", Value: "user-1" },
            { Name: "email", Value: "user1@example.com" },
            { Name: "name", Value: "" },
          ],
        },
      ],
    });

    const result = await handler(buildAdminListEvent(), {} as Context, () => {});
    const body = JSON.parse(result!.body);

    expect(body).toHaveLength(1);
    expect(body[0].name).toBe("Real Name");
  });
});
