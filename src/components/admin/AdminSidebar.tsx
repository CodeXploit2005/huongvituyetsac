"use client";

import React from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/common/BrandLogo";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Image as ImageIcon,
  Grid,
  ShoppingBag,
  ArrowLeft,
  MessageSquare,
  Users,
  TicketPercent,
  Zap,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useData } from "@/context/DataContext";

export const AdminSidebar: React.FC = () => {
  const pathname = usePathname();
  const { t } = useLanguage();
  const { reviews } = useData();

  const navItems = [
    {
      label: t("admin.dashboard"),
      href: "/admin",
      icon: LayoutDashboard,
      active: pathname === "/admin",
    },
    {
      label: "Quản lý tài khoản",
      href: "/admin/tai-khoan",
      icon: Users,
      active: pathname.startsWith("/admin/tai-khoan"),
    },
    {
      label: t("admin.products"),
      href: "/admin/san-pham",
      icon: Package,
      active: pathname.startsWith("/admin/san-pham"),
    },
    {
      label: "Đánh giá & Nhận xét",
      href: "/admin/danh-gia",
      icon: MessageSquare,
      active: pathname.startsWith("/admin/danh-gia"),
      badge: reviews.length ? `${reviews.length}` : undefined,
    },
    {
      label: t("admin.banners"),
      href: "/admin/banners",
      icon: ImageIcon,
      active: pathname.startsWith("/admin/banners"),
    },
    {
      label: t("admin.categories"),
      href: "/admin/danh-muc",
      icon: Grid,
      active: pathname.startsWith("/admin/danh-muc"),
    },
    {
      label: "Quản Lý Coupon",
      href: "/admin/coupons",
      icon: TicketPercent,
      active: pathname.startsWith("/admin/coupons"),
    },
    {
      label: "Quản Lý Flash Deal",
      href: "/admin/flash-deals",
      icon: Zap,
      active: pathname.startsWith("/admin/flash-deals"),
    },
    {
      label: t("admin.orders"),
      href: "/admin/don-hang",
      icon: ShoppingBag,
      active: pathname.startsWith("/admin/don-hang"),
    },
    { label: "Hỗ trợ khách hàng", href: "/admin/ho-tro-khach-hang", icon: MessageSquare, active: pathname.startsWith("/admin/ho-tro-khach-hang") },
  ];

  return (
    <aside className="w-full lg:w-64 bg-white dark:bg-[#0e121c] border-r border-stone-200 dark:border-[#1e2638] p-4 sm:p-6 flex flex-col justify-between shrink-0 transition-colors duration-300">
      <div className="space-y-6">
        {/* Branding */}
        <div className="flex items-center gap-2.5 pb-4 border-b border-stone-200 dark:border-[#1e2638]">
          <Link href="/" aria-label="Hương Vị Tuyệt Sắc — Trang chủ"><BrandLogo className="h-14 w-14" /></Link>
          <div>
            <h2 className="font-extrabold text-sm text-stone-900 dark:text-white leading-tight">
              CMS Quản Trị
            </h2>
            <p className="text-[10px] text-amber-400 font-bold">
              Hương Vị Tuyệt Sắc
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={false}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all ${
                  item.active
                    ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md shadow-red-950/60"
                    : "text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-[#151b2a] hover:text-stone-950 dark:hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon size={18} className={item.active ? "text-white" : "text-stone-400"} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                      item.active
                        ? "bg-white text-red-700"
                        : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Actions */}
      <div className="pt-6 border-t border-stone-200 dark:border-[#1e2638] space-y-2">
        <Link
          href="/"
          prefetch={false}
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-stone-200 dark:border-[#1e2638] bg-stone-50 dark:bg-[#0a0d14] text-xs font-bold text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-[#151b2a] hover:text-stone-950 dark:hover:text-white transition-colors shadow-sm"
        >
          <ArrowLeft size={14} />
          <span>{t("admin.backToStore")}</span>
        </Link>
      </div>
    </aside>
  );
};
