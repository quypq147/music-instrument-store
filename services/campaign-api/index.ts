import type { APIGatewayProxyHandler, APIGatewayProxyResult } from "aws-lambda";
import { randomUUID } from "node:crypto";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { EventBridgeClient, PutEventsCommand } from "@aws-sdk/client-eventbridge";
import AWSXRay from "aws-xray-sdk-core";

const dynamoDb = DynamoDBDocumentClient.from(
  process.env._X_AMZN_TRACE_ID
    ? AWSXRay.captureAWSv3Client(new DynamoDBClient({}))
    : new DynamoDBClient({})
);
const eventBridge = process.env._X_AMZN_TRACE_ID
  ? AWSXRay.captureAWSv3Client(new EventBridgeClient({}))
  : new EventBridgeClient({});
const tableName = process.env.TABLE_NAME;
const eventBusName = process.env.EVENT_BUS_NAME;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
  "Access-Control-Allow-Methods": "OPTIONS,GET,POST",
  "Content-Type": "application/json",
};

const jsonResponse = (statusCode: number, body: unknown): APIGatewayProxyResult => ({
  statusCode,
  headers: corsHeaders,
  body: JSON.stringify(body),
});

export const handler: APIGatewayProxyHandler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return jsonResponse(204, {});
  }

  const authorizer = event.requestContext?.authorizer as { claims?: Record<string, string> } | undefined;
  const groups = authorizer?.claims?.["cognito:groups"] || "";
  const isStaff = groups.includes("Admin") || groups.includes("Staff");
  if (!isStaff) {
    return jsonResponse(403, { message: "Forbidden: Bạn không có quyền truy cập" });
  }

  if (event.httpMethod === "GET") {
    const result = await dynamoDb.send(
      new ScanCommand({
        TableName: tableName,
        FilterExpression: "begins_with(PK, :prefix) AND SK = :metadataSk",
        ExpressionAttributeValues: {
          ":prefix": "CAMPAIGN#",
          ":metadataSk": "METADATA",
        },
      })
    );
    const campaigns = (result.Items ?? []).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return jsonResponse(200, campaigns);
  }

  if (event.httpMethod === "POST") {
    if (!event.body) {
      return jsonResponse(400, { message: "Missing request body" });
    }

    const { title, message, channel, segment } = JSON.parse(event.body);
    if (!title || !message) {
      return jsonResponse(400, { message: "Thiếu tiêu đề hoặc nội dung chiến dịch" });
    }

    const campaignId = randomUUID();
    const now = new Date().toISOString();
    const normalizedChannel = channel === "SMS" || channel === "BOTH" ? channel : "EMAIL";
    const campaign = {
      PK: `CAMPAIGN#${campaignId}`,
      SK: "METADATA",
      id: campaignId,
      title,
      message,
      channel: normalizedChannel,
      segment: segment || "ALL",
      status: "QUEUED",
      createdAt: now,
    };

    await dynamoDb.send(new PutCommand({ TableName: tableName, Item: campaign }));

    if (eventBusName) {
      await eventBridge.send(
        new PutEventsCommand({
          Entries: [
            {
              EventBusName: eventBusName,
              Source: "com.musicstore.campaign",
              DetailType: "CampaignRequested",
              Detail: JSON.stringify({
                eventId: randomUUID(),
                version: "1.0",
                campaignId,
                title,
                message,
                channel: normalizedChannel,
                segment: campaign.segment,
              }),
            },
          ],
        })
      );
    }

    return jsonResponse(201, campaign);
  }

  return jsonResponse(405, { message: "Method Not Allowed" });
};
