"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

interface CartItem {
  id: number;
  name: string;
  price: string;
  image: string;
  quantity?: number;
}

interface Order {
  id: string;
  customer: {
    name: string;
    phone: string;
    address: string;
    note: string;
  };
  paymentMethod: string;
  products: CartItem[];
  totalItems: number;
  totalPrice: number;
  status: string;
  createdAt: string;
}

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

      <div className="order-tabs">
        {tabs.map((tab) => (
          <button
            key={tab}
            className={activeTab === tab ? "active" : ""}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {filteredOrders.length === 0 ? (
        <div className="empty-orders">
          <h2>Chưa có đơn hàng nào</h2>
          <p>Đơn hàng của bạn sẽ hiển thị tại đây.</p>

          <Link href="/products">
            <button>Tiếp tục mua hàng</button>
          </Link>
        </div>
      ) : (
        <section className="orders-list">
          {filteredOrders.map((order) => (
            <div className="order-card" key={order.id}>
              <div className="order-header">
                <div>
                  <h2>Mã đơn: {order.id}</h2>
                  <p>Ngày đặt: {order.createdAt}</p>
                </div>

                <span>{order.status}</span>
              </div>

              <div className="order-progress">
                <div className="progress-step active">
                  <b>1</b>
                  <p>Chờ xác nhận</p>
                </div>

                <div
                  className={
                    order.status === "Chờ lấy đơn" ||
                    order.status === "Chờ giao hàng" ||
                    order.status === "Đánh giá"
                      ? "progress-step active"
                      : "progress-step"
                  }
                >
                  <b>2</b>
                  <p>Chờ lấy đơn</p>
                </div>

                <div
                  className={
                    order.status === "Chờ giao hàng" ||
                    order.status === "Đánh giá"
                      ? "progress-step active"
                      : "progress-step"
                  }
                >
                  <b>3</b>
                  <p>Chờ giao hàng</p>
                </div>

                <div
                  className={
                    order.status === "Đánh giá"
                      ? "progress-step active"
                      : "progress-step"
                  }
                >
                  <b>4</b>
                  <p>Đánh giá</p>
                </div>
              </div>

              <div className="order-products">
                {order.products.map((item: CartItem, index: number) => (
                  <div className="order-product" key={index}>
                    <Image
                      src={item.image}
                      alt={item.name}
                      width={96}
                      height={96}
                    />

                    <div>
                      <h3>{item.name}</h3>
                      <p>Số lượng: {item.quantity || 1}</p>
                      <p>Giá: {item.price}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="order-info">
                <p>
                  <strong>Người nhận:</strong> {order.customer.name}
                </p>
                <p>
                  <strong>Số điện thoại:</strong> {order.customer.phone}
                </p>
                <p>
                  <strong>Địa chỉ:</strong> {order.customer.address}
                </p>
              </div>

              <div className="order-total">
                Tổng tiền: {order.totalPrice.toLocaleString("vi-VN")}đ
              </div>
            </div>
          ))}
        </section>
      )}
    </main>
  );
}
