"use client";

import "../components/common/AmplifyConfig";
import { useEffect, useState } from "react";
import { fetchAuthSession } from "aws-amplify/auth";
import type { Product } from "../../types/product";
import type { Order } from "../../types/cart";
import { StatCard } from "../components/admin/StatCard";
import { ORDER_STATUSES, getStatusClasses } from "../components/order/OrderTable";
import MusicLoading from "../components/common/MusicLoading";
import { formatOrderCode } from "../lib/order";
import { listAdminOrders } from "../../lib/api/adminOrders";
import { listAdminUsers } from "../../lib/api/adminUsers";

interface AdminUser {
  userId: string;
}

const STATUS_BAR_COLORS: Record<string, string> = {
  "Chờ xác nhận": "bg-amber-400",
  "Chờ lấy đơn": "bg-blue-400",
  "Chờ giao hàng": "bg-sky-400",
  "Đánh giá": "bg-emerald-400",
  "Tạm dừng": "bg-gray-300",
  "Đã hủy": "bg-rose-400",
};

const formatPrice = (price: number) => price.toLocaleString("vi-VN") + " ₫";

export default function AdminDashboardPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const session = await fetchAuthSession();
        const token = session.tokens?.idToken?.toString();

        const [productsRes, ordersResult, usersResult] = await Promise.all([
          fetch("/api/products"),
          token ? listAdminOrders(token) : Promise.resolve(null),
          token ? listAdminUsers(token) : Promise.resolve(null),
        ]);

        if (productsRes.ok) setProducts(await productsRes.json());
        if (ordersResult?.ok) setOrders(ordersResult.data);
        if (usersResult?.ok) setUsers(usersResult.data);
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <MusicLoading message="Đang tải tổng quan..." height="200px" />
      </div>
    );
  }

  const totalRevenue = orders
    .filter((order) => order.status !== "Đã hủy")
    .reduce((sum, order) => sum + (order.totalPrice || 0), 0);

  const statusCounts = ORDER_STATUSES.map((status) => ({
    status,
    count: orders.filter((order) => order.status === status).length,
  }));
  const maxStatusCount = Math.max(1, ...statusCounts.map((s) => s.count));

  const productSales = new Map<string, number>();
  orders.forEach((order) => {
    (order.products || []).forEach((item) => {
      productSales.set(item.name, (productSales.get(item.name) || 0) + (item.quantity || 1));
    });
  });
  const topProducts = Array.from(productSales.entries())
    .map(([name, quantity]) => ({ name, quantity }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);
  const maxProductQuantity = Math.max(1, ...topProducts.map((p) => p.quantity));

  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <div>
      <div className="mb-8 pb-4 border-b-2 border-[#DF9E47]">
        <h2 className="font-serif text-2xl text-[#002B1F]">Tổng Quan</h2>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon="💰" label="Tổng Doanh Thu" value={formatPrice(totalRevenue)} />
        <StatCard icon="📦" label="Tổng Đơn Hàng" value={String(orders.length)} />
        <StatCard icon="🎷" label="Tổng Sản Phẩm" value={String(products.length)} />
        <StatCard icon="👥" label="Tổng Khách Hàng" value={String(users.length)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Order status breakdown */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="font-serif text-lg text-[#002B1F] mb-5">Phân Bố Trạng Thái Đơn Hàng</h3>
          <div className="space-y-4">
            {statusCounts.map(({ status, count }) => (
              <div key={status}>
                <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1.5">
                  <span className={`inline-block px-2 py-0.5 rounded-full ${getStatusClasses(status)}`}>{status}</span>
                  <span>{count}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${STATUS_BAR_COLORS[status]}`}
                    style={{ width: `${(count / maxStatusCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top products */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="font-serif text-lg text-[#002B1F] mb-5">Top 5 Sản Phẩm Bán Chạy</h3>
          {topProducts.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">Chưa có dữ liệu bán hàng.</p>
          ) : (
            <div className="space-y-4">
              {topProducts.map((product) => (
                <div key={product.name}>
                  <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1.5">
                    <span className="truncate pr-2">{product.name}</span>
                    <span className="shrink-0">{product.quantity} đã bán</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#DF9E47]"
                      style={{ width: `${(product.quantity / maxProductQuantity) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent orders */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h3 className="font-serif text-lg text-[#002B1F] mb-5">Đơn Hàng Gần Đây</h3>
        {recentOrders.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-8">Chưa có đơn hàng nào.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between py-3 gap-4">
                <div className="min-w-0">
                  <p className="font-mono text-xs font-semibold text-slate-600 truncate">{formatOrderCode(order)}</p>
                  <p className="text-sm text-[#002B1F] font-semibold truncate">
                    {order.customer?.name || "Chưa cập nhật"}
                  </p>
                </div>
                <span className={`shrink-0 inline-block px-2.5 py-1 rounded-full text-xs font-bold ${getStatusClasses(order.status)}`}>
                  {order.status}
                </span>
                <strong className="shrink-0 text-[#A36B2B] text-sm">{formatPrice(order.totalPrice || 0)}</strong>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
