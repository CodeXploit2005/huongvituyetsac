"use client";

import React from "react";
import Link from "next/link";
import { useData } from "@/context/DataContext";
import { Sparkles, Award, ShieldCheck, HeartHandshake, ArrowRight } from "lucide-react";

export const BrandStory: React.FC = () => {
  const { categories } = useData();
  const fishSauceCategory = categories.find((category) => category.slug.startsWith("nuoc-mam"));

  return (
    <section
      id="brand-story"
      className="py-16 sm:py-20 bg-stone-100 dark:bg-[#120d0d] text-stone-900 dark:text-white border-y border-stone-200/80 dark:border-stone-800/80 relative overflow-hidden transition-colors duration-300"
    >
      {/* Subtle background decoration */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/5 dark:bg-red-900/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-500/10 dark:bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* Left Media Block */}
          <div className="relative">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-stone-200 dark:border-stone-700">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/nuoc-mam-tin-binh-gom.png"
                alt="Bình gốm nước mắm Tĩn rin nguyên chất trên nền cá cơm"
                className="w-full h-auto"
              />
              <div className="bg-stone-900 p-4 text-xs text-stone-200">
                <p className="font-bold text-amber-300">
                  Công thức 300 năm từ làng chài
                </p>
              </div>
            </div>
          </div>

          {/* Right Text Story */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-500/15 dark:bg-amber-500/20 text-amber-800 dark:text-amber-400 text-xs font-bold border border-amber-500/30">
              <Sparkles size={14} />
              <span>CÂU CHUYỆN THƯƠNG HIỆU</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-stone-900 dark:text-white leading-tight">
              TẠI SAO LẠI GỌI LÀ <span className="text-red-700 dark:text-amber-400">NƯỚC MẮM TĨN?</span>
            </h2>

            <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
              Tên gọi “nước mắm Tĩn” xuất phát từ gần 300 năm trước khi người dân làng chài xưa tại Phan Thiết thời bấy giờ kéo rút <strong>nước mắm rin nguyên chất</strong> (mắm nhỉ nước đầu tiên) từ thùng lều gỗ cho vào cái tĩn gốm (bình gốm) chở ghe bầu bán chạy nhất Việt Nam ngày xưa. Do rất sánh đặc thịt cá, nên một chai nước mắm Tĩn về nguyên tắc có thể làm ra 3 đến 4 chai nước mắm thông thường.
            </p>

            <div className="space-y-3">
              <h3 className="text-lg sm:text-xl font-bold text-stone-900 dark:text-white">
                “Nước mắm rin nguyên chất” khác gì “nước mắm nhỉ”
              </h3>
              <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
                Rin là cách người dân làng chài xưa Phan Thiết gọi dòng nước mắm nhỉ đầu tiên ra khỏi thùng lều gỗ. Nước mắm rin do đó còn quý giá hơn cả nước mắm nhỉ truyền thống thông thường. Đặc trưng của nước mắm rin là sự sánh đặc thịt cá với vị mặn nhẹ đầu lưỡi và hậu dịu ngọt của cá. Nước mắm Tĩn chính là loại nước mắm rin nguyên chất quý giá đó.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg sm:text-xl font-bold text-stone-900 dark:text-white">
                Lịch sử 300 năm nước mắm Tĩn tại bảo tàng nước mắm Làng Chài Xưa
              </h3>
              <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
                Nước mắm Tĩn được bảo tàng nước mắm Làng Chài Xưa khôi phục và gìn giữ công thức làm nước mắm 300 năm. Nước mắm đựng trong bình gốm như xưa sau khi kéo rút trực tiếp từ thùng lều gỗ với cá cơm than con to béo tươi và muối tinh khiết, tự nhiên, truyền thống, không chất bảo quản.
              </p>
            </div>
            {/* 3 Value Pillars */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-3.5 rounded-2xl bg-white dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700/80 space-y-1 shadow-xs">
                <Award size={20} className="text-amber-600 dark:text-amber-400" />
                <h4 className="font-bold text-xs text-stone-900 dark:text-white">100% Tự Nhiên</h4>
                <p className="text-[11px] text-stone-600 dark:text-stone-400">Ủ chượp thủ công, không hóa chất tạo màu.</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700/80 space-y-1 shadow-xs">
                <ShieldCheck size={20} className="text-emerald-600 dark:text-emerald-400" />
                <h4 className="font-bold text-xs text-stone-900 dark:text-white">Chuẩn HACCP & ISO</h4>
                <p className="text-[11px] text-stone-600 dark:text-stone-400">Kiểm định nghiêm ngặt an toàn thực phẩm.</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700/80 space-y-1 shadow-xs">
                <HeartHandshake size={20} className="text-red-600 dark:text-red-400" />
                <h4 className="font-bold text-xs text-stone-900 dark:text-white">Vị Ngọt Hậu Sâu</h4>
                <p className="text-[11px] text-stone-600 dark:text-stone-400">Đạm cá tự nhiên, đậm đà trọn vị cơm nhà.</p>
              </div>
            </div>

            <div className="pt-2">
              <Link
                href={fishSauceCategory ? `/danh-muc/${fishSauceCategory.slug}` : "/danh-muc/all"}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-red-700 via-red-800 to-amber-600 hover:from-red-800 hover:to-amber-700 text-white font-bold text-xs sm:text-sm transition-all shadow-lg shadow-red-700/20 active:scale-95 group"
              >
                <span>Khám phá bộ sản phẩm di sản</span>
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
