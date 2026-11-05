"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { useData } from "@/context/DataContext";
import { useLanguage } from "@/context/LanguageContext";

export const CategoryGrid: React.FC = () => {
  const { categories, products } = useData();
  const { t, loc } = useLanguage();

  return (
    <section className="py-12 sm:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-8 sm:mb-10">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-1.5">
            <Sparkles size={14} />
            <span>{t("categories")}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-stone-900 dark:text-white tracking-tight">
            Tinh Hoa <span className="text-red-700 dark:text-amber-400">4 Nhóm Sản Phẩm</span>
          </h2>
        </div>

        <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 max-w-md">
          Tuyển chọn từ những làng nghề làm nước mắm, xưởng gia vị cổ truyền và công nghệ chế biến hiện đại nhất Việt Nam.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {categories.map((cat) => {
          const count = products.filter(
            (p) => p.categoryId === cat._id && !p.isVariant
          ).length;

          return (
            <Link
              key={cat._id}
              href={`/danh-muc/${cat.slug}`}
              className="group relative h-72 rounded-3xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 ease-out hover:-translate-y-1.5 flex flex-col justify-end p-6 border border-stone-200 dark:border-stone-800 transform-gpu will-change-transform"
            >
              {/* Background image */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={cat.image}
                alt={loc(cat.name)}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-106 transition-transform duration-500 ease-out transform-gpu will-change-transform"
              />

              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent group-hover:from-black/95 transition-opacity duration-300" />

              {/* Content */}
              <div className="relative z-10 space-y-2">
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-400/90 text-stone-950">
                  {count} {loc({ vi: "sản phẩm", en: "items" })}
                </span>

                <h3 className="font-extrabold text-xl text-white group-hover:text-amber-300 transition-colors">
                  {loc(cat.name)}
                </h3>

                <p className="text-xs text-stone-300 line-clamp-2 leading-relaxed opacity-90">
                  {loc(cat.description)}
                </p>

                <div className="pt-2 flex items-center gap-1 text-xs font-bold text-amber-400 group-hover:translate-x-1 transition-transform">
                  <span>Khám phá ngay</span>
                  <ArrowRight size={14} />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
};
