"use client";

import React from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/common/BrandLogo";
import { usePathname } from "next/navigation";
import { ContactFooter } from "./ContactFooter";
import { Phone, Mail, ShieldCheck, Award, HeartHandshake } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useData } from "@/context/DataContext";

export const Footer: React.FC = () => {
  const { t, loc } = useLanguage();
  const { categories } = useData();
  const pathname = usePathname();
  if (pathname === "/lien-he") return <ContactFooter />;

  return (
    <footer className="bg-stone-100 dark:bg-[#0f0b0b] text-stone-700 dark:text-stone-300 border-t border-stone-200 dark:border-stone-800/80 pt-14 pb-10 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 pb-12 border-b border-stone-200 dark:border-stone-800">
          {/* Brand Info */}
          <div className="space-y-4">
            <Link href="/" aria-label="Hương Vị Tuyệt Sắc — Trang chủ" className="inline-flex rounded-full transition-transform hover:scale-[1.03]">
              <BrandLogo className="h-36 w-36 sm:h-44 sm:w-44" />
            </Link>

            <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
              {t("footerAbout")}
            </p>

            {/* Certifications Badges */}
            <div className="pt-2 space-y-2">
              <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-300 font-semibold">
                <Award size={16} />
                <span>{t("certifications")}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400 font-semibold">
                <ShieldCheck size={16} />
                <span>100% Nguyên Liệu Sạch – Không Phẩm Màu Độc Hại</span>
              </div>
            </div>
          </div>

          {/* Categories Links */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-stone-900 dark:text-white uppercase tracking-wider">
              {t("categories")}
            </h4>
            <ul className="space-y-2 text-xs">
              {categories.map((cat) => (
                <li key={cat._id}>
                  <Link
                    href={`/danh-muc/${cat.slug}`}
                    className="text-stone-600 dark:text-stone-400 hover:text-red-700 dark:hover:text-amber-400 transition-colors flex items-center gap-1.5"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-red-700"></span>
                    <span>{loc(cat.name)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links & Policies */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-stone-900 dark:text-white uppercase tracking-wider">
              {t("customerSupport")}
            </h4>
            <ul className="space-y-2 text-xs text-stone-600 dark:text-stone-400">
              <li>
                <Link href="/#brand-story" className="hover:text-red-700 dark:hover:text-white transition-colors">
                  {t("brandStory")}
                </Link>
              </li>
              <li>
                <Link href="/uu-dai-gio-vang" className="hover:text-red-700 dark:hover:text-white transition-colors">
                  {t("flashSale")}
                </Link>
              </li>
              <li>
                <Link href="/lien-he" className="hover:text-red-700 dark:hover:text-white transition-colors">Liên Hệ</Link>
              </li>
              <li>
                <Link href="/gio-hang" className="hover:text-red-700 dark:hover:text-white transition-colors">
                  {t("viewCart")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-stone-900 dark:text-white uppercase tracking-wider">
              {t("contactUs")}
            </h4>
            <div className="space-y-2.5 text-xs text-stone-600 dark:text-stone-400">
              <div className="flex items-center gap-2.5">
                <Phone size={16} className="text-amber-600 dark:text-amber-400 shrink-0" />
                <a href="tel:0824685041" className="font-bold text-stone-900 dark:text-white">{t("hotline")}</a>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail size={16} className="text-stone-500 shrink-0" />
                <a href="mailto:huongvituyetsac@gmail.com">huongvituyetsac@gmail.com</a>
              </div>
              <div className="flex items-center gap-2.5">
                <HeartHandshake size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Đậm tình quê hương trong từng giọt gia vị</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-4">
          <p>{t("copyright")}</p>
          <div className="flex items-center gap-4 text-stone-500 dark:text-stone-400">
            <span>Bảo mật thanh toán SSL</span>
            <span>•</span>
            <span>Giao hàng toàn quốc 24-48h</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
