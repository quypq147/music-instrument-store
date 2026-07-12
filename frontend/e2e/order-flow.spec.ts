import { test, expect } from "@playwright/test";
import { addFirstProductToCart, login, hasTestCredentials } from "./helpers";

// ORD-01 + CHK (nhánh COD): luồng doanh thu đầy đủ khi ĐÃ đăng nhập —
// thêm giỏ → đặt hàng COD → POST /api/orders (JWT) → đơn xuất hiện ở /orders.
//
// LƯU Ý: mỗi lần chạy tạo một đơn hàng THẬT trong DynamoDB môi trường dev
// (đã được đồng ý). Không chạy suite này trên production.

test.describe("Đặt hàng COD end-to-end (ORD-01)", () => {
  test.skip(
    !hasTestCredentials(),
    "Cần E2E_TEST_EMAIL / E2E_TEST_PASSWORD trong .env.local"
  );

  test("đăng nhập → thêm giỏ → đặt COD → đơn hiện trong /orders", async ({
    page,
  }) => {
    await login(page);
    await addFirstProductToCart(page);

    await page.goto("/cart");
    const productName = (
      await page.locator("h3.font-serif").first().textContent()
    )?.trim();
    expect(productName).toBeTruthy();

    await page.getByRole("button", { name: "Đặt Hàng" }).click();
    await page.getByPlaceholder("Họ và tên").fill("Khách Hàng E2E");
    await page.getByPlaceholder("Số điện thoại").fill("0900000001");
    await page
      .getByPlaceholder(/Số nhà, tên đường/)
      .fill("123 Đường Kiểm Thử, Quận Test (đơn E2E — có thể xóa)");
    await page.getByRole("button", { name: "Tiếp tục", exact: true }).click();

    // COD là phương thức mặc định; xác nhận luôn.
    await expect(
      page.getByRole("heading", { name: "Phương thức thanh toán", exact: true })
    ).toBeVisible();
    await page.getByRole("button", { name: "Xác nhận đặt hàng" }).click();

    // Thành công → chuyển sang /orders, đơn mới nằm ở tab "Chờ xác nhận".
    await page.waitForURL(/\/orders/, { timeout: 30_000 });
    await expect(page.getByText(productName!).first()).toBeVisible({
      timeout: 15_000,
    });
  });
});
