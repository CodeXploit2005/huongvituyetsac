"use client";

// Browser autofill extensions inject fdprocessedid before hydration.
// Limit suppression to form controls; keep hydration diagnostics on the surrounding tree.
import React, { useState } from "react";
import { ImageUploader } from "@/components/common/ImageUploader";
import { Plus, Edit2, Trash2, Search, X } from "lucide-react";
import { useData } from "@/context/DataContext";
import { useLanguage } from "@/context/LanguageContext";
import { Banner } from "@/types";

export default function AdminBannersPage() {
  const { banners, addBanner, updateBanner, deleteBanner } = useData();
  const { t, loc } = useLanguage();

  const [pendingBannerId, setPendingBannerId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");
  const handleToggle = async (banner: Banner) => {
    if (pendingBannerId) return;
    setPendingBannerId(banner._id);
    setActionError("");
    try { await updateBanner({ _id: banner._id, isActive: !banner.isActive }); }
    catch (error) { setActionError(error instanceof Error ? error.message : "Không thể đổi trạng thái banner."); }
    finally { setPendingBannerId(null); }
  };
  const [uploadCount, setUploadCount] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const filteredBanners = banners.filter((banner) => [banner.title.vi, banner.title.en].join(" ").toLocaleLowerCase("vi").includes(searchQuery.trim().toLocaleLowerCase("vi")));

  const [formData, setFormData] = useState({
    image: "",
    titleVi: "",
    titleEn: "",
    order: 1,
    isActive: true,
  });

  const handleOpenAdd = () => {
    setFormError("");
    setEditingBanner(null);
    setFormData({
      image: "",
      titleVi: "",
      titleEn: "",
      order: Math.max(0, ...banners.map(banner => banner.order)) + 1,
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (b: Banner) => {
    setFormError("");
    setEditingBanner(b);
    setFormData({
      image: b.image,
      titleVi: b.title.vi,
      titleEn: b.title.en,
      order: b.order,
      isActive: b.isActive,
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploadCount > 0 || isSaving) return;
    setFormError("");
    const payload = {
      image: formData.image,
      title: { vi: formData.titleVi.trim(), en: formData.titleEn.trim() || formData.titleVi.trim() },
      ctaText: editingBanner?.ctaText ?? { vi: "", en: "" },
      ctaLink: editingBanner?.ctaLink ?? "",
      order: Number(formData.order),
      isActive: formData.isActive,
    };

    try {
      setIsSaving(true);
    if (editingBanner) {
      await updateBanner({ ...payload, _id: editingBanner._id });
    } else {
      await addBanner(payload);
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
            {t("admin.banners")}
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Quản lý ảnh banner tự thiết kế trên trang chủ.
          </p>
        </div>

        <button suppressHydrationWarning
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-red-700 hover:bg-red-800 text-white text-xs font-bold transition-all shadow-md"
        >
          <Plus size={15} />
          <span>{t("admin.addBanner")}</span>
        </button>
      </div>

      <label className="relative block max-w-xl"><Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"/><input suppressHydrationWarning value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Tìm tên banner..." className="w-full rounded-2xl border border-stone-200 bg-white py-3 pl-10 pr-4 text-xs outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/15 dark:border-stone-800 dark:bg-stone-900"/></label>

      {actionError && <p role="alert" className="text-sm text-red-500">{actionError}</p>}
      {/* Banners Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBanners.map((b) => (
          <div
            key={b._id}
            className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-sm flex flex-col justify-between"
          >
            <div className="relative h-44 w-full bg-stone-950">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={b.image}
                alt={loc(b.title)}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 left-3 flex gap-2">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    b.isActive
                      ? "bg-emerald-500 text-stone-950"
                      : "bg-stone-700 text-white"
                  }`}
                >
                  {b.isActive ? "Đang chạy" : "Tạm dừng"}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-black/60 text-white">
                  Thứ tự: #{b.order}
                </span>
              </div>
            </div>

            <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
              <div className="space-y-1.5">
                <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100 line-clamp-2">
                  {loc(b.title)}
                </h3>
              </div>

              <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
                <button suppressHydrationWarning
                  onClick={() => void handleToggle(b)}
                  disabled={pendingBannerId !== null}
                  className="rounded-lg px-3 py-2 text-xs font-semibold text-stone-600 transition-colors hover:bg-stone-100 hover:text-stone-900 dark:text-stone-300 dark:hover:bg-stone-800 dark:hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500 cursor-pointer disabled:cursor-wait disabled:opacity-60"
                >
                  {pendingBannerId === b._id ? "Đang lưu..." : b.isActive ? "Tạm dừng" : "Kích hoạt"}
                </button>

                <div className="flex gap-2">
                  <button suppressHydrationWarning
                    onClick={() => handleOpenEdit(b)}
                    className="p-1.5 rounded-lg bg-stone-100 text-stone-700 transition-colors hover:bg-[#44403c] hover:text-white dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700 dark:hover:text-white cursor-pointer"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button suppressHydrationWarning
                    onClick={() => {
                      if (confirm("Xóa banner này?")) void deleteBanner(b._id).catch((error: unknown) => alert(error instanceof Error ? error.message : "Không thể xóa banner."));
                    }}
                    className="p-1.5 rounded-lg bg-red-50 text-red-700 transition-colors hover:bg-red-100 dark:bg-red-950/50 dark:text-red-400 dark:hover:bg-red-900/60 dark:hover:text-red-200"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Add / Edit Banner */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
              <h2 className="text-lg font-black text-stone-900 dark:text-white">
                {editingBanner ? "Chỉnh sửa Banner" : "Thêm Banner mới"}
              </h2>
              <button suppressHydrationWarning
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-full text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              {formError && <p role="alert" className="text-red-500">{formError}</p>}
              <div>
                <label className="font-bold block mb-1">Ảnh banner tự thiết kế *</label>
                <ImageUploader target="banners" value={formData.image ? [formData.image] : []} onChange={urls => setFormData(current => ({ ...current, image: urls[0] || "" }))} setUploadCount={setUploadCount} disabled={isSaving || uploadCount > 0} />
                <input suppressHydrationWarning
                  aria-label="Đường dẫn ảnh banner"
                  placeholder="Hoặc dán đường dẫn ảnh (https://...)"
                  type="url"
                  required
                  disabled={isSaving || uploadCount > 0}
                  value={formData.image}
                  onChange={(e) =>
                    setFormData({ ...formData, image: e.target.value })
                  }
                  className="w-full p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">Tên banner *</label>
                  <input suppressHydrationWarning
                    type="text"
                    required
                    value={formData.titleVi}
                    onChange={(e) =>
                      setFormData({ ...formData, titleVi: e.target.value })
                    }
                    className="w-full p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">Tên tiếng Anh (không bắt buộc)</label>
                  <input suppressHydrationWarning
                    type="text"
                    value={formData.titleEn}
                    onChange={(e) =>
                      setFormData({ ...formData, titleEn: e.target.value })
                    }
                    className="w-full p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                  />
                </div>
              </div>

              <p className="text-stone-500">Trang chủ chỉ hiển thị ảnh bạn tải lên, không chèn thêm chữ hay nút. Tên banner dùng để quản lý và mô tả ảnh; nếu bỏ trống tên tiếng Anh sẽ dùng tên tiếng Việt.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">Thứ tự hiển thị</label>
                  <input suppressHydrationWarning
                    type="number"
                    value={formData.order}
                    onChange={(e) =>
                      setFormData({ ...formData, order: Number(e.target.value) })
                    }
                    className="w-full p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input suppressHydrationWarning
                  type="checkbox"
                  id="activeBanner"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                  className="rounded text-red-700"
                />
                <label htmlFor="activeBanner" className="font-bold">
                  Kích hoạt banner hiển thị ra trang chủ ngay
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-stone-200 dark:border-stone-800">
                <button suppressHydrationWarning
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-stone-300 dark:border-stone-700 font-bold"
                >
                  {t("admin.cancel")}
                </button>
                <button suppressHydrationWarning
                  type="submit"
                  disabled={isSaving || uploadCount > 0}
                  className="px-6 py-2 rounded-xl bg-red-700 text-white font-bold hover:bg-red-800"
                >
                  {t("admin.save")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
