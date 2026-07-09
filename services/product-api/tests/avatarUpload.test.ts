import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import type { APIGatewayProxyEvent, Context } from "aws-lambda";
import { handler } from "../index";

jest.mock("@aws-sdk/s3-presigned-post", () => ({
  createPresignedPost: jest.fn(),
}));

const mockCreatePresignedPost = createPresignedPost as jest.Mock;

function buildEvent(overrides: Partial<APIGatewayProxyEvent> = {}): APIGatewayProxyEvent {
  return {
    resource: "/users/profile/avatar-upload-url",
    httpMethod: "POST",
    path: "/users/profile/avatar-upload-url",
    pathParameters: null,
    body: JSON.stringify({ fileType: "image/jpeg" }),
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
  mockCreatePresignedPost.mockReset();
  mockCreatePresignedPost.mockResolvedValue({
    url: "https://test-bucket.s3.amazonaws.com/",
    fields: { key: "mock-key", "Content-Type": "image/jpeg" },
  });
});

describe("POST /users/profile/avatar-upload-url", () => {
  it("returns 401 when not authenticated", async () => {
    const result = await handler(
      buildEvent({ requestContext: { authorizer: undefined } as any }),
      {} as Context,
      () => {}
    );
    expect(result!.statusCode).toBe(401);
  });

  it("rejects an unsupported file type", async () => {
    const result = await handler(
      buildEvent({ body: JSON.stringify({ fileType: "image/gif" }) }),
      {} as Context,
      () => {}
    );
    expect(result!.statusCode).toBe(400);
  });

  it("returns a presigned upload URL keyed under users/{userId}/profile/", async () => {
    const result = await handler(buildEvent(), {} as Context, () => {});

    expect(result!.statusCode).toBe(200);
    const body = JSON.parse(result!.body);
    expect(body.uploadUrl).toBe("https://test-bucket.s3.amazonaws.com/");
    expect(mockCreatePresignedPost).toHaveBeenCalledTimes(1);

    const presignArgs = mockCreatePresignedPost.mock.calls[0][1];
    expect(presignArgs.Key).toMatch(/^users\/user-1\/profile\/.+\.jpg$/);
  });
});
