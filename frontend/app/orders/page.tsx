"use client";

import { useState } from "react";
import type { Order } from "../../types/cart";
import { OrderTabs } from "../components/OrderTabs";
import { EmptyOrders } from "../components/EmptyOrders";
import { OrderCard } from "../components/OrderCard";

const getStoredOrders = (): Order[] => {
  if (typeof window === "undefined") {
    return [];
  }

  return JSON.parse(localStorage.getItem("orders") || "[]") as Order[];
};

export default function OrdersPage() {
  const [orders] = useState<Order[]>(getStoredOrders);
  const [activeTab, setActiveTab] = useState("Chờ xác nhận");

  const tabs = [
    "Chờ xác nhận",
    "Chờ lấy đơn",
    "Chờ giao hàng",
    "Đánh giá",
  ];

  const filteredOrders = orders.filter(
    (order: Order) => order.status === activeTab
  );

  return (
    <main className="orders-page">
      <h1 className="orders-title">Đơn Đã Mua</h1>

      <OrderTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {filteredOrders.length === 0 ? (
        <EmptyOrders />
      ) : (
        <section className="orders-list">
          {filteredOrders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </section>
      )}
    </main>
  );
}
