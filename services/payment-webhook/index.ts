import type { APIGatewayProxyHandler, APIGatewayProxyResult } from "aws-lambda";
import { createHmac, timingSafeEqual, randomUUID } from "crypto";
import {
  EventBridgeClient,
  PutEventsCommand,
} from "@aws-sdk/client-eventbridge";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";

import AWSXRay from "aws-xray-sdk-core";

const eventBridge = AWSXRay.captureAWSv3Client(new EventBridgeClient({}));
const eventBusName = process.env.EVENT_BUS_NAME;
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const stripeSignatureToleranceSeconds = 300;
const tableName = process.env.TABLE_NAME || "";

const momoSecretKey = process.env.MOMO_SECRET_KEY || "";
const momoAccessKey = process.env.MOMO_ACCESS_KEY || "";

const ddbClient = AWSXRay.captureAWSv3Client(new DynamoDBClient({}));
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);

const jsonResponse = (
  statusCode: number,
  body: unknown
): APIGatewayProxyResult => ({
  statusCode,
  headers: {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  },
  body: JSON.stringify(body),
});

const getRawBody = (body: string, isBase64Encoded: boolean | undefined) =>
  isBase64Encoded ? Buffer.from(body, "base64").toString("utf8") : body;

const parseStripeSignatureHeader = (header: string) =>
  header.split(",").reduce(
    (parts, segment) => {
      const [key, ...valueParts] = segment.split("=");
      const value = valueParts.join("=");

      if (key === "t") {
        parts.timestamp = value;
      }

      if (key === "v1" && value) {
        parts.signatures.push(value);
      }

      return parts;
    },
    { timestamp: undefined as string | undefined, signatures: [] as string[] }
  );

const safeHexEqual = (expectedHex: string, actualHex: string) => {
  const expected = Buffer.from(expectedHex, "hex");
  const actual = Buffer.from(actualHex, "hex");

  return expected.length === actual.length && timingSafeEqual(expected, actual);
};

const verifyStripeSignature = (
  rawBody: string,
  signatureHeader: string,
  webhookSecret: string
) => {
  const { timestamp, signatures } =
    parseStripeSignatureHeader(signatureHeader);

  if (!timestamp || signatures.length === 0) {
    return false;
  }

  const timestampSeconds = Number(timestamp);

  if (!Number.isFinite(timestampSeconds)) {
    return false;
  }

  const ageSeconds = Math.abs(Date.now() / 1000 - timestampSeconds);

  if (ageSeconds > stripeSignatureToleranceSeconds) {
    return false;
  }

  const signedPayload = `${timestamp}.${rawBody}`;
  const expectedSignature = createHmac("sha256", webhookSecret)
    .update(signedPayload, "utf8")
    .digest("hex");

  return signatures.some((signature) =>
    safeHexEqual(expectedSignature, signature)
  );
};

const verifyMomoSignature = (payload: any, secretKey: string, accessKey: string) => {
  const {
    amount,
    extraData,
    message,
    orderId,
    orderInfo,
    partnerCode,
    requestId,
    responseTime,
    resultCode,
    transId,
    signature,
  } = payload;

  const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;

  const expectedSignature = createHmac("sha256", secretKey)
    .update(rawSignature)
    .digest("hex");

  return signature === expectedSignature;
};

// Chuyển trạng thái marker giữ chỗ RESERVATION#<orderId> bằng conditional write.
// Trả về "transitioned" khi chuyển thành công, "no-marker" khi đơn không có marker
// (đơn cũ trước cơ chế này), hoặc trạng thái hiện tại của marker khi đã được xử lý rồi.
const transitionReservation = async (
  orderId: string,
  fromStatus: string,
  toStatus: string
): Promise<string> => {
  try {
    await ddbDocClient.send(
      new UpdateCommand({
        TableName: tableName,
        Key: {
          PK: `RESERVATION#${orderId}`,
          SK: "METADATA",
        },
        UpdateExpression: "SET #status = :to, updatedAt = :now",
        ConditionExpression: "attribute_exists(PK) AND #status = :from",
        ExpressionAttributeNames: { "#status": "status" },
        ExpressionAttributeValues: {
          ":to": toStatus,
          ":from": fromStatus,
          ":now": new Date().toISOString(),
        },
      })
    );
    return "transitioned";
  } catch (err: any) {
    if (err?.name !== "ConditionalCheckFailedException") {
      throw err;
    }

    const marker = await ddbDocClient.send(
      new GetCommand({
        TableName: tableName,
        Key: {
          PK: `RESERVATION#${orderId}`,
          SK: "METADATA",
        },
      })
    );
    return marker.Item ? String(marker.Item.status) : "no-marker";
  }
};

