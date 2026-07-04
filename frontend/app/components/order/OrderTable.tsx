"use client";

import type { Order } from "../../../types/cart";

interface OrderTableProps {
  orders: Order[];
  search: string;
  onSearchChange: (val: string) => void;
  statusFilter: string;
  onStatusFilterChange: (val: string) => void;
  onUpdateStatus: (orderId: string, newStatus: string) => void;
  onViewDetails: (order: Order) => void;
  onDeleteOrder: (orderId: string) => void;
}

export function OrderTable({
  orders,
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onUpdateStatus,
  onViewDetails,
  onDeleteOrder,
}: OrderTableProps) {
  const statuses = ["Tất cả", "Chờ xác nhận", "Chờ lấy đơn", "Chờ giao hàng", "Đánh giá", "Tạm dừng", "Đã hủy"];

  // Filter orders by search and status tab
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(search.toLowerCase()) ||
      order.customer.name.toLowerCase().includes(search.toLowerCase()) ||
      order.customer.phone.includes(search);

    const matchesStatus = statusFilter === "Tất cả" || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Chờ xác nhận":
        return { bg: "#FEF3C7", text: "#D97706" }; // Gold
      case "Chờ lấy đơn":
        return { bg: "#DBEAFE", text: "#2563EB" }; // Blue
      case "Chờ giao hàng":
        return { bg: "#E0F2FE", text: "#0284C7" }; // Light Blue
      case "Đánh giá":
        return { bg: "#D1FAE5", text: "#059669" }; // Emerald
      case "Tạm dừng":
        return { bg: "#F3F4F6", text: "#9CA3AF" }; // Gray
      case "Đã hủy":
        return { bg: "#FEE2E2", text: "#EF4444" }; // Red
      default:
        return { bg: "#F3F4F6", text: "#4B5563" }; // Gray
    }
  };

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
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="admin-table-container">
      <div className="admin-search-bar" style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap", alignItems: "center" }}>
        <input
          type="text"
          placeholder="Tìm theo Mã đơn hàng, Tên khách hàng hoặc Số điện thoại..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          style={{ flex: 1, minWidth: "260px" }}
        />
        
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {statuses.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => onStatusFilterChange(tab)}
              style={{
                padding: "8px 16px",
                fontSize: "13px",
                fontWeight: "600",
                borderRadius: "4px",
                border: "1px solid var(--color-border-subtle)",
                backgroundColor: statusFilter === tab ? "var(--color-primary-container)" : "white",
                color: statusFilter === tab ? "white" : "var(--color-on-surface)",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="admin-empty" style={{ backgroundColor: "var(--color-surface-cream)", borderRadius: "8px" }}>
          Không tìm thấy đơn đặt hàng nào phù hợp.
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Mã đơn hàng</th>
                <th>Thời gian</th>
                <th>Khách hàng</th>
                <th>Sản phẩm</th>
                <th>Tổng tiền</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => {
                const statusColor = getStatusColor(order.status);
                return (
                  <tr key={order.id}>
                    <td style={{ fontFamily: "monospace", fontSize: "13px", fontWeight: "600" }}>
                      {order.id.slice(0, 16)}...
                    </td>
                    <td>{formatDate(order.createdAt)}</td>
                    <td>
                      <div style={{ fontWeight: "600" }}>{order.customer.name}</div>
                      <div style={{ fontSize: "12px", color: "var(--color-on-surface-variant)" }}>
                        {order.customer.phone}
                      </div>
                    </td>
                    <td>
                      <div style={{ maxWidth: "250px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {order.products.map((p) => `${p.name} (x${p.quantity || 1})`).join(", ")}
                      </div>
                    </td>
                    <td style={{ fontWeight: "600", color: "var(--color-primary)" }}>
                      {formatPrice(order.totalPrice)}
                    </td>
                    <td>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "4px 10px",
                          borderRadius: "4px",
                          fontSize: "12px",
                          fontWeight: "600",
                          backgroundColor: statusColor.bg,
                          color: statusColor.text,
                        }}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <button
                          type="button"
                          className="edit-btn"
                          onClick={() => onViewDetails(order)}
                          style={{
                            padding: "6px 12px",
                            fontSize: "12px",
                            fontWeight: "600",
                            border: "1px solid var(--color-secondary)",
                            borderRadius: "4px",
                            backgroundColor: "transparent",
                            color: "var(--color-secondary)",
                            cursor: "pointer"
                          }}
                        >
                          👁 Xem
                        </button>
                        
                        <select
                          value={order.status}
                          onChange={(e) => onUpdateStatus(order.id, e.target.value)}
                          style={{
                            padding: "5px 8px",
                            fontSize: "12px",
                            borderRadius: "4px",
                            border: "1px solid var(--color-border-subtle)",
                            backgroundColor: "white",
                            cursor: "pointer",
                            fontWeight: "500"
                          }}
                        >
                          <option value="Chờ xác nhận">Chờ xác nhận</option>
                          <option value="Chờ lấy đơn">Chờ lấy đơn</option>
                          <option value="Chờ giao hàng">Chờ giao hàng</option>
                          <option value="Đánh giá">Đánh giá (Đã giao)</option>
                          <option value="Tạm dừng">Tạm dừng</option>
                          <option value="Đã hủy">Đã hủy</option>
                        </select>

                        <button
                          type="button"
                          className="delete-btn"
                          onClick={() => onDeleteOrder(order.id)}
                          style={{
                            padding: "6px 10px",
                            fontSize: "12px",
                            fontWeight: "600",
                            border: "1px solid #DC2626",
                            borderRadius: "4px",
                            backgroundColor: "transparent",
                            color: "#DC2626",
                            cursor: "pointer"
                          }}
                        >
                          🗑 Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
