var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// services/order-api/index.ts
var index_exports = {};
__export(index_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(index_exports);
var import_node_crypto = require("node:crypto");
var import_client_sqs = require("@aws-sdk/client-sqs");
var import_client_dynamodb = require("@aws-sdk/client-dynamodb");
var import_lib_dynamodb = require("@aws-sdk/lib-dynamodb");
var sqs = new import_client_sqs.SQSClient({});
var queueUrl = process.env.ORDER_QUEUE_URL;
var tableName = process.env.TABLE_NAME;
var dynamoDb = import_lib_dynamodb.DynamoDBDocumentClient.from(new import_client_dynamodb.DynamoDBClient({}));
var corsHeaders = {
  "Access-Control-Allow-Origin": process.env.CORS_ALLOW_ORIGIN ?? "*",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
  "Access-Control-Allow-Methods": "OPTIONS,POST",
  "Content-Type": "application/json"
};
var jsonResponse = (statusCode, body) => ({
  statusCode,
  headers: corsHeaders,
  body: JSON.stringify(body)
});
var isRecord = (value) => Boolean(value) && typeof value === "object" && !Array.isArray(value);
var isCustomer = (value) => {
  if (!isRecord(value)) {
    return false;
  }
  return typeof value.name === "string" && typeof value.phone === "string" && typeof value.address === "string" && (value.note === void 0 || typeof value.note === "string");
};
var isOrderItem = (value) => {
  if (!isRecord(value)) {
    return false;
  }
  return typeof value.productId === "string" && typeof value.name === "string" && typeof value.price === "number" && Number.isFinite(value.price) && typeof value.quantity === "number" && Number.isInteger(value.quantity) && value.quantity > 0 && (value.imageUrl === void 0 || typeof value.imageUrl === "string");
};
var parseRequest = (body) => {
  if (!body) {
    throw new Error("Request body is required.");
  }
  const parsed = JSON.parse(body);
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
    userId: typeof parsed.userId === "string" ? parsed.userId : void 0,
    email: typeof parsed.email === "string" ? parsed.email : void 0,
    couponCode: typeof parsed.couponCode === "string" && parsed.couponCode.trim() ? parsed.couponCode.trim() : void 0
  };
};
var CouponError = class extends Error {
};
var applyCoupon = async (couponCode, totalPrice) => {
  if (!tableName) {
    throw new CouponError("H\u1EC7 th\u1ED1ng ch\u01B0a c\u1EA5u h\xECnh \u0111\u1EC3 \xE1p d\u1EE5ng m\xE3 gi\u1EA3m gi\xE1.");
  }
  const result = await dynamoDb.send(
    new import_lib_dynamodb.GetCommand({
      TableName: tableName,
      Key: {
        PK: `COUPON#${couponCode}`,
        SK: "METADATA"
      }
    })
  );
  const coupon = result.Item;
  if (!coupon) {
    throw new CouponError("M\xE3 gi\u1EA3m gi\xE1 kh\xF4ng t\u1ED3n t\u1EA1i.");
  }
  const now = /* @__PURE__ */ new Date();
  const isExpired = coupon.validFrom && now < new Date(coupon.validFrom) || coupon.validUntil && now > new Date(coupon.validUntil);
  const isExhausted = typeof coupon.usageLimit === "number" && coupon.usageCount >= coupon.usageLimit;
  if (!coupon.isActive || isExpired || isExhausted) {
    throw new CouponError("M\xE3 gi\u1EA3m gi\xE1 kh\xF4ng c\xF2n hi\u1EC7u l\u1EF1c.");
  }
  if (coupon.minOrderValue && totalPrice < coupon.minOrderValue) {
    throw new CouponError(`\u0110\u01A1n h\xE0ng c\u1EA7n t\u1ED1i thi\u1EC3u ${coupon.minOrderValue.toLocaleString("vi-VN")}\u0111 \u0111\u1EC3 \xE1p d\u1EE5ng m\xE3 n\xE0y.`);
  }
  const discountAmount = coupon.discountType === "percentage" ? Math.round(totalPrice * coupon.discountValue / 100) : Math.min(coupon.discountValue, totalPrice);
  try {
    await dynamoDb.send(
      new import_lib_dynamodb.UpdateCommand({
        TableName: tableName,
        Key: {
          PK: `COUPON#${couponCode}`,
          SK: "METADATA"
        },
        UpdateExpression: "ADD usageCount :one",
        ConditionExpression: "attribute_not_exists(usageLimit) OR usageLimit = :nullVal OR usageCount < usageLimit",
        ExpressionAttributeValues: {
          ":one": 1,
          ":nullVal": null
        }
      })
    );
  } catch (err) {
    if (err?.name === "ConditionalCheckFailedException") {
      throw new CouponError("M\xE3 gi\u1EA3m gi\xE1 \u0111\xE3 h\u1EBFt l\u01B0\u1EE3t s\u1EED d\u1EE5ng.");
    }
    throw err;
  }
  return discountAmount;
};
var handler = async (event) => {
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
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const orderId = `ord_${Date.now()}_${(0, import_node_crypto.randomUUID)().slice(0, 8)}`;
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
      updatedAt: now
    };
    await sqs.send(
      new import_client_sqs.SendMessageCommand({
        QueueUrl: queueUrl,
        MessageBody: JSON.stringify(order)
      })
    );
    return jsonResponse(201, {
      orderId,
      status: order.status,
      totalItems,
      totalPrice,
      discountAmount
    });
  } catch (error) {
    if (error instanceof SyntaxError || error instanceof Error) {
      const message = error instanceof SyntaxError ? "Request body must be valid JSON." : error.message;
      if (message.includes("required") || message.includes("must") || message.includes("Every item")) {
        return jsonResponse(400, { message });
      }
    }
    console.error("CreateOrder handler failed", {
      error,
      requestId: event.requestContext.requestId
    });
    return jsonResponse(500, { message: "Internal Server Error" });
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
