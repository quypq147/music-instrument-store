"use client";

import type { Order } from "../../../types/cart";

interface OrderDetailsModalProps {
  isOpen: boolean;
  order: Order | null;
  onClose: () => void;
}

export function OrderDetailsModal({ isOpen, order, onClose }: OrderDetailsModalProps) {
  if (!isOpen || !order) return null;

  const formatPrice = (price: number) => {
    return price.toLocaleString("vi-VN") + " ₫";
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        backdropFilter: "blur(4px)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
        fontFamily: "var(--font-sans)",
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "#FAF9F6", // Cream background
          width: "90%",
          maxWidth: "750px",
          maxHeight: "90vh",
          borderRadius: "8px",
          border: "1px solid var(--color-border-subtle)",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "1.5rem 2rem",
            borderBottom: "1px solid var(--color-border-subtle)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            backgroundColor: "var(--color-surface-cream)",
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: "18px", color: "var(--color-primary)", fontFamily: "var(--font-serif)", fontWeight: "bold" }}>
              Chi Tiết Đơn Hàng
            </h3>
            <span style={{ fontSize: "12px", fontFamily: "monospace", color: "var(--color-on-surface-variant)" }}>
              ID: {order.id}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "24px",
              cursor: "pointer",
              color: "var(--color-on-surface-variant)",
            }}
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: "2rem" }}>
          {/* Status and Method */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "1.5rem",
              marginBottom: "2rem",
              padding: "1.25rem",
              backgroundColor: "rgba(6, 78, 59, 0.03)",
              borderRadius: "6px",
              border: "1px dashed var(--color-border-subtle)"
            }}
          >
            <div>
              <span style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-on-surface-variant)" }}>
                Trạng thái hiện tại
              </span>
              <div style={{ fontWeight: "700", color: "var(--color-primary)", marginTop: "4px" }}>
                {order.status}
              </div>
            </div>
            <div>
              <span style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-on-surface-variant)" }}>
                Phương thức thanh toán
              </span>
              <div style={{ fontWeight: "600", marginTop: "4px" }}>
                {order.paymentMethod}
              </div>
            </div>
            <div>
              <span style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-on-surface-variant)" }}>
                Thời gian đặt hàng
              </span>
              <div style={{ fontWeight: "500", marginTop: "4px" }}>
                {formatDate(order.createdAt)}
              </div>
            </div>
          </div>

          {/* Customer Grid */}
          <div style={{ marginBottom: "2rem" }}>
            <h4 style={{ margin: "0 0 1rem 0", fontSize: "15px", color: "var(--color-primary)", borderBottom: "1px solid var(--color-border-subtle)", paddingBottom: "0.5rem" }}>
              Thông Tin Giao Hàng
            </h4>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <span style={{ fontSize: "12px", color: "var(--color-on-surface-variant)" }}>Họ và Tên</span>
                <p style={{ margin: "4px 0 0 0", fontWeight: "600" }}>{order.customer.name}</p>
              </div>
              <div>
                <span style={{ fontSize: "12px", color: "var(--color-on-surface-variant)" }}>Số Điện Thoại</span>
                <p style={{ margin: "4px 0 0 0", fontWeight: "600" }}>{order.customer.phone}</p>
              </div>
              <div style={{ gridColumn: "span 2" }}>
                <span style={{ fontSize: "12px", color: "var(--color-on-surface-variant)" }}>Địa Chỉ Nhận Hàng</span>
                <p style={{ margin: "4px 0 0 0", fontWeight: "500", lineHeight: "1.5" }}>{order.customer.address}</p>
              </div>
              {order.customer.note && (
                <div style={{ gridColumn: "span 2" }}>
                  <span style={{ fontSize: "12px", color: "var(--color-on-surface-variant)" }}>Ghi chú đơn hàng</span>
                  <p style={{ margin: "4px 0 0 0", fontStyle: "italic", color: "var(--color-on-surface-variant)", lineHeight: "1.5" }}>
                    &ldquo;{order.customer.note}&rdquo;
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Product Items */}
          <div>
            <h4 style={{ margin: "0 0 1rem 0", fontSize: "15px", color: "var(--color-primary)", borderBottom: "1px solid var(--color-border-subtle)", paddingBottom: "0.5rem" }}>
              Danh Sách Sản Phẩm ({order.totalItems})
            </h4>
            <div style={{ border: "1px solid var(--color-border-subtle)", borderRadius: "6px", overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ backgroundColor: "var(--color-surface-cream)", borderBottom: "1px solid var(--color-border-subtle)" }}>
                    <th style={{ padding: "10px 15px", textAlign: "left", fontSize: "12px", fontWeight: "600", textTransform: "uppercase", color: "var(--color-primary)" }}>Sản phẩm</th>
                    <th style={{ padding: "10px 15px", textAlign: "right", fontSize: "12px", fontWeight: "600", textTransform: "uppercase", color: "var(--color-primary)" }}>Đơn giá</th>
                    <th style={{ padding: "10px 15px", textAlign: "center", fontSize: "12px", fontWeight: "600", textTransform: "uppercase", color: "var(--color-primary)" }}>Số lượng</th>
                    <th style={{ padding: "10px 15px", textAlign: "right", fontSize: "12px", fontWeight: "600", textTransform: "uppercase", color: "var(--color-primary)" }}>Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {order.products.map((item) => {
                    const priceNum = parseFloat(String(item.price).replace(/,/g, ""));
                    const totalNum = priceNum * (item.quantity || 1);
                    return (
                      <tr key={item.id} style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
                        <td style={{ padding: "12px 15px", fontSize: "13px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            {item.image && (
                              <img
                                src={item.image}
                                alt={item.name}
                                style={{ width: "40px", height: "40px", objectFit: "contain", backgroundColor: "white", borderRadius: "4px", border: "1px solid var(--color-border-subtle)" }}
                              />
                            )}
                            <span style={{ fontWeight: "600" }}>{item.name}</span>
                          </div>
                        </td>
                        <td style={{ padding: "12px 15px", textAlign: "right", fontSize: "13px" }}>
                          {formatPrice(priceNum)}
                        </td>
                        <td style={{ padding: "12px 15px", textAlign: "center", fontSize: "13px", fontWeight: "600" }}>
                          {item.quantity || 1}
                        </td>
                        <td style={{ padding: "12px 15px", textAlign: "right", fontSize: "13px", fontWeight: "600", color: "var(--color-primary)" }}>
                          {formatPrice(totalNum)}
                        </td>
                      </tr>
                    );
                  })}
                  <tr style={{ backgroundColor: "rgba(6, 78, 59, 0.02)", fontWeight: "bold" }}>
                    <td colSpan={3} style={{ padding: "15px", textAlign: "right", fontSize: "14px", color: "var(--color-on-surface)" }}>
                      TỔNG THANH TOÁN:
                    </td>
                    <td style={{ padding: "15px", textAlign: "right", fontSize: "16px", color: "var(--color-primary)" }}>
                      {formatPrice(order.totalPrice)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "1.25rem 2rem",
            borderTop: "1px solid var(--color-border-subtle)",
            backgroundColor: "var(--color-surface-cream)",
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "8px 20px",
              fontSize: "13px",
              fontWeight: "600",
              backgroundColor: "var(--color-primary-container)",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
