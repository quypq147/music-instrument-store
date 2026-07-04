"use client";

import Link from "next/link";

interface AdminSidebarProps {
  activeTab: "products" | "orders" | "users";
  onTabChange: (tab: "products" | "orders" | "users") => void;
}

export function AdminSidebar({ activeTab, onTabChange }: AdminSidebarProps) {
  return (
    <aside className="admin-sidebar">
      <div className="sidebar-header">
        <h3>Bảng Quản Trị</h3>
        <p>Nhóm TTTN Music</p>
      </div>
      <nav className="sidebar-nav">
        <button
          type="button"
          className={activeTab === "products" ? "active" : ""}
          onClick={() => onTabChange("products")}
        >
          🎷 Quản Lý Sản Phẩm
        </button>
        <button
          type="button"
          className={activeTab === "orders" ? "active" : ""}
          onClick={() => onTabChange("orders")}
        >
          📦 Quản Lý Đơn Hàng
        </button>
        <button
          type="button"
          className={activeTab === "users" ? "active" : ""}
          onClick={() => onTabChange("users")}
        >
          👥 Quản Lý Nhân Sự
        </button>
        <div className="sidebar-divider"></div>
        <Link href="/" className="back-to-shop">
          🏠 Quay lại Cửa Hàng
        </Link>
      </nav>
    </aside>
  );
}
