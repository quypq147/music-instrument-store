import { NextRequest, NextResponse } from "next/server";
import { ddbDocClient, TABLE_NAME } from "@/lib/dynamodb";
import { GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    console.log("[Local Momo Webhook] Received payload:", payload);

    const { orderId, resultCode } = payload;
    if (orderId && Number(resultCode) === 0) {
      console.log(`[Local Momo Webhook] Updating order status to "Chờ lấy đơn" for order: ${orderId}`);
      
      // 1. Update order status to "Chờ lấy đơn"
      await ddbDocClient.send(
        new UpdateCommand({
          TableName: TABLE_NAME,
          Key: {
            PK: `ORDER#${orderId}`,
            SK: "METADATA",
          },
          UpdateExpression: "SET #status = :status, updatedAt = :now",
          ExpressionAttributeNames: {
            "#status": "status",
          },
          ExpressionAttributeValues: {
            ":status": "Chờ lấy đơn",
            ":now": new Date().toISOString(),
          },
        })
      );

      // 2. Release inventory reservation
      const getOrderResult = await ddbDocClient.send(
        new GetCommand({
          TableName: TABLE_NAME,
          Key: {
            PK: `ORDER#${orderId}`,
            SK: "METADATA",
          },
        })
      );
      
      const order = getOrderResult.Item;
      if (order && Array.isArray(order.items)) {
        for (const item of order.items) {
          const productId = String(item.productId);
          const qty = item.quantity || 1;
          
          await ddbDocClient.send(
            new UpdateCommand({
              TableName: TABLE_NAME,
              Key: {
                PK: `PRODUCT#${productId}`,
                SK: "INVENTORY",
              },
              UpdateExpression: "SET reserved = reserved - :qty",
              ExpressionAttributeValues: {
                ":qty": qty,
              },
            })
          );
        }
      }
      return NextResponse.json({ received: true, processed: true });
    }

    return NextResponse.json({ received: true, processed: false });
  } catch (error) {
    console.error("[Local Momo Webhook] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
