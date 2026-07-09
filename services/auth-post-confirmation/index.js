"use strict";
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

// services/auth-post-confirmation/index.ts
var index_exports = {};
__export(index_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(index_exports);
var import_client_dynamodb = require("@aws-sdk/client-dynamodb");
var import_lib_dynamodb = require("@aws-sdk/lib-dynamodb");
var ddbClient = new import_client_dynamodb.DynamoDBClient({});
var ddbDocClient = import_lib_dynamodb.DynamoDBDocumentClient.from(ddbClient);
var tableName = process.env.TABLE_NAME || "";
var handler = async (event) => {
  try {
    const userId = event.request.userAttributes.sub;
    const email = event.request.userAttributes.email || "";
    const name = event.request.userAttributes.name || email.split("@")[0] || "";
    const phone = event.request.userAttributes.phone_number || "";
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const profile = {
      userId,
      email,
      name,
      phone,
      address: "",
      updatedAt: now
    };
    await ddbDocClient.send(
      new import_lib_dynamodb.PutCommand({
        TableName: tableName,
        Item: {
          PK: `USER#${userId}`,
          SK: "PROFILE",
          ...profile
        },
        ConditionExpression: "attribute_not_exists(PK)"
      })
    );
  } catch (error) {
    console.error("Failed to create profile on post-confirmation:", error);
  }
  return event;
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
