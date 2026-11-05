"use client";

import React from "react";
import { Sparkles } from "lucide-react";
import { Product } from "@/types";
import { useLanguage } from "@/context/LanguageContext";
import { ProductCard } from "./ProductCard";

interface RelatedProductsProps {
  products: Product[];
  currentProductId: string;
}

export const RelatedProducts: React.FC<RelatedProductsProps> = ({
  products,
  currentProductId,
}) => {
  const { t } = useLanguage();

  const related = products
    .filter((p) => p._id !== currentProductId && !p.isVariant)
    .slice(0, 4);

  if (related.length === 0) return null;

  return (
    <div className="space-y-6 pt-10">
      <div className="flex items-center gap-2">
        <Sparkles className="text-amber-500" size={20} />
        <h3 className="font-extrabold text-xl sm:text-2xl text-stone-900 dark:text-stone-100">
          {t("relatedProducts")}
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
        {related.map((product) => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>
    </div>
  );
};
