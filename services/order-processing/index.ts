import type { SQSHandler } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

const dynamoDb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const tableName = process.env.TABLE_NAME;

type OrderPayload = {
  id?: string;
  orderId?: string;
  status?: string;
  [key: string]: unknown;
};

export const handler: SQSHandler = async (event) => {
  if (!tableName) {
    throw new Error("TABLE_NAME environment variable is not set");
  }

  for (const record of event.Records) {
    try {
      const order = JSON.parse(record.body) as OrderPayload;
      const orderId = order.id ?? order.orderId;

      if (!orderId) {
        throw new Error("Order payload must include an id or orderId");
      }

      const now = new Date().toISOString();

      await dynamoDb.send(
        new PutCommand({
          TableName: tableName,
          Item: {
            ...order,
            id: orderId,
            pk: `ORDER#${orderId}`,
            sk: "STATUS#PENDING",
            status: order.status ?? "PENDING",
            createdAt: order.createdAt ?? now,
            updatedAt: now,
          },
        })
      );
    } catch (error) {
      console.error("Failed to process SQS order message", {
        error,
        messageId: record.messageId,
        awsRegion: record.awsRegion,
      });

      throw error;
    }
  }
};
