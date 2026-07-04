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
var import_client_eventbridge = require("@aws-sdk/client-eventbridge");
var dynamoDb = import_lib_dynamodb.DynamoDBDocumentClient.from(new import_client_dynamodb.DynamoDBClient({}));
var tableName = process.env.TABLE_NAME;
var eventBridge = new import_client_eventbridge.EventBridgeClient({});
var eventBusName = process.env.EVENT_BUS_NAME;
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
  if (!item) return item;
  const { PK, SK, pk, sk, createdAt, updatedAt, ...rest } = item;
  return rest;
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
    const resource = event.resource;
    const method = event.httpMethod;
    const authorizer = event.requestContext.authorizer;
    const userId = authorizer?.claims?.sub;
    const email = authorizer?.claims?.email;
    const userName = authorizer?.claims?.name || email || authorizer?.claims?.["cognito:username"] || "User";
    if (resource === "/products/{id}/ratings") {
      const productId2 = getProductId(event.path, event.pathParameters?.id);
      if (!productId2) {
        return jsonResponse(400, { message: "Missing product ID" });
      }
      if (method === "GET") {
        const ratingsResult = await dynamoDb.send(
          new import_lib_dynamodb.QueryCommand({
            TableName: tableName,
            KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
            ExpressionAttributeValues: {
              ":pk": `PRODUCT#${productId2}`,
              ":sk": "RATING#"
            }
          })
        );
        const ratings = (ratingsResult.Items ?? []).map((item) => stripTableKeys(item));
        return jsonResponse(200, ratings);
      }
      if (method === "POST") {
        if (!userId) {
          return jsonResponse(401, { message: "Unauthorized: \u0110\u0103ng nh\u1EADp \u0111\u1EC3 th\u1EF1c hi\u1EC7n \u0111\xE1nh gi\xE1" });
        }
        const productCheck = await dynamoDb.send(
          new import_lib_dynamodb.GetCommand({
            TableName: tableName,
            Key: {
              PK: `PRODUCT#${productId2}`,
              SK: "METADATA"
            }
          })
        );
        if (!productCheck.Item) {
          return jsonResponse(404, { message: "S\u1EA3n ph\u1EA9m kh\xF4ng t\u1ED3n t\u1EA1i" });
        }
        const boughtCheck = await dynamoDb.send(
          new import_lib_dynamodb.GetCommand({
            TableName: tableName,
            Key: {
              PK: `USER#${userId}`,
              SK: `BOUGHT#${productId2}`
            }
          })
        );
        if (!boughtCheck.Item) {
          return jsonResponse(403, {
            message: "B\u1EA1n ch\u1EC9 c\xF3 th\u1EC3 \u0111\xE1nh gi\xE1 s\u1EA3n ph\u1EA9m sau khi \u0111\xE3 mua h\xE0ng th\xE0nh c\xF4ng."
          });
        }
        if (!event.body) {
          return jsonResponse(400, { message: "Body kh\xF4ng h\u1EE3p l\u1EC7" });
        }
        const body = JSON.parse(event.body);
        const rating = Number(body.rating);
        const comment = body.comment || "";
        if (isNaN(rating) || rating < 1 || rating > 5) {
          return jsonResponse(400, { message: "S\u1ED1 sao \u0111\xE1nh gi\xE1 ph\u1EA3i t\u1EEB 1 \u0111\u1EBFn 5" });
        }
        const now = (/* @__PURE__ */ new Date()).toISOString();
        await dynamoDb.send(
          new import_lib_dynamodb.PutCommand({
            TableName: tableName,
            Item: {
              PK: `PRODUCT#${productId2}`,
              SK: `RATING#${userId}`,
              rating,
              comment,
              userId,
              userName,
              createdAt: now
            }
          })
        );
        return jsonResponse(201, { message: "\u0110\xE1nh gi\xE1 s\u1EA3n ph\u1EA9m th\xE0nh c\xF4ng!" });
      }
    }
    if (resource === "/products/{id}/comments") {
      const productId2 = getProductId(event.path, event.pathParameters?.id);
      if (!productId2) {
        return jsonResponse(400, { message: "Missing product ID" });
      }
      if (method === "GET") {
        const commentsResult = await dynamoDb.send(
          new import_lib_dynamodb.QueryCommand({
            TableName: tableName,
            KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
            ExpressionAttributeValues: {
              ":pk": `PRODUCT#${productId2}`,
              ":sk": "COMMENT#"
            }
          })
        );
        const comments = (commentsResult.Items ?? []).map((item) => stripTableKeys(item));
        return jsonResponse(200, comments);
      }
      if (method === "POST") {
        if (!userId) {
          return jsonResponse(401, { message: "Unauthorized: \u0110\u0103ng nh\u1EADp \u0111\u1EC3 b\xECnh lu\u1EADn" });
        }
        const productCheck = await dynamoDb.send(
          new import_lib_dynamodb.GetCommand({
            TableName: tableName,
            Key: {
              PK: `PRODUCT#${productId2}`,
              SK: "METADATA"
            }
          })
        );
        if (!productCheck.Item) {
          return jsonResponse(404, { message: "S\u1EA3n ph\u1EA9m kh\xF4ng t\u1ED3n t\u1EA1i" });
        }
        if (!event.body) {
          return jsonResponse(400, { message: "Body kh\xF4ng h\u1EE3p l\u1EC7" });
        }
        const body = JSON.parse(event.body);
        const content = body.content;
        if (!content || typeof content !== "string" || !content.trim()) {
          return jsonResponse(400, { message: "N\u1ED9i dung b\xECnh lu\u1EADn kh\xF4ng \u0111\u01B0\u1EE3c \u0111\u1EC3 tr\u1ED1ng" });
        }
        const now = (/* @__PURE__ */ new Date()).toISOString();
        const commentId = `comment_${Date.now()}_${userId.slice(0, 6)}`;
        await dynamoDb.send(
          new import_lib_dynamodb.PutCommand({
            TableName: tableName,
            Item: {
              PK: `PRODUCT#${productId2}`,
              SK: `COMMENT#${commentId}`,
              commentId,
              content,
              userId,
              userName,
              createdAt: now
            }
          })
        );
        return jsonResponse(201, { message: "G\u1EEDi b\xECnh lu\u1EADn th\xE0nh c\xF4ng!" });
      }
    }
    if (resource === "/users/profile") {
      if (!userId) {
        return jsonResponse(401, { message: "Unauthorized: Ch\u01B0a \u0111\u0103ng nh\u1EADp" });
      }
      if (method === "GET") {
        const result = await dynamoDb.send(
          new import_lib_dynamodb.GetCommand({
            TableName: tableName,
            Key: {
              PK: `USER#${userId}`,
              SK: "PROFILE"
            }
          })
        );
        if (!result.Item) {
          return jsonResponse(200, {
            profile: {
              userId,
              email: email || "",
              name: userName !== "User" ? userName : "",
              phone: "",
              address: ""
            }
          });
        }
        return jsonResponse(200, { profile: stripTableKeys(result.Item) });
      }
      if (method === "PUT") {
        if (!event.body) {
          return jsonResponse(400, { message: "Missing body" });
        }
        const body = JSON.parse(event.body);
        const now = (/* @__PURE__ */ new Date()).toISOString();
        const updatedProfile = {
          PK: `USER#${userId}`,
          SK: "PROFILE",
          userId,
          email: email || body.email || "",
          name: body.name || "",
          phone: body.phone || "",
          address: body.address || "",
          updatedAt: now
        };
        await dynamoDb.send(
          new import_lib_dynamodb.PutCommand({
            TableName: tableName,
            Item: updatedProfile
          })
        );
        return jsonResponse(200, { profile: stripTableKeys(updatedProfile) });
      }
    }
    if (resource === "/users/orders") {
      if (!userId) {
        return jsonResponse(401, { message: "Unauthorized: Ch\u01B0a \u0111\u0103ng nh\u1EADp" });
      }
      if (method === "GET") {
        const result = await dynamoDb.send(
          new import_lib_dynamodb.QueryCommand({
            TableName: tableName,
            IndexName: "GSI1",
            KeyConditionExpression: "GSI1PK = :gsi1pk AND begins_with(GSI1SK, :gsi1sk)",
            ExpressionAttributeValues: {
              ":gsi1pk": `USER#${userId}`,
              ":gsi1sk": "ORDER#"
            }
          })
        );
        const orders = (result.Items ?? []).map((item) => {
          const stripped = stripTableKeys(item);
          return {
            ...stripped,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt
          };
        });
        return jsonResponse(200, orders);
      }
    }
    if (resource === "/orders" && method === "GET") {
      const groups = authorizer?.claims?.["cognito:groups"] || "";
      const isStaff = groups.includes("Admin") || groups.includes("Staff");
      if (!isStaff) {
        return jsonResponse(403, { message: "Forbidden: B\u1EA1n kh\xF4ng c\xF3 quy\u1EC1n truy c\u1EADp" });
      }
      const items = [];
      let ExclusiveStartKey;
      do {
        const result = await dynamoDb.send(
          new import_lib_dynamodb.ScanCommand({
            TableName: tableName,
            FilterExpression: "begins_with(PK, :orderPrefix) AND SK = :metadataSk",
            ExpressionAttributeValues: {
              ":orderPrefix": "ORDER#",
              ":metadataSk": "METADATA"
            },
            ExclusiveStartKey
          })
        );
        items.push(...result.Items ?? []);
        ExclusiveStartKey = result.LastEvaluatedKey;
      } while (ExclusiveStartKey);
      const sortedOrders = items.map((item) => {
        const stripped = stripTableKeys(item);
        return {
          ...stripped,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt
        };
      }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return jsonResponse(200, sortedOrders);
    }
    if (resource === "/orders/{id}" && method === "PUT") {
      const groups = authorizer?.claims?.["cognito:groups"] || "";
      const isStaff = groups.includes("Admin") || groups.includes("Staff");
      if (!isStaff) {
        return jsonResponse(403, { message: "Forbidden: B\u1EA1n kh\xF4ng c\xF3 quy\u1EC1n truy c\u1EADp" });
      }
      const targetOrderId = event.pathParameters?.id;
      if (!targetOrderId) {
        return jsonResponse(400, { message: "Missing order ID in path" });
      }
      if (!event.body) {
        return jsonResponse(400, { message: "Missing request body" });
      }
      const { status } = JSON.parse(event.body);
      if (!status) {
        return jsonResponse(400, { message: "Status is required" });
      }
      const getResult = await dynamoDb.send(
        new import_lib_dynamodb.GetCommand({
          TableName: tableName,
          Key: {
            PK: `ORDER#${targetOrderId}`,
            SK: "METADATA"
          }
        })
      );
      if (!getResult.Item) {
        return jsonResponse(404, { message: "Order not found" });
      }
      const order = getResult.Item;
      const now = (/* @__PURE__ */ new Date()).toISOString();
      const updatedOrder = {
        ...order,
        status,
        updatedAt: now
      };
      await dynamoDb.send(
        new import_lib_dynamodb.PutCommand({
          TableName: tableName,
          Item: updatedOrder
        })
      );
      if (eventBusName) {
        try {
          console.log(`Publishing OrderUpdated event for order ${targetOrderId} to ${eventBusName}...`);
          await eventBridge.send(
            new import_client_eventbridge.PutEventsCommand({
              Entries: [
                {
                  EventBusName: eventBusName,
                  Source: "com.musicstore.order",
                  DetailType: "OrderUpdated",
                  Detail: JSON.stringify({
                    orderId: targetOrderId,
                    customer: order.customer,
                    status,
                    totalPrice: order.totalPrice
                  })
                }
              ]
            })
          );
        } catch (err) {
          console.error("Failed to publish OrderUpdated event to EventBridge", err);
        }
      }
      return jsonResponse(200, stripTableKeys(updatedOrder));
    }
    if (resource === "/users" || resource === "/users/{userId}") {
      const groups = authorizer?.claims?.["cognito:groups"] || "";
      const isStaff = groups.includes("Admin") || groups.includes("Staff");
      if (!isStaff) {
        return jsonResponse(403, { message: "Forbidden: B\u1EA1n kh\xF4ng c\xF3 quy\u1EC1n truy c\u1EADp" });
      }
      if (resource === "/users" && method === "GET") {
        const items = [];
        let ExclusiveStartKey;
        do {
          const result = await dynamoDb.send(
            new import_lib_dynamodb.ScanCommand({
              TableName: tableName,
              FilterExpression: "SK = :profileSk",
              ExpressionAttributeValues: {
                ":profileSk": "PROFILE"
              },
              ExclusiveStartKey
            })
          );
          items.push(...result.Items ?? []);
          ExclusiveStartKey = result.LastEvaluatedKey;
        } while (ExclusiveStartKey);
        const profiles = items.map((item) => stripTableKeys(item));
        return jsonResponse(200, profiles);
      }
      if (resource === "/users/{userId}") {
        const targetUserId = event.pathParameters?.userId;
        if (!targetUserId) {
          return jsonResponse(400, { message: "Missing userId in path" });
        }
        if (method === "PUT") {
          if (!event.body) {
            return jsonResponse(400, { message: "Missing body" });
          }
          const body = JSON.parse(event.body);
          const now = (/* @__PURE__ */ new Date()).toISOString();
          const getRes = await dynamoDb.send(
            new import_lib_dynamodb.GetCommand({
              TableName: tableName,
              Key: {
                PK: `USER#${targetUserId}`,
                SK: "PROFILE"
              }
            })
          );
          const existing = getRes.Item || {};
          const updatedProfile = {
            ...existing,
            PK: `USER#${targetUserId}`,
            SK: "PROFILE",
            userId: targetUserId,
            email: body.email || existing.email || "",
            name: body.name || existing.name || "",
            phone: body.phone || existing.phone || "",
            address: body.address || existing.address || "",
            role: body.role || existing.role || "User",
            updatedAt: now
          };
          await dynamoDb.send(
            new import_lib_dynamodb.PutCommand({
              TableName: tableName,
              Item: updatedProfile
            })
          );
          return jsonResponse(200, stripTableKeys(updatedProfile));
        }
        if (method === "DELETE") {
          await dynamoDb.send(
            new import_lib_dynamodb.DeleteCommand({
              TableName: tableName,
              Key: {
                PK: `USER#${targetUserId}`,
                SK: "PROFILE"
              }
            })
          );
          return jsonResponse(200, { message: "User profile deleted successfully" });
        }
      }
    }
    if (resource === "/users/wishlist") {
      if (!userId) {
        return jsonResponse(401, { message: "Unauthorized" });
      }
      if (method === "GET") {
        const result = await dynamoDb.send(
          new import_lib_dynamodb.QueryCommand({
            TableName: tableName,
            KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
            ExpressionAttributeValues: {
              ":pk": `USER#${userId}`,
              ":sk": "WISHLIST#"
            }
          })
        );
        const wishlist = (result.Items ?? []).map((item) => stripTableKeys(item));
        return jsonResponse(200, wishlist);
      }
      if (method === "POST") {
        if (!event.body) {
          return jsonResponse(400, { message: "Missing body" });
        }
        const body = JSON.parse(event.body);
        const { productId: productId2 } = body;
        if (!productId2) {
          return jsonResponse(400, { message: "productId is required" });
        }
        const productRes = await dynamoDb.send(
          new import_lib_dynamodb.GetCommand({
            TableName: tableName,
            Key: {
              PK: `PRODUCT#${productId2}`,
              SK: "METADATA"
            }
          })
        );
        if (!productRes.Item) {
          return jsonResponse(404, { message: "S\u1EA3n ph\u1EA9m kh\xF4ng t\u1ED3n t\u1EA1i" });
        }
        const product = productRes.Item;
        const now = (/* @__PURE__ */ new Date()).toISOString();
        await dynamoDb.send(
          new import_lib_dynamodb.PutCommand({
            TableName: tableName,
            Item: {
              PK: `USER#${userId}`,
              SK: `WISHLIST#${productId2}`,
              productId: productId2,
              name: product.name,
              price: product.price,
              imageUrl: product.imageUrl,
              brand: product.brand,
              type: product.type || "",
              addedAt: now
            }
          })
        );
        return jsonResponse(201, { message: "\u0110\xE3 th\xEAm s\u1EA3n ph\u1EA9m v\xE0o danh s\xE1ch y\xEAu th\xEDch!" });
      }
    }
    if (resource === "/users/wishlist/{productId}") {
      if (!userId) {
        return jsonResponse(401, { message: "Unauthorized" });
      }
      if (method === "DELETE") {
        const targetProductId = event.pathParameters?.productId;
        if (!targetProductId) {
          return jsonResponse(400, { message: "Missing productId in path" });
        }
        await dynamoDb.send(
          new import_lib_dynamodb.DeleteCommand({
            TableName: tableName,
            Key: {
              PK: `USER#${userId}`,
              SK: `WISHLIST#${targetProductId}`
            }
          })
        );
        return jsonResponse(200, { message: "\u0110\xE3 x\xF3a s\u1EA3n ph\u1EA9m kh\u1ECFi danh s\xE1ch y\xEAu th\xEDch" });
      }
    }
    const productId = getProductId(event.path, event.pathParameters?.id);
    if (method === "GET") {
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
        let averageRating = 0;
        let ratingCount = 0;
        try {
          const ratingsResult = await dynamoDb.send(
            new import_lib_dynamodb.QueryCommand({
              TableName: tableName,
              KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
              ExpressionAttributeValues: {
                ":pk": `PRODUCT#${productId}`,
                ":sk": "RATING#"
              }
            })
          );
          const ratings = ratingsResult.Items ?? [];
          ratingCount = ratings.length;
          if (ratingCount > 0) {
            const sum = ratings.reduce((acc, r) => acc + (r.rating || 0), 0);
            averageRating = parseFloat((sum / ratingCount).toFixed(1));
          }
        } catch (err) {
          console.error("Failed to fetch ratings for average calculation", err);
        }
        const product = stripTableKeys(result.Item);
        return jsonResponse(200, {
          product: {
            ...product,
            averageRating,
            ratingCount
          }
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
    if (method === "POST") {
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
    if (method === "PUT") {
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
    if (method === "DELETE") {
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
