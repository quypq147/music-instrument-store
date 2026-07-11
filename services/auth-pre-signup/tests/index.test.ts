import { mockClient } from "aws-sdk-client-mock";
import {
  CognitoIdentityProviderClient,
  ListUsersCommand,
  AdminLinkProviderForUserCommand,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import type { PreSignUpTriggerEvent, Context } from "aws-lambda";
import { handler, AUTO_LINKED_MARKER } from "../index";

const cognitoMock = mockClient(CognitoIdentityProviderClient);
const ddbMock = mockClient(DynamoDBDocumentClient);

function buildEvent(
  triggerSource: string,
  userName: string,
  email: string,
  name = "Jane Doe"
): PreSignUpTriggerEvent {
  return {
    version: "1",
    region: "ap-southeast-1",
    userPoolId: "pool-1",
    userName,
    triggerSource,
    callerContext: { awsSdkVersion: "", clientId: "" },
    request: {
      userAttributes: { email, name },
    },
    response: {},
  } as unknown as PreSignUpTriggerEvent;
}

const invoke = (event: PreSignUpTriggerEvent) =>
  handler(event, {} as Context, () => {});

beforeEach(() => {
  cognitoMock.reset();
  ddbMock.reset();
  ddbMock.on(PutCommand).resolves({});
});

describe("auth-pre-signup handler", () => {
  it("passes native email sign-ups through untouched", async () => {
    const event = buildEvent("PreSignUp_SignUp", "some-uuid", "jane@example.com");

    await expect(invoke(event)).resolves.toBe(event);
    expect(cognitoMock.commandCalls(ListUsersCommand)).toHaveLength(0);
  });

  it("links a federated sign-in to the existing native user and blocks the duplicate", async () => {
    cognitoMock.on(ListUsersCommand).resolves({
      Users: [{ Username: "native-uuid", UserStatus: "CONFIRMED" }],
    });
    cognitoMock.on(AdminLinkProviderForUserCommand).resolves({});

    await expect(
      invoke(buildEvent("PreSignUp_ExternalProvider", "google_115443", "jane@example.com"))
    ).rejects.toThrow(AUTO_LINKED_MARKER);

    const linkCall = cognitoMock.commandCalls(AdminLinkProviderForUserCommand)[0];
    expect(linkCall.args[0].input).toMatchObject({
      UserPoolId: "pool-1",
      DestinationUser: {
        ProviderName: "Cognito",
        ProviderAttributeValue: "native-uuid",
      },
      SourceUser: {
        ProviderName: "Google",
        ProviderAttributeName: "Cognito_Subject",
        ProviderAttributeValue: "115443",
      },
    });
    expect(cognitoMock.commandCalls(AdminCreateUserCommand)).toHaveLength(0);
  });

  it("creates a native root account (with profile) when the email is new, then links", async () => {
    cognitoMock.on(ListUsersCommand).resolves({ Users: [] });
    cognitoMock.on(AdminCreateUserCommand).resolves({
      User: {
        Username: "created-uuid",
        Attributes: [{ Name: "sub", Value: "created-sub" }],
      },
    });
    cognitoMock.on(AdminSetUserPasswordCommand).resolves({});
    cognitoMock.on(AdminLinkProviderForUserCommand).resolves({});

    await expect(
      invoke(buildEvent("PreSignUp_ExternalProvider", "facebook_10223", "new@example.com"))
    ).rejects.toThrow(AUTO_LINKED_MARKER);

    const createInput = cognitoMock.commandCalls(AdminCreateUserCommand)[0].args[0].input;
    expect(createInput.MessageAction).toBe("SUPPRESS");
    expect(createInput.UserAttributes).toEqual(
      expect.arrayContaining([
        { Name: "email", Value: "new@example.com" },
        { Name: "email_verified", Value: "true" },
        { Name: "name", Value: "Jane Doe" },
      ])
    );

    const passwordInput = cognitoMock.commandCalls(AdminSetUserPasswordCommand)[0].args[0].input;
    expect(passwordInput.Permanent).toBe(true);
    expect(passwordInput.Username).toBe("created-uuid");

    const linkInput = cognitoMock.commandCalls(AdminLinkProviderForUserCommand)[0].args[0].input;
    expect(linkInput.SourceUser?.ProviderName).toBe("Facebook");
    expect(linkInput.DestinationUser?.ProviderAttributeValue).toBe("created-uuid");

    const profileItem = ddbMock.commandCalls(PutCommand)[0].args[0].input.Item;
    expect(profileItem?.PK).toBe("USER#created-sub");
    expect(profileItem?.SK).toBe("PROFILE");
    expect(profileItem?.email).toBe("new@example.com");
  });

  it("keeps the old behavior (separate federated user) when only an unconfirmed user matches", async () => {
    cognitoMock.on(ListUsersCommand).resolves({
      Users: [{ Username: "native-uuid", UserStatus: "UNCONFIRMED" }],
    });

    const event = buildEvent("PreSignUp_ExternalProvider", "google_115443", "jane@example.com");
    await expect(invoke(event)).resolves.toBe(event);
    expect(cognitoMock.commandCalls(AdminLinkProviderForUserCommand)).toHaveLength(0);
    expect(cognitoMock.commandCalls(AdminCreateUserCommand)).toHaveLength(0);
  });

  it("fails open (no link, no block) when Cognito lookups error out", async () => {
    cognitoMock.on(ListUsersCommand).rejects(new Error("throttled"));

    const event = buildEvent("PreSignUp_ExternalProvider", "google_115443", "jane@example.com");
    await expect(invoke(event)).resolves.toBe(event);
  });
});
