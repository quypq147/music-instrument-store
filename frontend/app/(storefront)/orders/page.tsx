/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import "../../components/common/AmplifyConfig";
import { useEffect, useState } from "react";
import { fetchAuthSession } from "aws-amplify/auth";
import type { Order } from "../../../types/cart";
import { OrderTabs } from "../../components/order/OrderTabs";
import { EmptyOrders } from "../../components/order/EmptyOrders";
import { OrderCard } from "../../components/order/OrderCard";
import MusicLoading from "../../components/common/MusicLoading";

const getStoredOrders = (): Order[] => {
  if (typeof window === "undefined") {
    return [];
  }

  return JSON.parse(localStorage.getItem("orders") || "[]") as Order[];
};

interface DbOrderItem {
  productId: string;
  name: string;
  price: number;
  imageUrl?: string;
  quantity: number;
}

interface DbOrder {
  id: string;
  customer: {
    name: string;
    phone: string;
    address: string;
    note: string;
  };
  paymentMethod: string;
  items?: DbOrderItem[];
  totalItems: number;
  totalPrice: number;
  status: string;
  createdAt?: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState("Chờ xác nhận");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load local storage first
    setOrders(getStoredOrders());

    // Fetch database orders if logged in
    const fetchDbOrders = async () => {
      try {
        const session = await fetchAuthSession();
        const token = session.tokens?.idToken?.toString();
        if (!token) {
          setLoading(false);
          return;
        }

        const res = await fetch("/api/users/orders", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.ok) {
          const dbData = await res.json();
          const mappedOrders = dbData.map((order: DbOrder) => ({
            id: order.id,
            customer: order.customer,
            paymentMethod: order.paymentMethod,
            products: (order.items || []).map((item: DbOrderItem) => ({
              id: Number(item.productId) || 0,
              name: item.name,
              price: `${(item.price || 0).toLocaleString("vi-VN")}đ`,
              image: item.imageUrl || "/placeholder.png",
              quantity: item.quantity
            })),
            totalItems: order.totalItems,
            totalPrice: order.totalPrice,
            status: order.status === "PENDING" ? "Chờ xác nhận" : (order.status ?? "Chờ xác nhận"),
            createdAt: order.createdAt ? new Date(order.createdAt).toLocaleString("vi-VN") : ""
          }));
          mappedOrders.sort((a: Order, b: Order) => b.id.localeCompare(a.id));
          setOrders(mappedOrders);
        }
      } catch (err) {
        console.error("Failed to fetch user DB orders:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDbOrders();
  }, []);

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
    <main className="min-h-screen bg-white pt-16 md:pt-20 pb-20 px-4 md:px-6 lg:px-24 max-w-5xl mx-auto">
      <h1 className="font-serif text-3xl md:text-4xl text-[#002B1F] mt-10 mb-8">Đơn Đã Mua</h1>

      <OrderTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {loading ? (
        <MusicLoading message="Đang tải danh sách đơn hàng..." height="300px" />
      ) : filteredOrders.length === 0 ? (
        <EmptyOrders />
      ) : (
        <section>
          {filteredOrders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </section>
      )}
    </main>
  );
}
