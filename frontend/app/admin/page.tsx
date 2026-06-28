"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchAuthSession } from "@aws-amplify/auth";
import type { Product } from "../../types/product";
import { AdminSidebar } from "../components/AdminSidebar";
import { ProductTable } from "../components/ProductTable";
import { ProductModal } from "../components/ProductModal";

export default function AdminPage() {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"products" | "orders">("products");

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

  useEffect(() => {
    const init = async () => {
      try {
        const session = await fetchAuthSession();
        const groups = session.tokens?.idToken?.payload["cognito:groups"] as string[] | undefined;
        if (groups && groups.includes("Admin")) {
          setIsAuthorized(true);
          await fetchProducts();
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

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(search.toLowerCase()) ||
    product.brand.toLowerCase().includes(search.toLowerCase())
  );

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
          ) : (
            <div className="admin-section">
              <div className="section-header">
                <h2>Quản Lý Đơn Đặt Hàng</h2>
              </div>
              <div className="admin-empty">
                Chức năng quản lý hóa đơn & khách hàng đang được xử lý thông qua hệ thống EventBridge và SQS ở Backend.
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
    </main>
  );
}