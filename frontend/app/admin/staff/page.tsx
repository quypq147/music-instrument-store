"use client";

import "../../components/common/AmplifyConfig";
import { useEffect, useState, useCallback } from "react";
import { fetchAuthSession } from "aws-amplify/auth";
import { type AdminUser } from "../../components/admin/UserTable";
import { StaffTable } from "../../components/admin/StaffTable";
import { useToast } from "../../context/ToastContext";
import { useConfirm } from "../../context/ConfirmDialogContext";
import MusicLoading from "../../components/common/MusicLoading";
import Link from "next/link";
import { listAdminUsers, updateAdminUser, deleteAdminUser } from "../../../lib/api/adminUsers";

export default function AdminStaffPage() {
  const { showToast } = useToast();
  const confirmAction = useConfirm();
  const [usersList, setUsersList] = useState<AdminUser[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isEditUserSubmitting, setIsEditUserSubmitting] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  const [userFormData, setUserFormData] = useState({
    name: "",
    phone: "",
    address: "",
    role: "Staff",
  });

  const fetchUsers = useCallback(async () => {
    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      if (!token) return;

      const result = await listAdminUsers(token);
      if (result.ok) {
        // Filter: Only include Admin and Staff members
        const staffOnly = (result.data || []).filter(
          (u: AdminUser) => {
            const role = u.role?.toLowerCase();
            return role === "admin" || role === "staff";
          }
        );
        setUsersList(staffOnly);
      }
    } catch (error) {
      console.error("Error fetching staff list:", error);
    }
  }, []);

  useEffect(() => {
    const checkAuthorization = async () => {
      try {
        const session = await fetchAuthSession();
        const groups = session.tokens?.idToken?.payload["cognito:groups"] as string[] | undefined;
        if (groups && groups.includes("Admin")) {
          setIsAuthorized(true);
          await fetchUsers();
        } else {
          setIsAuthorized(false);
        }
      } catch (err) {
        console.error("Auth check failed in staff page:", err);
        setIsAuthorized(false);
      }
    };
    checkAuthorization();
  }, [fetchUsers]);

  const handleOpenEditUserModal = (user: AdminUser) => {
    setSelectedUser(user);
    setUserFormData({
      name: user.name || "",
      phone: user.phone || "",
      address: user.address || "",
      role: user.role || "Staff",
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

      const result = await updateAdminUser(token, selectedUser.userId, userFormData);

      if (result.ok) {
        showToast("Cập nhật vai trò nhân sự thành công!", "success");
        setIsUserModalOpen(false);
        fetchUsers();
      } else {
        showToast("Cập nhật thất bại. Vui lòng thử lại.", "error");
      }
    } catch (err) {
      console.error("Failed to update staff member role:", err);
      showToast("Đã xảy ra lỗi khi cập nhật.", "error");
    } finally {
      setIsEditUserSubmitting(false);
    }
  };

  const handleDeleteUserProfile = async (userId: string) => {
    const ok = await confirmAction({
      message: "Bạn có chắc chắn muốn xóa hồ sơ nhân sự này? Thao tác này không thể hoàn tác.",
      danger: true,
    });
    if (!ok) return;

    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      if (!token) return;

      const result = await deleteAdminUser(token, userId);

      if (result.ok) {
        showToast("Xóa hồ sơ nhân sự thành công!", "success");
        await fetchUsers();
      } else {
        showToast("Không thể xóa hồ sơ nhân sự.", "error");
      }
    } catch (err) {
      console.error("Failed to delete staff member profile:", err);
      showToast("Đã xảy ra lỗi khi xóa.", "error");
    }
  };

  if (isAuthorized === null) {
    return <MusicLoading message="Đang kiểm tra quyền truy cập..." height="200px" />;
  }

  if (isAuthorized === false) {
    return (
      <div className="max-w-md mx-auto mt-20 bg-white rounded-2xl border border-gray-100 p-10 text-center">
        <div className="text-5xl mb-4">🔒</div>
        <h1 className="font-serif text-2xl text-[#A36B2B] mb-3">Truy Cập Bị Từ Chối</h1>
        <p className="text-sm text-slate-600 leading-relaxed mb-6">
          Chỉ Quản trị viên (Admin) mới có quyền truy cập trang quản lý nhân sự này.
        </p>
        <Link href="/admin">
          <button
            type="button"
            className="w-full bg-[#002B1F] hover:bg-[#054030] text-white font-bold text-sm uppercase tracking-widest py-3.5 rounded-xl transition-colors cursor-pointer"
          >
            Quay Lại Tổng Quan
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 pb-4 border-b-2 border-[#DF9E47]">
        <h2 className="font-serif text-2xl text-[#002B1F]">Quản Lý Nhân Sự</h2>
      </div>

      <StaffTable
        users={usersList}
        search={userSearch}
        onSearchChange={setUserSearch}
        onEditUser={handleOpenEditUserModal}
        onDeleteUser={handleDeleteUserProfile}
      />

      {isUserModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 md:p-8">
            <h3 className="font-serif text-xl text-[#002B1F] mb-6 text-center">Cập Nhật Vai Trò Nhân Sự</h3>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-bold text-[#002B1F] uppercase tracking-wider mb-1">Họ và Tên</label>
                <p className="text-sm font-semibold text-slate-800">{selectedUser.name || "Chưa cập nhật"}</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#002B1F] uppercase tracking-wider mb-1">Email</label>
                <p className="text-sm font-semibold text-slate-800">{selectedUser.email}</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#002B1F] uppercase tracking-wider mb-2">Vai trò</label>
                <select
                  value={userFormData.role}
                  onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value })}
                  className="w-full py-2.5 px-4 bg-white border border-gray-200 rounded-xl text-sm text-slate-700 outline-none focus:border-[#002B1F] focus:shadow-[0_0_0_1px_#002B1F] transition-all cursor-pointer"
                >
                  <option value="User">Khách hàng (User)</option>
                  <option value="Staff">Nhân viên (Staff)</option>
                  <option value="Admin">Quản trị viên (Admin)</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleEditUserSubmit}
                disabled={isEditUserSubmitting}
                className="flex-1 bg-[#002B1F] hover:bg-[#054030] text-white font-bold text-sm uppercase tracking-widest py-3.5 rounded-xl transition-colors disabled:opacity-60 cursor-pointer"
              >
                {isEditUserSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
              <button
                onClick={() => setIsUserModalOpen(false)}
                disabled={isEditUserSubmitting}
                className="px-6 border border-gray-200 text-slate-600 font-bold text-sm uppercase tracking-widest py-3.5 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-60 cursor-pointer"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
