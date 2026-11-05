"use client";

import React, { useState } from "react";
import { ImageUploader } from "@/components/common/ImageUploader";
import { Plus, Edit2, Trash2, Grid, Search, X } from "lucide-react";
import { useData } from "@/context/DataContext";
import { useLanguage } from "@/context/LanguageContext";
import { Category } from "@/types";

export default function AdminCategoriesPage() {
  const { categories, products, addCategory, updateCategory, deleteCategory } =
    useData();
  const { t, loc } = useLanguage();

  const [uploadCount, setUploadCount] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const filteredCategories = categories.filter((category) => [category.name.vi, category.name.en, category.slug, category.description?.vi, category.description?.en].join(" ").toLocaleLowerCase("vi").includes(searchQuery.trim().toLocaleLowerCase("vi")));

  const [formData, setFormData] = useState({
    nameVi: "",
    nameEn: "",
    slug: "",
    order: 1,
    image: "",
    descriptionVi: "",
    descriptionEn: "",
  });

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setFormData({
      nameVi: "",
      nameEn: "",
      slug: "",
      order: categories.length + 1,
      image: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=600&q=80",
      descriptionVi: "",
      descriptionEn: "",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: Category) => {
    setEditingCategory(c);
    setFormData({
      nameVi: c.name.vi,
      nameEn: c.name.en,
      slug: c.slug,
      order: c.order,
      image: c.image || "",
      descriptionVi: c.description?.vi || "",
      descriptionEn: c.description?.en || "",
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploadCount > 0 || isSaving) return;
    setFormError("");
    const payload = {
      name: { vi: formData.nameVi, en: formData.nameEn },
      slug:
        formData.slug ||
        formData.nameVi
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "-")
          .replace(/-+/g, "-"),
      order: Number(formData.order),
      image: formData.image,
      description: { vi: formData.descriptionVi, en: formData.descriptionEn },
    };

    try {
      setIsSaving(true);
    if (editingCategory) {
      await updateCategory({ ...payload, _id: editingCategory._id });
    } else {
      await addCategory(payload);
    }
      setIsModalOpen(false);
    } catch (error) { setFormError(error instanceof Error ? error.message : "Không thể lưu dữ liệu."); }
    finally { setIsSaving(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-white">
            {t("admin.categories")}
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Quản lý 4 nhóm danh mục chính và bổ sung ngành hàng gia vị
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-red-700 hover:bg-red-800 text-white text-xs font-bold transition-all shadow-md"
        >
          <Plus size={15} />
          <span>Thêm danh mục mới</span>
        </button>
      </div>

      <label className="relative block max-w-xl"><Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"/><input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Tìm tên hoặc đường dẫn danh mục..." className="w-full rounded-2xl border border-stone-200 bg-white py-3 pl-10 pr-4 text-xs outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/15 dark:border-stone-800 dark:bg-stone-900"/></label>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredCategories.map((cat) => {
          const prodsCount = products.filter(
            (p) => p.categoryId === cat._id && !p.isVariant
          ).length;

          return (
            <div
              key={cat._id}
              className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-sm flex flex-col justify-between"
            >
              <div className="relative h-36 w-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={cat.image}
                  alt={loc(cat.name)}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2.5 right-2.5 bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  #{cat.order}
                </div>
              </div>

              <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-extrabold text-base text-stone-900 dark:text-stone-100">
                    {loc(cat.name)}
                  </h3>
                  <div className="text-xs text-amber-700 dark:text-amber-400 font-semibold mt-0.5">
                    {prodsCount} sản phẩm
                  </div>
                  <p className="text-xs text-stone-500 line-clamp-2 mt-1.5">
                    {loc(cat.description)}
                  </p>
                </div>

                <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex justify-end gap-2">
                  <button
                    onClick={() => handleOpenEdit(cat)}
                    className="p-1.5 rounded-lg bg-stone-100 text-stone-700 transition-colors hover:bg-[#44403c] hover:text-white dark:bg-stone-800 dark:text-stone-300"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Xóa danh mục "${loc(cat.name)}"?`))
                        void deleteCategory(cat._id).catch((error: unknown) => alert(error instanceof Error ? error.message : "Không thể xóa danh mục."));
                    }}
                    className="p-1.5 rounded-lg bg-red-50 text-red-700 transition-colors hover:bg-red-100 dark:bg-red-950/50 dark:text-red-400 dark:hover:bg-red-900/60 dark:hover:text-red-200"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
              <h2 className="text-lg font-black text-stone-900 dark:text-white">
                {editingCategory ? "Chỉnh sửa Danh Mục" : "Thêm Danh Mục mới"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-full text-stone-400"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              {formError && <p role="alert" className="text-red-500">{formError}</p>}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">Tên Tiếng Việt *</label>
                  <input
                    type="text"
                    required
                    value={formData.nameVi}
                    onChange={(e) =>
                      setFormData({ ...formData, nameVi: e.target.value })
                    }
                    className="w-full p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">Tên English *</label>
                  <input
                    type="text"
                    required
                    value={formData.nameEn}
                    onChange={(e) =>
                      setFormData({ ...formData, nameEn: e.target.value })
                    }
                    className="w-full p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold block mb-1">Link Ảnh Đại Diện (URL)</label>
                <ImageUploader target="categories" value={formData.image ? [formData.image] : []} onChange={urls => setFormData(current => ({ ...current, image: urls[0] || "" }))} setUploadCount={setUploadCount} disabled={isSaving || uploadCount > 0} />
                <input
                  type="url"
                  disabled={isSaving || uploadCount > 0}
                  value={formData.image}
                  onChange={(e) =>
                    setFormData({ ...formData, image: e.target.value })
                  }
                  className="w-full p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Mô tả ngắn</label>
                <textarea
                  rows={2}
                  value={formData.descriptionVi}
                  onChange={(e) =>
                    setFormData({ ...formData, descriptionVi: e.target.value })
                  }
                  className="w-full p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-stone-200 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-stone-300 dark:border-stone-700 font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSaving || uploadCount > 0}
                  className="px-6 py-2 rounded-xl bg-red-700 text-white font-bold hover:bg-red-800"
                >
                  Lưu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
