"use client";

import React from "react";
import { Check, Sparkles } from "lucide-react";
import { Product } from "@/types";
import { useLanguage } from "@/context/LanguageContext";
import { formatCurrency } from "@/utils/formatters";
import { calculateDiscountPercent } from "@/lib/productData";

interface VariantSelectorProps {
  variants: Product[];
  selectedProduct: Product;
  onSelectVariant: (variant: Product) => void;
}

export const VariantSelector: React.FC<VariantSelectorProps> = ({
  variants,
  selectedProduct,
  onSelectVariant,
}) => {
  const { language, t, loc } = useLanguage();

  if (variants.length <= 1) return null;

  return (
    <div className="min-w-0 space-y-3">
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
        <label className="flex min-w-0 items-center gap-1.5 text-xs font-bold text-stone-900 dark:text-stone-100 sm:text-sm">
          <Sparkles size={15} className="text-amber-500" />
          <span>{t("packagingType")}</span>
        </label>
        <span className="max-w-full break-words text-right text-xs font-semibold text-red-700 dark:text-amber-400">
          {loc(selectedProduct.variantLabel) || t("singlePack")}
        </span>
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-2.5 sm:grid-cols-2">
        {variants.map((variant) => {
          const isSelected = variant._id === selectedProduct._id;
          const discountPercent = variant.discountPercent ?? calculateDiscountPercent(variant.price, variant.originalPrice);

          return (
            <button
              key={variant._id}
              type="button"
              onClick={() => onSelectVariant(variant)}
              className={`relative flex min-w-0 items-center justify-between gap-2 overflow-hidden rounded-2xl border-2 p-3.5 text-left transition-all ${
                isSelected
                  ? "border-red-700 bg-red-50/70 dark:border-amber-400 dark:bg-amber-950/30 shadow-md ring-2 ring-red-700/20 dark:ring-amber-400/20"
                  : "border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:border-stone-300 dark:hover:border-stone-700"
              }`}
            >
              <div className="min-w-0 flex-1 space-y-0.5">
                <div className="flex min-w-0 items-center gap-1.5">
                  <span
                    className={`min-w-0 break-words text-xs font-bold sm:text-sm ${
                      isSelected
                        ? "text-red-800 dark:text-amber-300"
                        : "text-stone-800 dark:text-stone-200"
                    }`}
                  >
                    {loc(variant.variantLabel) || loc(variant.name)}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  <span className="text-xs font-extrabold text-red-700 dark:text-amber-400">
                    {formatCurrency(variant.price, language)}
                  </span>
                  {variant.originalPrice && variant.originalPrice > variant.price && (
                    <span className="text-[11px] text-stone-400 line-through">
                      {formatCurrency(variant.originalPrice, language)}
                    </span>
                  )}
                </div>
              </div>

              {/* Computed discount badge or Checkmark */}
              <div className="flex shrink-0 flex-col items-end gap-1">
                {discountPercent && (
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-red-600 text-white shadow-xs">
                    -{discountPercent}%
                  </span>
                )}
                {isSelected && (
                  <div className="w-5 h-5 rounded-full bg-red-700 dark:bg-amber-400 text-white dark:text-stone-950 flex items-center justify-center shadow-xs">
                    <Check size={12} strokeWidth={3} />
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
