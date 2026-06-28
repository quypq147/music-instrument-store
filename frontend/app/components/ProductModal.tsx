"use client";

import type { Product } from "../../types/product";

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
    <div className="admin-modal-overlay">
      <div className="admin-modal-box">
        <div className="modal-header">
          <h2>{editProduct ? "Cập Nhật Sản Phẩm" : "Thêm Sản Phẩm Mới"}</h2>
          <button type="button" className="close-modal-btn" onClick={onClose}>
            ✕
          </button>
        </div>
        <form onSubmit={onSubmit} className="admin-form">
          <div className="form-row-2">
            <div className="form-group">
              <label htmlFor="prod-id">Mã sản phẩm (ID)</label>
              <input
                id="prod-id"
                type="text"
                value={formData.id}
                onChange={(e) => onChangeField("id", e.target.value)}
                disabled={!!editProduct || isSubmitting}
                placeholder="Ví dụ: 24"
              />
            </div>
            <div className="form-group">
              <label htmlFor="prod-name">Tên sản phẩm</label>
              <input
                id="prod-name"
                type="text"
                value={formData.name}
                onChange={(e) => onChangeField("name", e.target.value)}
                disabled={isSubmitting}
                placeholder="Ví dụ: Yamaha YAS-480"
              />
            </div>
          </div>

          <div className="form-row-3">
            <div className="form-group">
              <label htmlFor="prod-brand">Thương hiệu</label>
              <input
                id="prod-brand"
                type="text"
                value={formData.brand}
                onChange={(e) => onChangeField("brand", e.target.value)}
                disabled={isSubmitting}
                placeholder="Yamaha, Selmer, v.v."
              />
            </div>
            <div className="form-group">
              <label htmlFor="prod-type">Phân loại</label>
              <select
                id="prod-type"
                value={formData.type}
                onChange={(e) => onChangeField("type", e.target.value)}
                disabled={isSubmitting}
              >
                <option value="Alto Saxophone">Alto Saxophone</option>
                <option value="Tenor Saxophone">Tenor Saxophone</option>
                <option value="Soprano Saxophone">Soprano Saxophone</option>
                <option value="Baritone Saxophone">Baritone Saxophone</option>
                <option value="Accessories">Phụ kiện Saxophone</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="prod-price">Giá bán (VND)</label>
              <input
                id="prod-price"
                type="number"
                value={formData.price}
                onChange={(e) => onChangeField("price", Number(e.target.value))}
                disabled={isSubmitting}
                placeholder="Ví dụ: 35000000"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="prod-image">Đường dẫn hình ảnh (URL)</label>
            <input
              id="prod-image"
              type="text"
              value={formData.imageUrl}
              onChange={(e) => onChangeField("imageUrl", e.target.value)}
              disabled={isSubmitting}
              placeholder="Ví dụ: /images/yamaha-yas280.jpg hoặc link https://"
            />
          </div>

          <div className="form-group">
            <label htmlFor="prod-desc">Mô tả sản phẩm</label>
            <textarea
              id="prod-desc"
              rows={4}
              value={formData.description}
              onChange={(e) => onChangeField("description", e.target.value)}
              disabled={isSubmitting}
              placeholder="Nhập mô tả chi tiết sản phẩm..."
            />
          </div>

          <div className="modal-actions">
            <button type="submit" className="submit-btn" disabled={isSubmitting}>
              {isSubmitting ? "Đang xử lý..." : editProduct ? "Cập Nhật" : "Thêm Mới"}
            </button>
            <button
              type="button"
              className="cancel-btn"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Hủy
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
