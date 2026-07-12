import { test, expect, type Page } from "@playwright/test";

// Smoke test giai đoạn 1 của kế hoạch kiểm thử toàn bộ flow
// (docs/ke_hoach_kiem_thu_toan_bo_flow.md): trang chủ, danh sách sản phẩm,
// trang đăng nhập. Chỉ kiểm tra render và điều hướng cơ bản, chưa cần tài
// khoản test hay dữ liệu seed đặc thù.

function collectPageErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(err.message));
  return errors;
}

test.describe("Trang chủ (PROD-01)", () => {
  test("render hero, danh mục và không có lỗi runtime", async ({ page }) => {
    const errors = collectPageErrors(page);

    await page.goto("/");

    await expect(
      page.getByRole("heading", { name: "Aureate Forest", exact: true })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Danh Mục Sản Phẩm" })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Sản Phẩm Nổi Bật" })
    ).toBeVisible();

    expect(errors).toEqual([]);
  });

  test("nút 'Mua ngay' dẫn tới trang sản phẩm", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("link", { name: "Mua ngay" }).click();

    await expect(page).toHaveURL(/\/products/);
  });
});

test.describe("Danh sách sản phẩm (PROD-02)", () => {
  test("trang /products render không lỗi runtime", async ({ page }) => {
    const errors = collectPageErrors(page);

    const response = await page.goto("/products");

    expect(response?.ok()).toBe(true);
    await expect(page.locator("main")).toBeVisible();
    expect(errors).toEqual([]);
  });
});

test.describe("Đăng nhập (AUTH-02 — render form)", () => {
  test("hiển thị đầy đủ form đăng nhập", async ({ page }) => {
    await page.goto("/login");

    await expect(
      page.getByRole("heading", { name: "Đăng Nhập" })
    ).toBeVisible();
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Đăng Nhập" })).toBeEnabled();
  });

  test("liên kết sang đăng ký và quên mật khẩu hoạt động", async ({ page }) => {
    await page.goto("/login");

    await page.getByRole("link", { name: /Đăng ký ngay/ }).click();
    await expect(page).toHaveURL(/\/register/);

    await page.goto("/login");
    await page.getByRole("link", { name: "Quên mật khẩu?" }).click();
    await expect(page).toHaveURL(/\/forgot-password/);
  });

  test("đăng nhập sai hiển thị thông báo lỗi, không điều hướng", async ({
    page,
  }) => {
    await page.goto("/login");

    await page.locator("#email").fill("khong-ton-tai@example.com");
    await page.locator("#password").fill("MatKhauSai@123");
    await page.getByRole("button", { name: "Đăng Nhập" }).click();

    // Toast lỗi từ translateSignInError (UserNotFoundException /
    // NotAuthorizedException) — chỉ cần khớp phần thông điệp chung.
    await expect(
      page.getByText(/Không tìm thấy tài khoản|Email hoặc mật khẩu không đúng/)
    ).toBeVisible({ timeout: 15_000 });
    await expect(page).toHaveURL(/\/login/);
  });
});
