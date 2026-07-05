import type { APIGatewayProxyHandler, APIGatewayProxyResult } from "aws-lambda";
import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";

const sesClient = new SESv2Client({});
const fromEmail = process.env.SES_FROM_EMAIL || "no-reply@musicstore.example.com";
const contactInboxEmail = process.env.CONTACT_INBOX_EMAIL || fromEmail;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
  "Access-Control-Allow-Methods": "OPTIONS,POST",
  "Content-Type": "application/json",
};

const jsonResponse = (statusCode: number, body: unknown): APIGatewayProxyResult => ({
  statusCode,
  headers: corsHeaders,
  body: JSON.stringify(body),
});

export const handler: APIGatewayProxyHandler = async (event) => {
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
  if (!name || !message || (!phone && !email)) {
    return jsonResponse(400, {
      message: "Vui lòng nhập họ tên, nội dung và ít nhất một cách liên hệ (SĐT hoặc email)",
    });
  }

  try {
    await sesClient.send(
      new SendEmailCommand({
        FromEmailAddress: fromEmail,
        Destination: { ToAddresses: [contactInboxEmail] },
        ...(email ? { ReplyToAddresses: [email] } : {}),
        Content: {
          Simple: {
            Subject: { Data: `[Liên hệ website] ${name}`, Charset: "UTF-8" },
            Body: {
              Text: {
                Data: `Họ tên: ${name}\nSĐT: ${phone || "(không có)"}\nEmail: ${email || "(không có)"}\n\nNội dung:\n${message}`,
                Charset: "UTF-8",
              },
            },
          },
        },
      })
    );
    return jsonResponse(200, { message: "Đã gửi yêu cầu liên hệ thành công!" });
  } catch (err) {
    console.error("Failed to send contact email", err);
    return jsonResponse(500, { message: "Không thể gửi yêu cầu liên hệ. Vui lòng thử lại sau." });
  }
};
