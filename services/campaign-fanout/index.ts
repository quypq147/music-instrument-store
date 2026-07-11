import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { SQSClient, SendMessageBatchCommand } from "@aws-sdk/client-sqs";
import AWSXRay from "aws-xray-sdk-core";

const dynamoDb = DynamoDBDocumentClient.from(
  process.env._X_AMZN_TRACE_ID
    ? AWSXRay.captureAWSv3Client(new DynamoDBClient({}))
    : new DynamoDBClient({})
);
const sqs = process.env._X_AMZN_TRACE_ID
  ? AWSXRay.captureAWSv3Client(new SQSClient({}))
  : new SQSClient({});
const tableName = process.env.TABLE_NAME;
const campaignQueueUrl = process.env.CAMPAIGN_QUEUE_URL;

// Giới hạn của SQS SendMessageBatch là 10 message/lần gọi
const BATCH_SIZE = 10;

interface Recipient {
  email?: string;
  phone?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const handler = async (event: any): Promise<void> => {
  const detail = event.detail || event;
  const { campaignId, title, message, channel, segment } = detail;

  console.log(`[CampaignFanOut] Bắt đầu fan-out chiến dịch ${campaignId} (segment=${segment})`);

  const recipients = await collectRecipients();
  console.log(`[CampaignFanOut] Tìm được ${recipients.length} khách hàng (đã loại trùng, loại opt-out)`);

  for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
    const batch = recipients.slice(i, i + BATCH_SIZE);
    await sqs.send(
      new SendMessageBatchCommand({
        QueueUrl: campaignQueueUrl,
        Entries: batch.map((recipient, idx) => ({
          Id: `${campaignId}-${i + idx}`,
          MessageBody: JSON.stringify({ campaignId, title, message, channel, recipient }),
        })),
      })
    );
  }

  console.log(`[CampaignFanOut] Đã đẩy ${recipients.length} message vào Campaign Queue cho chiến dịch ${campaignId}`);
};

// Segment "ALL" duy nhất được hỗ trợ hiện tại: khách hàng lấy từ danh sách đơn hàng đã có (chưa có
// bảng Customer Profile riêng). Loại trùng theo email/phone, bỏ qua nếu customer.marketingOptOut = true.
async function collectRecipients(): Promise<Recipient[]> {
  const seen = new Set<string>();
  const recipients: Recipient[] = [];
  let ExclusiveStartKey: Record<string, unknown> | undefined;

  do {
    const result = await dynamoDb.send(
      new ScanCommand({
        TableName: tableName,
        FilterExpression: "begins_with(PK, :orderPrefix) AND SK = :metadataSk",
        ExpressionAttributeValues: {
          ":orderPrefix": "ORDER#",
          ":metadataSk": "METADATA",
        },
        ExclusiveStartKey,
      })
    );

    for (const item of result.Items ?? []) {
      const email = item.email as string | undefined;
      const phone = item.customer?.phone as string | undefined;
      const optOut = item.customer?.marketingOptOut === true;
      if (optOut) continue;

      const key = email || phone;
      if (!key || seen.has(key)) continue;
      seen.add(key);
      recipients.push({ email, phone });
    }

    ExclusiveStartKey = result.LastEvaluatedKey as Record<string, unknown> | undefined;
  } while (ExclusiveStartKey);

  return recipients;
}