const getReservationItems = async (
  orderId: string
): Promise<{ productId: string; quantity: number }[] | undefined> => {
  const marker = await ddbDocClient.send(
    new GetCommand({
      TableName: tableName,
      Key: {
        PK: `RESERVATION#${orderId}`,
        SK: "METADATA",
      },
    })
  );
  return Array.isArray(marker.Item?.items) ? marker.Item?.items : undefined;
};

// Thanh toán fail/hủy: hoàn kho (stock += qty, reserved -= qty) đúng một lần dựa trên marker.
const processOrderPaymentFailure = async (orderId: string, paymentMethod: string) => {
  if (!tableName) return;

  console.log(`[Webhook] Processing failed/canceled payment for order: ${orderId} via ${paymentMethod}`);

  try {
    const outcome = await transitionReservation(orderId, "RESERVED", "RELEASED");
    if (outcome !== "transitioned") {
      console.log(`[Webhook] Reservation for ${orderId} is "${outcome}". Nothing to restore.`);
      return;
    }

    const items = await getReservationItems(orderId);
    if (!items || items.length === 0) {
      console.warn(`[Webhook] Reservation marker for ${orderId} has no items. Skipping stock restore.`);
      return;
    }

    for (const item of items) {
      const productId = String(item.productId);
      const qty = item.quantity || 1;

      console.log(`[Webhook] Restoring stock for product ${productId} by ${qty}`);
      await ddbDocClient.send(
        new UpdateCommand({
          TableName: tableName,
          Key: {
            PK: `PRODUCT#${productId}`,
            SK: "INVENTORY",
          },
          UpdateExpression: "SET stock = stock + :qty, reserved = reserved - :qty, updatedAt = :now",
          ExpressionAttributeValues: {
            ":qty": qty,
            ":now": new Date().toISOString(),
          },
        })
      );
    }
  } catch (err) {
    console.error(`[Webhook] Failed to restore inventory for order ${orderId}:`, err);
  }
};

