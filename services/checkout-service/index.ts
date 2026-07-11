import type { APIGatewayProxyHandler, APIGatewayProxyResult } from "aws-lambda";
import Stripe from "stripe";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, TransactWriteCommand } from "@aws-sdk/lib-dynamodb";
import { createHmac } from "crypto";
import https from "https";
import AWSXRay from "aws-xray-sdk-core";

// Stripe SDK (Node) dùng module "https" gốc làm HTTP transport mặc định, nên patch global
// này giúp lời gọi tới api.stripe.com tự hiện thành node riêng trên X-Ray Application Map.
AWSXRay.captureHTTPsGlobal(https);
AWSXRay.capturePromise();

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || "";
const tableName = process.env.TABLE_NAME || "";
const momoPartnerCode = process.env.MOMO_PARTNER_CODE || "";
const momoAccessKey = process.env.MOMO_ACCESS_KEY || "";
const momoSecretKey = process.env.MOMO_SECRET_KEY || "";
const momoApiUrl = process.env.MOMO_API_URL || "https://test-payment.momo.vn/v2/gateway/api/create";
const momoRedirectUrl = process.env.MOMO_REDIRECT_URL || "";
const momoIpnUrl = process.env.MOMO_IPN_URL || "";

const ddbClient = AWSXRay.captureAWSv3Client(new DynamoDBClient({}));
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
  "Access-Control-Allow-Methods": "OPTIONS,POST",
  "Content-Type": "application/json",
};

