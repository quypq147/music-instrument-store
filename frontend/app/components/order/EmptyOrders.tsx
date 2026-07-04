"use client";

import Link from "next/link";

export function EmptyOrders() {
  return (
    <div className="max-w-md mx-auto text-center bg-[#F3EFEA] rounded-2xl p-10 md:p-14">
      <div className="text-5xl mb-4">📦</div>
      <h2 className="font-serif text-xl text-[#002B1F] mb-2">Chưa có đơn hàng nào</h2>
      <p className="text-sm text-slate-600 mb-6">Đơn hàng của bạn sẽ hiển thị tại đây.</p>

      <Link href="/products">
        <button
          type="button"
          className="bg-[#002B1F] hover:bg-[#054030] text-white font-bold text-sm uppercase tracking-widest px-8 py-3.5 rounded-xl transition-colors"
        >
          Tiếp tục mua hàng
        </button>
      </Link>
    </div>
  );
}
