import { NextRequest, NextResponse } from "next/server";
import { ddbDocClient, TABLE_NAME } from "@/lib/dynamodb";
import { GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    console.log("[Local Stripe Webhook] Received payload type:", payload.type);

    let orderId = "";

    if (payload.type === "checkout.session.completed") {
      const session = payload.data?.object;
      orderId = session.metadata?.orderId || session.client_reference_id;
    } else if (payload.type === "payment_intent.succeeded") {
      const paymentIntent = payload.data?.object;
      orderId = paymentIntent.metadata?.orderId;
    }

    if (orderId) {
      console.log(`[Local Stripe Webhook] Updating order status to "Chờ lấy đơn" for order: ${orderId}`);
      
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
    console.error("[Local Stripe Webhook] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
