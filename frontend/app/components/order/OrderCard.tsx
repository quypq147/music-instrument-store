"use client";

import { useState } from "react";
import Image from "next/image";
import { fetchAuthSession } from "aws-amplify/auth";
import type { Order } from "../../../types/cart";
import { formatOrderCode } from "../../lib/order";
import { useToast } from "../../context/ToastContext";

interface OrderCardProps {
  order: Order;
  showSummaryOnly?: boolean;
  onViewDetails?: () => void;
  onReceiptConfirmed?: (orderId: string) => void;
}

// Trạng thái cũ "Chờ giao hàng" được coi tương đương "Đang giao hàng" cho đơn hàng lịch sử
const IN_TRANSIT_STATUSES = ["Chờ giao hàng", "Đang giao hàng"];

export function OrderCard({ order, showSummaryOnly = false, onViewDetails, onReceiptConfirmed }: OrderCardProps) {
  const { showToast } = useToast();
  const [isConfirming, setIsConfirming] = useState(false);

  const isStep2Active =
    order.status === "Chờ lấy đơn" ||
    IN_TRANSIT_STATUSES.includes(order.status) ||
    order.status === "Đã giao hàng" ||
    order.status === "Đánh giá";

  const isStep3Active =
    IN_TRANSIT_STATUSES.includes(order.status) ||
    order.status === "Đã giao hàng" ||
    order.status === "Đánh giá";

  const isStep4Active = order.status === "Đã giao hàng" || order.status === "Đánh giá";

  const isStep5Active = order.status === "Đánh giá";

  const steps = [
    { label: "Chờ xác nhận", active: true },
    { label: "Chờ lấy đơn", active: isStep2Active },
    { label: "Đang giao hàng", active: isStep3Active },
    { label: "Đã giao hàng", active: isStep4Active },
    { label: "Đánh giá", active: isStep5Active },
  ];

  const handleConfirmReceipt = async () => {
    setIsConfirming(true);
    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      if (!token) {
        showToast("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.", "error");
        return;
      }

      const res = await fetch(`/api/orders/${order.id}/confirm-receipt`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        showToast("Đã xác nhận nhận hàng. Cảm ơn bạn!", "success");
        onReceiptConfirmed?.(order.id);
      } else {
        const data = await res.json().catch(() => ({}));
        showToast(data.error || data.message || "Không thể xác nhận nhận hàng.", "error");
      }
    } catch (error) {
      console.error("Failed to confirm receipt:", error);
      showToast("Đã xảy ra lỗi khi xác nhận nhận hàng.", "error");
    } finally {
      setIsConfirming(false);
    }
  };

  if (showSummaryOnly) {
    return (
      <div className="bg-white dark:bg-[#06261d] rounded-2xl border border-gray-100 dark:border-primary-container/20 p-5 mb-5 transition-colors duration-300 shadow-sm hover:shadow-md">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-4 border-b border-gray-100 dark:border-primary-container/20">
          <div>
            <h2 className="font-serif text-base text-[#002B1F] dark:text-[#80bea6] font-bold">Mã đơn: {formatOrderCode(order)}</h2>
            <p className="text-xs text-slate-500 dark:text-emerald-100/50 mt-0.5">Ngày đặt: {order.createdAt}</p>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-[#F3EFEA] dark:bg-[#031d16] text-[#A36B2B] dark:text-secondary px-3 py-1 rounded-full transition-colors">
              {order.status}
            </span>
          </div>
        </div>

        {/* Product summary & action row */}
        <div className="pt-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div className="min-w-0 flex items-center gap-3">
            {order.products && order.products[0] && (
              <div className="relative w-10 h-10 shrink-0 bg-[#F3EFEA] dark:bg-[#031d16] rounded-lg overflow-hidden border border-gray-100 dark:border-primary-container/10">
                <Image
                  src={order.products[0].image}
                  alt={order.products[0].name}
                  fill
                  className="object-contain p-1"
                />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-700 dark:text-emerald-100/80 truncate">
                {order.products && order.products[0] ? order.products[0].name : "Không có sản phẩm"}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-emerald-100/50 mt-0.5">
                {order.products && order.products.length > 1
                  ? `và ${order.products.length - 1} sản phẩm khác (Tổng: ${order.totalItems} món)`
                  : `Số lượng: ${(order.products && order.products[0]?.quantity) || 1}`}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 w-full sm:w-auto">
            <div className="text-left sm:text-right">
              <span className="text-[10px] text-slate-400 dark:text-emerald-100/40 uppercase block">Tổng tiền</span>
              <span className="font-extrabold text-sm text-[#A36B2B] dark:text-secondary">
                {(order.totalPrice || 0).toLocaleString("vi-VN")}đ
              </span>
            </div>
            {onViewDetails && (
              <button
                type="button"
                onClick={onViewDetails}
                className="bg-[#002B1F] dark:bg-secondary hover:bg-[#054030] dark:hover:bg-secondary-container text-white dark:text-[#002B1F] font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm active:scale-[0.98] cursor-pointer shrink-0"
              >
                Xem chi tiết đơn
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#06261d] rounded-2xl border border-gray-100 dark:border-primary-container/20 p-6 mb-6 transition-colors duration-300">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="font-serif text-lg text-[#002B1F] dark:text-[#80bea6]">Mã đơn: {formatOrderCode(order)}</h2>
          <p className="text-sm text-slate-500 dark:text-emerald-100/50 mt-1">Ngày đặt: {order.createdAt}</p>
        </div>

        <span className="text-xs font-bold uppercase tracking-wider bg-[#F3EFEA] dark:bg-[#031d16] text-[#A36B2B] dark:text-secondary px-3 py-1.5 rounded-full transition-colors">
          {order.status}
        </span>
      </div>

      <div className="flex items-center mb-8 overflow-x-auto pb-2 md:pb-0">
        {steps.map((step, index) => (
          <div key={step.label} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  step.active ? "bg-[#002B1F] dark:bg-secondary text-white dark:text-[#002B1F]" : "bg-gray-100 dark:bg-[#031d16] text-gray-400 dark:text-emerald-100/30"
                }`}
              >
                {index + 1}
              </div>
              <p className={`text-[11px] text-center whitespace-nowrap ${step.active ? "text-[#002B1F] dark:text-[#80bea6] font-semibold" : "text-gray-400 dark:text-emerald-100/30"}`}>
                {step.label}
              </p>
            </div>
            {index < steps.length - 1 && (
              <div className={`flex-1 h-0.5 min-w-[30px] mx-2 mb-5 ${step.active && steps[index + 1].active ? "bg-[#002B1F] dark:bg-secondary" : "bg-gray-100 dark:bg-[#031d16]"}`} />
            )}
          </div>
        ))}
      </div>

      <div className="space-y-3 mb-6">
        {(order.products || []).map((item, index) => (
          <div key={index} className="flex items-center gap-4 bg-[#F3EFEA] dark:bg-[#031d16] rounded-xl p-3 border border-transparent dark:border-primary-container/10 transition-colors">
            <div className="relative w-16 h-16 shrink-0 bg-white dark:bg-transparent rounded-lg overflow-hidden border dark:border-primary-container/20">
              <Image src={item.image} alt={item.name} fill className="object-contain p-1" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-[#002B1F] dark:text-emerald-50 truncate">{item.name}</h3>
              <p className="text-xs text-slate-500 dark:text-emerald-100/50 mt-1">Số lượng: {item.quantity || 1}</p>
              <p className="text-xs text-slate-500 dark:text-emerald-100/50">Giá: {item.price}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-gray-100 dark:border-primary-container/20 pt-4 space-y-1.5 mb-4 text-sm text-slate-600 dark:text-emerald-100/70">
        <p><strong className="text-[#002B1F] dark:text-[#80bea6]">Người nhận:</strong> {order.customer?.name || "Chưa cập nhật"}</p>
        <p><strong className="text-[#002B1F] dark:text-[#80bea6]">Số điện thoại:</strong> {order.customer?.phone || "Chưa cập nhật"}</p>
        <p><strong className="text-[#002B1F] dark:text-[#80bea6]">Địa chỉ:</strong> {order.customer?.address || "Chưa cập nhật"}</p>
      </div>

      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-t border-gray-100 dark:border-primary-container/20 pt-4">
        <div className="font-bold text-[#A36B2B] dark:text-secondary">
          Tổng tiền: {(order.totalPrice || 0).toLocaleString("vi-VN")}đ
        </div>
        {order.status === "Đã giao hàng" && (
          <button
            type="button"
            onClick={handleConfirmReceipt}
            disabled={isConfirming}
            className="bg-[#002B1F] dark:bg-secondary hover:bg-[#054030] dark:hover:bg-secondary-container text-white dark:text-[#002B1F] font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm active:scale-[0.98] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isConfirming ? "Đang xác nhận..." : "✅ Xác nhận đã nhận hàng"}
          </button>
        )}
      </div>
    </div>
  );
}
