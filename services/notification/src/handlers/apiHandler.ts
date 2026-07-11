import type { APIGatewayProxyResult } from "aws-lambda";
import { SesEmailProvider } from "../infrastructure/providers/email/sesEmailProvider";
import { SnsSmsProvider } from "../infrastructure/providers/sms/snsSmsProvider";
import { env } from "../config/env";

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

const emailProvider = new SesEmailProvider(env.sesFromEmail);
const smsProvider = new SnsSmsProvider();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function handleApiEvent(event: any): Promise<APIGatewayProxyResult> {
  if (event.httpMethod === "OPTIONS") {
    return jsonResponse(204, {});
  }
  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { message: "Method Not Allowed" });
  }
  if (!event.body) {
    return jsonResponse(400, { message: "Missing request body" });
  }

  try {
    const { type, recipient, message, title } = JSON.parse(event.body);
    if (!recipient || !message) {
      return jsonResponse(400, { message: "Missing recipient or message" });
    }

    if (type === "SMS") {
      await smsProvider.send({ to: recipient, body: message });
    } else {
      const deliveryStatus = await emailProvider.send({
        to: recipient,
        subject: title || "Music Instrument Store Notification",
        html: `<p>${message}</p>`,
        text: message,
      });

      // Email bị bỏ qua (SES chưa cấu hình / sandbox chặn người nhận) không phải là gửi thành
      // công — phải trả lỗi để caller (vd. OTP xác minh thiết bị) không báo thành công giả.
      if (deliveryStatus !== "SENT") {
        return jsonResponse(502, {
          message: "Email was not delivered: SES is not configured or the recipient is not verified",
          recipient,
          type: "EMAIL",
          status: deliveryStatus,
        });
      }
    }

    return jsonResponse(200, {
      message: "Notification sent",
      recipient,
      type: type || "EMAIL",
      status: "SENT",
    });
  } catch (error) {
    console.error("Notification handler failed", error);
    return jsonResponse(500, {
      message: "Internal Server Error",
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
