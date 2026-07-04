"use client";

import Link from "next/link";

interface CartSummaryProps {
  totalItems: number;
  totalPrice: number;
  onOrderClick: () => void;
  onClearCartClick: () => void;
}

export function CartSummary({
  totalItems,
  totalPrice,
  onOrderClick,
  onClearCartClick,
}: CartSummaryProps) {
  return (
    <aside className="cart-summary-box">
      <h2>Thông tin đơn hàng</h2>

      <div className="summary-row">
        <span>Sản phẩm đã chọn</span>
        <strong>{totalItems}</strong>
      </div>

      <div className="summary-row">
        <span>Tạm tính</span>
        <strong>{totalPrice.toLocaleString("vi-VN")}đ</strong>
      </div>

      <div className="summary-row">
        <span>Phí vận chuyển</span>
        <strong>Miễn phí</strong>
      </div>

      <div className="summary-total">
        <span>Tổng tiền</span>
        <strong>{totalPrice.toLocaleString("vi-VN")}đ</strong>
      </div>

      <button
        type="button"
        className="order-btn"
        onClick={onOrderClick}
      >
        Đặt Hàng
      </button>

      <Link href="/products">
        <button type="button" className="continue-shopping-btn">
          Tiếp tục mua hàng
        </button>
      </Link>

      <button
        type="button"
        className="clear-cart-btn"
        onClick={onClearCartClick}
      >
        Xóa toàn bộ giỏ hàng
      </button>
    </aside>
  );
}
