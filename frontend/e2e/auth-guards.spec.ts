import { test, expect } from "@playwright/test";

// AUTH-06: bảo vệ route và API khi CHƯA đăng nhập. Các test này không cần
// tài khoản Cognito — phần đăng nhập thật (AUTH-01→05) nằm ở spec riêng và
// yêu cầu biến môi trường E2E_TEST_EMAIL / E2E_TEST_PASSWORD.

test.describe("Bảo vệ route (AUTH-06)", () => {
  test("khách vãng lai vào /admin thấy màn hình từ chối truy cập", async ({
    page,
  }) => {
    await page.goto("/admin");

    await expect(
      page.getByRole("heading", { name: "Truy Cập Bị Từ Chối" })
    ).toBeVisible({ timeout: 15_000 });
  });

  test("khách vãng lai vào /profile được yêu cầu đăng nhập", async ({
    page,
  }) => {
    await page.goto("/profile");

    await expect(
      page.getByText("Vui lòng đăng nhập để xem thông tin tài khoản")
    ).toBeVisible({ timeout: 15_000 });
  });

  test("bấm yêu thích khi chưa đăng nhập → chuyển về /login", async ({
    page,
  }) => {
    await page.goto("/products");

    const heart = page
      .getByRole("button", { name: "Thêm vào danh sách yêu thích" })
      .first();
    await expect(heart).toBeVisible({ timeout: 15_000 });
    await heart.click();

    await expect(
      page.getByText(
        "Vui lòng đăng nhập để thêm sản phẩm vào danh sách yêu thích!"
      )
    ).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("Bảo vệ API admin (ADM-01 — thiếu token)", () => {
  for (const path of ["/api/admin/users", "/api/admin/orders", "/api/admin/coupons"]) {
    test(`GET ${path} không có token bị từ chối`, async ({ request }) => {
      const res = await request.get(path);

      // Backend (API Gateway + Cognito authorizer) phải từ chối request
      // không có Authorization header — tuyệt đối không trả 2xx kèm dữ liệu.
      expect(res.status()).toBeGreaterThanOrEqual(400);
    });
  }
});
