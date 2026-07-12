import { test, expect } from "@playwright/test";
import { addFirstProductToCart } from "./helpers";

// Giai đoạn 2 của kế hoạch kiểm thử toàn bộ flow: luồng mua hàng
// duyệt sản phẩm → thêm giỏ → giỏ hàng → modal đặt hàng (CART-01/02/03,
// CHK-02 một phần, và guard đăng nhập của luồng đặt hàng).
// Yêu cầu: môi trường dev có ít nhất 1 sản phẩm còn hàng.

test.describe("Giỏ hàng (CART-01/02/03)", () => {
  test("thêm sản phẩm vào giỏ và hiển thị đúng trong /cart", async ({
    page,
  }) => {
    await addFirstProductToCart(page);

    await page.goto("/cart");

    await expect(
      page.getByRole("heading", { name: "Giỏ Hàng Của Bạn" })
    ).toBeVisible();
    await expect(page.getByText("1 sản phẩm đã chọn")).toBeVisible();
    await expect(page.getByText("Thông tin đơn hàng")).toBeVisible();
  });

  test("tăng số lượng cập nhật tổng số sản phẩm đã chọn", async ({ page }) => {
    await addFirstProductToCart(page);
    await page.goto("/cart");

    await page.getByRole("button", { name: "+", exact: true }).click();

    await expect(page.getByText("2 sản phẩm đã chọn")).toBeVisible();
  });

  test("giỏ hàng giữ nguyên sau khi reload (persist localStorage)", async ({
    page,
  }) => {
    await addFirstProductToCart(page);
    await page.goto("/cart");
    await expect(page.getByText("1 sản phẩm đã chọn")).toBeVisible();

    await page.reload();

    await expect(page.getByText("1 sản phẩm đã chọn")).toBeVisible();
  });

  test("xóa sản phẩm qua hộp thoại xác nhận → giỏ trống", async ({ page }) => {
    await addFirstProductToCart(page);
    await page.goto("/cart");

    await page.getByRole("button", { name: "Xóa", exact: true }).click();
    await expect(page.getByText("Bạn chắc chắn muốn xóa sản phẩm này?")).toBeVisible();
    await page.getByRole("button", { name: "Xác nhận", exact: true }).click();

    await expect(page.getByText("Giỏ hàng đang trống")).toBeVisible();
  });

  test("giỏ trống có nút quay lại trang sản phẩm", async ({ page }) => {
    await page.goto("/cart");

    await expect(page.getByText("Giỏ hàng đang trống")).toBeVisible();
    await page.getByRole("button", { name: "Tiếp tục mua hàng" }).click();

    await expect(page).toHaveURL(/\/products/);
  });
});

test.describe("Mã giảm giá (CHK-02)", () => {
  test("mã không hợp lệ hiển thị thông báo lỗi", async ({ page }) => {
    await addFirstProductToCart(page);
    await page.goto("/cart");

    await page.getByPlaceholder("Nhập mã giảm giá").fill("MA-KHONG-TON-TAI");
    await page.getByRole("button", { name: "Áp dụng" }).click();

    // Lỗi cụ thể tùy backend trả về; chỉ cần có thông báo lỗi màu đỏ
    // dưới ô nhập mã và không có dòng "Đã áp dụng mã giảm giá!".
    await expect(page.locator("p.text-rose-600, p.text-xs.text-rose-600")).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText("Đã áp dụng mã giảm giá!")).not.toBeVisible();
  });
});

test.describe("Modal đặt hàng (CHK-01 — validate và guard đăng nhập)", () => {
  test("thiếu địa chỉ không cho sang bước thanh toán", async ({ page }) => {
    await addFirstProductToCart(page);
    await page.goto("/cart");

    await page.getByRole("button", { name: "Đặt Hàng" }).click();
    await expect(page.getByText("Thông tin đặt hàng")).toBeVisible();

    await page.getByPlaceholder("Họ và tên").fill("Nguyễn Văn Test");
    await page.getByPlaceholder("Số điện thoại").fill("0900000000");
    await page.getByRole("button", { name: "Tiếp tục", exact: true }).click();

    await expect(
      page.getByText("Vui lòng điền/chọn địa chỉ nhận hàng chi tiết!")
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "Phương thức thanh toán", exact: true })).not.toBeVisible();
  });

  test("chưa đăng nhập → xác nhận đặt hàng chuyển về /login", async ({
    page,
  }) => {
    await addFirstProductToCart(page);
    await page.goto("/cart");

    await page.getByRole("button", { name: "Đặt Hàng" }).click();
    await page.getByPlaceholder("Họ và tên").fill("Nguyễn Văn Test");
    await page.getByPlaceholder("Số điện thoại").fill("0900000000");
    await page
      .getByPlaceholder(/Số nhà, tên đường/)
      .fill("123 Đường Test, Quận 1");
    await page.getByRole("button", { name: "Tiếp tục", exact: true }).click();

    await expect(page.getByRole("heading", { name: "Phương thức thanh toán", exact: true })).toBeVisible();
    await page
      .getByRole("button", { name: "Xác nhận đặt hàng" })
      .click();

    await expect(
      page.getByText("Vui lòng đăng nhập để đặt hàng")
    ).toBeVisible({ timeout: 15_000 });
    await expect(page).toHaveURL(/\/login/);
  });
});
