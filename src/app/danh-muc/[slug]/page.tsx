"use client";

import React, { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { SlidersHorizontal, ChevronRight, Home, RefreshCw, Sparkles, Tag, Layers } from "lucide-react";
import { useData } from "@/context/DataContext";
import { useLanguage } from "@/context/LanguageContext";
import { ProductCard } from "@/components/product/ProductCard";
import { SortDropdown } from "@/components/common/SortDropdown";
import { motion } from "framer-motion";

export default function CategoryPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const { categories, products } = useData();
  const { t, loc } = useLanguage();

  const [selectedCatSlug, setSelectedCatSlug] = useState<string>(slug || "all");
  const [selectedPriceRange, setSelectedPriceRange] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("featured");
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Active Category info
  const currentCategory = categories.find((c) => c.slug === selectedCatSlug);

  // Filter & Sort Logic
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Category filter
      if (selectedCatSlug !== "all") {
        const cat = categories.find((c) => c.slug === selectedCatSlug);
        if (cat && p.categoryId !== cat._id) return false;
      }

      // Price filter
      if (selectedPriceRange === "under50k" && p.price >= 50000) return false;
      if (
        selectedPriceRange === "50k-100k" &&
        (p.price < 50000 || p.price > 100000)
      )
        return false;
      if (
        selectedPriceRange === "100k-200k" &&
        (p.price < 100000 || p.price > 200000)
      )
        return false;
      if (selectedPriceRange === "above200k" && p.price <= 200000) return false;

      return true;
    }).sort((a, b) => {
      if (sortBy === "priceAsc") return a.price - b.price;
      if (sortBy === "priceDesc") return b.price - a.price;
      if (sortBy === "rating") return (b.rating || 0) - (a.rating || 0);
      if (sortBy === "newest")
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
    });
  }, [products, categories, selectedCatSlug, selectedPriceRange, sortBy]);

  const handleClearFilters = () => {
    setSelectedCatSlug("all");
    setSelectedPriceRange("all");
    setSortBy("featured");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, filter: "blur(3px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ type: "tween", duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      className="min-h-screen bg-stone-50 dark:bg-stone-950 pb-16"
    >
      {/* Category Hero / Header */}
      <div className="bg-gradient-to-r from-red-950 via-stone-900 to-amber-950 text-white py-10 sm:py-14 border-b border-stone-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-xs text-stone-400 mb-4">
            <Link href="/" className="hover:text-white flex items-center gap-1">
              <Home size={13} />
              <span>{t("home")}</span>
            </Link>
            <ChevronRight size={12} />
            <Link href="/danh-muc/all" className="hover:text-white">
              {t("categories")}
            </Link>
            {currentCategory && (
              <>
                <ChevronRight size={12} />
                <span className="text-amber-400 font-semibold">
                  {loc(currentCategory.name)}
                </span>
              </>
            )}
          </nav>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white mb-2">
            {currentCategory ? loc(currentCategory.name) : t("allProducts")}
          </h1>
          <p className="text-xs sm:text-sm text-stone-300 max-w-2xl">
            {currentCategory
              ? loc(currentCategory.description)
              : "Bộ sưu tập đầy đủ các dòng nước mắm truyền thống, mì gói hải sản 7 cấp độ và gia vị đặc sản Việt Nam."}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Controls Bar on top */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-200 dark:border-stone-800">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="lg:hidden flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs font-bold text-stone-800 dark:text-stone-200"
            >
              <SlidersHorizontal size={14} />
              <span>{t("filterBy")}</span>
            </button>
            <span className="text-xs text-stone-500 dark:text-stone-400">
              {t("foundResults", { count: filteredProducts.length })}
            </span>
          </div>

          {/* Custom Sort Dropdown */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <label className="text-xs text-stone-500 dark:text-stone-400 font-medium hidden sm:inline">
              {t("sortBy")}
            </label>
            <SortDropdown value={sortBy} onChange={setSortBy} />
          </div>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 pt-8">
          {/* Sidebar Filters */}
          <aside
            className={`space-y-6 ${
              showMobileFilters ? "block" : "hidden lg:block"
            }`}
          >
            {/* Category Filter */}
            <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#140f0f] border border-stone-200/90 dark:border-stone-800 shadow-xl space-y-4">
              <div className="flex items-center gap-2 text-xs font-black tracking-wider uppercase text-stone-900 dark:text-amber-400">
                <Sparkles size={16} className="text-amber-500" />
                <span>{t("categories")}</span>
              </div>

              <div className="space-y-1.5 text-xs">
                <button
                  onClick={() => setSelectedCatSlug("all")}
                  className={`w-full text-left px-3.5 py-3 rounded-2xl font-bold transition-all flex items-center justify-between active:scale-[0.98] ${
                    selectedCatSlug === "all"
                      ? "bg-gradient-to-r from-[#b81818] via-[#c22e0a] to-[#ea580c] text-white shadow-md shadow-red-950/40"
                      : "text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800/80 hover:text-stone-900 dark:hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Layers size={15} className={selectedCatSlug === "all" ? "text-amber-200" : "text-stone-400"} />
                    <span>{t("allCategories")}</span>
                  </div>
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                      selectedCatSlug === "all"
                        ? "bg-white/20 text-white"
                        : "bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400"
                    }`}
                  >
                    {products.length}
                  </span>
                </button>

                {categories.map((cat) => {
                  const isSelected = selectedCatSlug === cat.slug;
                  const catCount = products.filter(
                    (p) => p.categoryId === cat._id
                  ).length;

                  return (
                    <button
                      key={cat._id}
                      onClick={() => setSelectedCatSlug(cat.slug)}
                      className={`w-full text-left px-3.5 py-3 rounded-2xl font-bold transition-all flex items-center justify-between active:scale-[0.98] ${
                        isSelected
                          ? "bg-gradient-to-r from-[#b81818] via-[#c22e0a] to-[#ea580c] text-white shadow-md shadow-red-950/40"
                          : "text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800/80 hover:text-stone-900 dark:hover:text-white"
                      }`}
                    >
                      <span className="truncate pr-2">{loc(cat.name)}</span>
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded-full font-bold shrink-0 ${
                          isSelected
                            ? "bg-white/20 text-white"
                            : "bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400"
                        }`}
                      >
                        {catCount}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Price Range Filter */}
            <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#140f0f] border border-stone-200/90 dark:border-stone-800 shadow-xl space-y-4">
              <div className="flex items-center gap-2 text-xs font-black tracking-wider uppercase text-stone-900 dark:text-amber-400">
                <Tag size={15} className="text-amber-500" />
                <span>{t("priceRange")}</span>
              </div>

              <div className="space-y-1.5 text-xs">
                {[
                  { id: "all", label: t("allPrices") },
                  { id: "under50k", label: t("under50k") },
                  { id: "50k-100k", label: t("from50kTo100k") },
                  { id: "100k-200k", label: t("from100kTo200k") },
                  { id: "above200k", label: t("above200k") },
                ].map((item) => {
                  const isChecked = selectedPriceRange === item.id;
                  return (
                    <label
                      key={item.id}
                      onClick={() => setSelectedPriceRange(item.id)}
                      className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all ${
                        isChecked
                          ? "bg-amber-500/10 dark:bg-amber-500/15 text-amber-900 dark:text-amber-300 font-bold border border-amber-500/30"
                          : "hover:bg-stone-50 dark:hover:bg-stone-800/60 text-stone-600 dark:text-stone-300 border border-transparent font-medium"
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full flex items-center justify-center transition-all shrink-0 ${
                          isChecked
                            ? "border-2 border-amber-500 bg-amber-500 shadow-xs shadow-amber-500/50"
                            : "border-2 border-stone-400 dark:border-stone-600 bg-transparent"
                        }`}
                      >
                        {isChecked && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <span className="text-xs">{item.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Reset Filters button */}
            {(selectedCatSlug !== "all" || selectedPriceRange !== "all") && (
              <button
                onClick={handleClearFilters}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs font-bold text-stone-700 dark:text-stone-300 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/40 dark:hover:text-red-300 transition-colors shadow-sm"
              >
                <RefreshCw size={14} />
                <span>{t("clearFilters")}</span>
              </button>
            )}
          </aside>

          {/* Products Grid */}
          <main className="lg:col-span-3">
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
            ) : (
              <div className="p-12 text-center bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 space-y-4">
                <p className="text-stone-500 dark:text-stone-400 text-sm">
                  {t("noProductsFound")}
                </p>
                <button
                  onClick={handleClearFilters}
                  className="px-5 py-2.5 rounded-2xl bg-red-700 text-white text-xs font-bold hover:bg-red-800 transition-colors"
                >
                  {t("clearFilters")}
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </motion.div>
  );
}
