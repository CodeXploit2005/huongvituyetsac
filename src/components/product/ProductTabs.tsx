"use client";

import React, { useState } from "react";
import { ShieldCheck, Utensils, Info, MessageSquare } from "lucide-react";
import { Product } from "@/types";
import { useLanguage } from "@/context/LanguageContext";
import { useData } from "@/context/DataContext";
import { ProductReviews } from "./ProductReviews";
import { getApprovedProductReviews } from "@/lib/reviewData";

interface ProductTabsProps {
  product: Product;
}

export const ProductTabs: React.FC<ProductTabsProps> = ({ product }) => {
  const { t, loc, language } = useLanguage();
  const { reviews, products } = useData();
  const [activeTab, setActiveTab] = useState<"desc" | "ingredients" | "usage" | "reviews">("desc");

  const emptyText = language === "vi" ? "Thông tin đang được cập nhật." : "Information is being updated.";

  const productReviews = getApprovedProductReviews(reviews, product, products);

  return (
    <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-4 sm:p-8 shadow-sm">
      {/* Tabs Header */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 border-b border-stone-200 dark:border-stone-800 scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveTab("desc")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap ${
            activeTab === "desc"
              ? "bg-red-700 text-white shadow-md"
              : "text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800"
          }`}
        >
          <Info size={16} />
          <span>{t("productTabs.description")}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("ingredients")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap ${
            activeTab === "ingredients"
              ? "bg-red-700 text-white shadow-md"
              : "text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800"
          }`}
        >
          <Utensils size={16} />
          <span>{t("productTabs.ingredients")}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("usage")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap ${
            activeTab === "usage"
              ? "bg-red-700 text-white shadow-md"
              : "text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800"
          }`}
        >
          <ShieldCheck size={16} />
          <span>{t("productTabs.usage")}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("reviews")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap ${
            activeTab === "reviews"
              ? "bg-red-700 text-white shadow-md"
              : "text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800"
          }`}
        >
          <MessageSquare size={16} />
          <span>
            {t("productTabs.reviews")} ({productReviews.length})
          </span>
        </button>
      </div>

      {/* Tabs Content */}
      <div className="pt-6 text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
        {activeTab === "desc" && (
          <p className="whitespace-pre-line break-words">{loc(product.description)?.trim() || emptyText}</p>
        )}
        {activeTab === "ingredients" && (
          <div className="grid gap-4 md:grid-cols-2">
            {([
              [language === "vi" ? "Thành phần" : "Ingredients", product.ingredients],
              [language === "vi" ? "Thông tin dinh dưỡng" : "Nutrition information", product.nutrition],
            ] as const).map(([title, content]) => (
              <section key={title} className="rounded-2xl border border-stone-200 bg-stone-50 p-5 dark:border-stone-800 dark:bg-stone-950/40">
                <h3 className="mb-3 text-base font-bold text-stone-900 dark:text-stone-100">{title}</h3>
                <p className="whitespace-pre-line break-words">{loc(content)?.trim() || emptyText}</p>
              </section>
            ))}
          </div>
        )}
        {activeTab === "usage" && (
          <div className="grid gap-4 md:grid-cols-2">
            {([
              [language === "vi" ? "Hướng dẫn sử dụng" : "Directions for use", product.usageInstructions],
              [language === "vi" ? "Hướng dẫn bảo quản" : "Storage instructions", product.storageInstructions],
            ] as const).map(([title, content]) => (
              <section key={title} className="rounded-2xl border border-stone-200 bg-stone-50 p-5 dark:border-stone-800 dark:bg-stone-950/40">
                <h3 className="mb-3 text-base font-bold text-stone-900 dark:text-stone-100">{title}</h3>
                <p className="whitespace-pre-line break-words">{loc(content)?.trim() || emptyText}</p>
              </section>
            ))}
          </div>
        )}

        {/* Reviews Tab */}
        {activeTab === "reviews" && (
          <ProductReviews product={product} />
        )}
      </div>
    </div>
  );
};
