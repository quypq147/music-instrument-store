import type { APIGatewayProxyHandler, APIGatewayProxyResult } from "aws-lambda";
import Stripe from "stripe";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, TransactWriteCommand } from "@aws-sdk/lib-dynamodb";
import { createHmac } from "crypto";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || "";
const tableName = process.env.TABLE_NAME || "";
const momoPartnerCode = process.env.MOMO_PARTNER_CODE || "";
const momoAccessKey = process.env.MOMO_ACCESS_KEY || "";
const momoSecretKey = process.env.MOMO_SECRET_KEY || "";
const momoApiUrl = process.env.MOMO_API_URL || "https://test-payment.momo.vn/v2/gateway/api/create";
const momoRedirectUrl = process.env.MOMO_REDIRECT_URL || "";
const momoIpnUrl = process.env.MOMO_IPN_URL || "";

const ddbClient = new DynamoDBClient({});
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

    // Thực hiện giữ chỗ tồn kho (Inventory Reservation) bằng TransactWrite
    if (tableName) {
      const transactItems = items.map((item: { productId: string | number; quantity?: number }) => {
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
              ":now": new Date().toISOString(),
            },
          },
        };
      });

      try {
        await ddbDocClient.send(
          new TransactWriteCommand({
            TransactItems: transactItems,
          })
        );
        console.log(`Successfully reserved inventory for items. Idempotency Key: ${resolvedIdempotencyKey}`);
      } catch (error: any) {
        console.error("Inventory reservation failed:", error);
        
        // Trả về lỗi chi tiết nếu kiểm tra điều kiện thất bại (hết hàng)
        if (error.name === "TransactionCanceledException" || error.message?.includes("ConditionalCheckFailed")) {
          return jsonResponse(400, {
            message: "Một hoặc nhiều sản phẩm đã hết hàng hoặc không đủ số lượng tồn kho. Vui lòng kiểm tra lại giỏ hàng!",
            error: "InventoryConflict",
          });
        }
        
        return jsonResponse(500, {
          message: "Lỗi hệ thống khi xử lý tồn kho đơn hàng.",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    const mockOrderId = resolvedIdempotencyKey.replace("idemp_", "");

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

      const response = await fetch(momoApiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(momoPayload)
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
