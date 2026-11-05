"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Grid, Search, ShoppingBag, User, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { SearchAutocomplete } from "./SearchAutocomplete";

export const MobileBottomNav: React.FC = () => {
  const pathname = usePathname();
  const { cartCount, setIsCartDrawerOpen, isBadgeBouncing } = useCart();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [isSearchSheetOpen, setIsSearchSheetOpen] = useState(false);

  // Don't show bottom nav on admin routes
  if (pathname.startsWith("/admin")) return null;

  return (
    <>
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-stone-950/95 backdrop-blur-xl border-t border-stone-200/90 dark:border-stone-800 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-2 py-1.5 safe-area-pb">
        <div className="grid grid-cols-5 items-center justify-around">
          {/* 1. Home */}
          <Link
            href="/"
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
              pathname === "/"
                ? "text-red-700 dark:text-amber-400 font-bold"
                : "text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200"
            }`}
          >
            <Home size={20} className={pathname === "/" ? "stroke-[2.5]" : "stroke-[1.8]"} />
            <span className="text-[10px] mt-0.5">{t("home")}</span>
          </Link>

          {/* 2. Categories */}
          <Link
            href="/danh-muc/all"
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
              pathname.startsWith("/danh-muc")
                ? "text-red-700 dark:text-amber-400 font-bold"
                : "text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200"
            }`}
          >
            <Grid size={20} className={pathname.startsWith("/danh-muc") ? "stroke-[2.5]" : "stroke-[1.8]"} />
            <span className="text-[10px] mt-0.5">Danh mục</span>
          </Link>

          {/* 3. Search Button (Opens Fullscreen Sheet) */}
          <button
            type="button"
            suppressHydrationWarning
            onClick={() => setIsSearchSheetOpen(true)}
            className="flex flex-col items-center justify-center py-1 text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 transition-all"
          >
            <div className="w-8 h-8 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-xs">
              <Search size={17} strokeWidth={2.2} />
            </div>
            <span className="text-[10px] mt-0.5">Tìm kiếm</span>
          </button>

          {/* 4. Cart */}
          <button
            type="button"
            suppressHydrationWarning
            onClick={() => setIsCartDrawerOpen(true)}
            className="relative flex flex-col items-center justify-center py-1 text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 transition-all"
          >
            <div className="relative">
              <ShoppingBag size={20} className="stroke-[1.8]" />
              {cartCount > 0 && (
                <span
                  className={`absolute -top-1.5 -right-2 bg-red-600 text-white font-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center shadow-md ${
                    isBadgeBouncing ? "animate-badge-bounce scale-110" : ""
                  }`}
                >
                  {cartCount}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-0.5">{t("cart")}</span>
          </button>

          {/* 5. Account */}
          <Link
            href="/tai-khoan"
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
              pathname.startsWith("/tai-khoan")
                ? "text-red-700 dark:text-amber-400 font-bold"
                : "text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200"
            }`}
          >
            {user?.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatar}
                alt={user.name}
                className="w-5 h-5 rounded-full object-cover border border-amber-500"
              />
            ) : (
              <User size={20} className={pathname.startsWith("/tai-khoan") ? "stroke-[2.5]" : "stroke-[1.8]"} />
            )}
            <span className="text-[10px] mt-0.5 truncate max-w-[50px]">
              {user ? user.name.split(" ").pop() : "Tài khoản"}
            </span>
          </Link>
        </div>
      </div>

      {/* Full-Screen Search Modal for Mobile */}
      <AnimatePresence>
        {isSearchSheetOpen && (
          <motion.div
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", damping: 26, stiffness: 260 }}
            className="fixed inset-0 z-50 bg-white dark:bg-stone-950 p-4 flex flex-col justify-start overflow-hidden lg:hidden"
          >
            <div className="flex items-center justify-between gap-3 pb-4 border-b border-stone-200 dark:border-stone-800">
              <h3 className="font-extrabold text-sm text-stone-900 dark:text-white">
                Tìm kiếm sản phẩm
              </h3>
              <button
                type="button"
                suppressHydrationWarning
                onClick={() => setIsSearchSheetOpen(false)}
                className="p-1.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 hover:text-stone-900 dark:hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="pt-4 flex-1 overflow-y-auto">
              <SearchAutocomplete
                isMobile
                autoFocus
                onClose={() => setIsSearchSheetOpen(false)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
