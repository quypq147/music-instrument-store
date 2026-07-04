"use client";

import Image from "next/image";
import type { Order } from "../../../types/cart";

interface OrderCardProps {
  order: Order;
}

export function OrderCard({ order }: OrderCardProps) {
  const isStep2Active =
    order.status === "Chờ lấy đơn" ||
    order.status === "Chờ giao hàng" ||
    order.status === "Đánh giá";

  const isStep3Active =
    order.status === "Chờ giao hàng" || order.status === "Đánh giá";

  const isStep4Active = order.status === "Đánh giá";

  const steps = [
    { label: "Chờ xác nhận", active: true },
    { label: "Chờ lấy đơn", active: isStep2Active },
    { label: "Chờ giao hàng", active: isStep3Active },
    { label: "Đánh giá", active: isStep4Active },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="font-serif text-lg text-[#002B1F]">Mã đơn: {order.id}</h2>
          <p className="text-sm text-slate-500 mt-1">Ngày đặt: {order.createdAt}</p>
        </div>

        <span className="text-xs font-bold uppercase tracking-wider bg-[#F3EFEA] text-[#A36B2B] px-3 py-1.5 rounded-full">
          {order.status}
        </span>
      </div>

      <div className="flex items-center mb-8">
        {steps.map((step, index) => (
          <div key={step.label} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  step.active ? "bg-[#002B1F] text-white" : "bg-gray-100 text-gray-400"
                }`}
              >
                {index + 1}
              </div>
              <p className={`text-[11px] text-center whitespace-nowrap ${step.active ? "text-[#002B1F] font-semibold" : "text-gray-400"}`}>
                {step.label}
              </p>
            </div>
            {index < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 mb-5 ${step.active && steps[index + 1].active ? "bg-[#002B1F]" : "bg-gray-100"}`} />
            )}
          </div>
        ))}
      </div>

      <div className="space-y-3 mb-6">
        {(order.products || []).map((item, index) => (
          <div key={index} className="flex items-center gap-4 bg-[#F3EFEA] rounded-xl p-3">
            <div className="relative w-16 h-16 shrink-0 bg-white rounded-lg overflow-hidden">
              <Image src={item.image} alt={item.name} fill className="object-contain p-1" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-[#002B1F] truncate">{item.name}</h3>
              <p className="text-xs text-slate-500 mt-1">Số lượng: {item.quantity || 1}</p>
              <p className="text-xs text-slate-500">Giá: {item.price}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-gray-100 pt-4 space-y-1.5 mb-4 text-sm text-slate-600">
        <p><strong className="text-[#002B1F]">Người nhận:</strong> {order.customer?.name || "Chưa cập nhật"}</p>
        <p><strong className="text-[#002B1F]">Số điện thoại:</strong> {order.customer?.phone || "Chưa cập nhật"}</p>
        <p><strong className="text-[#002B1F]">Địa chỉ:</strong> {order.customer?.address || "Chưa cập nhật"}</p>
      </div>

      <div className="flex justify-end border-t border-gray-100 pt-4 font-bold text-[#A36B2B]">
        Tổng tiền: {(order.totalPrice || 0).toLocaleString("vi-VN")}đ
      </div>
    </div>
  );
}