const processOrderPaymentSuccess = async (orderId: string, paymentMethod: string, rawPayload: any) => {
  if (!tableName) return;
  
  console.log(`[Webhook] Processing successful payment for order: ${orderId} via ${paymentMethod}`);
  
  // 1. Update order status to "Chờ lấy đơn" in DynamoDB
  try {
    await ddbDocClient.send(
      new UpdateCommand({
        TableName: tableName,
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
    console.log(`[Webhook] Successfully updated status for order ${orderId} to "Chờ lấy đơn"`);
  } catch (err) {
    console.error(`[Webhook] Failed to update order status for ${orderId}:`, err);
  }

  // 2. Commit giữ chỗ tồn kho: chuyển marker RESERVED -> COMMITTED trước rồi mới trừ
  // reserved, để webhook gửi lặp (Stripe/Momo giao at-least-once) không trừ trùng.
  let order: Record<string, any> | undefined;
  try {
    const getOrderResult = await ddbDocClient.send(
      new GetCommand({
        TableName: tableName,
        Key: {
          PK: `ORDER#${orderId}`,
          SK: "METADATA",
        },
      })
    );
    order = getOrderResult.Item;
  } catch (err) {
    console.error(`[Webhook] Failed to load order ${orderId}:`, err);
  }

  try {
    const commitOutcome = await transitionReservation(orderId, "RESERVED", "COMMITTED");

    if (commitOutcome === "transitioned" || commitOutcome === "no-marker") {
      // "no-marker": đơn tạo trước khi có cơ chế marker — giữ hành vi cũ (release theo order items)
      const items = commitOutcome === "transitioned"
        ? await getReservationItems(orderId)
        : Array.isArray(order?.items) ? order?.items : undefined;

      if (items && items.length > 0) {
        for (const item of items) {
          const productId = String(item.productId);
          const qty = item.quantity || 1;

          console.log(`[Webhook] Deducting reserved count for product ${productId} by ${qty}`);
          await ddbDocClient.send(
            new UpdateCommand({
              TableName: tableName,
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
      } else {
        console.warn(`[Webhook] No reservation/order items found for ${orderId}. Skipping reservation release.`);
      }
    } else {
      console.log(`[Webhook] Reservation for ${orderId} already ${commitOutcome}. Skipping duplicate release.`);
    }
  } catch (err) {
    console.error(`[Webhook] Failed to release inventory reservation for order ${orderId}:`, err);
  }

  // 3. Publish Event to EventBridge (triggers notification services)
  if (eventBusName) {
    try {
      await eventBridge.send(
        new PutEventsCommand({
          Entries: [
            {
              EventBusName: eventBusName,
              Source: "com.musicstore.payment",
              DetailType: "PaymentSucceeded",
              Detail: JSON.stringify({
                eventId: randomUUID(),
                version: "1.0",
                id: orderId,
                amount: rawPayload.amount ?? rawPayload.amountPaid ?? order?.totalPrice ?? 0,
                email: order?.email,
                customer: order?.customer,
                metadata: {
                  orderId,
                  paymentMethod,
                },
                rawPayload,
              }),
            },
          ],
        })
      );
      console.log(`[Webhook] Published PaymentSucceeded event for order ${orderId}`);
    } catch (err) {
      console.error(`[Webhook] Failed to publish EventBridge event for order ${orderId}:`, err);
    }
  }
};

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    if (!eventBusName) {
      throw new Error("EVENT_BUS_NAME environment variable is not set");
    }

    if (event.httpMethod !== "POST") {
      return jsonResponse(405, { message: "Method Not Allowed" });
    }

    const path = event.path || "";

    // -------------------------------------------------------------
    // Route: /webhooks/stripe
    // -------------------------------------------------------------
    if (path.includes("/stripe")) {
      if (!stripeWebhookSecret) {
        throw new Error("STRIPE_WEBHOOK_SECRET environment variable is not set");
      }

      const signature = event.headers["stripe-signature"] ?? event.headers["Stripe-Signature"];
      if (!signature) {
        return jsonResponse(400, { message: "Missing Stripe signature" });
      }

      if (!event.body) {
        return jsonResponse(400, { message: "Missing webhook body" });
      }

      const rawBody = getRawBody(event.body, event.isBase64Encoded);
      if (!verifyStripeSignature(rawBody, signature, stripeWebhookSecret)) {
        return jsonResponse(400, { message: "Invalid Stripe signature" });
      }

      const payload = JSON.parse(rawBody);
      console.log(`[Stripe Webhook] Received event type: ${payload.type}`);

      // Support both checkout.session.completed and payment_intent.succeeded
      if (payload.type === "checkout.session.completed") {
        const session = payload.data?.object;
        const orderId = session.metadata?.orderId || session.client_reference_id;
        if (orderId) {
          await processOrderPaymentSuccess(orderId, "Stripe", session);
        }
      } else if (payload.type === "payment_intent.succeeded") {
        const paymentIntent = payload.data?.object;
        const orderId = paymentIntent.metadata?.orderId;
        if (orderId) {
          await processOrderPaymentSuccess(orderId, "Stripe", paymentIntent);
        }
      } else if (
        payload.type === "payment_intent.payment_failed" ||
        payload.type === "payment_intent.canceled"
      ) {
        const paymentIntent = payload.data?.object;
        const orderId = paymentIntent?.metadata?.orderId;
        if (orderId) {
          await processOrderPaymentFailure(orderId, "Stripe");
        }
      }

      return jsonResponse(200, { received: true });
    }

    // -------------------------------------------------------------
    // Route: /webhooks/momo
    // -------------------------------------------------------------
    if (path.includes("/momo")) {
      if (!event.body) {
        return jsonResponse(400, { message: "Missing webhook body" });
      }

      const rawBody = getRawBody(event.body, event.isBase64Encoded);
      const payload = JSON.parse(rawBody);
      console.log("[Momo Webhook] Received payload:", JSON.stringify(payload));

      const isMockMomo = !momoSecretKey || momoSecretKey.startsWith("dummy");
      if (!isMockMomo) {
        if (!verifyMomoSignature(payload, momoSecretKey, momoAccessKey)) {
          return jsonResponse(400, { message: "Invalid Momo signature" });
        }
      } else {
        console.log("[Momo Webhook] Running in mock/offline mode. Skipping signature verification.");
      }

      const { orderId, resultCode } = payload;
      if (orderId && Number(resultCode) === 0) {
        await processOrderPaymentSuccess(orderId, "Momo", payload);
      } else if (orderId) {
        console.warn(`[Momo Webhook] Payment failed: orderId=${orderId}, resultCode=${resultCode}`);
        await processOrderPaymentFailure(orderId, "Momo");
      } else {
        console.warn(`[Momo Webhook] orderId missing in payload, resultCode=${resultCode}`);
      }

      return jsonResponse(200, { received: true });
    }

    return jsonResponse(404, { message: "Route not found" });
  } catch (error) {
    console.error("Payment webhook handler failed", {
      error,
      requestId: event.requestContext.requestId,
      path: event.path,
      method: event.httpMethod,
    });

    return jsonResponse(500, { message: "Internal Server Error" });
  }
};
