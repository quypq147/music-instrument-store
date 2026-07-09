import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import type { APIGatewayProxyEvent, Context } from "aws-lambda";
import { handler } from "../index";

jest.mock("@aws-sdk/s3-presigned-post", () => ({
  createPresignedPost: jest.fn(),
}));

const mockCreatePresignedPost = createPresignedPost as jest.Mock;

function buildEvent(overrides: Partial<APIGatewayProxyEvent> = {}): APIGatewayProxyEvent {
  return {
    resource: "/products/{id}/image-upload-url",
    httpMethod: "POST",
    path: "/products/24/image-upload-url",
    pathParameters: { id: "24" },
    body: JSON.stringify({ fileType: "image/png" }),
    requestContext: {
      authorizer: {
        claims: {
          sub: "admin-1",
          email: "admin@example.com",
          "cognito:groups": "Admin",
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
    fields: { key: "mock-key", "Content-Type": "image/png" },
  });
});

describe("POST /products/{id}/image-upload-url", () => {
  it("returns 403 for a non-admin/staff user", async () => {
    const result = await handler(
      buildEvent({
        requestContext: {
          authorizer: { claims: { sub: "user-1", email: "user1@example.com", "cognito:groups": "" } },
        },
      } as any),
      {} as Context,
      () => {}
    );
    expect(result!.statusCode).toBe(403);
  });

  it("rejects an unsupported file type", async () => {
    const result = await handler(
      buildEvent({ body: JSON.stringify({ fileType: "image/gif" }) }),
      {} as Context,
      () => {}
    );
    expect(result!.statusCode).toBe(400);
  });

  it("returns a presigned upload URL keyed under products/{id}/ for an Admin", async () => {
    const result = await handler(buildEvent(), {} as Context, () => {});

    expect(result!.statusCode).toBe(200);
    const body = JSON.parse(result!.body);
    expect(body.uploadUrl).toBe("https://test-bucket.s3.amazonaws.com/");
    const presignArgs = mockCreatePresignedPost.mock.calls[0][1];
    expect(presignArgs.Key).toMatch(/^products\/24\/.+\.png$/);
  });

  it("returns a presigned upload URL for a Staff user", async () => {
    const result = await handler(
      buildEvent({
        requestContext: {
          authorizer: { claims: { sub: "staff-1", email: "staff1@example.com", "cognito:groups": "Staff" } },
        },
      } as any),
      {} as Context,
      () => {}
    );

    expect(result!.statusCode).toBe(200);
    const body = JSON.parse(result!.body);
    expect(body.uploadUrl).toBe("https://test-bucket.s3.amazonaws.com/");
  });
});
