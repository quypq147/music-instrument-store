"use client";

import "../../components/common/AmplifyConfig";
import { useEffect, useState } from "react";
import { useToast } from "../../context/ToastContext";
import { useConfirm } from "../../context/ConfirmDialogContext";
import MusicLoading from "../../components/common/MusicLoading";
import { Search, Plus, Edit2, Trash2, X, Tag } from "lucide-react";
import { listCategories, deleteCategory, saveCategory, type Category } from "../../../lib/api/adminCategories";

export default function AdminCategoriesPage() {
  const { showToast } = useToast();
  const confirmAction = useConfirm();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  const fetchCategories = async () => {
    try {
      const result = await listCategories();
      if (!result.ok) throw new Error("Failed to fetch categories");
      setCategories(result.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
      showToast("Không thể tải danh sách danh mục.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      await fetchCategories();
    })();
  }, []);

  const handleOpenAddModal = () => {
    setEditCategory(null);
    setFormData({
      name: "",
      description: "",
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (category: Category) => {
    setEditCategory(category);
    setFormData({
      name: category.name,
      description: category.description || "",
    });
    setIsModalOpen(true);
  };

  const handleDeleteCategory = async (category: Category) => {
    const ok = await confirmAction({
      message: `Bạn có chắc chắn muốn xóa danh mục "${category.name}"? Hành động này không thể hoàn tác!`,
      danger: true,
    });
    if (!ok) return;

    try {
      const result = await deleteCategory(category.id);

      if (!result.ok) throw new Error("Failed to delete category");

      showToast("Xóa danh mục thành công!", "success");
      setLoading(true);
      fetchCategories();
    } catch (error) {
      console.error("Error deleting category:", error);
      showToast("Không thể xóa danh mục. Vui lòng thử lại!", "error");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      showToast("Vui lòng nhập tên danh mục!", "warning");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await saveCategory(editCategory?.id ?? null, formData);

      if (!result.ok) {
        const errorData = result.data as { error?: string } | undefined;
        throw new Error(errorData?.error || "Failed to save category");
      }

      showToast(
        editCategory ? "Cập nhật danh mục thành công!" : "Thêm danh mục thành công!",
        "success"
      );
      setIsModalOpen(false);
      setLoading(true);
      fetchCategories();
    } catch (error) {
      console.error("Error saving category:", error);
      const message = error instanceof Error ? error.message : undefined;
      showToast(message || "Không thể lưu danh mục. Vui lòng thử lại!", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCategories = categories.filter(
    (cat) =>
      cat.name.toLowerCase().includes(search.toLowerCase()) ||
      (cat.description && cat.description.toLowerCase().includes(search.toLowerCase())) ||
      cat.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-8 pb-4 border-b-2 border-[#DF9E47]">
        <h2 className="font-serif text-2xl text-[#002B1F] flex items-center gap-2">
          <Tag className="w-6 h-6 text-[#DF9E47]" />
          Quản Lý Danh Mục
        </h2>
        <button
          type="button"
          onClick={handleOpenAddModal}
          className="bg-[#DF9E47] hover:bg-[#c88a3a] text-[#002B1F] font-bold text-sm px-5 py-2.5 rounded-xl transition-colors flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" /> Thêm Danh Mục Mới
        </button>
      </div>

      {/* Search Filter */}
      <div className="mb-6 flex gap-4 max-w-md">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Tìm kiếm danh mục..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-205 border-gray-200 rounded-xl outline-none focus:border-[#DF9E47] text-sm text-slate-800"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <MusicLoading message="Đang tải danh mục..." height="150px" />
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center shadow-sm">
          <Tag className="w-12 h-12 text-slate-300 mx-auto mb-4" strokeWidth={1} />
          <p className="text-slate-500 font-medium">Không tìm thấy danh mục nào phù hợp.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-gray-150">
                  <th className="py-4 px-6 font-serif text-slate-700 font-bold text-sm w-1/4">Tên Danh Mục</th>
                  <th className="py-4 px-6 font-serif text-slate-700 font-bold text-sm w-1/4">Mã định danh (Slug)</th>
                  <th className="py-4 px-6 font-serif text-slate-700 font-bold text-sm w-1/3">Mô tả</th>
                  <th className="py-4 px-6 font-serif text-slate-700 font-bold text-sm text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredCategories.map((category) => (
                  <tr key={category.id} className="border-b border-gray-100 last:border-0 hover:bg-slate-50/30 transition-colors">
                    <td className="py-4 px-6 text-sm font-semibold text-[#002B1F]">{category.name}</td>
                    <td className="py-4 px-6 text-sm text-slate-500 font-mono text-xs">
                      <span className="bg-slate-100 px-2 py-1 rounded-md">{category.id}</span>
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-600 line-clamp-1 max-w-[300px]" title={category.description}>
                      {category.description || <span className="text-slate-400 italic">Chưa có mô tả</span>}
                    </td>
                    <td className="py-4 px-6 text-sm text-right whitespace-nowrap">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(category)}
                          className="p-2 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Sửa danh mục"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(category)}
                          className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Xóa danh mục"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#001A12]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-slate-50/50">
              <h3 className="font-serif text-lg text-[#002B1F] font-bold">
                {editCategory ? "Cập Nhật Danh Mục" : "Thêm Danh Mục Mới"}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="cat-name" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Tên danh mục <span className="text-rose-500">*</span>
                </label>
                <input
                  id="cat-name"
                  type="text"
                  required
                  placeholder="Ví dụ: Kèn Soprano, Phụ Kiện..."
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  disabled={isSubmitting}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#DF9E47] focus:bg-white text-slate-800 text-sm transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="cat-desc" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Mô tả danh mục
                </label>
                <textarea
                  id="cat-desc"
                  rows={4}
                  placeholder="Mô tả ngắn gọn về danh mục..."
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  disabled={isSubmitting}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#DF9E47] focus:bg-white text-slate-800 text-sm transition-all"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-[#002B1F] hover:bg-[#054030] text-white font-bold text-sm uppercase tracking-widest py-3 rounded-xl transition-colors disabled:opacity-60 shadow-sm"
                >
                  {isSubmitting ? "Đang xử lý..." : editCategory ? "Cập Nhật" : "Thêm Mới"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-5 border border-slate-200 text-slate-500 font-bold text-sm uppercase tracking-widest py-3 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-60"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
