import type { EmailMessage, SmsMessage } from "./notification.entity";

// "SENT" = email đã thực sự đi qua SES; "SKIPPED" = provider chủ động bỏ qua (chưa cấu hình
// SES_FROM_EMAIL hoặc bị SES sandbox chặn) — caller cần biết để không báo thành công giả.
export type EmailDeliveryStatus = "SENT" | "SKIPPED";

export interface EmailProvider {
  send(message: EmailMessage): Promise<EmailDeliveryStatus>;
}

export interface SmsProvider {
  send(message: SmsMessage): Promise<void>;
}

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

export interface TemplateRenderer {
  renderEmail(templateName: string, data: Record<string, unknown>): RenderedEmail;
  renderSms(templateName: string, data: Record<string, unknown>): string;
}

export interface NotificationLogRepository {
  /**
   * Ghi nhận eventId đã xử lý bằng conditional write (PK: EVENT#{eventId}, SK: PROCESSED — schema theo blueprint mục 8).
   * Trả về true nếu đây là lần đầu xử lý (nên tiếp tục gửi), false nếu đã xử lý trước đó (bỏ qua, đảm bảo idempotent).
   */
  markProcessedIfNew(eventId: string, consumer: string): Promise<boolean>;
}
