import { mockClient } from "aws-sdk-client-mock";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import type { PostConfirmationConfirmSignUpTriggerEvent, Context } from "aws-lambda";
import { handler } from "../index";

const ddbMock = mockClient(DynamoDBDocumentClient);

function buildEvent(
  name: string,
  email: string
): PostConfirmationConfirmSignUpTriggerEvent {
  return {
    version: "1",
    region: "ap-southeast-1",
    userPoolId: "pool-1",
    userName: "user-1",
    triggerSource: "PostConfirmation_ConfirmSignUp",
    callerContext: { awsSdkVersion: "", clientId: "" },
    request: {
      userAttributes: {
        sub: "user-1",
        email,
        name,
        phone_number: "",
      },
    },
    response: {},
  } as unknown as PostConfirmationConfirmSignUpTriggerEvent;
}

beforeEach(() => {
  ddbMock.reset();
  ddbMock.on(PutCommand).resolves({});
});

describe("auth-post-confirmation handler", () => {
  it("falls back name to the email's local part when Cognito name attribute is empty", async () => {
    await handler(buildEvent("", "jane.doe@example.com"), {} as Context, () => {});

    const putCall = ddbMock.commandCalls(PutCommand)[0];
    expect(putCall.args[0].input.Item?.name).toBe("jane.doe");
  });

  it("keeps the Cognito name attribute when present", async () => {
    await handler(buildEvent("Jane Doe", "jane@example.com"), {} as Context, () => {});

    const putCall = ddbMock.commandCalls(PutCommand)[0];
    expect(putCall.args[0].input.Item?.name).toBe("Jane Doe");
  });
});
