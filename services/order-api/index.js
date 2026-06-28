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
var import_client_dynamodb = require("@aws-sdk/client-dynamodb");
var import_lib_dynamodb = require("@aws-sdk/lib-dynamodb");
var dynamoDb = import_lib_dynamodb.DynamoDBDocumentClient.from(new import_client_dynamodb.DynamoDBClient({}));
var tableName = process.env.TABLE_NAME;
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
    paymentMethod: parsed.paymentMethod
  };
};
var handler = async (event) => {
  try {
    if (!tableName) {
      throw new Error("TABLE_NAME environment variable is not set.");
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
    const totalPrice = request.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const order = {
      PK: `ORDER#${orderId}`,
      SK: "METADATA",
      id: orderId,
      customer: request.customer,
      items: request.items,
      totalItems,
      totalPrice,
      paymentMethod: request.paymentMethod,
      status: "PENDING",
      createdAt: now,
      updatedAt: now
    };
    await dynamoDb.send(
      new import_lib_dynamodb.PutCommand({
        TableName: tableName,
        Item: order,
        ConditionExpression: "attribute_not_exists(PK)"
      })
    );
    return jsonResponse(201, {
      orderId,
      status: order.status,
      totalItems,
      totalPrice
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
