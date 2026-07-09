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

// services/order-processing/index.ts
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
var handler = async (event) => {
  if (!tableName) {
    throw new Error("TABLE_NAME environment variable is not set");
  }
  for (const record of event.Records) {
    try {
      const order = JSON.parse(record.body);
      const orderId = order.id ?? order.orderId;
      if (!orderId) {
        throw new Error("Order payload must include an id or orderId");
      }
      const now = (/* @__PURE__ */ new Date()).toISOString();
      if (order.paymentMethod === "COD" && Array.isArray(order.items)) {
        const transactItems = order.items.map((item) => {
          const qty = Number(item.quantity || 1);
          const productId = String(item.productId);
          return {
            Update: {
              TableName: tableName,
              Key: {
                PK: `PRODUCT#${productId}`,
                SK: "INVENTORY"
              },
              UpdateExpression: "SET stock = stock - :qty, updatedAt = :now",
              ConditionExpression: "stock >= :qty",
              ExpressionAttributeValues: {
                ":qty": qty,
                ":now": now
              }
            }
          };
        });
        try {
          await dynamoDb.send(
            new import_lib_dynamodb.TransactWriteCommand({
              TransactItems: transactItems
            })
          );
          console.log(`[Order Processing] Successfully deducted stock for COD order ${orderId}`);
        } catch (stockErr) {
          console.error(`[Order Processing] Failed to deduct stock for COD order ${orderId} (likely out of stock)`, stockErr);
          throw stockErr;
        }
      }
      const gsi1pk = order.userId ? `USER#${order.userId}` : void 0;
      const gsi1sk = gsi1pk ? `ORDER#${orderId}` : void 0;
      await dynamoDb.send(
        new import_lib_dynamodb.PutCommand({
          TableName: tableName,
          Item: {
            ...order,
            id: orderId,
            PK: `ORDER#${orderId}`,
            SK: "METADATA",
            GSI1PK: gsi1pk,
            GSI1SK: gsi1sk,
            status: order.status ?? "PENDING",
            createdAt: order.createdAt ?? now,
            updatedAt: now
          }
        })
      );
      if (eventBusName) {
        console.log(`Publishing OrderPlaced event for order ${orderId} to ${eventBusName}...`);
        await eventBridge.send(
          new import_client_eventbridge.PutEventsCommand({
            Entries: [
              {
                EventBusName: eventBusName,
                Source: "com.musicstore.order",
                DetailType: "OrderPlaced",
                Detail: JSON.stringify({
                  orderId,
                  email: order.email,
                  customer: order.customer,
                  totalPrice: order.totalPrice,
                  totalItems: order.totalItems,
                  paymentMethod: order.paymentMethod
                })
              }
            ]
          })
        );
      }
    } catch (error) {
      console.error("Failed to process SQS order message", {
        error,
        messageId: record.messageId,
        awsRegion: record.awsRegion
      });
      throw error;
    }
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