const jsonResponse = (
  statusCode: number,
  body: unknown
): APIGatewayProxyResult => ({
  statusCode,
  headers: corsHeaders,
  body: JSON.stringify(body),
});

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    if (event.httpMethod === "OPTIONS") {
      return jsonResponse(204, {});
    }

    if (event.httpMethod !== "POST") {
      return jsonResponse(405, { message: "Method Not Allowed" });
    }

    if (!event.body) {
      return jsonResponse(400, { message: "Missing request body" });
    }

    const { items, customer, paymentMethod, idempotencyKey } = JSON.parse(event.body);

    if (!items || !Array.isArray(items) || items.length === 0) {
      return jsonResponse(400, { message: "Missing or invalid items" });
    }

    // Tính tổng tiền đơn hàng (VND)
    const totalPrice = items.reduce(
      (sum: number, item: { price: number; quantity: number }) =>
        sum + (item.price || 0) * (item.quantity || 1),
      0
    );

    // Sinh idempotency key nếu client không gửi lên
    const resolvedIdempotencyKey = idempotencyKey || `idemp_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

    const mockOrderId = resolvedIdempotencyKey.replace("idemp_", "");

    // Thực hiện giữ chỗ tồn kho (Inventory Reservation) bằng TransactWrite.
    // Marker RESERVATION#<orderId> được ghi atomic cùng transaction: nếu marker đã tồn tại
    // ở trạng thái RESERVED (client gửi lại cùng idempotency key) thì KHÔNG trừ kho lần nữa;
    // nếu marker ở trạng thái RELEASED (thanh toán trước đó fail và đã hoàn kho) thì cho phép
    // giữ chỗ lại. Webhook thanh toán dùng marker này để commit/hoàn kho đúng một lần.
    if (tableName) {
      const now = new Date().toISOString();
      const reservationItems = items.map(
        (item: { productId: string | number; quantity?: number }) => ({
          productId: String(item.productId),
          quantity: item.quantity || 1,
        })
      );

      const transactItems: any[] = items.map((item: { productId: string | number; quantity?: number }) => {
        const qty = item.quantity || 1;
        const productId = String(item.productId);
        return {
          Update: {
            TableName: tableName,
            Key: {
              PK: `PRODUCT#${productId}`,
              SK: "INVENTORY",
            },
            UpdateExpression: "SET stock = stock - :qty, reserved = reserved + :qty, updatedAt = :now",
            ConditionExpression: "stock >= :qty",
            ExpressionAttributeValues: {
              ":qty": qty,
              ":now": now,
            },
          },
        };
      });

      // Marker luôn nằm cuối transactItems để nhận diện trong CancellationReasons
      transactItems.push({
        Put: {
          TableName: tableName,
          Item: {
            PK: `RESERVATION#${mockOrderId}`,
            SK: "METADATA",
            status: "RESERVED",
            idempotencyKey: resolvedIdempotencyKey,
            items: reservationItems,
            createdAt: now,
            updatedAt: now,
          },
          ConditionExpression: "attribute_not_exists(PK) OR #status = :released",
          ExpressionAttributeNames: { "#status": "status" },
          ExpressionAttributeValues: { ":released": "RELEASED" },
        },
      });

      try {
        await ddbDocClient.send(
          new TransactWriteCommand({
            TransactItems: transactItems,
          })
        );
        console.log(`Successfully reserved inventory for items. Idempotency Key: ${resolvedIdempotencyKey}`);
      } catch (error: any) {
        const reasons = (error?.CancellationReasons ?? []) as { Code?: string }[];
        const onlyMarkerFailed =
          error?.name === "TransactionCanceledException" &&
          reasons.length === transactItems.length &&
          reasons[reasons.length - 1]?.Code === "ConditionalCheckFailed" &&
          reasons.slice(0, -1).every((r) => !r?.Code || r.Code === "None");

        if (onlyMarkerFailed) {
          // Retry của cùng một phiên thanh toán đang chờ — kho đã được giữ, đi tiếp tới
          // cổng thanh toán (Stripe idempotency key bảo đảm trả về cùng Payment Intent).
          console.log(`Reservation already exists for ${mockOrderId}, skipping duplicate inventory hold.`);
        } else if (error.name === "TransactionCanceledException" || error.message?.includes("ConditionalCheckFailed")) {
          console.error("Inventory reservation failed:", error);
          return jsonResponse(400, {
            message: "Một hoặc nhiều sản phẩm đã hết hàng hoặc không đủ số lượng tồn kho. Vui lòng kiểm tra lại giỏ hàng!",
            error: "InventoryConflict",
          });
        } else {
          console.error("Inventory reservation failed:", error);
          return jsonResponse(500, {
            message: "Lỗi hệ thống khi xử lý tồn kho đơn hàng.",
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    }

    // -------------------------------------------------------------
    // Momo Payment Integration
    // -------------------------------------------------------------
    if (paymentMethod === "Momo") {
      const isMockMomo =
        !momoPartnerCode ||
        momoPartnerCode === "TO_BE_REPLACED_IN_CONSOLE" ||
        momoPartnerCode.startsWith("dummy") ||
        !momoSecretKey;

      if (isMockMomo) {
        console.log(`Momo keys not configured. Returning mock pay URL. Idempotency Key: ${resolvedIdempotencyKey}`);
        return jsonResponse(200, {
          payUrl: `/checkout?orderId=${mockOrderId}&method=Momo&amount=${totalPrice}&isMock=true`,
          isMock: true,
          amount: totalPrice,
          idempotencyKey: resolvedIdempotencyKey,
        });
      }

      const extraData = "";
      const requestType = "captureWallet";
      const orderInfo = `Thanh toan don hang ${mockOrderId}`;
      const requestId = `req_${mockOrderId}_${Date.now()}`;
      
      const redirectUrl = momoRedirectUrl || `https://${event.headers?.Host || event.headers?.host || "localhost:3000"}/orders`;
      const ipnUrl = momoIpnUrl || `https://${event.headers?.Host || event.headers?.host || "localhost:3000"}/webhooks/momo`;

      const rawSignature = `accessKey=${momoAccessKey}&amount=${totalPrice}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${mockOrderId}&orderInfo=${orderInfo}&partnerCode=${momoPartnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;
      
      const signature = createHmac("sha256", momoSecretKey)
        .update(rawSignature)
        .digest("hex");

      const momoPayload = {
        partnerCode: momoPartnerCode,
        partnerName: "Music Store",
        storeId: "MusicStore",
        requestId,
        amount: totalPrice,
        orderId: mockOrderId,
        orderInfo,
        redirectUrl,
        ipnUrl,
        lang: "vi",
        extraData,
        requestType,
        signature
      };

      console.log("Calling Momo API with payload:", JSON.stringify(momoPayload));

      // fetch() native (Node runtime, chạy trên undici) không đi qua module "https" gốc nên
      // captureHTTPsGlobal() không bắt được — tạo subsegment thủ công để lời gọi vẫn hiện
      // trên trace timeline thay vì biến mất hoàn toàn khỏi trace.
      const response = await AWSXRay.captureAsyncFunc("MomoApiCall", async (subsegment) => {
        try {
          const res = await fetch(momoApiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(momoPayload)
          });
          return res;
        } catch (err) {
          subsegment?.addError(err as Error);
          throw err;
        } finally {
          subsegment?.close();
        }
      });

      const momoResult = await response.json();
      console.log("Momo API response:", JSON.stringify(momoResult));

      if (momoResult.resultCode === 0) {
        return jsonResponse(200, {
          payUrl: momoResult.payUrl,
          isMock: false,
          amount: totalPrice,
          idempotencyKey: resolvedIdempotencyKey,
        });
      } else {
        return jsonResponse(400, {
          message: `Momo API error: ${momoResult.message}`,
          error: momoResult,
        });
      }
    }

    // -------------------------------------------------------------
    // Stripe Payment Integration
    // -------------------------------------------------------------
    // Kiểm tra Stripe Secret Key xem có hợp lệ không
    const isMockStripe =
      !stripeSecretKey ||
      stripeSecretKey === "TO_BE_REPLACED_IN_CONSOLE" ||
      stripeSecretKey.startsWith("dummy");

    if (isMockStripe) {
      console.log(`Stripe key is not configured or mock. Returning mock client secret. Idempotency Key: ${resolvedIdempotencyKey}`);
      // Giả lập trả về mock clientSecret dựa trên idempotency key để đảm bảo tính nhất quán
      return jsonResponse(200, {
        clientSecret: `pi_mock_${resolvedIdempotencyKey}_secret_${Math.random().toString(36).substring(2, 6)}`,
        amount: totalPrice,
        currency: "vnd",
        paymentMethod: "Stripe",
        customer,
        idempotencyKey: resolvedIdempotencyKey,
        isMock: true,
      });
    }

    // Tạo Stripe Payment Intent thật với idempotency key
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16" as any,
    });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalPrice, // Stripe tính bằng VND không cần chia 100
      currency: "vnd",
      payment_method_types: ["card"],
      metadata: {
        customerName: customer?.name || "Unknown",
        customerPhone: customer?.phone || "Unknown",
        customerAddress: customer?.address || "Unknown",
        itemsCount: items.length.toString(),
        orderId: mockOrderId,
        idempotencyKey: resolvedIdempotencyKey,
      },
    }, {
      idempotencyKey: resolvedIdempotencyKey, // Ngăn chặn thanh toán trùng lặp tại Stripe
    });

    return jsonResponse(200, {
      clientSecret: paymentIntent.client_secret,
      id: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      paymentMethod: "Stripe",
      idempotencyKey: resolvedIdempotencyKey,
    });
  } catch (error) {
    console.error("Checkout handler failed", error);
    return jsonResponse(500, {
      message: "Internal Server Error",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
