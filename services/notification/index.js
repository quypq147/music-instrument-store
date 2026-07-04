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

// services/notification/index.ts
var index_exports = {};
__export(index_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(index_exports);
var corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
  "Access-Control-Allow-Methods": "OPTIONS,POST",
  "Content-Type": "application/json"
};
var jsonResponse = (statusCode, body) => ({
  statusCode,
  headers: corsHeaders,
  body: JSON.stringify(body)
});
var handler = async (event) => {
  if (event.Records && Array.isArray(event.Records)) {
    console.log(`[Notification Service] Processing SQS batch of ${event.Records.length} records...`);
    for (const record of event.Records) {
      try {
        const payload = JSON.parse(record.body);
        const eventType = payload["detail-type"] || "OrderPlaced";
        const detail = payload.detail || payload;
        console.log(`[Notification Service Asynchronous] Received event: ${eventType}`);
        const recipient = detail.customer?.phone || detail.customer?.email || "customer@musicstore.com";
        let message = "";
        if (eventType === "OrderPlaced") {
          message = `[Music Store] \u0110\u01A1n h\xE0ng c\u1EE7a b\u1EA1n \u0111\xE3 \u0111\u01B0\u1EE3c \u0111\u1EB7t th\xE0nh c\xF4ng! M\xE3 \u0111\u01A1n: ${detail.orderId}. T\u1ED5ng thanh to\xE1n: ${Number(detail.totalPrice).toLocaleString("vi-VN")}\u0111. Ph\u01B0\u01A1ng th\u1EE9c: ${detail.paymentMethod}.`;
        } else if (eventType === "OrderUpdated") {
          const status = detail.status || "C\u1EADp nh\u1EADt";
          message = `[Music Store] \u0110\u01A1n h\xE0ng ${detail.orderId} c\u1EE7a b\u1EA1n \u0111\xE3 \u0111\u01B0\u1EE3c c\u1EADp nh\u1EADt tr\u1EA1ng th\xE1i m\u1EDBi: ${status}.`;
        } else if (eventType === "PaymentSucceeded") {
          const orderId = detail.metadata?.orderId || detail.id || "N/A";
          const amount = detail.amount ? detail.amount.toLocaleString("vi-VN") : "N/A";
          message = `[Music Store] X\xE1c nh\u1EADn thanh to\xE1n th\xE0nh c\xF4ng cho \u0111\u01A1n h\xE0ng: ${orderId}. S\u1ED1 ti\u1EC1n: ${amount}\u0111. Tr\u1EA1ng th\xE1i: \u0110ang chu\u1EA9n b\u1ECB h\xE0ng.`;
        } else {
          message = `[Music Store] Th\xF4ng b\xE1o s\u1EF1 ki\u1EC7n: ${eventType} - N\u1ED9i dung: ${JSON.stringify(detail)}`;
        }
        console.log(`[Notification Service] Asynchronous Message SENT:`, {
          recipient,
          message,
          messageId: record.messageId,
          sentAt: (/* @__PURE__ */ new Date()).toISOString()
        });
      } catch (err) {
        console.error("Failed to process notification SQS record", err);
        throw err;
      }
    }
    return;
  }
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
    const { type, recipient, message, title } = JSON.parse(event.body);
    if (!recipient || !message) {
      return jsonResponse(400, { message: "Missing recipient or message" });
    }
    console.log(`[Notification Service Synchronous] Sending ${type || "EMAIL"} notification:`, {
      recipient,
      title: title || "Music Instrument Store Notification",
      message,
      sentAt: (/* @__PURE__ */ new Date()).toISOString()
    });
    return jsonResponse(200, {
      message: "Notification sent successfully (simulated)",
      recipient,
      type: type || "EMAIL",
      status: "SENT"
    });
  } catch (error) {
    console.error("Notification handler failed", error);
    return jsonResponse(500, {
      message: "Internal Server Error",
      error: error instanceof Error ? error.message : String(error)
    });
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
