/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState } from "react";
import type { Order } from "../../../types/cart";
import { useConfirm } from "../../context/ConfirmDialogContext";
import { Pagination } from "../common/Pagination";

interface OrderTableProps {
  orders: Order[];
  search: string;
  onSearchChange: (val: string) => void;
  statusFilter: string;
  onStatusFilterChange: (val: string) => void;
  onUpdateStatus: (orderId: string, newStatus: string) => Promise<void>;
  onViewDetails: (order: Order) => void;
}

const ITEMS_PER_PAGE = 10;

export const ORDER_STATUSES = ["Chờ xác nhận", "Chờ lấy đơn", "Chờ giao hàng", "Đánh giá", "Tạm dừng", "Đã hủy"];

export const getStatusClasses = (status: string) => {
  switch (status) {
    case "Chờ xác nhận":
      return "bg-amber-50 text-amber-700";
    case "Chờ lấy đơn":
      return "bg-blue-50 text-blue-700";
    case "Chờ giao hàng":
      return "bg-sky-50 text-sky-700";
    case "Đánh giá":
      return "bg-emerald-50 text-emerald-700";
    case "Tạm dừng":
      return "bg-gray-100 text-gray-500";
    case "Đã hủy":
      return "bg-rose-50 text-rose-600";
    default:
      return "bg-gray-100 text-gray-600";
  }
};

export function OrderTable({
  orders,
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onUpdateStatus,
  onViewDetails,
}: OrderTableProps) {
  const confirmAction = useConfirm();
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const statuses = ["Tất cả", "Chờ xác nhận", "Chờ lấy đơn", "Chờ giao hàng", "Đánh giá", "Tạm dừng", "Đã hủy"];

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(search.toLowerCase()) ||
      (order.customer?.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (order.customer?.phone || "").includes(search);

    const matchesStatus = statusFilter === "Tất cả" || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, orders.length]);

  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const formatPrice = (price: number) => price.toLocaleString("vi-VN") + " ₫";

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdatingOrderId(orderId);
    await onUpdateStatus(orderId, newStatus);
    setUpdatingOrderId(null);
  };

  const handleCancelOrder = async (order: Order) => {
    const ok = await confirmAction({
      message: `Bạn chắc chắn muốn hủy đơn hàng ${order.id}?`,
      danger: true,
    });
    if (!ok) return;

    setUpdatingOrderId(order.id);
    await onUpdateStatus(order.id, "Đã hủy");
    setUpdatingOrderId(null);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <div className="flex flex-wrap gap-4 items-center mb-6">
        <input
          type="text"
          placeholder="Tìm theo Mã đơn hàng, Tên khách hàng hoặc Số điện thoại..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="flex-1 min-w-64 py-2.5 px-4 bg-white border border-gray-200 rounded-xl text-sm text-slate-700 outline-none focus:border-[#002B1F] focus:shadow-[0_0_0_1px_#002B1F] transition-all"
        />

        <div className="flex flex-wrap gap-2">
          {statuses.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => onStatusFilterChange(tab)}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
                statusFilter === tab
                  ? "bg-[#002B1F] text-white"
                  : "bg-[#F3EFEA] text-slate-600 hover:bg-[#e9e2d8]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="text-center py-16 bg-[#F3EFEA] rounded-xl text-sm text-slate-500">
          Không tìm thấy đơn đặt hàng nào phù hợp.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-[#F3EFEA] border-b border-gray-200 text-[#002B1F] font-bold uppercase text-[11px] tracking-wider">
                <th className="p-4">Mã đơn hàng</th>
                <th className="p-4">Thời gian</th>
                <th className="p-4">Khách hàng</th>
                <th className="p-4">Sản phẩm</th>
                <th className="p-4">Tổng tiền</th>
                <th className="p-4">Trạng thái</th>
                <th className="p-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedOrders.map((order) => {
                const isUpdating = updatingOrderId === order.id;
                return (
                  <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4 font-mono text-xs font-semibold text-slate-600">
                      {order.id.slice(0, 16)}...
                    </td>
                    <td className="p-4 text-slate-600">{formatDate(order.createdAt)}</td>
                    <td className="p-4">
                      <div className="font-semibold text-[#002B1F]">{order.customer?.name || "Chưa cập nhật"}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{order.customer?.phone || "Chưa cập nhật"}</div>
                    </td>
                    <td className="p-4">
                      <div className="max-w-64 truncate text-slate-600">
                        {(order.products || []).map((p) => `${p.name} (x${p.quantity || 1})`).join(", ")}
                      </div>
                    </td>
                    <td className="p-4 font-semibold text-[#A36B2B]">
                      {formatPrice(order.totalPrice || 0)}
                    </td>
                    <td className="p-4">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${getStatusClasses(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2 items-center justify-end flex-wrap">
                        <button
                          type="button"
                          onClick={() => onViewDetails(order)}
                          className="text-xs font-bold border border-[#DF9E47] text-[#A36B2B] px-3 py-1.5 rounded-lg hover:bg-[#F3EFEA] transition-colors"
                        >
                          👁 Xem
                        </button>

                        <select
                          value={order.status}
                          onChange={(e) => handleStatusChange(order.id, e.target.value)}
                          disabled={isUpdating}
                          className="text-xs font-medium py-1.5 px-2 rounded-lg border border-gray-200 bg-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <option value="Chờ xác nhận">Chờ xác nhận</option>
                          <option value="Chờ lấy đơn">Chờ lấy đơn</option>
                          <option value="Chờ giao hàng">Chờ giao hàng</option>
                          <option value="Đánh giá">Đánh giá (Đã giao)</option>
                          <option value="Tạm dừng">Tạm dừng</option>
                          <option value="Đã hủy">Đã hủy</option>
                        </select>

                        {order.status !== "Đã hủy" && (
                          <button
                            type="button"
                            onClick={() => handleCancelOrder(order)}
                            disabled={isUpdating}
                            className="text-xs font-bold border border-rose-300 text-rose-600 px-3 py-1.5 rounded-lg hover:bg-rose-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isUpdating ? "..." : "✕ Hủy Đơn"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>
      )}
    </div>
  );
}
