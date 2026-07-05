import type { SQSHandler } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { EventBridgeClient, PutEventsCommand } from "@aws-sdk/client-eventbridge";

const dynamoDb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const tableName = process.env.TABLE_NAME;
const eventBridge = new EventBridgeClient({});
const eventBusName = process.env.EVENT_BUS_NAME;

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

      // Lưu đơn hàng vào DynamoDB với GSI1 để hỗ trợ truy vấn đa chiều (ví dụ: xem đơn hàng theo User)
      const gsi1pk = order.userId ? `USER#${order.userId}` : undefined;
      const gsi1sk = gsi1pk ? `ORDER#${orderId}` : undefined;

      await dynamoDb.send(
        new PutCommand({
          TableName: tableName,
          Item: {
            ...order,
            id: orderId,
            PK: `ORDER#${orderId}`,
            SK: "METADATA",
            GSI1PK: gsi1pk,
            GSI1SK: gsi1sk,
            status: order.status ?? "PENDING",
            createdAt: order.createdAt ?? now,
            updatedAt: now,
          },
        })
      );

      // Lưu ý: KHÔNG ghi BOUGHT#{productId} ở đây nữa — quyền đánh giá chỉ được cấp khi đơn
      // chuyển sang trạng thái "Đánh giá" (đã giao), xem services/product-api/index.ts route
      // PUT /orders/{id}, để tránh cho phép đánh giá khi đơn chưa thanh toán/giao hoặc đã bị hủy.

      // Bắn sự kiện OrderPlaced sang EventBridge để xử lý gửi thông báo bất đồng bộ
      if (eventBusName) {
        console.log(`Publishing OrderPlaced event for order ${orderId} to ${eventBusName}...`);
        await eventBridge.send(
          new PutEventsCommand({
            Entries: [
              {
                EventBusName: eventBusName,
                Source: "com.musicstore.order",
                DetailType: "OrderPlaced",
                Detail: JSON.stringify({
                  orderId,
                  email: order.email,
                  customer: order.customer,
                  totalPrice: order.totalPrice,
                  totalItems: order.totalItems,
                  paymentMethod: order.paymentMethod,
                }),
              },
            ],
          })
        );
      }
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
