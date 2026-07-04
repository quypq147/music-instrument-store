/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { Product } from "../../../types/product";
import { Pagination } from "../common/Pagination";

interface ProductTableProps {
  products: Product[];
  loading: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
}

const ITEMS_PER_PAGE = 10;

export function ProductTable({
  products,
  loading,
  search,
  onSearchChange,
  onEditProduct,
  onDeleteProduct,
}: ProductTableProps) {
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, products.length]);

  const totalPages = Math.ceil(products.length / ITEMS_PER_PAGE);
  const paginatedProducts = products.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      {/* Search Bar */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Tìm kiếm sản phẩm theo tên hoặc thương hiệu..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full max-w-md py-2.5 px-4 bg-white border border-gray-200 rounded-xl text-sm text-slate-700 outline-none focus:border-[#002B1F] focus:shadow-[0_0_0_1px_#002B1F] transition-all"
        />
      </div>

      {loading ? (
        <div className="text-center py-16 text-sm text-slate-500">Đang tải danh sách sản phẩm...</div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 bg-[#F3EFEA] rounded-xl text-sm text-slate-500">
          Không tìm thấy sản phẩm nào.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-[#F3EFEA] border-b border-gray-200 text-[#002B1F] font-bold uppercase text-[11px] tracking-wider">
                <th className="p-4">ID</th>
                <th className="p-4">Hình Ảnh</th>
                <th className="p-4">Tên Sản Phẩm</th>
                <th className="p-4">Thương Hiệu</th>
                <th className="p-4">Phân Loại</th>
                <th className="p-4">Giá Bán</th>
                <th className="p-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-4">
                    <code className="text-xs text-slate-500">{product.id}</code>
                  </td>
                  <td className="p-4">
                    <div className="relative w-14 h-14 bg-[#F3EFEA] rounded-lg overflow-hidden">
                      <Image
                        src={product.imageUrl}
                        alt={product.name}
                        fill
                        className="object-contain p-1"
                      />
                    </div>
                  </td>
                  <td className="p-4">
                    <strong className="text-[#002B1F]">{product.name}</strong>
                  </td>
                  <td className="p-4 text-slate-600">{product.brand}</td>
                  <td className="p-4">
                    <span className="inline-block bg-[#F3EFEA] text-[#A36B2B] text-xs font-bold px-3 py-1 rounded-full uppercase">
                      {product.type || "Alto"}
                    </span>
                  </td>
                  <td className="p-4">
                    <strong className="text-[#A36B2B]">
                      {product.price.toLocaleString("vi-VN")}đ
                    </strong>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => onEditProduct(product)}
                        className="text-xs font-bold text-[#002B1F] hover:underline px-3 py-1.5 hover:bg-[#F3EFEA] rounded-lg transition-all"
                      >
                        Sửa
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteProduct(product.id)}
                        className="text-xs font-bold text-rose-600 hover:underline px-3 py-1.5 hover:bg-rose-50 rounded-lg transition-all"
                      >
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>
      )}
    </div>
  );
}
