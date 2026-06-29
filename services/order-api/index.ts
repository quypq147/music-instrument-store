import type { APIGatewayProxyHandler, APIGatewayProxyResult } from "aws-lambda";
import { randomUUID } from "node:crypto";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";

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
};

const sqs = new SQSClient({});
const queueUrl = process.env.ORDER_QUEUE_URL;

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
  };
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
    const totalPrice = request.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

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
