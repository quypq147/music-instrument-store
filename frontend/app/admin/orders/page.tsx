/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import "../../components/common/AmplifyConfig";
import { useEffect, useState } from "react";
import { fetchAuthSession } from "aws-amplify/auth";
import type { Order } from "../../../types/cart";
import { OrderTable } from "../../components/order/OrderTable";
import { OrderDetailsModal } from "../../components/order/OrderDetailsModal";
import { useToast } from "../../context/ToastContext";

export default function AdminOrdersPage() {
  const { showToast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("Tất cả");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

  const fetchOrders = async () => {
    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      if (!token) return;

      const res = await fetch("/api/admin/orders", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (error) {
      console.error("Error fetching orders list:", error);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      if (!token) return;

      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        showToast(`Đã cập nhật trạng thái đơn hàng sang: ${newStatus}`, "success");
        await fetchOrders();
      } else {
        showToast("Cập nhật trạng thái thất bại. Vui lòng thử lại.", "error");
      }
    } catch (error) {
      console.error("Error updating order status:", error);
      showToast("Lỗi khi kết nối với máy chủ.", "error");
    }
  };

  const handleViewOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setIsOrderModalOpen(true);
  };

  return (
    <div>
      <div className="mb-8 pb-4 border-b-2 border-[#DF9E47]">
        <h2 className="font-serif text-2xl text-[#002B1F]">Quản Lý Đơn Đặt Hàng</h2>
      </div>
      <OrderTable
        orders={orders}
        search={orderSearch}
        onSearchChange={setOrderSearch}
        statusFilter={orderStatusFilter}
        onStatusFilterChange={setOrderStatusFilter}
        onUpdateStatus={handleUpdateOrderStatus}
        onViewDetails={handleViewOrderDetails}
      />

      <OrderDetailsModal
        isOpen={isOrderModalOpen}
        order={selectedOrder}
        onClose={() => setIsOrderModalOpen(false)}
      />
    </div>
  );
}
