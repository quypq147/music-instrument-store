/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import "../components/common/AmplifyConfig";
import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchAuthSession } from "aws-amplify/auth";
import type { Product } from "../../types/product";
import type { Order } from "../../types/cart";
import { AdminSidebar } from "../components/admin/AdminSidebar";
import { ProductTable } from "../components/product/ProductTable";
import { ProductModal } from "../components/product/ProductModal";
import { OrderTable } from "../components/order/OrderTable";
import { OrderDetailsModal } from "../components/order/OrderDetailsModal";

interface AdminUser {
  userId: string;
  email?: string;
  name?: string;
  phone?: string;
  address?: string;
  role?: string;
}

export default function AdminPage() {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"products" | "orders" | "users">("products");

  // User/Personnel management state
  const [usersList, setUsersList] = useState<AdminUser[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isEditUserSubmitting, setIsEditUserSubmitting] = useState(false);
  const [userFormData, setUserFormData] = useState({
    name: "",
    phone: "",
    address: "",
    role: "User",
  });

  // Form / Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form fields
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    brand: "",
    type: "Alto Saxophone",
    price: 0,
    imageUrl: "",
    description: "",
  });

  // Order management state
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("Tất cả");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/products");
      if (!res.ok) throw new Error("Failed to fetch products");
      const data = await res.json();
      setProducts(data);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

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

  const fetchUsers = async () => {
    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      if (!token) return;

      const res = await fetch("/api/admin/users", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setUsersList(data);
      }
    } catch (error) {
      console.error("Error fetching users list:", error);
    }
  };

  const handleOpenEditUserModal = (user: AdminUser) => {
    setSelectedUser(user);
    setUserFormData({
      name: user.name || "",
      phone: user.phone || "",
      address: user.address || "",
      role: user.role || "User",
    });
    setIsUserModalOpen(true);
  };

  const handleEditUserSubmit = async () => {
    if (!selectedUser) return;
    setIsEditUserSubmitting(true);
    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      if (!token) return;

      const res = await fetch(`/api/admin/users/${selectedUser.userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(userFormData),
      });

      if (res.ok) {
        alert("Cập nhật vai trò người dùng thành công!");
        setIsUserModalOpen(false);
        fetchUsers();
      } else {
        alert("Cập nhật thất bại. Vui lòng thử lại.");
      }
    } catch (err) {
      console.error("Failed to update user profile:", err);
      alert("Đã xảy ra lỗi khi cập nhật.");
    } finally {
      setIsEditUserSubmitting(false);
    }
  };

  const handleDeleteUserProfile = async (userId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa hồ sơ người dùng này? Thao tác này không thể hoàn tác.")) return;

    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      if (!token) return;

      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        alert("Xóa hồ sơ người dùng thành công!");
        fetchUsers();
      } else {
        alert("Không thể xóa hồ sơ người dùng.");
      }
    } catch (err) {
      console.error("Failed to delete user profile:", err);
      alert("Đã xảy ra lỗi khi xóa.");
    }
  };

  useEffect(() => {
    if (activeTab === "users" && isAuthorized) {
      fetchUsers();
    }
  }, [activeTab, isAuthorized]);

  useEffect(() => {
    const init = async () => {
      try {
        const session = await fetchAuthSession();
        const groups = session.tokens?.idToken?.payload["cognito:groups"] as string[] | undefined;
        if (groups && (groups.includes("Admin") || groups.includes("Staff"))) {
          setIsAuthorized(true);
          await fetchProducts();
          fetchOrders();
        } else {
          setIsAuthorized(false);
        }
      } catch (err) {
        console.error("Auth check failed:", err);
        setIsAuthorized(false);
      }
    };
    init();
  }, []);

  const handleOpenAddModal = () => {
    setEditProduct(null);
    setFormData({
      id: String(Date.now()), // Auto-generated numeric ID
      name: "",
      brand: "",
      type: "Alto Saxophone",
      price: 0,
      imageUrl: "",
      description: "",
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product: Product) => {
    setEditProduct(product);
    setFormData({
      id: product.id,
      name: product.name,
      brand: product.brand,
      type: product.type || "Alto Saxophone",
      price: product.price,
      imageUrl: product.imageUrl,
      description: product.description,
    });
    setIsModalOpen(true);
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Bạn chắc chắn muốn xóa sản phẩm này?")) return;

    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();

      const res = await fetch(`/api/products/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": token ? `Bearer ${token}` : "",
        },
      });

      if (!res.ok) throw new Error("Failed to delete product");

      alert("Xóa sản phẩm thành công!");
      setLoading(true);
      fetchProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("Không thể xóa sản phẩm. Vui lòng thử lại!");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.id || !formData.name || !formData.brand || !formData.imageUrl || !formData.description || formData.price <= 0) {
      alert("Vui lòng nhập đầy đủ các thông tin hợp lệ!");
      return;
    }

    setIsSubmitting(true);
    try {
      const method = editProduct ? "PUT" : "POST";
      const url = editProduct ? `/api/products/${editProduct.id}` : "/api/products";

      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Failed to save product");

      alert(editProduct ? "Cập nhật sản phẩm thành công!" : "Thêm sản phẩm thành công!");
      setIsModalOpen(false);
      setLoading(true);
      fetchProducts();
    } catch (error) {
      console.error("Error saving product:", error);
      alert("Không thể lưu sản phẩm. Vui lòng thử lại!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormDataChange = (field: keyof typeof formData, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

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
        alert(`Đã cập nhật trạng thái đơn hàng sang: ${newStatus}`);
        fetchOrders();
      } else {
        alert("Cập nhật trạng thái thất bại. Vui lòng thử lại.");
      }
    } catch (error) {
      console.error("Error updating order status:", error);
      alert("Lỗi khi kết nối với máy chủ.");
    }
  };

  const handleDeleteOrder = (orderId: string) => {
    alert(`Không hỗ trợ xóa đơn hàng thực tế (${orderId}). Vui lòng chuyển trạng thái đơn hàng sang 'Đã hủy'.`);
  };

  const handleViewOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setIsOrderModalOpen(true);
  };

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(search.toLowerCase()) ||
    product.brand.toLowerCase().includes(search.toLowerCase())
  );

  const filteredUsers = usersList.filter((user) => {
    const term = userSearch.toLowerCase();
    return (
      (user.name || "").toLowerCase().includes(term) ||
      (user.email || "").toLowerCase().includes(term) ||
      (user.phone || "").toLowerCase().includes(term) ||
      (user.role || "").toLowerCase().includes(term)
    );
  });

  if (isAuthorized === null) {
    return (
      <main className="admin-page-container" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <div className="admin-loading" style={{ fontFamily: "var(--font-sans)", fontSize: "16px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--color-primary)" }}>
          Đang kiểm tra quyền truy cập...
        </div>
      </main>
    );
  }

  if (isAuthorized === false) {
    return (
      <main className="admin-page-container" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "65vh" }}>
        <div className="login-card" style={{ padding: "3.5rem 2.5rem" }}>
          <div className="login-icon" style={{ fontSize: "56px" }}>🔒</div>
          <h1 style={{ color: "var(--color-gold-muted)", marginBottom: "1rem" }}>Truy Cập Bị Từ Chối</h1>
          <p className="login-desc" style={{ marginBottom: "2rem", lineHeight: "1.6" }}>
            Tài khoản của bạn không có quyền truy cập vào khu vực quản trị. Vui lòng đăng nhập bằng tài khoản có đặc quyền Admin.
          </p>
          <Link href="/">
            <button type="button" className="primary-btn" style={{ width: "100%" }}>Quay Lại Cửa Hàng</button>
          </Link>
          <p className="login-register" style={{ marginTop: "1.5rem" }}>
            Có tài khoản Admin? <Link href="/login" style={{ color: "var(--color-secondary)", fontWeight: "600" }}>Đăng nhập tại đây</Link>
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="admin-page-container">
      <div className="admin-layout">
        <AdminSidebar activeTab={activeTab} onTabChange={setActiveTab} />

        <section className="admin-content">
          {activeTab === "products" ? (
            <div className="admin-section">
              <div className="section-header">
                <h2>Quản Lý Danh Sách Sản Phẩm</h2>
                <button
                  type="button"
                  className="add-product-btn"
                  onClick={handleOpenAddModal}
                >
                  ➕ Thêm Sản Phẩm Mới
                </button>
              </div>

              <ProductTable
                products={filteredProducts}
                loading={loading}
                search={search}
                onSearchChange={setSearch}
                onEditProduct={handleOpenEditModal}
                onDeleteProduct={handleDeleteProduct}
              />
            </div>
          ) : activeTab === "orders" ? (
            <div className="admin-section">
              <div className="section-header">
                <h2>Quản Lý Đơn Đặt Hàng</h2>
              </div>
              <OrderTable
                orders={orders}
                search={orderSearch}
                onSearchChange={setOrderSearch}
                statusFilter={orderStatusFilter}
                onStatusFilterChange={setOrderStatusFilter}
                onUpdateStatus={handleUpdateOrderStatus}
                onViewDetails={handleViewOrderDetails}
                onDeleteOrder={handleDeleteOrder}
              />
            </div>
          ) : (
            <div className="admin-section">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-800">Quản Lý Người Dùng & Nhân Sự</h2>
                <div className="flex gap-4">
                  <input
                    type="text"
                    placeholder="Tìm kiếm người dùng..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-emerald-900 bg-white"
                  />
                </div>
              </div>

              {/* Table */}
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                      <th className="p-4">Họ và Tên</th>
                      <th className="p-4">Email</th>
                      <th className="p-4">Số điện thoại</th>
                      <th className="p-4">Địa chỉ</th>
                      <th className="p-4">Vai trò</th>
                      <th className="p-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center p-8 text-slate-400">
                          Không tìm thấy người dùng nào.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((user) => (
                        <tr key={user.userId} className="hover:bg-slate-50/50 transition-all">
                          <td className="p-4 font-semibold text-slate-800">{user.name || "Chưa cập nhật"}</td>
                          <td className="p-4">{user.email}</td>
                          <td className="p-4">{user.phone || "Chưa cập nhật"}</td>
                          <td className="p-4 max-w-50 truncate">{user.address || "Chưa cập nhật"}</td>
                          <td className="p-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              user.role === "Admin" ? "bg-rose-50 text-rose-600 border border-rose-100" :
                              user.role === "Staff" ? "bg-amber-50 text-amber-600 border border-amber-100" :
                              "bg-emerald-50 text-emerald-600 border border-emerald-100"
                            }`}>
                              {user.role === "Admin" ? "Quản trị viên" :
                               user.role === "Staff" ? "Nhân viên" :
                               "Khách hàng"}
                            </span>
                          </td>
                          <td className="p-4 text-right flex justify-end gap-2">
                            <button
                              onClick={() => handleOpenEditUserModal(user)}
                              className="text-xs font-bold text-emerald-800 hover:underline px-3 py-1.5 hover:bg-emerald-50 rounded-lg transition-all"
                            >
                              Sửa vai trò
                            </button>
                            <button
                              onClick={() => handleDeleteUserProfile(user.userId)}
                              className="text-xs font-bold text-rose-600 hover:underline px-3 py-1.5 hover:bg-rose-50 rounded-lg transition-all"
                            >
                              Xóa
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </div>

      <ProductModal
        isOpen={isModalOpen}
        editProduct={editProduct}
        formData={formData}
        onChangeField={handleFormDataChange}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
        onClose={() => setIsModalOpen(false)}
      />

      <OrderDetailsModal
        isOpen={isOrderModalOpen}
        order={selectedOrder}
        onClose={() => setIsOrderModalOpen(false)}
      />

      {isUserModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-xl border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-4 text-center">Cập Nhật Vai Trò Người Dùng</h3>
            
            <div className="space-y-4 mb-6">
              <div>
                <span className="text-xs font-bold text-slate-400 block mb-1">Họ và Tên</span>
                <span className="text-sm font-semibold text-slate-800">{selectedUser.name || "Chưa cập nhật"}</span>
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400 block mb-1">Email</span>
                <span className="text-sm font-semibold text-slate-800">{selectedUser.email}</span>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2">Vai trò người dùng</label>
                <select
                  value={userFormData.role}
                  onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-900 bg-white"
                >
                  <option value="User">Khách hàng (User)</option>
                  <option value="Staff">Nhân viên (Staff)</option>
                  <option value="Admin">Quản trị viên (Admin)</option>
                </select>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleEditUserSubmit}
                disabled={isEditUserSubmitting}
                className="flex-1 bg-emerald-900 hover:bg-emerald-950 text-white font-semibold py-2.5 rounded-xl text-sm transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {isEditUserSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
              <button
                onClick={() => setIsUserModalOpen(false)}
                disabled={isEditUserSubmitting}
                className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold py-2.5 px-6 rounded-xl text-sm transition-all"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}