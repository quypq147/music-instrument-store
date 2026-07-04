"use client";

import Link from "next/link";

interface CartSummaryProps {
  totalItems: number;
  totalPrice: number;
  onOrderClick: () => void;
  onClearCartClick: () => void;
  couponCode: string;
  onCouponCodeChange: (value: string) => void;
  onApplyCoupon: () => void;
  isApplyingCoupon: boolean;
  couponError: string | null;
  discountAmount: number;
}

export function CartSummary({
  totalItems,
  totalPrice,
  onOrderClick,
  onClearCartClick,
  couponCode,
  onCouponCodeChange,
  onApplyCoupon,
  isApplyingCoupon,
  couponError,
  discountAmount,
}: CartSummaryProps) {
  const finalPrice = Math.max(totalPrice - discountAmount, 0);

  return (
    <aside className="bg-white dark:bg-[#06261d] rounded-2xl border border-gray-100 dark:border-primary-container/20 p-6 h-fit lg:sticky lg:top-24 transition-colors duration-300">
      <h2 className="font-serif text-xl text-primary mb-6">Thông tin đơn hàng</h2>

      <div className="flex justify-between text-sm text-slate-600 dark:text-emerald-100/70 mb-3">
        <span>Sản phẩm đã chọn</span>
        <strong className="text-primary">{totalItems}</strong>
      </div>

      <div className="flex justify-between text-sm text-slate-600 dark:text-emerald-100/70 mb-3">
        <span>Tạm tính</span>
        <strong className="text-primary">{totalPrice.toLocaleString("vi-VN")}đ</strong>
      </div>

      <div className="flex justify-between text-sm text-slate-600 dark:text-emerald-100/70 mb-4">
        <span>Phí vận chuyển</span>
        <strong className="text-emerald-600 dark:text-emerald-400">Miễn phí</strong>
      </div>

      <div className="mb-4">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Nhập mã giảm giá"
            value={couponCode}
            onChange={(e) => onCouponCodeChange(e.target.value.toUpperCase())}
            className="flex-1 min-w-0 px-3 py-2.5 bg-gray-50/50 dark:bg-[#031d16]/50 border border-gray-200 dark:border-primary-container/30 rounded-xl outline-none focus:border-[#DF9E47] text-sm text-gray-700 dark:text-emerald-50"
          />
          <button
            type="button"
            onClick={onApplyCoupon}
            disabled={isApplyingCoupon || !couponCode.trim()}
            className="px-4 border border-primary text-primary font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-primary hover:text-white dark:hover:text-[#002B1F] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isApplyingCoupon ? "..." : "Áp dụng"}
          </button>
        </div>
        {couponError && (
          <p className="text-xs text-rose-600 dark:text-rose-400 mt-1.5">{couponError}</p>
        )}
        {discountAmount > 0 && !couponError && (
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1.5">
            Đã áp dụng mã giảm giá!
          </p>
        )}
      </div>

      {discountAmount > 0 && (
        <div className="flex justify-between text-sm text-emerald-600 dark:text-emerald-400 mb-4">
          <span>Giảm giá</span>
          <strong>-{discountAmount.toLocaleString("vi-VN")}đ</strong>
        </div>
      )}

      <div className="flex justify-between items-center border-t border-gray-100 dark:border-primary-container/20 pt-4 mb-6">
        <span className="text-sm font-semibold text-slate-700 dark:text-emerald-50">Tổng tiền</span>
        <strong className="text-xl font-bold text-[#A36B2B]">{finalPrice.toLocaleString("vi-VN")}đ</strong>
      </div>

      <button
        type="button"
        onClick={onOrderClick}
        className="w-full bg-primary hover:bg-primary-container text-white dark:text-[#002B1F] dark:bg-secondary dark:hover:bg-secondary-container font-bold text-sm uppercase tracking-widest py-4 rounded-xl transition-colors shadow-lg cursor-pointer"
      >
        Đặt Hàng
      </button>

      <Link href="/products">
        <button
          type="button"
          className="w-full border border-primary text-primary font-bold text-sm uppercase tracking-widest py-4 rounded-xl mt-3 hover:bg-primary hover:text-white dark:hover:text-[#002B1F] transition-all cursor-pointer"
        >
          Tiếp tục mua hàng
        </button>
      </Link>

      <button
        type="button"
        onClick={onClearCartClick}
        className="w-full text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline mt-4 transition-colors cursor-pointer"
      >
        Xóa toàn bộ giỏ hàng
      </button>
    </aside>
  );
}
