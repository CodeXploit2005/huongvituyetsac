"use client";

import React, { useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Search, ChevronRight, Home, Flame } from "lucide-react";
import { useData } from "@/context/DataContext";
import { useLanguage } from "@/context/LanguageContext";
import { searchProducts } from "@/utils/search";
import { ProductCard } from "@/components/product/ProductCard";
import { SortDropdown } from "@/components/common/SortDropdown";

function SearchContent() {
  const searchParams = useSearchParams();
  const rawQuery = searchParams.get("q") || "";

  const { products, categories } = useData();
  const { language, t, loc } = useLanguage();

  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("featured");

  const searchResults = useMemo(() => {
    if (!rawQuery.trim()) return [];
    let matched = searchProducts(products, rawQuery, language);

    if (selectedCategory !== "all") {
      matched = matched.filter((p) => p.categoryId === selectedCategory);
    }

    return matched.sort((a, b) => {
      if (sortBy === "priceAsc") return a.price - b.price;
      if (sortBy === "priceDesc") return b.price - a.price;
      if (sortBy === "rating") return (b.rating || 0) - (a.rating || 0);
      if (sortBy === "newest") {
        return (
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime()
        );
      }
      return 0; // featured default
    });
  }, [products, rawQuery, language, selectedCategory, sortBy]);

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-950 via-stone-900 to-amber-950 text-white py-10 sm:py-14 border-b border-stone-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2 text-xs text-stone-400 mb-4">
            <Link href="/" className="hover:text-white flex items-center gap-1">
              <Home size={13} />
              <span>{t("home")}</span>
            </Link>
            <ChevronRight size={12} />
            <span>Tìm kiếm</span>
            {rawQuery && (
              <>
                <ChevronRight size={12} />
                <span className="text-amber-400 font-semibold truncate max-w-xs">
                  &ldquo;{rawQuery}&rdquo;
                </span>
              </>
            )}
          </nav>

          <h1 className="text-2xl sm:text-3xl font-black text-white">
            {t("searchResultFor")}{" "}
            <span className="text-amber-400">&ldquo;{rawQuery}&rdquo;</span>
          </h1>
          <p className="text-xs sm:text-sm text-stone-300 mt-1">
            {t("foundResults", { count: searchResults.length })}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-stone-200 dark:border-stone-800">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full scrollbar-none">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors whitespace-nowrap ${
                selectedCategory === "all"
                  ? "bg-red-700 text-white"
                  : "bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-800"
              }`}
            >
              {t("allCategories")}
            </button>
            {categories.map((cat) => (
              <button
                key={cat._id}
                onClick={() => setSelectedCategory(cat._id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors whitespace-nowrap ${
                  selectedCategory === cat._id
                    ? "bg-red-700 text-white"
                    : "bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-800"
                }`}
              >
                {loc(cat.name)}
              </button>
            ))}
          </div>

          {/* Custom Sort Dropdown */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <SortDropdown value={sortBy} onChange={setSortBy} />
          </div>
        </div>

        {/* Results Grid */}
        <div className="pt-8">
          {searchResults.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {searchResults.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          ) : (
            <div className="p-16 text-center bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 space-y-4 max-w-xl mx-auto">
              <div className="w-16 h-16 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
                <Search size={28} />
              </div>
              <h3 className="font-bold text-lg text-stone-900 dark:text-stone-100">
                {t("noProductsFound")}
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Hãy thử tìm kiếm với các từ khóa phổ biến như &quot;Nước mắm Cà Ná&quot;, &quot;Mì Cay Seoul&quot;, &quot;Muối Ớt Xanh&quot; hoặc &quot;Nước Màu Dừa&quot;.
              </p>
              <Link
                href="/danh-muc/all"
                className="inline-block px-6 py-2.5 rounded-full bg-red-700 text-white text-xs font-bold hover:bg-red-800 transition-colors"
              >
                {t("allProducts")}
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center">Đang tải...</div>}>
      <SearchContent />
    </Suspense>
  );
}
