"use client";

import type { Product } from "../../../types/product";

interface ProductFormData {
  id: string;
  name: string;
  brand: string;
  type: string;
  price: number;
  imageUrl: string;
  description: string;
}

interface ProductModalProps {
  isOpen: boolean;
  editProduct: Product | null;
  formData: ProductFormData;
  onChangeField: (field: keyof ProductFormData, value: string | number) => void;
  isSubmitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
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
}: ProductModalProps) {
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                <option value="Alto Saxophone">Alto Saxophone</option>
                <option value="Tenor Saxophone">Tenor Saxophone</option>
                <option value="Soprano Saxophone">Soprano Saxophone</option>
                <option value="Baritone Saxophone">Baritone Saxophone</option>
                <option value="Accessories">Phụ kiện Saxophone</option>
              </select>
            </div>
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
          </div>

          <div>
            <label htmlFor="prod-image" className={labelClasses}>Đường dẫn hình ảnh (URL)</label>
            <input
              id="prod-image"
              type="text"
              value={formData.imageUrl}
              onChange={(e) => onChangeField("imageUrl", e.target.value)}
              disabled={isSubmitting}
              placeholder="Ví dụ: /images/yamaha-yas280.jpg hoặc link https://"
              className={inputClasses}
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
