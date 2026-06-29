import type { APIGatewayProxyHandler, APIGatewayProxyResult } from "aws-lambda";
import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || "";
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
        paymentMethod: paymentMethod || "Stripe",
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
      },
    }, {
      idempotencyKey: resolvedIdempotencyKey, // Ngăn chặn thanh toán trùng lặp tại Stripe
    });

    return jsonResponse(200, {
      clientSecret: paymentIntent.client_secret,
      id: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      paymentMethod: paymentMethod || "Stripe",
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
