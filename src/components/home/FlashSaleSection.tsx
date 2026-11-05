"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useData } from "@/context/DataContext";
import { Flame, Clock, ArrowRight } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { ProductCard } from "@/components/product/ProductCard";
import type { FlashDeal } from "@/types";

export const FlashSaleSection: React.FC<{ showEmpty?: boolean }> = ({ showEmpty = false }) => {
  const { language } = useLanguage();
  const { categories } = useData();
  const noodleCategory = categories.find((category) => category.slug.startsWith("mi-goi"));

  // Dynamic countdown timer calculated from MongoDB endAt timestamp
  const [deal, setDeal] = useState<FlashDeal | null | undefined>(undefined);
  const [loadError, setLoadError] = useState(false);
  const [serverOffset, setServerOffset] = useState(0);
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  // Fetch dynamic FlashDeal config with endAt from MongoDB API
  useEffect(() => {
    async function loadFlashDeal() {
      try {
        const res = await fetch("/api/flash-deals/active", { cache: "no-store" });
        if (res.ok) {
          const data = (await res.json()) as FlashDeal | null;
          setDeal(data);
          if (data?.serverNow) setServerOffset(new Date(data.serverNow).getTime() - Date.now());
        } else {
          setLoadError(true);
          setDeal(null);
        }
      } catch (e) {
        setLoadError(true);
        console.error("Failed to load flash deal from DB", e);
        setDeal(null);
      }
    }
    loadFlashDeal();
  }, []);

  // Compute remaining hours, minutes, seconds from endAt
  useEffect(() => {
    const updateCountdown = () => {
      if (!deal?.coupon?.endAt) return;
      const distance = new Date(deal.coupon.endAt).getTime() - (Date.now() + serverOffset);

      if (distance > 0) {
        const hours = Math.floor(distance / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        setTimeLeft({ hours, minutes, seconds });
      } else {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        setDeal(null);
      }
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [deal?.coupon?.endAt, serverOffset]);

  // Filter items with discounts or featured
  if (!deal || !deal.coupon || !deal.products?.length) return showEmpty ? <div className="mx-auto max-w-7xl px-5 py-16"><div role="status" className="rounded-2xl border border-amber-200 bg-amber-50 p-10 text-center dark:border-stone-700 dark:bg-stone-900"><Flame className="mx-auto mb-4 text-amber-500" size={32} /><h2 className="text-xl font-bold">{deal === undefined ? "Đang tải ưu đãi giờ vàng..." : loadError ? "Chưa thể tải ưu đãi giờ vàng" : "Hiện chưa có ưu đãi giờ vàng đang diễn ra"}</h2><p className="mt-3 text-sm text-stone-500 dark:text-stone-400">{deal === undefined ? "Vui lòng chờ trong giây lát." : loadError ? "Vui lòng tải lại trang để thử lại." : "Hãy quay lại sau để khám phá các chương trình mới nhất."}</p><Link href="/danh-muc/all" className="mt-6 inline-block rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-6 py-3 text-sm font-bold text-stone-950">Khám phá sản phẩm</Link></div></div> : null;
  const saleProducts = deal.products;
  const localizedTitle = deal.title[language];
  const localizedSubtitle = deal.subtitle[language];

  return (
    <section
      id="flash-sale"
      className="py-12 sm:py-16 bg-gradient-to-b from-amber-50/70 via-orange-50/40 to-amber-50/50 dark:from-[#161010] dark:via-[#1c1414] dark:to-[#120d0d] border-y border-amber-200/80 dark:border-stone-800/80 transition-colors duration-300"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with Countdown */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 sm:mb-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-red-600 via-red-700 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-red-700/25 animate-pulse shrink-0">
              <Flame size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-gradient-to-r from-red-600 to-amber-600 text-white uppercase tracking-wider shadow-xs">
                  Flash Deal
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-white tracking-tight">
                  {localizedTitle}
                </h2>
              </div>
              <p className="text-xs text-stone-600 dark:text-stone-400 mt-0.5 font-medium">
                {localizedSubtitle}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-bold">
                <span className="rounded-lg border border-red-200 bg-red-50 px-2 py-1 font-mono text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-amber-300">
                  Mã: {deal.coupon.code}
                </span>
                <span className="text-stone-600 dark:text-stone-400">
                  Nhập mã trong giỏ hàng để giảm {deal.coupon.discountType === "percent" ? `${deal.coupon.discountValue}%` : `${deal.coupon.discountValue.toLocaleString("vi-VN")}₫`}
                  {deal.coupon.minOrderValue > 0 ? ` cho đơn từ ${deal.coupon.minOrderValue.toLocaleString("vi-VN")}₫` : ""}
                </span>
              </div>
            </div>
          </div>

          {/* Countdown Clock */}
          <div className="flex items-center gap-2.5 bg-white dark:bg-stone-900/90 p-2 sm:px-4 sm:py-2.5 rounded-2xl border border-amber-300/80 dark:border-stone-700/80 shadow-md shadow-amber-950/5 self-start md:self-auto">
            <Clock size={16} className="text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="text-xs font-bold text-stone-700 dark:text-stone-300">
              Kết thúc trong:
            </span>
            <div className="flex items-center gap-1 text-xs font-black">
              <span className="px-2 py-1 rounded-lg bg-stone-900 text-amber-300 font-mono shadow-xs border border-stone-700/60">
                {String(timeLeft.hours).padStart(2, "0")}
              </span>
              <span className="text-stone-800 dark:text-amber-400 font-bold">:</span>
              <span className="px-2 py-1 rounded-lg bg-stone-900 text-amber-300 font-mono shadow-xs border border-stone-700/60">
                {String(timeLeft.minutes).padStart(2, "0")}
              </span>
              <span className="text-stone-800 dark:text-amber-400 font-bold">:</span>
              <span className="px-2 py-1 rounded-lg bg-stone-900 text-amber-300 font-mono shadow-xs border border-stone-700/60">
                {String(timeLeft.seconds).padStart(2, "0")}
              </span>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {saleProducts.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>

        {/* View all sale link */}
        <div className="text-center mt-10">
          <Link
            href={noodleCategory ? `/danh-muc/${noodleCategory.slug}` : "/danh-muc/all"}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-red-700 hover:text-red-800 dark:text-amber-400 dark:hover:text-amber-300 transition-colors group"
          >
            <span>Xem tất cả ưu đãi Combo & Hộp quà tặng</span>
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
};

