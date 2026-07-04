import type { APIGatewayProxyHandler, APIGatewayProxyResult } from "aws-lambda";
import { randomUUID } from "node:crypto";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";

type OrderCustomer = {
  name: string;
  phone: string;
  address: string;
  note?: string;
};

type OrderItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
};

type CreateOrderRequest = {
  customer: OrderCustomer;
  items: OrderItem[];
  paymentMethod: string;
  userId?: string;
  email?: string;
  couponCode?: string;
};

const sqs = new SQSClient({});
const queueUrl = process.env.ORDER_QUEUE_URL;
const tableName = process.env.TABLE_NAME;
const dynamoDb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const corsHeaders = {
  "Access-Control-Allow-Origin": process.env.CORS_ALLOW_ORIGIN ?? "*",
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

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const isCustomer = (value: unknown): value is OrderCustomer => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.name === "string" &&
    typeof value.phone === "string" &&
    typeof value.address === "string" &&
    (value.note === undefined || typeof value.note === "string")
  );
};

const isOrderItem = (value: unknown): value is OrderItem => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.productId === "string" &&
    typeof value.name === "string" &&
    typeof value.price === "number" &&
    Number.isFinite(value.price) &&
    typeof value.quantity === "number" &&
    Number.isInteger(value.quantity) &&
    value.quantity > 0 &&
    (value.imageUrl === undefined || typeof value.imageUrl === "string")
  );
};

const parseRequest = (body: string | null): CreateOrderRequest => {
  if (!body) {
    throw new Error("Request body is required.");
  }

  const parsed: unknown = JSON.parse(body);

  if (!isRecord(parsed)) {
    throw new Error("Request body must be a JSON object.");
  }

  if (!isCustomer(parsed.customer)) {
    throw new Error("customer.name, customer.phone, and customer.address are required.");
  }

  if (!Array.isArray(parsed.items) || parsed.items.length === 0) {
    throw new Error("items must be a non-empty array.");
  }

  if (!parsed.items.every(isOrderItem)) {
    throw new Error("Every item must include productId, name, price, and quantity.");
  }

  if (typeof parsed.paymentMethod !== "string" || !parsed.paymentMethod.trim()) {
    throw new Error("paymentMethod is required.");
  }

  return {
    customer: parsed.customer,
    items: parsed.items,
    paymentMethod: parsed.paymentMethod,
    userId: typeof parsed.userId === "string" ? parsed.userId : undefined,
    email: typeof parsed.email === "string" ? parsed.email : undefined,
    couponCode: typeof parsed.couponCode === "string" && parsed.couponCode.trim() ? parsed.couponCode.trim() : undefined,
  };
};

class CouponError extends Error {}

// Validate và áp dụng coupon, tăng usageCount atomically để chặn race condition vượt usageLimit.
// Trả về số tiền được giảm (VND); ném CouponError nếu mã không hợp lệ.
const applyCoupon = async (couponCode: string, totalPrice: number): Promise<number> => {
  if (!tableName) {
    throw new CouponError("Hệ thống chưa cấu hình để áp dụng mã giảm giá.");
  }

  const result = await dynamoDb.send(
    new GetCommand({
      TableName: tableName,
      Key: {
        PK: `COUPON#${couponCode}`,
        SK: "METADATA",
      },
    })
  );

  const coupon = result.Item;
  if (!coupon) {
    throw new CouponError("Mã giảm giá không tồn tại.");
  }

  const now = new Date();
  const isExpired =
    (coupon.validFrom && now < new Date(coupon.validFrom)) ||
    (coupon.validUntil && now > new Date(coupon.validUntil));
  const isExhausted = typeof coupon.usageLimit === "number" && coupon.usageCount >= coupon.usageLimit;

  if (!coupon.isActive || isExpired || isExhausted) {
    throw new CouponError("Mã giảm giá không còn hiệu lực.");
  }

  if (coupon.minOrderValue && totalPrice < coupon.minOrderValue) {
    throw new CouponError(`Đơn hàng cần tối thiểu ${coupon.minOrderValue.toLocaleString("vi-VN")}đ để áp dụng mã này.`);
  }

  const discountAmount =
    coupon.discountType === "percentage"
      ? Math.round((totalPrice * coupon.discountValue) / 100)
      : Math.min(coupon.discountValue, totalPrice);

  try {
    await dynamoDb.send(
      new UpdateCommand({
        TableName: tableName,
        Key: {
          PK: `COUPON#${couponCode}`,
          SK: "METADATA",
        },
        UpdateExpression: "ADD usageCount :one",
        ConditionExpression:
          "attribute_not_exists(usageLimit) OR usageLimit = :nullVal OR usageCount < usageLimit",
        ExpressionAttributeValues: {
          ":one": 1,
          ":nullVal": null,
        },
      })
    );
  } catch (err: any) {
    if (err?.name === "ConditionalCheckFailedException") {
      throw new CouponError("Mã giảm giá đã hết lượt sử dụng.");
    }
    throw err;
  }

  return discountAmount;
};

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    if (!queueUrl) {
      throw new Error("ORDER_QUEUE_URL environment variable is not set.");
    }

    if (event.httpMethod === "OPTIONS") {
      return jsonResponse(204, {});
    }

    if (event.httpMethod !== "POST") {
      return jsonResponse(405, { message: "Method Not Allowed" });
    }

    const request = parseRequest(event.body);
    const now = new Date().toISOString();
    const orderId = `ord_${Date.now()}_${randomUUID().slice(0, 8)}`;
    const totalItems = request.items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = request.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    let discountAmount = 0;
    if (request.couponCode) {
      try {
        discountAmount = await applyCoupon(request.couponCode, subtotal);
      } catch (err) {
        if (err instanceof CouponError) {
          return jsonResponse(400, { message: err.message });
        }
        throw err;
      }
    }

    const totalPrice = subtotal - discountAmount;

    const order = {
      PK: `ORDER#${orderId}`,
      SK: "METADATA",
      id: orderId,
      userId: request.userId,
      email: request.email,
      customer: request.customer,
      items: request.items,
      totalItems,
      totalPrice,
      couponCode: request.couponCode,
      discountAmount,
      paymentMethod: request.paymentMethod,
      status: "PENDING",
      createdAt: now,
      updatedAt: now,
    };

    // Đẩy đơn hàng vào SQS Queue để xử lý bất đồng bộ
    await sqs.send(
      new SendMessageCommand({
        QueueUrl: queueUrl,
        MessageBody: JSON.stringify(order),
      })
    );

    return jsonResponse(201, {
      orderId,
      status: order.status,
      totalItems,
      totalPrice,
      discountAmount,
    });
  } catch (error) {
    if (error instanceof SyntaxError || error instanceof Error) {
      const message =
        error instanceof SyntaxError ? "Request body must be valid JSON." : error.message;

      if (
        message.includes("required") ||
        message.includes("must") ||
        message.includes("Every item")
      ) {
        return jsonResponse(400, { message });
      }
    }

    console.error("CreateOrder handler failed", {
      error,
      requestId: event.requestContext.requestId,
    });

    return jsonResponse(500, { message: "Internal Server Error" });
  }
};
