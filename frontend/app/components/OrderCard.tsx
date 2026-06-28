"use client";

import Image from "next/image";
import type { Order } from "../../types/cart";

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

  return (
    <div className="order-card">
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

        <div className={isStep2Active ? "progress-step active" : "progress-step"}>
          <b>2</b>
          <p>Chờ lấy đơn</p>
        </div>

        <div className={isStep3Active ? "progress-step active" : "progress-step"}>
          <b>3</b>
          <p>Chờ giao hàng</p>
        </div>

        <div className={isStep4Active ? "progress-step active" : "progress-step"}>
          <b>4</b>
          <p>Đánh giá</p>
        </div>
      </div>

      <div className="order-products">
        {order.products.map((item, index) => (
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
  );
}
