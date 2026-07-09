"use client";

import { useEffect, useState } from "react";
import type { Product } from "../../../types/product";
import { ImagePicker } from "../common/ImagePicker";
import { useToast } from "../../context/ToastContext";

interface ProductFormData {
  id: string;
  name: string;
  brand: string;
  type: string;
  price: number;
  imageUrl: string;
  description: string;
  stock: number;
}

interface ProductModalProps {
  isOpen: boolean;
  editProduct: Product | null;
  formData: ProductFormData;
  onChangeField: (field: keyof ProductFormData, value: string | number) => void;
  isSubmitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  authToken: string;
}

const inputClasses =
  "w-full py-2.5 px-4 bg-white border border-gray-200 rounded-xl text-sm text-slate-700 outline-none focus:border-[#002B1F] focus:shadow-[0_0_0_1px_#002B1F] transition-all disabled:opacity-60 disabled:cursor-not-allowed";
const labelClasses = "block text-xs font-bold text-[#002B1F] uppercase tracking-wider mb-2";

export function ProductModal({
  isOpen,
  editProduct,
  formData,
  onChangeField,
  isSubmitting,
  onSubmit,
  onClose,
  authToken,
}: ProductModalProps) {
  const { showToast } = useToast();
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/categories");
        if (res.ok) {
          const data = await res.json();
          setCategories(data);
        }
      } catch (err) {
        console.error("Error fetching categories in modal:", err);
      }
    };
    fetchCategories();
  }, [isOpen]);

  const defaultCategories = [
    { id: "alto-saxophone", name: "Alto Saxophone" },
    { id: "tenor-saxophone", name: "Tenor Saxophone" },
    { id: "soprano-saxophone", name: "Soprano Saxophone" },
    { id: "baritone-saxophone", name: "Baritone Saxophone" },
    { id: "accessories", name: "Accessories" }
  ];

  const displayedCategories = categories.length > 0 ? categories : defaultCategories;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl p-6 md:p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-serif text-2xl text-[#002B1F]">
            {editProduct ? "Cập Nhật Sản Phẩm" : "Thêm Sản Phẩm Mới"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-2xl text-slate-400 hover:text-slate-600 transition-colors leading-none"
          >
            ✕
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="prod-id" className={labelClasses}>Mã sản phẩm (ID)</label>
              <input
                id="prod-id"
                type="text"
                value={formData.id}
                onChange={(e) => onChangeField("id", e.target.value)}
                disabled={!!editProduct || isSubmitting}
                placeholder="Ví dụ: 24"
                className={inputClasses}
              />
            </div>
            <div>
              <label htmlFor="prod-name" className={labelClasses}>Tên sản phẩm</label>
              <input
                id="prod-name"
                type="text"
                value={formData.name}
                onChange={(e) => onChangeField("name", e.target.value)}
                disabled={isSubmitting}
                placeholder="Ví dụ: Yamaha YAS-480"
                className={inputClasses}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="prod-brand" className={labelClasses}>Thương hiệu</label>
              <input
                id="prod-brand"
                type="text"
                value={formData.brand}
                onChange={(e) => onChangeField("brand", e.target.value)}
                disabled={isSubmitting}
                placeholder="Yamaha, Selmer, v.v."
                className={inputClasses}
              />
            </div>
            <div>
              <label htmlFor="prod-type" className={labelClasses}>Phân loại</label>
              <select
                id="prod-type"
                value={formData.type}
                onChange={(e) => onChangeField("type", e.target.value)}
                disabled={isSubmitting}
                className={inputClasses}
              >
                {displayedCategories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="prod-price" className={labelClasses}>Giá bán (VND)</label>
              <input
                id="prod-price"
                type="number"
                value={formData.price}
                onChange={(e) => onChangeField("price", Number(e.target.value))}
                disabled={isSubmitting}
                placeholder="Ví dụ: 35000000"
                className={inputClasses}
              />
            </div>
            <div>
              <label htmlFor="prod-stock" className={labelClasses}>Số lượng tồn kho</label>
              <input
                id="prod-stock"
                type="number"
                min="0"
                value={formData.stock}
                onChange={(e) => onChangeField("stock", Number(e.target.value))}
                disabled={isSubmitting}
                placeholder="Ví dụ: 10"
                className={inputClasses}
              />
            </div>
          </div>

          <div>
            <label className={labelClasses}>Hình ảnh sản phẩm</label>
            <ImagePicker
              currentImageUrl={formData.imageUrl}
              uploadUrlEndpoint={`/api/products/${formData.id}/image-upload-url`}
              authToken={authToken}
              onUploaded={(publicUrl) => onChangeField("imageUrl", publicUrl)}
              onError={(message) => showToast(message, "error")}
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label htmlFor="prod-desc" className={labelClasses}>Mô tả sản phẩm</label>
            <textarea
              id="prod-desc"
              rows={4}
              value={formData.description}
              onChange={(e) => onChangeField("description", e.target.value)}
              disabled={isSubmitting}
              placeholder="Nhập mô tả chi tiết sản phẩm..."
              className={inputClasses}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-[#002B1F] hover:bg-[#054030] text-white font-bold text-sm uppercase tracking-widest py-3.5 rounded-xl transition-colors disabled:opacity-60"
            >
              {isSubmitting ? "Đang xử lý..." : editProduct ? "Cập Nhật" : "Thêm Mới"}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-6 border border-gray-200 text-slate-600 font-bold text-sm uppercase tracking-widest py-3.5 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-60"
            >
              Hủy
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
