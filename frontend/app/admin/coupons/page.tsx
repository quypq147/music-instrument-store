"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import "../../components/common/AmplifyConfig";
import { useEffect, useState } from "react";
import { fetchAuthSession } from "aws-amplify/auth";
import { useToast } from "../../context/ToastContext";
import { useConfirm } from "../../context/ConfirmDialogContext";
import MusicLoading from "../../components/common/MusicLoading";
import { Tag, Plus } from "lucide-react";
import { listCoupons, createCoupon, updateCoupon, deleteCoupon, type Coupon } from "../../../lib/api/adminCoupons";

const emptyForm = {
  code: "",
  discountType: "percentage" as "percentage" | "fixed",
  discountValue: "",
  minOrderValue: "",
  usageLimit: "",
  validUntil: "",
};

export default function AdminCouponsPage() {
  const { showToast } = useToast();
  const confirmAction = useConfirm();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [busyCode, setBusyCode] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const getToken = async () => {
    const session = await fetchAuthSession();
    return session.tokens?.idToken?.toString();
  };

  const fetchCoupons = async () => {
    try {
      const token = await getToken();
      if (!token) {
        showToast("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.", "error");
        return;
      }
      const result = await listCoupons(token);
      if (!result.ok) {
        const errorData = result.data as { error?: string } | undefined;
        throw new Error(errorData?.error || `Failed to fetch coupons (status ${result.status})`);
      }
      setCoupons(result.data);
    } catch (error) {
      console.error("Error fetching coupons:", error);
      const detail = error instanceof Error ? error.message : "";
      showToast(
        detail ? `Không thể tải danh sách mã giảm giá: ${detail}` : "Không thể tải danh sách mã giảm giá.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code.trim() || !form.discountValue) {
      showToast("Vui lòng nhập mã và giá trị giảm giá.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = await getToken();
      if (!token) {
        showToast("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.", "error");
        return;
      }

      const result = await createCoupon(token, {
        code: form.code.trim().toUpperCase(),
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        minOrderValue: form.minOrderValue ? Number(form.minOrderValue) : 0,
        usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
        validUntil: form.validUntil ? new Date(form.validUntil).toISOString() : null,
      });

      if (result.ok) {
        showToast("Đã tạo mã giảm giá!", "success");
        setForm(emptyForm);
        fetchCoupons();
      } else {
        const errorData = result.data as { error?: string } | undefined;
        showToast(errorData?.error ? `Tạo mã thất bại: ${errorData.error}` : "Tạo mã giảm giá thất bại.", "error");
      }
    } catch (error) {
      console.error("Error creating coupon:", error);
      showToast("Lỗi khi kết nối với máy chủ.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (coupon: Coupon) => {
    setBusyCode(coupon.code);
    try {
      const token = await getToken();
      if (!token) {
        showToast("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.", "error");
        return;
      }

      const result = await updateCoupon(token, coupon.code, { isActive: !coupon.isActive });

      if (result.ok) {
        showToast(coupon.isActive ? "Đã tạm dừng mã giảm giá." : "Đã kích hoạt lại mã giảm giá.", "success");
        fetchCoupons();
      } else {
        const errorData = result.data as { error?: string } | undefined;
        showToast(errorData?.error || "Không thể cập nhật mã giảm giá.", "error");
      }
    } catch (error) {
      console.error("Error toggling coupon:", error);
      showToast("Lỗi khi kết nối với máy chủ.", "error");
    } finally {
      setBusyCode(null);
    }
  };

  const handleDelete = async (coupon: Coupon) => {
    const ok = await confirmAction({
      message: `Bạn có chắc chắn muốn xóa mã giảm giá "${coupon.code}"? Thao tác này không thể hoàn tác.`,
      danger: true,
    });
    if (!ok) return;

    setBusyCode(coupon.code);
    try {
      const token = await getToken();
      if (!token) {
        showToast("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.", "error");
        return;
      }

      const result = await deleteCoupon(token, coupon.code);

      if (result.ok) {
        showToast("Đã xóa mã giảm giá.", "success");
        fetchCoupons();
      } else {
        const errorData = result.data as { error?: string } | undefined;
        showToast(errorData?.error || "Không thể xóa mã giảm giá.", "error");
      }
    } catch (error) {
      console.error("Error deleting coupon:", error);
      showToast("Lỗi khi kết nối với máy chủ.", "error");
    } finally {
      setBusyCode(null);
    }
  };

  const formatDiscount = (coupon: Coupon) =>
    coupon.discountType === "percentage"
      ? `${coupon.discountValue}%`
      : `${coupon.discountValue.toLocaleString("vi-VN")}đ`;

  const formatDate = (isoString?: string | null) => {
    if (!isoString) return "Không giới hạn";
    try {
      return new Date(isoString).toLocaleDateString("vi-VN");
    } catch {
      return isoString;
    }
  };

  return (
    <div>
      <div className="mb-8 pb-4 border-b-2 border-[#DF9E47]">
        <h2 className="font-serif text-2xl text-[#002B1F]">Quản Lý Mã Giảm Giá</h2>
        <p className="text-sm text-slate-500 mt-1">Tạo và quản lý các mã giảm giá áp dụng khi khách hàng thanh toán.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 p-6 mb-8">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 block">Mã giảm giá</label>
            <input
              type="text"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              placeholder="SUMMER20"
              className="w-full py-2.5 px-4 bg-white border border-gray-200 rounded-xl text-sm text-slate-700 outline-none focus:border-[#002B1F] focus:shadow-[0_0_0_1px_#002B1F] transition-all uppercase"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 block">Loại giảm giá</label>
            <select
              value={form.discountType}
              onChange={(e) => setForm({ ...form, discountType: e.target.value as "percentage" | "fixed" })}
              className="w-full py-2.5 px-4 bg-white border border-gray-200 rounded-xl text-sm text-slate-700 outline-none focus:border-[#002B1F] cursor-pointer"
            >
              <option value="percentage">Phần trăm (%)</option>
              <option value="fixed">Số tiền cố định (đ)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 block">
              Giá trị giảm {form.discountType === "percentage" ? "(%)" : "(đ)"}
            </label>
            <input
              type="number"
              value={form.discountValue}
              onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
              placeholder={form.discountType === "percentage" ? "20" : "100000"}
              className="w-full py-2.5 px-4 bg-white border border-gray-200 rounded-xl text-sm text-slate-700 outline-none focus:border-[#002B1F] focus:shadow-[0_0_0_1px_#002B1F] transition-all"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 block">Đơn tối thiểu (đ)</label>
            <input
              type="number"
              value={form.minOrderValue}
              onChange={(e) => setForm({ ...form, minOrderValue: e.target.value })}
              placeholder="0"
              className="w-full py-2.5 px-4 bg-white border border-gray-200 rounded-xl text-sm text-slate-700 outline-none focus:border-[#002B1F] focus:shadow-[0_0_0_1px_#002B1F] transition-all"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 block">Giới hạn lượt dùng</label>
            <input
              type="number"
              value={form.usageLimit}
              onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
              placeholder="Không giới hạn"
              className="w-full py-2.5 px-4 bg-white border border-gray-200 rounded-xl text-sm text-slate-700 outline-none focus:border-[#002B1F] focus:shadow-[0_0_0_1px_#002B1F] transition-all"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 block">Ngày hết hạn</label>
            <input
              type="date"
              value={form.validUntil}
              onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
              className="w-full py-2.5 px-4 bg-white border border-gray-200 rounded-xl text-sm text-slate-700 outline-none focus:border-[#002B1F] focus:shadow-[0_0_0_1px_#002B1F] transition-all"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-6 flex items-center gap-2 bg-[#002B1F] text-white font-bold text-sm uppercase tracking-widest px-6 py-3 rounded-xl hover:bg-[#054030] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus size={16} />
          {isSubmitting ? "Đang tạo..." : "Tạo Mã Giảm Giá"}
        </button>
      </form>

      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h3 className="font-serif text-lg text-[#002B1F] mb-4">Danh Sách Mã Giảm Giá</h3>

        {loading ? (
          <MusicLoading />
        ) : coupons.length === 0 ? (
          <div className="text-center py-16 bg-[#F3EFEA] rounded-xl text-sm text-slate-500">
            <Tag className="mx-auto mb-2" size={28} />
            Chưa có mã giảm giá nào.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-[#F3EFEA] border-b border-gray-200 text-[#002B1F] font-bold uppercase text-[11px] tracking-wider">
                  <th className="p-4">Mã</th>
                  <th className="p-4">Giảm giá</th>
                  <th className="p-4">Đơn tối thiểu</th>
                  <th className="p-4">Đã dùng</th>
                  <th className="p-4">Hết hạn</th>
                  <th className="p-4">Trạng thái</th>
                  <th className="p-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {coupons.map((coupon) => {
                  const isBusy = busyCode === coupon.code;
                  return (
                    <tr key={coupon.code} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-4 font-mono font-semibold text-[#002B1F]">{coupon.code}</td>
                      <td className="p-4 text-slate-600">{formatDiscount(coupon)}</td>
                      <td className="p-4 text-slate-600">{(coupon.minOrderValue || 0).toLocaleString("vi-VN")}đ</td>
                      <td className="p-4 text-slate-600">
                        {coupon.usageCount}
                        {typeof coupon.usageLimit === "number" ? ` / ${coupon.usageLimit}` : ""}
                      </td>
                      <td className="p-4 text-slate-600">{formatDate(coupon.validUntil)}</td>
                      <td className="p-4">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                            coupon.isActive ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {coupon.isActive ? "Đang hoạt động" : "Tạm dừng"}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleActive(coupon)}
                            disabled={isBusy}
                            className="text-xs font-bold text-[#002B1F] hover:underline px-3 py-1.5 hover:bg-[#F3EFEA] rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {coupon.isActive ? "Tạm dừng" : "Kích hoạt"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(coupon)}
                            disabled={isBusy}
                            className="text-xs font-bold text-rose-600 hover:underline px-3 py-1.5 hover:bg-rose-50 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
