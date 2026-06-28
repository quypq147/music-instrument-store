"use client";

import Image from "next/image";
import type { Product } from "../../types/product";

interface ProductTableProps {
  products: Product[];
  loading: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
}

export function ProductTable({
  products,
  loading,
  search,
  onSearchChange,
  onEditProduct,
  onDeleteProduct,
}: ProductTableProps) {
  return (
    <div className="admin-section">
      {/* Search Bar */}
      <div className="admin-search-bar">
        <input
          type="text"
          placeholder="Tìm kiếm sản phẩm theo tên hoặc thương hiệu..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="admin-loading">Đang tải danh sách sản phẩm...</div>
      ) : products.length === 0 ? (
        <div className="admin-empty">Không tìm thấy sản phẩm nào.</div>
      ) : (
        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Hình Ảnh</th>
                <th>Tên Sản Phẩm</th>
                <th>Thương Hiệu</th>
                <th>Phân Loại</th>
                <th>Giá Bán</th>
                <th>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td>
                    <code>{product.id}</code>
                  </td>
                  <td>
                    <div className="table-img-wrapper">
                      <Image
                        src={product.imageUrl}
                        alt={product.name}
                        width={60}
                        height={60}
                        className="table-img"
                      />
                    </div>
                  </td>
                  <td>
                    <strong>{product.name}</strong>
                  </td>
                  <td>{product.brand}</td>
                  <td>
                    <span className="badge-type">
                      {product.type || "Alto"}
                    </span>
                  </td>
                  <td>
                    <strong style={{ color: "var(--color-gold-muted)" }}>
                      {product.price.toLocaleString("vi-VN")}đ
                    </strong>
                  </td>
                  <td className="table-actions">
                    <button
                      type="button"
                      className="edit-btn"
                      onClick={() => onEditProduct(product)}
                    >
                      Sửa
                    </button>
                    <button
                      type="button"
                      className="delete-btn"
                      onClick={() => onDeleteProduct(product.id)}
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
