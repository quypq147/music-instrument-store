import { expect, type Page } from "@playwright/test";

// Helper dùng chung cho các spec E2E.

export async function addFirstProductToCart(page: Page) {
  await page.goto("/products");
  const addButton = page
    .getByRole("button", { name: "Thêm vào giỏ hàng" })
    .first();
  await expect(addButton).toBeVisible({ timeout: 15_000 });
  await addButton.click();
  await expect(page.getByText(/Đã thêm .* vào giỏ hàng!/)).toBeVisible();
}

// Đăng nhập bằng tài khoản test (E2E_TEST_EMAIL / E2E_TEST_PASSWORD).
// Ném lỗi rõ ràng nếu Cognito rẽ sang xác minh thiết bị — bước OTP qua email
// không tự động hóa được.
export async function login(page: Page) {
  const email = process.env.E2E_TEST_EMAIL;
  const password = process.env.E2E_TEST_PASSWORD;
  if (!email || !password) {
    throw new Error("Cần E2E_TEST_EMAIL / E2E_TEST_PASSWORD trong .env.local");
  }

  await page.goto("/login");
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: "Đăng Nhập" }).click();

  await page.waitForURL(
    (url) => url.pathname === "/" || url.pathname === "/verify-device",
    { timeout: 30_000 }
  );

  if (new URL(page.url()).pathname === "/verify-device") {
    throw new Error(
      "Tài khoản test bị yêu cầu xác minh thiết bị (OTP email) — không thể tự động hóa; hãy đánh dấu thiết bị tin cậy cho tài khoản test trước."
    );
  }
}

export function hasTestCredentials(): boolean {
  return !!(process.env.E2E_TEST_EMAIL && process.env.E2E_TEST_PASSWORD);
}
