import type { APIGatewayProxyResult } from "aws-lambda";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
  "Access-Control-Allow-Methods": "OPTIONS,POST",
  "Content-Type": "application/json",
};

const jsonResponse = (
  statusCode: number,
  body: unknown
): APIGatewayProxyResult => ({
  statusCode,
  headers: corsHeaders,
  body: JSON.stringify(body),
});

export const handler = async (event: any): Promise<APIGatewayProxyResult | void> => {
  // 1. Kiểm tra xem có phải là sự kiện SQS không (Xử lý bất đồng bộ)
  if (event.Records && Array.isArray(event.Records)) {
    console.log(`[Notification Service] Processing SQS batch of ${event.Records.length} records...`);
    
    for (const record of event.Records) {
      try {
        const payload = JSON.parse(record.body);
        
        // Tin nhắn gửi từ EventBridge sang SQS sẽ có cấu trúc EventBridge envelope (có detail-type và detail)
        const eventType = payload["detail-type"] || "OrderPlaced";
        const detail = payload.detail || payload;
        
        console.log(`[Notification Service Asynchronous] Received event: ${eventType}`);
        
        // Mô phỏng địa chỉ nhận thông báo
        const recipient = detail.customer?.phone || detail.customer?.email || "customer@musicstore.com";
        let message = "";

        if (eventType === "OrderPlaced") {
          message = `[Music Store] Đơn hàng của bạn đã được đặt thành công! Mã đơn: ${detail.orderId}. Tổng thanh toán: ${Number(detail.totalPrice).toLocaleString("vi-VN")}đ. Phương thức: ${detail.paymentMethod}.`;
        } else if (eventType === "OrderUpdated") {
          const status = detail.status || "Cập nhật";
          message = `[Music Store] Đơn hàng ${detail.orderId} của bạn đã được cập nhật trạng thái mới: ${status}.`;
        } else if (eventType === "PaymentSucceeded") {
          const orderId = detail.metadata?.orderId || detail.id || "N/A";
          const amount = detail.amount ? (detail.amount).toLocaleString("vi-VN") : "N/A";
          message = `[Music Store] Xác nhận thanh toán thành công cho đơn hàng: ${orderId}. Số tiền: ${amount}đ. Trạng thái: Đang chuẩn bị hàng.`;
        } else {
          message = `[Music Store] Thông báo sự kiện: ${eventType} - Nội dung: ${JSON.stringify(detail)}`;
        }

        console.log(`[Notification Service] Asynchronous Message SENT:`, {
          recipient,
          message,
          messageId: record.messageId,
          sentAt: new Date().toISOString(),
        });
      } catch (err) {
        console.error("Failed to process notification SQS record", err);
        // Ném lỗi để SQS thử lại hoặc đẩy vào DLQ
        throw err;
      }
    }
    return;
  }

  // 2. Xử lý sự kiện API Gateway (Đồng bộ)
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

    // Giả lập gửi thông báo (email/SMS)
    console.log(`[Notification Service Synchronous] Sending ${type || "EMAIL"} notification:`, {
      recipient,
      title: title || "Music Instrument Store Notification",
      message,
      sentAt: new Date().toISOString(),
    });

    return jsonResponse(200, {
      message: "Notification sent successfully (simulated)",
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
};
