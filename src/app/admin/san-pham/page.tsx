"use client";

import React, { useState } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Package,
  Layers,
  Sparkles,
  Search,
  Filter,
  X,
  Check,
  Film,
  Tag,
  Flame,
  Gift,
  Star,
  Crown,
  Truck,
  Heart,
  Shapes,
  Ban,
} from "lucide-react";
import { useData } from "@/context/DataContext";
import { useLanguage } from "@/context/LanguageContext";
import { formatCurrency } from "@/utils/formatters";
import { Product, ProductBadge } from "@/types";
import { calculateDiscountPercent, validateProductPricing } from "@/lib/productData";
import { SortDropdown } from "@/components/common/SortDropdown";
import { ImageUploader } from "@/components/common/ImageUploader";

const formatVndInput = (value: number) =>
  value > 0 ? new Intl.NumberFormat("vi-VN").format(value) : "";

const parseVndInput = (value: string) => {
  const digits = value.replace(/\D/g, "");
  return digits ? Number(digits) : 0;
};

export default function AdminProductsPage() {
  const {
    products,
    categories,
    addProduct,
    updateProduct,
    deleteProduct,
    bulkAddSeedProducts,
  } = useData();
  const { language, t, loc } = useLanguage();

  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadCount, setUploadCount] = useState(0);
  const [formError, setFormError] = useState("");
  const [badgeDraft, setBadgeDraft] = useState({ text: "", icon: "", color: "#b91c1c" });
  const [editingBadgeId, setEditingBadgeId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    nameVi: "",
    nameEn: "",
    slug: "",
    categoryId: "cat-1",
    parentProductId: "" as string,
    descriptionVi: "",
    descriptionEn: "",
    ingredientsVi: "",
    ingredientsEn: "",
    nutritionVi: "",
    nutritionEn: "",
    usageInstructionsVi: "",
    usageInstructionsEn: "",
    storageInstructionsVi: "",
    storageInstructionsEn: "",
    price: 50000,
    originalPrice: 60000,
    shippingFee: 0,
    image1: "",
    image2: "",
    videoUrl: "",
    videoPoster: "",
    stock: 100,
    tags: "gia vi, dac san",
    isVariant: false,
    variantLabelVi: "",
    variantLabelEn: "",
    weight: "250g",
    originVi: "Việt Nam",
    originEn: "Vietnam",
    badges: [] as ProductBadge[],
    isFeatured: false,
    isBestSeller: false,
  });

  const parentProducts = products.filter((p) => !p.isVariant);

  const filteredProducts = products.filter((p) => {
    if (selectedCategory !== "all" && p.categoryId !== selectedCategory)
      return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        p.name.vi.toLowerCase().includes(q) ||
        p.name.en.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleOpenAdd = (parentProd?: Product) => {
    setFormError("");
    setEditingProduct(null);
    setFormData({
      nameVi: parentProd ? `${parentProd.name.vi} - Biến thể mới` : "",
      nameEn: parentProd ? `${parentProd.name.en} - New Variant` : "",
      slug: parentProd ? `${parentProd.slug}-variant-${Date.now()}` : "",
      categoryId: parentProd ? parentProd.categoryId : categories[0]?._id || "cat-1",
      parentProductId: parentProd ? parentProd._id : "",
      descriptionVi: parentProd ? parentProd.description.vi : "",
      descriptionEn: parentProd ? parentProd.description.en : "",
      ingredientsVi: parentProd?.ingredients?.vi || "",
      ingredientsEn: parentProd?.ingredients?.en || "",
      nutritionVi: parentProd?.nutrition?.vi || "",
      nutritionEn: parentProd?.nutrition?.en || "",
      usageInstructionsVi: parentProd?.usageInstructions?.vi || "",
      usageInstructionsEn: parentProd?.usageInstructions?.en || "",
      storageInstructionsVi: parentProd?.storageInstructions?.vi || "",
      storageInstructionsEn: parentProd?.storageInstructions?.en || "",
      price: parentProd ? parentProd.price : 50000,
      originalPrice: parentProd ? parentProd.originalPrice || 0 : 0,
      shippingFee: parentProd?.shippingFee || 0,
      image1: parentProd?.images[0] || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=85",
      image2: parentProd?.images[1] || "",
      videoUrl: parentProd?.videos?.[0] || "",
      videoPoster: parentProd?.videoPoster || "",
      stock: 100,
      tags: parentProd?.tags.join(", ") || "gia vi, dac san",
      isVariant: !!parentProd,
      variantLabelVi: parentProd ? "Combo mới" : "Gói lẻ",
      variantLabelEn: parentProd ? "New Combo" : "Single Pack",
      weight: parentProd?.weight || "250g",
      originVi: parentProd?.origin?.vi || "Việt Nam",
      originEn: parentProd?.origin?.en || "Vietnam",
      badges: parentProd?.badges || [],
      isFeatured: false,
      isBestSeller: false,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setFormError("");
    setEditingProduct(p);
    setFormData({
      nameVi: p.name.vi,
      nameEn: p.name.en,
      slug: p.slug,
      categoryId: p.categoryId,
      parentProductId: p.parentProductId || "",
      descriptionVi: p.description.vi,
      descriptionEn: p.description.en,
      ingredientsVi: p?.ingredients?.vi || "",
      ingredientsEn: p?.ingredients?.en || "",
      nutritionVi: p?.nutrition?.vi || "",
      nutritionEn: p?.nutrition?.en || "",
      usageInstructionsVi: p?.usageInstructions?.vi || "",
      usageInstructionsEn: p?.usageInstructions?.en || "",
      storageInstructionsVi: p?.storageInstructions?.vi || "",
      storageInstructionsEn: p?.storageInstructions?.en || "",
      price: p.price,
      originalPrice: p.originalPrice || 0,
      shippingFee: p.shippingFee || 0,
      image1: p.images[0] || "",
      image2: p.images[1] || "",
      videoUrl: p.videos?.[0] || "",
      videoPoster: p.videoPoster || "",
      stock: p.stock,
      tags: p.tags.join(", "),
      isVariant: p.isVariant,
      variantLabelVi: p.variantLabel?.vi || "",
      variantLabelEn: p.variantLabel?.en || "",
      weight: p.weight || "",
      originVi: p.origin?.vi || "",
      originEn: p.origin?.en || "",
      badges: p.badges || [],
      isFeatured: Boolean(p.isFeatured),
      isBestSeller: Boolean(p.isBestSeller),
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploadCount > 0 || isSaving) return;
    setFormError("");

    const originalPrice = formData.originalPrice > 0 ? Number(formData.originalPrice) : null;
    const pricingError = validateProductPricing(Number(formData.price), originalPrice);
    if (pricingError) {
      setFormError(pricingError);
      return;
    }

    const images = [formData.image1, formData.image2, ...(editingProduct?.images.slice(2) || [])].filter(Boolean);
    if (images.length === 0) {
      images.push(
        "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=85"
      );
    }

    const payload = {
      name: { vi: formData.nameVi, en: formData.nameEn },
      slug:
        formData.slug ||
        formData.nameVi
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "-")
          .replace(/-+/g, "-"),
      categoryId: formData.categoryId,
      parentProductId: formData.parentProductId || null,
      description: { vi: formData.descriptionVi, en: formData.descriptionEn },
      ingredients: { vi: formData.ingredientsVi.trim(), en: formData.ingredientsEn.trim() },
      nutrition: { vi: formData.nutritionVi.trim(), en: formData.nutritionEn.trim() },
      usageInstructions: { vi: formData.usageInstructionsVi.trim(), en: formData.usageInstructionsEn.trim() },
      storageInstructions: { vi: formData.storageInstructionsVi.trim(), en: formData.storageInstructionsEn.trim() },
      price: Number(formData.price),
      originalPrice,
      shippingFee: Number(formData.shippingFee),
      badges: formData.badges,
      isFeatured: !formData.isVariant && !formData.parentProductId && formData.isFeatured,
      isBestSeller: !formData.isVariant && !formData.parentProductId && formData.isBestSeller,
      images,
      videos: formData.videoUrl ? [formData.videoUrl] : [],
      videoPoster: formData.videoPoster || undefined,
      stock: Number(formData.stock),
      tags: formData.tags.split(",").map((s) => s.trim()).filter(Boolean),
      isVariant: Boolean(formData.parentProductId) || formData.isVariant,
      variantLabel: formData.variantLabelVi
        ? { vi: formData.variantLabelVi, en: formData.variantLabelEn }
        : undefined,
      weight: formData.weight,
      origin: { vi: formData.originVi, en: formData.originEn },
      rating: editingProduct?.rating || 5.0,
      reviewsCount: editingProduct?.reviewsCount || 1,
      isPlaceholder: false,
    };

    try {
      setIsSaving(true);
      if (editingProduct) {
        await updateProduct({ ...payload, _id: editingProduct._id, createdAt: editingProduct.createdAt, updatedAt: new Date().toISOString() });
      } else {
        await addProduct(payload);
      }
      setIsModalOpen(false);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Không thể lưu sản phẩm.");
    } finally {
      setIsSaving(false);
    }
  };

  const discountPercent = calculateDiscountPercent(
    Number(formData.price),
    formData.originalPrice > 0 ? Number(formData.originalPrice) : null
  );

  const saveBadgeDraft = () => {
    const text = badgeDraft.text.trim();
    if (!text) return setFormError("Nội dung badge không được để trống.");
    if (text.length > 50) return setFormError("Badge không được vượt quá 50 ký tự.");
    const badge: ProductBadge = {
      id: editingBadgeId || `badge-${Date.now()}`,
      type: "text",
      text,
      icon: badgeDraft.icon || null,
      color: badgeDraft.color || null,
    };
    setFormData((current) => ({
      ...current,
      badges: editingBadgeId
        ? current.badges.map((item) => (item.id === editingBadgeId ? badge : item))
        : [...current.badges, badge],
    }));
    setBadgeDraft({ text: "", icon: "", color: "#b91c1c" });
    setEditingBadgeId(null);
    setFormError("");
  };

  const badgeIcons = { flame: Flame, gift: Gift, star: Star, crown: Crown, truck: Truck, heart: Heart };
  const badgeIconLabels: Record<keyof typeof badgeIcons, string> = {
    flame: "Nổi bật",
    gift: "Quà tặng",
    star: "Yêu thích",
    crown: "Cao cấp",
    truck: "Giao nhanh",
    heart: "Được yêu thích",
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-white">
            {t("admin.products")}
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Quản lý sản phẩm gốc, phân loại biến thể đóng gói (combo/hộp) và kho hàng
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            suppressHydrationWarning
            onClick={() => handleOpenAdd()}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-red-700 hover:bg-red-800 text-white text-xs font-bold transition-all shadow-md"
          >
            <Plus size={15} />
            <span>{t("admin.addProduct")}</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200 dark:border-stone-800">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter size={15} className="text-stone-400" />
          <SortDropdown
            value={selectedCategory}
            onChange={setSelectedCategory}
            options={[
              { value: "all", label: "Tất cả danh mục" },
              ...categories.map((c) => ({ value: c._id, label: loc(c.name) })),
            ]}
            className="min-w-[190px] [&>button]:w-full [&>button]:bg-stone-100 dark:[&>button]:bg-[#292524] [&>button]:border-stone-200 dark:[&>button]:border-[#57534e] [&>button]:text-stone-700 dark:[&>button]:text-stone-200 [&>button_svg]:text-stone-400 [&>button]:shadow-sm dark:[&>button]:shadow-lg [&>button:hover]:border-amber-500/80 [&_[role=listbox]]:left-0 [&_[role=listbox]]:right-auto [&_[role=listbox]]:min-w-[260px] [&_[role=listbox]]:bg-white dark:[&_[role=listbox]]:bg-[#1c1917] [&_[role=listbox]]:border-stone-200 dark:[&_[role=listbox]]:border-[#44403c] [&_[role=option]]:text-stone-700 dark:[&_[role=option]]:text-stone-200 [&_[role=option]:hover]:bg-amber-50 dark:[&_[role=option]:hover]:bg-[#292524] [&_[role=option]:hover]:text-amber-800 dark:[&_[role=option]:hover]:text-amber-100 [&_[aria-selected=true]]:bg-amber-50 dark:[&_[aria-selected=true]]:bg-[#3b3029] [&_[aria-selected=true]]:text-amber-800 dark:[&_[aria-selected=true]]:text-amber-300"
          />
        </div>

        <div className="relative w-full sm:w-64">
          <input
            suppressHydrationWarning
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên/slug..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-100 placeholder:text-stone-500 dark:placeholder:text-stone-400 focus:outline-none focus:border-amber-500/80 focus:ring-2 focus:ring-amber-500/15"
          />
          <Search size={14} className="absolute left-2.5 top-2 text-stone-400" />
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="select-none bg-stone-50 dark:bg-stone-800/60 border-b border-stone-200 dark:border-stone-800 text-stone-400 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Ảnh & Tên sản phẩm</th>
                <th className="py-3.5 px-4">Danh mục</th>
                <th className="py-3.5 px-4">Phân loại / Biến thể</th>
                <th className="py-3.5 px-4">Giá bán</th>
                <th className="py-3.5 px-4">Kho</th>
                <th className="py-3.5 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800 font-medium">
              {filteredProducts.map((p) => {
                const cat = categories.find((c) => c._id === p.categoryId);
                const parent = products.find((pr) => pr._id === p.parentProductId);

                return (
                  <tr
                    key={p._id}
                    className={`hover:bg-stone-50 dark:hover:bg-stone-800/40 ${
                      p.isVariant ? "bg-stone-50/50 dark:bg-stone-900/40" : ""
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={p.images[0]}
                          alt={loc(p.name)}
                          className="w-11 h-11 object-cover rounded-xl border border-stone-200 dark:border-stone-700 shrink-0"
                        />
                        <div className="min-w-0 max-w-xs sm:max-w-md">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-stone-900 dark:text-stone-100 truncate">
                              {loc(p.name)}
                            </span>
                            {p.videos && p.videos.length > 0 && (
                              <Film size={13} className="text-amber-500 shrink-0" />
                            )}
                          </div>
                          <div className="text-[11px] text-stone-400 truncate">
                            Slug: {p.slug}
                          </div>
                          {p.badges && p.badges.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {p.badges.slice(0, 3).map((badge) => (
                                <span
                                  key={badge.id}
                                  className="px-1.5 py-0.5 rounded-full text-[9px] font-bold text-white"
                                  style={{ backgroundColor: badge.color || "#b91c1c" }}
                                >
                                  {badge.text}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="px-2.5 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-[11px] font-semibold text-stone-700 dark:text-stone-300">
                        {cat ? loc(cat.name) : "—"}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      {p.isVariant ? (
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(p)}
                          title="Mở chỉnh sửa biến thể"
                          className="group/variant inline-flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[11px] font-bold text-amber-800 transition-all hover:border-amber-400 hover:bg-amber-100 hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40 dark:border-amber-800/50 dark:bg-amber-950/40 dark:text-amber-300 dark:hover:border-amber-600 dark:hover:bg-amber-900/50"
                        >
                          <Layers size={13} />
                          <span>
                            Biến thể ({loc(p.variantLabel) || "Combo"})
                          </span>
                          <Edit2 size={11} className="opacity-50 transition-opacity group-hover/variant:opacity-100" />
                        </button>
                      ) : (
                        <span className="text-stone-500 font-semibold">
                          Sản phẩm gốc
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 font-bold text-red-700 dark:text-amber-400">
                      {formatCurrency(p.price, language)}
                    </td>

                    <td className="py-3 px-4 font-semibold">{p.stock}</td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {!p.isVariant && (
                          <button
                            type="button"
                            suppressHydrationWarning
                            onClick={() => handleOpenAdd(p)}
                            title="Thêm biến thể đóng gói cho sản phẩm này"
                            aria-label="Thêm biến thể đóng gói"
                            className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 hover:bg-amber-200 hover:text-amber-950 dark:hover:bg-amber-900/80 dark:hover:text-amber-100"
                          >
                            <Layers size={14} className="pointer-events-none stroke-current" />
                          </button>
                        )}
                        <button
                          type="button"
                          suppressHydrationWarning
                          onClick={() => handleOpenEdit(p)}
                          title={p.isVariant ? "Chỉnh sửa biến thể" : "Chỉnh sửa sản phẩm"}
                          aria-label={p.isVariant ? "Chỉnh sửa biến thể" : "Chỉnh sửa sản phẩm"}
                          className="p-1.5 rounded-lg border border-stone-200 bg-stone-100 text-stone-700 transition-colors hover:border-stone-400 hover:bg-stone-200 hover:text-stone-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-400/50 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300 dark:hover:border-stone-500 dark:hover:bg-stone-700 dark:hover:text-white"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          type="button"
                          suppressHydrationWarning
                          onClick={() => {
                            if (confirm(`Xóa sản phẩm "${loc(p.name)}"?`)) {
                              deleteProduct(p._id);
                            }
                          }}
                          className="p-1.5 rounded-lg bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-400 hover:bg-red-100"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add / Edit Product */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-4">
              <h2 className="text-lg font-black text-stone-900 dark:text-white">
                {editingProduct
                  ? editingProduct.isVariant
                    ? "Chỉnh sửa biến thể"
                    : "Chỉnh sửa sản phẩm"
                  : formData.parentProductId
                    ? "Thêm biến thể mới"
                    : "Thêm sản phẩm mới"}
              </h2>
              <button
                suppressHydrationWarning
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleSave}
              className="space-y-4 text-xs text-stone-800 dark:text-stone-200 [&_input]:text-stone-900 dark:[&_input]:text-stone-100 [&_select]:text-stone-900 dark:[&_select]:text-stone-100 [&_textarea]:text-stone-900 dark:[&_textarea]:text-stone-100 [&_input]:placeholder:text-stone-400 dark:[&_input]:placeholder:text-stone-500"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold block mb-1">Tên Tiếng Việt *</label>
                  <input
                    suppressHydrationWarning
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
                    suppressHydrationWarning
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

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="font-bold block mb-1">Danh Mục</label>
                  <SortDropdown
                    value={formData.categoryId}
                    onChange={(categoryId) =>
                      setFormData({ ...formData, categoryId })
                    }
                    options={categories.map((category) => ({
                      value: category._id,
                      label: loc(category.name),
                      icon: <Shapes size={14} aria-hidden="true" />,
                    }))}
                    className="w-full [&>button]:w-full [&>button]:min-h-10 [&>button]:rounded-xl [&>button]:bg-stone-50 dark:[&>button]:bg-stone-800 [&>button]:border-stone-200 dark:[&>button]:border-stone-700 [&_[role=listbox]]:left-0 [&_[role=listbox]]:right-auto [&_[role=listbox]]:min-w-[260px] [&_[role=listbox]]:max-w-[min(320px,calc(100vw-3rem))] [&_[role=listbox]]:bg-white dark:[&_[role=listbox]]:bg-stone-900"
                  />
                </div>

                {!formData.isVariant && !formData.parentProductId && (
                  <fieldset className="sm:col-span-2 rounded-xl border border-stone-200 dark:border-stone-700 p-4 space-y-3">
                    <legend className="font-bold px-1">Hiển thị trên trang chủ</legend>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={formData.isFeatured} onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })} />
                      Sản phẩm nổi bật
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={formData.isBestSeller} onChange={(e) => setFormData({ ...formData, isBestSeller: e.target.checked })} />
                      Sản phẩm bán chạy
                    </label>
                    <p className="text-xs text-stone-500">Chọn để đưa vào mục “Được Yêu Thích Nhất”. Bỏ cả hai để gỡ khỏi mục tuyển chọn. Các tab danh mục vẫn hiển thị theo danh mục sản phẩm.</p>
                  </fieldset>
                )}
                <div>
                  <label className="font-bold block mb-1">Giá gốc (VND)</label>
                  <input
                    suppressHydrationWarning
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    value={formatVndInput(formData.originalPrice)}
                    onChange={(e) =>
                      setFormData({ ...formData, originalPrice: parseVndInput(e.target.value) })
                    }
                    placeholder="VD: 200.000"
                    aria-label="Giá gốc bằng Việt Nam đồng"
                    className="w-full p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 tabular-nums focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>

                <div>
                  <label className="font-bold block mb-1">Giá bán (VND) *</label>
                  <input
                    suppressHydrationWarning
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    required
                    value={formatVndInput(formData.price)}
                    onChange={(e) =>
                      setFormData({ ...formData, price: parseVndInput(e.target.value) })
                    }
                    placeholder="VD: 150.000"
                    aria-label="Giá bán bằng Việt Nam đồng"
                    className="w-full p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 tabular-nums focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>

                <div>
                  <label className="font-bold block mb-1">Số lượng tồn kho</label>
                  <input
                    suppressHydrationWarning
                    type="number"
                    value={formData.stock}
                    onChange={(e) =>
                      setFormData({ ...formData, stock: Number(e.target.value) })
                    }
                    className="w-full p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                  />
                </div>

                <div className="sm:col-span-2 lg:col-span-2">
                  <label className="font-bold block mb-1">Phí giao hàng (VND)</label>
                  <input
                    suppressHydrationWarning
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    value={formData.shippingFee === 0 ? "0" : formatVndInput(formData.shippingFee)}
                    onChange={(e) => setFormData({ ...formData, shippingFee: parseVndInput(e.target.value) })}
                    placeholder="0 = Miễn phí"
                    aria-label="Phí giao hàng bằng Việt Nam đồng"
                    className="w-full p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 tabular-nums focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                  />
                  <p className="mt-1 text-[10px] text-stone-500">Nhập 0 để hiển thị Miễn phí.</p>
                </div>
              </div>

              <div className={`rounded-2xl border px-4 py-3 ${
                discountPercent
                  ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/60"
                  : "bg-stone-50 dark:bg-stone-800/60 border-stone-200 dark:border-stone-700"
              }`}>
                <div className="font-black text-sm text-stone-900 dark:text-white">
                  Giảm giá: {discountPercent ? `-${discountPercent}%` : "Không áp dụng"}
                </div>
                <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                  ⓘ Phần trăm giảm giá được tự động tính từ giá gốc và giá bán.
                </p>
              </div>

              <div className="p-4 rounded-2xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/50 space-y-3">
                <div className="flex items-center gap-2 font-bold text-stone-900 dark:text-white">
                  <Tag size={16} className="text-amber-500" />
                  <span>Badge sản phẩm</span>
                </div>

                {formData.badges.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.badges.map((badge) => {
                      const Icon = badge.icon ? badgeIcons[badge.icon as keyof typeof badgeIcons] : null;
                      return (
                        <button
                          key={badge.id}
                          type="button"
                          onClick={() => {
                            setEditingBadgeId(badge.id);
                            setBadgeDraft({ text: badge.text, icon: badge.icon || "", color: badge.color || "#b91c1c" });
                          }}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-white text-[11px] font-bold shadow-sm"
                          style={{ backgroundColor: badge.color || "#b91c1c" }}
                          title="Bấm để chỉnh sửa"
                        >
                          {Icon && <Icon size={12} />}
                          <span>{badge.text}</span>
                          <X
                            size={12}
                            onClick={(event) => {
                              event.stopPropagation();
                              setFormData((current) => ({ ...current, badges: current.badges.filter((item) => item.id !== badge.id) }));
                            }}
                          />
                        </button>
                      );
                    })}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-[1fr_140px_70px_auto] gap-2 items-end">
                  <div>
                    <label className="font-semibold block mb-1">Nội dung</label>
                    <input
                      type="text"
                      maxLength={50}
                      value={badgeDraft.text}
                      onChange={(e) => setBadgeDraft({ ...badgeDraft, text: e.target.value })}
                      placeholder="VD: HỘP QUÀ VIP"
                      className="w-full p-2.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700"
                    />
                  </div>
                  <div>
                    <label className="font-semibold block mb-1">Icon</label>
                    <SortDropdown
                      value={badgeDraft.icon}
                      onChange={(icon) => setBadgeDraft({ ...badgeDraft, icon })}
                      options={[
                        { value: "", label: "Không icon", icon: <Ban size={14} aria-hidden="true" /> },
                        ...Object.entries(badgeIcons).map(([icon, Icon]) => ({
                          value: icon,
                          label: badgeIconLabels[icon as keyof typeof badgeIcons],
                          icon: <Icon size={14} aria-hidden="true" />,
                        })),
                      ]}
                      className="w-full [&>button]:w-full [&>button]:min-h-10 [&>button]:rounded-xl [&>button]:bg-white dark:[&>button]:bg-stone-900 [&>button]:border-stone-200 dark:[&>button]:border-stone-700 [&_[role=listbox]]:left-0 [&_[role=listbox]]:right-auto [&_[role=listbox]]:w-full [&_[role=listbox]]:min-w-[190px] [&_[role=listbox]]:max-w-none [&_[role=listbox]]:bg-white dark:[&_[role=listbox]]:bg-stone-900"
                    />
                  </div>
                  <div>
                    <label className="font-semibold block mb-1">Màu</label>
                    <input
                      type="color"
                      value={badgeDraft.color}
                      onChange={(e) => setBadgeDraft({ ...badgeDraft, color: e.target.value })}
                      className="w-full h-10 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 p-1"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={saveBadgeDraft}
                    className="h-10 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold whitespace-nowrap"
                  >
                    {editingBadgeId ? "Cập nhật" : "+ Thêm"}
                  </button>
                </div>

                {badgeDraft.text.trim() && (
                  <div className="flex items-center gap-2 text-[11px] text-stone-500 dark:text-stone-400">
                    <span>Preview:</span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-white font-bold" style={{ backgroundColor: badgeDraft.color }}>
                      {(() => { const Icon = badgeDraft.icon ? badgeIcons[badgeDraft.icon as keyof typeof badgeIcons] : null; return Icon ? <Icon size={12} /> : null; })()}
                      {badgeDraft.text.trim()}
                    </span>
                  </div>
                )}
              </div>

              {/* Variant settings */}
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 space-y-3">
                <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-200">
                  <Layers size={16} />
                  <span>Cài đặt Biến thể & Nhóm đóng gói (Combo/Hộp quà)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block mb-1 font-semibold">
                      Sản phẩm Gốc (parentProductId)
                    </label>
                  <select
                    suppressHydrationWarning
                    value={formData.parentProductId}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        parentProductId: e.target.value,
                        isVariant: !!e.target.value,
                      })
                    }
                    className="w-full p-2 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                  >
                    <option value="">Không có (Đây là sản phẩm gốc)</option>
                    {parentProducts.map((parentProduct) => (
                      <option key={parentProduct._id} value={parentProduct._id}>
                        {loc(parentProduct.name)}
                      </option>
                    ))}
                  </select>
                  </div>

                  <div>
                    <label className="block mb-1 font-semibold">
                      Tên biến thể (vd: Combo 3 gói, Hộp 5 tặng 1)
                    </label>
                    <input
                      suppressHydrationWarning
                      type="text"
                      value={formData.variantLabelVi}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          variantLabelVi: e.target.value,
                        })
                      }
                      placeholder="Combo 3 gói"
                      className="w-full p-2 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                    />
                  </div>
                </div>
              </div>

              {/* Media links */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold block mb-1">Ảnh chính sản phẩm</label>
                  <ImageUploader target="products" label="Chọn ảnh chính" value={formData.image1 ? [formData.image1] : []} onChange={urls => setFormData(current => ({ ...current, image1: urls[0] || "" }))} setUploadCount={setUploadCount} disabled={isSaving || uploadCount > 0} />
                  <input
                    disabled={isSaving || uploadCount > 0}
                    suppressHydrationWarning
                    type="url"
                    value={formData.image1}
                    onChange={(e) =>
                      setFormData({ ...formData, image1: e.target.value })
                    }
                    placeholder="https://images.unsplash.com/..."
                    className="w-full p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                  />
                </div>

                <div>
                  <label className="font-bold block mb-1">
                    Ảnh phụ sản phẩm (tùy chọn)
                  </label>
                  <ImageUploader target="products" label="Chọn ảnh phụ" value={formData.image2 ? [formData.image2] : []} onChange={urls => setFormData(current => ({ ...current, image2: urls[0] || "" }))} setUploadCount={setUploadCount} disabled={isSaving || uploadCount > 0} />
                  <label className="font-bold block mb-1 mt-4">
                    Video sản phẩm (tùy chọn)
                  </label>
                  <ImageUploader target="products" mediaType="video" label="Chọn video sản phẩm" value={formData.videoUrl ? [formData.videoUrl] : []} onChange={urls => setFormData(current => ({ ...current, videoUrl: urls[0] || "" }))} setUploadCount={setUploadCount} disabled={isSaving || uploadCount > 0} />
                  <input
                    suppressHydrationWarning
                    type="url"
                    disabled={isSaving || uploadCount > 0}
                    value={formData.videoUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, videoUrl: e.target.value })
                    }
                    placeholder="https://assets.mixkit.co/..."
                    className="w-full p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                  />
                </div>
              </div>

              {/* Product origin */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold block mb-1">Xuất xứ (Tiếng Việt)</label>
                  <input
                    suppressHydrationWarning
                    type="text"
                    value={formData.originVi}
                    onChange={(e) =>
                      setFormData({ ...formData, originVi: e.target.value })
                    }
                    placeholder="VD: Việt Nam"
                    className="w-full p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>

                <div>
                  <label className="font-bold block mb-1">Origin (English)</label>
                  <input
                    suppressHydrationWarning
                    type="text"
                    value={formData.originEn}
                    onChange={(e) =>
                      setFormData({ ...formData, originEn: e.target.value })
                    }
                    placeholder="Example: Vietnam"
                    className="w-full p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
              </div>

              <section className="space-y-5 rounded-2xl border border-stone-200 bg-stone-50/60 p-4 sm:p-5 dark:border-stone-700 dark:bg-stone-800/30">
                <div>
                  <h3 className="text-base font-bold">Thông tin chi tiết sản phẩm</h3>
                  <p className="mt-1 text-xs leading-relaxed text-stone-500 dark:text-stone-400">Nội dung được hiển thị tại các mục tương ứng trên trang sản phẩm sau khi lưu. Có thể xuống dòng để chia ý. Nếu chưa nhập tiếng Anh, trang khách sẽ hiển thị tiếng Việt.</p>
                </div>
                {([
                  ["description", "Mô tả sản phẩm", "Giới thiệu đặc điểm và thông tin sản phẩm."],
                  ["ingredients", "Thành phần", "Liệt kê thành phần, tỷ lệ và thông tin dị ứng (nếu có)."],
                  ["nutrition", "Thông tin dinh dưỡng", "Ghi rõ đơn vị tính, khẩu phần và giá trị dinh dưỡng theo nhãn sản phẩm."],
                  ["usageInstructions", "Hướng dẫn sử dụng", "Cách dùng, liều lượng và lưu ý khi sử dụng."],
                  ["storageInstructions", "Hướng dẫn bảo quản", "Điều kiện bảo quản, lưu ý sau khi mở và hạn sử dụng."]
                ] as const).map(([field, title, hint]) => (
                  <fieldset key={field} className="border-t border-stone-200 pt-4 dark:border-stone-700">
                    <legend className="pr-3 font-bold text-stone-900 dark:text-stone-100">{title}</legend>
                    <p className="mb-3 text-xs text-stone-500 dark:text-stone-400">{hint}</p>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {(["Vi", "En"] as const).map((lang) => (
                        <label key={lang} className="block text-xs font-semibold text-stone-600 dark:text-stone-300">
                          {lang === "Vi" ? "Tiếng Việt" : "English (tùy chọn)"}
                          <textarea rows={4} value={formData[`${field}${lang}`]} onChange={(e) => setFormData((prev) => ({ ...prev, [`${field}${lang}`]: e.target.value }))} placeholder={lang === "Vi" ? hint : "Enter English content…"} className="mt-2 w-full resize-y rounded-xl border border-stone-200 bg-white p-3 text-sm font-normal leading-relaxed focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 dark:border-stone-700 dark:bg-stone-800" />
                        </label>
                      ))}
                    </div>
                  </fieldset>
                ))}
              </section>

              <div className="flex justify-end gap-3 pt-4 border-t border-stone-200 dark:border-stone-800">
                {formError && <p className="mr-auto text-red-600 dark:text-red-400 font-semibold self-center">{formError}</p>}
                <button
                  type="button"
                  suppressHydrationWarning
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 font-bold"
                >
                  {t("admin.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={isSaving || uploadCount > 0}
                  suppressHydrationWarning
                  className="px-6 py-2.5 rounded-xl bg-red-700 text-white font-bold hover:bg-red-800"
                >
                  {uploadCount > 0 ? "Đang tải ảnh..." : isSaving ? "Đang lưu..." : t("admin.save")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
