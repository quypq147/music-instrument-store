import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import type { NotificationLogRepository } from "../../domain/ports";
import AWSXRay from "aws-xray-sdk-core";

const THIRTY_DAYS_IN_SECONDS = 60 * 60 * 24 * 30;

// Dùng đúng schema idempotency đã định nghĩa ở docs/blueprint.md mục 8:
// PK `EVENT#{eventId}`, SK `PROCESSED`, thuộc tính { processedAt, consumer, ttl }
export class DynamoNotificationLogRepository implements NotificationLogRepository {
  constructor(
    private readonly tableName: string,
    private readonly client: DynamoDBDocumentClient = DynamoDBDocumentClient.from(
      AWSXRay.captureAWSv3Client(new DynamoDBClient({}))
    )
  ) {}

  async markProcessedIfNew(eventId: string, consumer: string): Promise<boolean> {
    try {
      await this.client.send(
        new PutCommand({
          TableName: this.tableName,
          Item: {
            PK: `EVENT#${eventId}`,
            SK: "PROCESSED",
            consumer,
            processedAt: new Date().toISOString(),
            ttl: Math.floor(Date.now() / 1000) + THIRTY_DAYS_IN_SECONDS,
          },
          ConditionExpression: "attribute_not_exists(PK)",
        })
      );
      return true;
    } catch (err) {
      if (err instanceof Error && err.name === "ConditionalCheckFailedException") {
        return false;
      }
      throw err;
    }
  }
}
