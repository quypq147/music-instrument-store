import { test, expect } from "@playwright/test";

// AUTH-02/03: đăng nhập thật bằng tài khoản test Cognito. Yêu cầu
// E2E_TEST_EMAIL / E2E_TEST_PASSWORD trong .env.local (được nạp qua
// playwright.config.ts). Nếu thiếu, cả describe bị skip.
//
// Lưu ý: mỗi browser context của Playwright là "thiết bị" mới, nên đăng nhập
// có thể rẽ sang /verify-device và gửi OTP thật tới email test — đó là hành
// vi đúng của AUTH-03, test chấp nhận cả hai nhánh.

const email = process.env.E2E_TEST_EMAIL;
const password = process.env.E2E_TEST_PASSWORD;

test.describe("Đăng nhập tài khoản test (AUTH-02/03)", () => {
  test.skip(
    !email || !password,
    "Cần E2E_TEST_EMAIL / E2E_TEST_PASSWORD trong .env.local"
  );

  test("Cognito chấp nhận thông tin đăng nhập của tài khoản test", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.locator("#email").fill(email!);
    await page.locator("#password").fill(password!);
    await page.getByRole("button", { name: "Đăng Nhập" }).click();

    // Hai kết cục hợp lệ sau khi Cognito xác thực thành công:
    // 1. Thiết bị đã tin cậy (hoặc bước check lỗi mạng) → về trang chủ.
    // 2. Thiết bị lạ → /verify-device (AUTH-03) và OTP được gửi qua email.
    await page.waitForURL(
      (url) => url.pathname === "/" || url.pathname === "/verify-device",
      { timeout: 30_000 }
    );

    if (new URL(page.url()).pathname === "/verify-device") {
      // Nhánh AUTH-03: trang xác minh thiết bị render được form nhập OTP.
      await expect(page.locator("input").first()).toBeVisible();
    } else {
      // Nhánh trực tiếp: có phiên đăng nhập thật — /profile không còn đòi
      // đăng nhập nữa.
      await page.goto("/profile");
      await expect(
        page.getByText("Vui lòng đăng nhập để xem thông tin tài khoản")
      ).not.toBeVisible();
      await expect(page.getByText(email!).first()).toBeVisible({
        timeout: 15_000,
      });
    }
  });

  test("mật khẩu sai với email test hiển thị lỗi NotAuthorized", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.locator("#email").fill(email!);
    await page.locator("#password").fill("SaiMatKhau@999");
    await page.getByRole("button", { name: "Đăng Nhập" }).click();

    await expect(
      page.getByText(/Email hoặc mật khẩu không đúng/)
    ).toBeVisible({ timeout: 15_000 });
    await expect(page).toHaveURL(/\/login/);
  });
});
