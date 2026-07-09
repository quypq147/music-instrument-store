"use client";

import { useState } from "react";
import type { Customer } from "../../../types/cart";
import AddressSelector from "../address/AddressSelector";
import { useToast } from "../../context/ToastContext";

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
  const [step, setStep] = useState<1 | 2>(1);
  const { showToast } = useToast();

  const updateField = (field: keyof Customer, value: string) => {
    onChangeCustomer({
      ...customer,
      [field]: value,
    });
  };

  const handleNextStep = () => {
    if (!customer.name.trim()) {
      showToast("Vui lòng nhập họ và tên nhận hàng!", "warning");
      return;
    }
    if (!customer.phone.trim()) {
      showToast("Vui lòng nhập số điện thoại liên hệ!", "warning");
      return;
    }
    if (!customer.address.trim()) {
      showToast("Vui lòng điền/chọn địa chỉ nhận hàng chi tiết!", "warning");
      return;
    }
    setStep(2);
  };

  const paymentOptions = [
    { value: "COD", label: "💵 Thanh toán khi nhận hàng (COD)" },
    { value: "Momo", label: "🟣 Ví Momo" },
    { value: "VNPay", label: "🔵 VNPay / Ngân hàng" },
    { value: "Stripe", label: "💳 Thẻ tín dụng quốc tế (Stripe)" },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#06261d] w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl p-6 md:p-8 border border-transparent dark:border-primary-container/20 transition-colors duration-300">
        
        {/* Stepper Progress */}
        <div className="flex items-center justify-between mb-8 relative max-w-xs mx-auto">
          {/* Connecting Line */}
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[2px] bg-gray-200 dark:bg-emerald-950/40 z-0"></div>
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 h-[2px] bg-primary dark:bg-secondary transition-all duration-300 z-0"
            style={{ width: step === 1 ? "0%" : "100%" }}
          ></div>

          {/* Step 1 */}
          <button
            type="button"
            onClick={() => setStep(1)}
            className="relative z-10 flex flex-col items-center gap-1 group focus:outline-none cursor-pointer"
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                step >= 1
                  ? "bg-primary dark:bg-secondary text-white dark:text-[#002B1F]"
                  : "bg-gray-200 dark:bg-emerald-950/40 text-gray-500"
              }`}
            >
              1
            </div>
            <span
              className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${
                step === 1
                  ? "text-primary dark:text-secondary"
                  : "text-gray-400 dark:text-emerald-800/40"
              }`}
            >
              Giao hàng
            </span>
          </button>

          {/* Step 2 */}
          <button
            type="button"
            onClick={() => {
              if (step === 1) {
                handleNextStep();
              }
            }}
            className="relative z-10 flex flex-col items-center gap-1 group focus:outline-none cursor-pointer"
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                step === 2
                  ? "bg-primary dark:bg-secondary text-white dark:text-[#002B1F]"
                  : "bg-gray-200 dark:bg-emerald-950/40 text-gray-500"
              }`}
            >
              2
            </div>
            <span
              className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${
                step === 2
                  ? "text-primary dark:text-secondary"
                  : "text-gray-400 dark:text-emerald-800/40"
              }`}
            >
              Thanh toán
            </span>
          </button>
        </div>

        <h2 className="font-serif text-2xl text-primary mb-6">
          {step === 1 ? "Thông tin đặt hàng" : "Phương thức thanh toán"}
        </h2>

        {step === 1 ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Họ và tên</label>
                <input
                  type="text"
                  placeholder="Họ và tên"
                  value={customer.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  disabled={isSubmitting}
                  className={inputClasses}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Số điện thoại</label>
                <input
                  type="text"
                  placeholder="Số điện thoại"
                  value={customer.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  disabled={isSubmitting}
                  className={inputClasses}
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Địa chỉ nhận hàng</label>
              <AddressSelector
                value={customer.address}
                onChange={(val) => updateField("address", val)}
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Ghi chú thêm (Tùy chọn)</label>
              <textarea
                placeholder="Ghi chú thêm về đơn hàng..."
                value={customer.note}
                onChange={(e) => updateField("note", e.target.value)}
                disabled={isSubmitting}
                rows={3}
                className={inputClasses}
              />
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-primary-container/20">
              <button
                type="button"
                onClick={handleNextStep}
                className="flex-1 bg-primary hover:bg-primary-container text-white dark:text-[#002B1F] dark:bg-secondary dark:hover:bg-secondary-container font-bold text-sm uppercase tracking-widest py-3.5 rounded-xl transition-colors cursor-pointer border-none"
              >
                Tiếp tục
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-6 border border-gray-200 dark:border-primary-container/20 text-slate-600 dark:text-emerald-100/70 font-bold text-sm uppercase tracking-widest py-3.5 rounded-xl hover:bg-gray-50 dark:hover:bg-[#031d16] transition-colors cursor-pointer bg-transparent"
              >
                Hủy
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Shipping Info Summary Box */}
            <div className="bg-[#F3EFEA] dark:bg-[#031d16] border border-transparent dark:border-primary-container/15 rounded-xl p-4 space-y-2.5 text-sm transition-colors">
              <div className="flex justify-between items-center pb-2 border-b border-gray-200 dark:border-primary-container/10">
                <span className="font-bold text-primary dark:text-[#80bea6] text-xs uppercase tracking-wider">Thông tin giao hàng</span>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs text-secondary dark:text-[#fe932c] font-bold hover:underline cursor-pointer bg-transparent border-none outline-none"
                >
                  Thay đổi
                </button>
              </div>
              <div className="grid grid-cols-[100px_1fr] gap-x-2 gap-y-1 text-slate-700 dark:text-emerald-100/80">
                <span className="font-semibold text-xs uppercase text-slate-400">Người nhận:</span>
                <span>{customer.name}</span>
                <span className="font-semibold text-xs uppercase text-slate-400">Điện thoại:</span>
                <span>{customer.phone}</span>
                <span className="font-semibold text-xs uppercase text-slate-400">Địa chỉ:</span>
                <span>{customer.address}</span>
                {customer.note && (
                  <>
                    <span className="font-semibold text-xs uppercase text-slate-400">Ghi chú:</span>
                    <span className="italic">&quot;{customer.note}&quot;</span>
                  </>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold tracking-widest uppercase text-primary mb-3">
                Chọn phương thức thanh toán
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {paymentOptions.map((option) => (
                  <label
                    key={option.value}
                    className={`flex items-center gap-3 border rounded-xl px-4 py-3 cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-xs ${
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
                    <span className="text-sm font-medium text-slate-700 dark:text-emerald-100/70">{option.label}</span>
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
                className="flex-1 bg-primary hover:bg-primary-container text-white dark:text-[#002B1F] dark:bg-secondary dark:hover:bg-secondary-container font-bold text-sm uppercase tracking-widest py-3.5 rounded-xl transition-colors disabled:opacity-60 cursor-pointer border-none"
              >
                {isSubmitting ? "Đang gửi..." : "Xác nhận đặt hàng"}
              </button>

              <button
                type="button"
                onClick={() => setStep(1)}
                disabled={isSubmitting}
                className="px-6 border border-gray-200 dark:border-primary-container/20 text-slate-600 dark:text-emerald-100/70 font-bold text-sm uppercase tracking-widest py-3.5 rounded-xl hover:bg-gray-50 dark:hover:bg-[#031d16] transition-colors disabled:opacity-60 cursor-pointer bg-transparent"
              >
                Quay lại
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
