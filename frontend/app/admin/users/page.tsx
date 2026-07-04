"use client";

import "../../components/common/AmplifyConfig";
import { useEffect, useState } from "react";
import { fetchAuthSession } from "aws-amplify/auth";
import { UserTable, type AdminUser } from "../../components/admin/UserTable";
import { useToast } from "../../context/ToastContext";
import { useConfirm } from "../../context/ConfirmDialogContext";

export default function AdminUsersPage() {
  const { showToast } = useToast();
  const confirmAction = useConfirm();
  const [usersList, setUsersList] = useState<AdminUser[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
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
        const customersOnly = (data || []).filter((u: AdminUser) => u.role !== "Admin" && u.role !== "Staff");
        setUsersList(customersOnly);
      }
    } catch (error) {
      console.error("Error fetching users list:", error);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const session = await fetchAuthSession();
        const groups = session.tokens?.idToken?.payload["cognito:groups"] as string[] | undefined;
        if (groups && groups.includes("Admin")) {
          setIsAdmin(true);
        }
      } catch (error) {
        console.error("Error checking role in users page:", error);
      }
      await fetchUsers();
    };
    init();
  }, []);

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
        showToast("Cập nhật vai trò người dùng thành công!", "success");
        setIsUserModalOpen(false);
        fetchUsers();
      } else {
        showToast("Cập nhật thất bại. Vui lòng thử lại.", "error");
      }
    } catch (err) {
      console.error("Failed to update user profile:", err);
      showToast("Đã xảy ra lỗi khi cập nhật.", "error");
    } finally {
      setIsEditUserSubmitting(false);
    }
  };

  const handleDeleteUserProfile = async (userId: string) => {
    const ok = await confirmAction({
      message: "Bạn có chắc chắn muốn xóa hồ sơ người dùng này? Thao tác này không thể hoàn tác.",
      danger: true,
    });
    if (!ok) return;

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
        showToast("Xóa hồ sơ người dùng thành công!", "success");
        await fetchUsers();
      } else {
        showToast("Không thể xóa hồ sơ người dùng.", "error");
      }
    } catch (err) {
      console.error("Failed to delete user profile:", err);
      showToast("Đã xảy ra lỗi khi xóa.", "error");
    }
  };

  return (
    <div>
      <div className="mb-8 pb-4 border-b-2 border-[#DF9E47]">
        <h2 className="font-serif text-2xl text-[#002B1F]">Quản Lý Người Dùng</h2>
      </div>

      <UserTable
        users={usersList}
        search={userSearch}
        onSearchChange={setUserSearch}
        onEditUser={handleOpenEditUserModal}
        onDeleteUser={handleDeleteUserProfile}
      />

      {isUserModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 md:p-8">
            <h3 className="font-serif text-xl text-[#002B1F] mb-6 text-center">Cập Nhật Vai Trò Người Dùng</h3>

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
                <label className="block text-xs font-bold text-[#002B1F] uppercase tracking-wider mb-2">Vai trò người dùng</label>
                <select
                  value={userFormData.role}
                  onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value })}
                  disabled={!isAdmin}
                  className="w-full py-2.5 px-4 bg-white border border-gray-200 rounded-xl text-sm text-slate-700 outline-none focus:border-[#002B1F] focus:shadow-[0_0_0_1px_#002B1F] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
                className="flex-1 bg-[#002B1F] hover:bg-[#054030] text-white font-bold text-sm uppercase tracking-widest py-3.5 rounded-xl transition-colors disabled:opacity-60"
              >
                {isEditUserSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
              <button
                onClick={() => setIsUserModalOpen(false)}
                disabled={isEditUserSubmitting}
                className="px-6 border border-gray-200 text-slate-600 font-bold text-sm uppercase tracking-widest py-3.5 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-60"
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
