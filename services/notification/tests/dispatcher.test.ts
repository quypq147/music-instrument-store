import { dispatchEvent, type DispatcherDeps } from "../src/application/dispatcher";
import type { EmailMessage, SmsMessage } from "../src/domain/notification.entity";

function createFakeDeps(alreadyProcessed = false) {
  const sentEmails: EmailMessage[] = [];
  const sentSms: SmsMessage[] = [];

  const deps: DispatcherDeps = {
    emailProvider: { send: async (m) => { sentEmails.push(m); return "SENT" as const; } },
    smsProvider: { send: async (m) => { sentSms.push(m); } },
    templateRenderer: {
      renderEmail: (name, data) => ({
        subject: `subject:${name}`,
        html: `html:${JSON.stringify(data)}`,
        text: `text:${JSON.stringify(data)}`,
      }),
      renderSms: (name, data) => `sms:${name}:${JSON.stringify(data)}`,
    },
    logRepository: {
      markProcessedIfNew: async () => !alreadyProcessed,
    },
  };

  return { deps, sentEmails, sentSms };
}

describe("dispatchEvent", () => {
  it("bỏ qua xử lý nếu eventId đã được xử lý trước đó (idempotent)", async () => {
    const { deps, sentEmails } = createFakeDeps(true);

    await dispatchEvent("evt-1", "OrderCancelled", { orderId: "o1", email: "a@b.com" }, deps);

    expect(sentEmails).toHaveLength(0);
  });

  it("gửi email xác nhận đơn khi PaymentSucceeded có email", async () => {
    const { deps, sentEmails } = createFakeDeps(false);

    await dispatchEvent(
      "evt-2",
      "PaymentSucceeded",
      { id: "o2", amount: 100000, email: "customer@example.com" },
      deps
    );

    expect(sentEmails).toHaveLength(1);
    expect(sentEmails[0].to).toBe("customer@example.com");
  });

  it("gửi cả email và SMS khi hủy đơn có đủ email và customer.phone", async () => {
    const { deps, sentEmails, sentSms } = createFakeDeps(false);

    await dispatchEvent(
      "evt-3",
      "OrderCancelled",
      { orderId: "o3", reason: "Hết hàng", email: "a@b.com", customer: { phone: "+84900000000" } },
      deps
    );

    expect(sentEmails).toHaveLength(1);
    expect(sentSms).toHaveLength(1);
    expect(sentSms[0].to).toBe("+84900000000");
  });
});
