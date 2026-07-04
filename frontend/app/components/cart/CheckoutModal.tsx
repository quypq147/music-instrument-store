"use client";

import type { Customer } from "../../../types/cart";
import AddressSelector from "../address/AddressSelector";

interface CheckoutModalProps {
  customer: Customer;
  onChangeCustomer: (customer: Customer) => void;
  paymentMethod: string;
  onChangePaymentMethod: (method: string) => void;
  totalPrice: number;
  isSubmitting: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

const inputClasses =
  "w-full py-3 px-4 bg-white dark:bg-[#031d16] border border-gray-200 dark:border-primary-container/30 rounded-xl text-sm text-slate-700 dark:text-emerald-50 transition-all outline-none focus:border-primary disabled:opacity-60 disabled:cursor-not-allowed placeholder:text-gray-400 dark:placeholder:text-emerald-800/40";

export function CheckoutModal({
  customer,
  onChangeCustomer,
  paymentMethod,
  onChangePaymentMethod,
  totalPrice,
  isSubmitting,
  onConfirm,
  onClose,
}: CheckoutModalProps) {
  const updateField = (field: keyof Customer, value: string) => {
    onChangeCustomer({
      ...customer,
      [field]: value,
    });
  };

  const paymentOptions = [
    { value: "COD", label: "💵 Thanh toán khi nhận hàng (COD)" },
    { value: "Momo", label: "🟣 Ví Momo" },
    { value: "VNPay", label: "🔵 VNPay / Ngân hàng" },
    { value: "Stripe", label: "💳 Thẻ tín dụng quốc tế (Stripe)" },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#06261d] w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl p-6 md:p-8 border border-transparent dark:border-primary-container/20 transition-colors duration-300">
        <h2 className="font-serif text-2xl text-primary mb-6">Thông tin đặt hàng</h2>

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Họ và tên"
            value={customer.name}
            onChange={(e) => updateField("name", e.target.value)}
            disabled={isSubmitting}
            className={inputClasses}
          />

          <input
            type="text"
            placeholder="Số điện thoại"
            value={customer.phone}
            onChange={(e) => updateField("phone", e.target.value)}
            disabled={isSubmitting}
            className={inputClasses}
          />

          <AddressSelector
            value={customer.address}
            onChange={(val) => updateField("address", val)}
            disabled={isSubmitting}
          />

          <textarea
            placeholder="Ghi chú thêm"
            value={customer.note}
            onChange={(e) => updateField("note", e.target.value)}
            disabled={isSubmitting}
            rows={3}
            className={inputClasses}
          />

          <div>
            <h3 className="text-xs font-bold tracking-widest uppercase text-primary mb-3">
              Phương thức thanh toán
            </h3>
            <div className="space-y-2">
              {paymentOptions.map((option) => (
                <label
                  key={option.value}
                  className={`flex items-center gap-3 border rounded-xl px-4 py-3 cursor-pointer transition-colors ${
                    paymentMethod === option.value
                      ? "border-primary dark:border-secondary bg-[#F3EFEA] dark:bg-[#031d16]"
                      : "border-gray-200 dark:border-primary-container/25 hover:bg-gray-50 dark:hover:bg-[#031d16]"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === option.value}
                    onChange={() => onChangePaymentMethod(option.value)}
                    disabled={isSubmitting}
                    className="accent-[#002B1F] dark:accent-secondary"
                  />
                  <span className="text-sm text-slate-700 dark:text-emerald-100/70">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center border-t border-gray-100 dark:border-primary-container/20 pt-4">
            <span className="text-sm font-semibold text-slate-700 dark:text-emerald-50">Tổng thanh toán</span>
            <strong className="text-xl font-bold text-[#A36B2B]">
              {totalPrice.toLocaleString("vi-VN")}đ
            </strong>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onConfirm}
              disabled={isSubmitting}
              className="flex-1 bg-primary hover:bg-primary-container text-white dark:text-[#002B1F] dark:bg-secondary dark:hover:bg-secondary-container font-bold text-sm uppercase tracking-widest py-3.5 rounded-xl transition-colors disabled:opacity-60 cursor-pointer"
            >
              {isSubmitting ? "Đang gửi..." : "Xác nhận đặt hàng"}
            </button>

            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-6 border border-gray-200 dark:border-primary-container/20 text-slate-600 dark:text-emerald-100/70 font-bold text-sm uppercase tracking-widest py-3.5 rounded-xl hover:bg-gray-50 dark:hover:bg-[#031d16] transition-colors disabled:opacity-60 cursor-pointer"
            >
              Hủy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
