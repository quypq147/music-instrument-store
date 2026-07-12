import { test, expect } from "@playwright/test";

// CHAT-01: chat widget nói chuyện với bot Amazon Lex (khách vãng lai).
// CNT-01: form liên hệ /lien-he (validate + gửi thật tới contact-api).
// CNT-02: các nút liên hệ nổi (điện thoại, Zalo) — regression cho
// FloatingContacts.tsx.

test.describe("Chat widget với Lex (CHAT-01)", () => {
  test("mở widget, gửi tin nhắn và nhận phản hồi từ bot", async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto("/");

    // Nút mở chat là floating button tròn 14x14 duy nhất.
    await page.locator("button.w-14.h-14").click();
    await expect(page.getByText("Trợ Lý Music Store")).toBeVisible();
    await expect(
      page.getByText(/Chào bạn! Tôi là trợ lý ảo AI/)
    ).toBeVisible();

    await page.getByPlaceholder("Nhập yêu cầu...").fill("Xin chào");
    await page.getByPlaceholder("Nhập yêu cầu...").press("Enter");

    // Tin của khách hiện ngay; Lex trả lời câu chào mặc định của bot
    // (xác nhận bằng cách gọi thẳng POST /api/chat khi thiết kế test).
    await expect(page.getByText("Xin chào", { exact: true })).toBeVisible();
    await expect(
      page.getByText(/Chào mừng bạn đến với Cửa hàng Nhạc cụ/)
    ).toBeVisible({ timeout: 30_000 });

    // Không được rơi vào nhánh lỗi kết nối.
    await expect(
      page.getByText("Đang mất kết nối Internet, vui lòng thử lại.")
    ).not.toBeVisible();
  });
});

test.describe("Trang liên hệ (CNT-01)", () => {
  test("bỏ trống họ tên/nội dung bị chặn", async ({ page }) => {
    await page.goto("/lien-he");

    await page.getByRole("button", { name: "Gửi Liên Hệ" }).click();

    await expect(
      page.getByText("Vui lòng nhập họ tên và nội dung cần tư vấn.")
    ).toBeVisible();
  });

  test("thiếu cả điện thoại lẫn email bị chặn", async ({ page }) => {
    await page.goto("/lien-he");

    await page.getByPlaceholder("Họ và tên").fill("Khách E2E");
    await page
      .getByPlaceholder("Nội dung cần tư vấn")
      .fill("Nội dung kiểm thử");
    await page.getByRole("button", { name: "Gửi Liên Hệ" }).click();

    await expect(
      page.getByText(
        "Vui lòng nhập ít nhất một cách liên hệ (số điện thoại hoặc email)."
      )
    ).toBeVisible();
  });

  test("điền đầy đủ gửi thành công tới contact-api", async ({ page }) => {
    // BUG hạ tầng (phát hiện 2026-07-12): SES đang ở sandbox mode và
    // identity no-reply@soniccart.dev chưa verify, nên contact-api luôn trả
    // 500. Đánh dấu "expected to fail" — khi SES được cấu hình xong test sẽ
    // báo passed-unexpectedly, lúc đó xóa dòng test.fail() này đi.
    test.fail();
    await page.goto("/lien-he");

    await page.getByPlaceholder("Họ và tên").fill("Khách E2E (kiểm thử)");
    await page.getByPlaceholder("Email").fill("e2e-test@example.com");
    await page
      .getByPlaceholder("Nội dung cần tư vấn")
      .fill("Tin nhắn từ bộ kiểm thử E2E — có thể bỏ qua.");
    await page.getByRole("button", { name: "Gửi Liên Hệ" }).click();

    await expect(
      page.getByText(/Đã gửi yêu cầu liên hệ thành công!/)
    ).toBeVisible({ timeout: 20_000 });
  });
});

test.describe("Nút liên hệ nổi (CNT-02)", () => {
  test("hiện nút gọi điện và Zalo với liên kết đúng", async ({ page }) => {
    await page.goto("/");

    const phone = page.locator('a[href="tel:0912191218"]');
    const zalo = page.locator('a[href="https://zalo.me/0912191218"]');

    await expect(phone).toBeVisible();
    await expect(zalo).toBeVisible();
    await expect(zalo).toHaveAttribute("target", "_blank");
    await expect(zalo).toHaveAttribute("rel", /noopener/);
  });

  test("nút nổi ẩn đi khi mở chat widget", async ({ page }) => {
    await page.goto("/");

    await page.locator("button.w-14.h-14").click();
    await expect(page.getByText("Trợ Lý Music Store")).toBeVisible();

    await expect(
      page.locator('a[href="https://zalo.me/0912191218"]')
    ).not.toBeVisible();
  });
});
