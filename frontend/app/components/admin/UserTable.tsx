/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState } from "react";
import { Pagination } from "../common/Pagination";

export interface AdminUser {
  userId: string;
  email?: string;
  name?: string;
  phone?: string;
  address?: string;
  role?: string;
}

interface UserTableProps {
  users: AdminUser[];
  search: string;
  onSearchChange: (value: string) => void;
  onEditUser: (user: AdminUser) => void;
  onDeleteUser: (userId: string) => Promise<void>;
}

const ITEMS_PER_PAGE = 10;

export function UserTable({ users, search, onSearchChange, onEditUser, onDeleteUser }: UserTableProps) {
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const filteredUsers = users.filter((user) => {
    const term = search.toLowerCase();
    return (
      (user.name || "").toLowerCase().includes(term) ||
      (user.email || "").toLowerCase().includes(term) ||
      (user.phone || "").toLowerCase().includes(term) ||
      (user.role || "").toLowerCase().includes(term)
    );
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [search, users.length]);

  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleDelete = async (userId: string) => {
    setDeletingUserId(userId);
    await onDeleteUser(userId);
    setDeletingUserId(null);
  };

  return (
    <div>
      <div className="mb-6">
        <input
          type="text"
          placeholder="Tìm kiếm người dùng..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full max-w-xs py-2.5 px-4 bg-white border border-gray-200 rounded-xl text-sm text-slate-700 outline-none focus:border-[#002B1F] focus:shadow-[0_0_0_1px_#002B1F] transition-all"
        />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="bg-[#F3EFEA] border-b border-gray-200 text-[#002B1F] font-bold uppercase text-[11px] tracking-wider">
              <th className="p-4">Họ và Tên</th>
              <th className="p-4">Email</th>
              <th className="p-4">Số điện thoại</th>
              <th className="p-4">Địa chỉ</th>
              <th className="p-4">Vai trò</th>
              <th className="p-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginatedUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-16 text-slate-500">
                  Không tìm thấy người dùng nào.
                </td>
              </tr>
            ) : (
              paginatedUsers.map((user) => {
                const isDeleting = deletingUserId === user.userId;
                return (
                  <tr key={user.userId} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4 font-semibold text-[#002B1F]">{user.name || "Chưa cập nhật"}</td>
                    <td className="p-4 text-slate-600">{user.email}</td>
                    <td className="p-4 text-slate-600">{user.phone || "Chưa cập nhật"}</td>
                    <td className="p-4 max-w-52 truncate text-slate-600">{user.address || "Chưa cập nhật"}</td>
                    <td className="p-4">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                          user.role === "Admin"
                            ? "bg-rose-50 text-rose-600"
                            : user.role === "Staff"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-emerald-50 text-emerald-700"
                        }`}
                      >
                        {user.role === "Admin" ? "Quản trị viên" : user.role === "Staff" ? "Nhân viên" : "Khách hàng"}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => onEditUser(user)}
                          disabled={isDeleting}
                          className="text-xs font-bold text-[#002B1F] hover:underline px-3 py-1.5 hover:bg-[#F3EFEA] rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Sửa vai trò
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(user.userId)}
                          disabled={isDeleting}
                          className="text-xs font-bold text-rose-600 hover:underline px-3 py-1.5 hover:bg-rose-50 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isDeleting ? "Đang xóa..." : "Xóa"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        {paginatedUsers.length > 0 && (
          <div className="pb-4">
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          </div>
        )}
      </div>
    </div>
  );
}
