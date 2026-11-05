"use client";

import React, { useState } from "react";
import { Trophy, Flame, Award } from "lucide-react";
import { useData } from "@/context/DataContext";
import { useLanguage } from "@/context/LanguageContext";
import { ProductCard } from "@/components/product/ProductCard";

export const FeaturedProducts: React.FC = () => {
  const { products, categories } = useData();
  const { language, loc } = useLanguage();
  const [filterTab, setFilterTab] = useState("featured");
  const tabs = [
    { id: "featured", label: language === "vi" ? "Nổi bật & Bán chạy" : "Featured & Bestsellers" },
    ...[...categories].sort((a, b) => a.order - b.order).map((category) => ({ id: category._id, label: loc(category.name) })),
  ];
  const activeTab = tabs.some((tab) => tab.id === filterTab) ? filterTab : "featured";
  const displayedProducts = products.filter((product) => {
    if (product.isVariant || product.parentProductId) return false;
    return activeTab === "featured"
      ? product.isBestSeller || product.isFeatured
      : product.categoryId === activeTab;
  });

  return (
    <section className="py-12 sm:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-6 mb-10">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-1.5">
            <Trophy size={14} />
            <span>{language === "vi" ? "Tuyển Chọn Thượng Hạng" : "Premium Selection"}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-stone-900 dark:text-white tracking-tight">
            {language === "vi" ? "Sản Phẩm " : "Our "}<span className="text-red-700 dark:text-amber-400">{language === "vi" ? "Được Yêu Thích Nhất" : "Favorite Products"}</span>
          </h2>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.id === "featured" ? Flame : Award;
            return (
              <button
                key={tab.id}
                type="button"
                aria-pressed={activeTab === tab.id}
                onClick={() => setFilterTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all duration-200 whitespace-nowrap active:scale-95 cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-gradient-to-r from-red-700 via-red-800 to-amber-600 text-white shadow-md shadow-red-700/20"
                    : "bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:border-amber-400/60 shadow-xs"
                }`}
              >
                <Icon size={15} className="text-amber-500" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
      {displayedProducts.length === 0 && (
        <p role="status" className="py-12 text-center text-stone-500 dark:text-stone-400">
          {language === "vi" ? "Chưa có sản phẩm trong mục này." : "No products in this section yet."}
        </p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {displayedProducts.slice(0, 8).map((product) => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>
    </section>
  );
};
