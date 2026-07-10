/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import "../../components/common/AmplifyConfig";
import { useEffect, useState } from "react";
import { fetchAuthSession } from "aws-amplify/auth";
import type { Product } from "../../../types/product";
import { ProductTable } from "../../components/product/ProductTable";
import { ProductModal } from "../../components/product/ProductModal";
import { useToast } from "../../context/ToastContext";
import { useConfirm } from "../../context/ConfirmDialogContext";
import { listProducts, deleteProduct, saveProduct } from "../../../lib/api/adminProducts";

export default function AdminProductsPage() {
  const { showToast } = useToast();
  const confirmAction = useConfirm();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    id: "",
    name: "",
    brand: "",
    type: "Alto Saxophone",
    price: 0,
    imageUrl: "",
    description: "",
    stock: 0,
  });

  const [authToken, setAuthToken] = useState("");

  useEffect(() => {
    fetchAuthSession().then((session) => {
      const token = session.tokens?.idToken?.toString();
      if (token) setAuthToken(token);
    });
  }, []);

  const fetchProducts = async () => {
    try {
      const result = await listProducts();
      if (!result.ok) throw new Error("Failed to fetch products");
      setProducts(result.data);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
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
      stock: 0,
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
      stock: typeof product.stock === "number" ? product.stock : 0,
    });
    setIsModalOpen(true);
  };

  const handleDeleteProduct = async (id: string) => {
    const ok = await confirmAction({
      message: "Bạn chắc chắn muốn xóa sản phẩm này?",
      danger: true,
    });
    if (!ok) return;

    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();

      const result = await deleteProduct(token, id);

      if (!result.ok) throw new Error("Failed to delete product");

      showToast("Xóa sản phẩm thành công!", "success");
      setLoading(true);
      fetchProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
      showToast("Không thể xóa sản phẩm. Vui lòng thử lại!", "error");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.id || !formData.name || !formData.brand || !formData.imageUrl || !formData.description || formData.price <= 0 || formData.stock < 0) {
      showToast("Vui lòng nhập đầy đủ các thông tin hợp lệ!", "warning");
      return;
    }

    setIsSubmitting(true);
    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();

      const result = await saveProduct(token, editProduct?.id ?? formData.id, !!editProduct, formData);

      if (!result.ok) throw new Error("Failed to save product");

      showToast(editProduct ? "Cập nhật sản phẩm thành công!" : "Thêm sản phẩm thành công!", "success");
      setIsModalOpen(false);
      setLoading(true);
      fetchProducts();
    } catch (error) {
      console.error("Error saving product:", error);
      showToast("Không thể lưu sản phẩm. Vui lòng thử lại!", "error");
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

  return (
    <div>
      <div className="flex justify-between items-center mb-8 pb-4 border-b-2 border-[#DF9E47]">
        <h2 className="font-serif text-2xl text-[#002B1F]">Quản Lý Danh Sách Sản Phẩm</h2>
        <button
          type="button"
          onClick={handleOpenAddModal}
          className="bg-[#DF9E47] hover:bg-[#c88a3a] text-[#002B1F] font-bold text-sm px-5 py-2.5 rounded-xl transition-colors"
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

      <ProductModal
        isOpen={isModalOpen}
        editProduct={editProduct}
        formData={formData}
        onChangeField={handleFormDataChange}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
        onClose={() => setIsModalOpen(false)}
        authToken={authToken}
      />
    </div>
  );
}
