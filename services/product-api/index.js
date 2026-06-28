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

// services/product-api/index.ts
var index_exports = {};
__export(index_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(index_exports);
var import_client_dynamodb = require("@aws-sdk/client-dynamodb");
var import_lib_dynamodb = require("@aws-sdk/lib-dynamodb");
var dynamoDb = import_lib_dynamodb.DynamoDBDocumentClient.from(new import_client_dynamodb.DynamoDBClient({}));
var tableName = process.env.TABLE_NAME;
var jsonResponse = (statusCode, body) => ({
  statusCode,
  headers: {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
    "Access-Control-Allow-Methods": "OPTIONS,GET,POST,PUT,DELETE",
    "Content-Type": "application/json"
  },
  body: JSON.stringify(body)
});
var stripTableKeys = (item) => {
  const { PK, SK, createdAt, updatedAt, ...product } = item;
  return product;
};
var getProductId = (path, pathId) => {
  if (pathId) {
    return decodeURIComponent(pathId);
  }
  const match = path?.match(/^\/products\/([^/]+)$/);
  return match?.[1] ? decodeURIComponent(match[1]) : void 0;
};
var handler = async (event) => {
  try {
    if (!tableName) {
      throw new Error("TABLE_NAME environment variable is not set");
    }
    if (event.httpMethod === "OPTIONS") {
      return jsonResponse(204, {});
    }
    const productId = getProductId(event.path, event.pathParameters?.id);
    if (event.httpMethod === "GET") {
      if (productId) {
        const result = await dynamoDb.send(
          new import_lib_dynamodb.GetCommand({
            TableName: tableName,
            Key: {
              PK: `PRODUCT#${productId}`,
              SK: "METADATA"
            }
          })
        );
        if (!result.Item) {
          return jsonResponse(404, { message: "Product not found" });
        }
        return jsonResponse(200, {
          product: stripTableKeys(result.Item)
        });
      }
      const items = [];
      let ExclusiveStartKey;
      do {
        const result = await dynamoDb.send(
          new import_lib_dynamodb.ScanCommand({
            TableName: tableName,
            FilterExpression: "begins_with(#pk, :productPrefix)",
            ExpressionAttributeNames: {
              "#pk": "PK"
            },
            ExpressionAttributeValues: {
              ":productPrefix": "PRODUCT#"
            },
            ExclusiveStartKey
          })
        );
        items.push(...result.Items ?? []);
        ExclusiveStartKey = result.LastEvaluatedKey;
      } while (ExclusiveStartKey);
      const products = items.map((item) => stripTableKeys(item)).sort((a, b) => Number(a.id) - Number(b.id));
      return jsonResponse(200, products);
    }
    if (event.httpMethod === "POST") {
      if (!event.body) {
        return jsonResponse(400, { message: "Invalid request: Missing body" });
      }
      const body = JSON.parse(event.body);
      const { id, name, brand, type, price, imageUrl, description } = body;
      if (!id || !name || !brand || typeof price !== "number" || !imageUrl || !description) {
        return jsonResponse(400, { message: "Missing required fields" });
      }
      const now = (/* @__PURE__ */ new Date()).toISOString();
      const newItem = {
        PK: `PRODUCT#${id}`,
        SK: "METADATA",
        id,
        name,
        brand,
        type,
        price,
        imageUrl,
        description,
        createdAt: now,
        updatedAt: now
      };
      await dynamoDb.send(
        new import_lib_dynamodb.PutCommand({
          TableName: tableName,
          Item: newItem
        })
      );
      return jsonResponse(201, stripTableKeys(newItem));
    }
    if (event.httpMethod === "PUT") {
      if (!productId) {
        return jsonResponse(400, { message: "Missing product ID in path" });
      }
      if (!event.body) {
        return jsonResponse(400, { message: "Invalid request: Missing body" });
      }
      const body = JSON.parse(event.body);
      const existing = await dynamoDb.send(
        new import_lib_dynamodb.GetCommand({
          TableName: tableName,
          Key: {
            PK: `PRODUCT#${productId}`,
            SK: "METADATA"
          }
        })
      );
      if (!existing.Item) {
        return jsonResponse(404, { message: "Product not found" });
      }
      const now = (/* @__PURE__ */ new Date()).toISOString();
      const updatedItem = {
        ...existing.Item,
        ...body,
        PK: `PRODUCT#${productId}`,
        SK: "METADATA",
        id: productId,
        updatedAt: now
      };
      await dynamoDb.send(
        new import_lib_dynamodb.PutCommand({
          TableName: tableName,
          Item: updatedItem
        })
      );
      return jsonResponse(200, stripTableKeys(updatedItem));
    }
    if (event.httpMethod === "DELETE") {
      if (!productId) {
        return jsonResponse(400, { message: "Missing product ID in path" });
      }
      await dynamoDb.send(
        new import_lib_dynamodb.DeleteCommand({
          TableName: tableName,
          Key: {
            PK: `PRODUCT#${productId}`,
            SK: "METADATA"
          }
        })
      );
      return jsonResponse(200, { message: "Product deleted successfully" });
    }
    return jsonResponse(405, { message: "Method Not Allowed" });
  } catch (error) {
    console.error("Product API handler failed", {
      error,
      requestId: event.requestContext.requestId,
      path: event.path,
      method: event.httpMethod
    });
    return jsonResponse(500, { message: "Internal Server Error" });
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
