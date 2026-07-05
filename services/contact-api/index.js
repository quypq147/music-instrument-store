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

// services/contact-api/index.ts
var index_exports = {};
__export(index_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(index_exports);
var import_client_sesv2 = require("@aws-sdk/client-sesv2");
var sesClient = new import_client_sesv2.SESv2Client({});
var fromEmail = process.env.SES_FROM_EMAIL || "no-reply@musicstore.example.com";
var contactInboxEmail = process.env.CONTACT_INBOX_EMAIL || fromEmail;
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
  if (event.httpMethod === "OPTIONS") {
    return jsonResponse(204, {});
  }
  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { message: "Method Not Allowed" });
  }
  if (!event.body) {
    return jsonResponse(400, { message: "Missing request body" });
  }
  const { name, phone, email, message } = JSON.parse(event.body);
  if (!name || !message || !phone && !email) {
    return jsonResponse(400, {
      message: "Vui l\xF2ng nh\u1EADp h\u1ECD t\xEAn, n\u1ED9i dung v\xE0 \xEDt nh\u1EA5t m\u1ED9t c\xE1ch li\xEAn h\u1EC7 (S\u0110T ho\u1EB7c email)"
    });
  }
  try {
    await sesClient.send(
      new import_client_sesv2.SendEmailCommand({
        FromEmailAddress: fromEmail,
        Destination: { ToAddresses: [contactInboxEmail] },
        ...email ? { ReplyToAddresses: [email] } : {},
        Content: {
          Simple: {
            Subject: { Data: `[Li\xEAn h\u1EC7 website] ${name}`, Charset: "UTF-8" },
            Body: {
              Text: {
                Data: `H\u1ECD t\xEAn: ${name}
S\u0110T: ${phone || "(kh\xF4ng c\xF3)"}
Email: ${email || "(kh\xF4ng c\xF3)"}

N\u1ED9i dung:
${message}`,
                Charset: "UTF-8"
              }
            }
          }
        }
      })
    );
    return jsonResponse(200, { message: "\u0110\xE3 g\u1EEDi y\xEAu c\u1EA7u li\xEAn h\u1EC7 th\xE0nh c\xF4ng!" });
  } catch (err) {
    console.error("Failed to send contact email", err);
    return jsonResponse(500, { message: "Kh\xF4ng th\u1EC3 g\u1EEDi y\xEAu c\u1EA7u li\xEAn h\u1EC7. Vui l\xF2ng th\u1EED l\u1EA1i sau." });
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
