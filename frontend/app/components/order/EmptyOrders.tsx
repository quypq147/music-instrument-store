"use client";

import Link from "next/link";

export function EmptyOrders() {
  return (
    <div className="empty-orders">
      <h2>Chưa có đơn hàng nào</h2>
      <p>Đơn hàng của bạn sẽ hiển thị tại đây.</p>

      <Link href="/products">
        <button type="button">Tiếp tục mua hàng</button>
      </Link>
    </div>
  );
}
