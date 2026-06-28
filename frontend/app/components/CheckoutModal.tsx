"use client";

import type { Customer } from "../../types/cart";

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

  return (
    <div className="checkout-overlay">
      <div className="checkout-box">
        <h2>Thông tin đặt hàng</h2>

        <input
          type="text"
          placeholder="Họ và tên"
          value={customer.name}
          onChange={(e) => updateField("name", e.target.value)}
          disabled={isSubmitting}
        />

        <input
          type="text"
          placeholder="Số điện thoại"
          value={customer.phone}
          onChange={(e) => updateField("phone", e.target.value)}
          disabled={isSubmitting}
        />

        <input
          type="text"
          placeholder="Địa chỉ nhận hàng"
          value={customer.address}
          onChange={(e) => updateField("address", e.target.value)}
          disabled={isSubmitting}
        />

        <textarea
          placeholder="Ghi chú thêm"
          value={customer.note}
          onChange={(e) => updateField("note", e.target.value)}
          disabled={isSubmitting}
        />

        <div className="payment-box">
          <h3>Phương thức thanh toán</h3>

          <label className="payment-option">
            <input
              type="radio"
              name="payment"
              checked={paymentMethod === "COD"}
              onChange={() => onChangePaymentMethod("COD")}
              disabled={isSubmitting}
            />
            <span>💵 Thanh toán khi nhận hàng (COD)</span>
          </label>

          <label className="payment-option">
            <input
              type="radio"
              name="payment"
              checked={paymentMethod === "Momo"}
              onChange={() => onChangePaymentMethod("Momo")}
              disabled={isSubmitting}
            />
            <span>🟣 Ví Momo</span>
          </label>

          <label className="payment-option">
            <input
              type="radio"
              name="payment"
              checked={paymentMethod === "VNPay"}
              onChange={() => onChangePaymentMethod("VNPay")}
              disabled={isSubmitting}
            />
            <span>🔵 VNPay / Ngân hàng</span>
          </label>
        </div>

        <div className="checkout-total-box">
          <span>Tổng thanh toán</span>
          <strong>{totalPrice.toLocaleString("vi-VN")}đ</strong>
        </div>

        <div className="checkout-actions">
          <button
            type="button"
            className="confirm-order-btn"
            onClick={onConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Đang gửi..." : "Xác nhận đặt hàng"}
          </button>

          <button
            type="button"
            className="cancel-order-btn"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Hủy
          </button>
        </div>
      </div>
    </div>
  );
}
