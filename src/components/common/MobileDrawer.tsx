"use client";
import { DEFAULT_AVATAR } from "@/lib/mediaUpload";

import React from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/common/BrandLogo";
import { usePathname } from "next/navigation";
import {
  X,
  Moon,
  Sun,
  Globe,
  Phone,
  ShieldCheck,
  Home,
  Grid,
  Flame,
  ChevronRight,
  User,
  ShoppingBag,
  Sparkles,
  LogOut,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";
import { useData } from "@/context/DataContext";
import { useAuth } from "@/context/AuthContext";
import { SearchAutocomplete } from "./SearchAutocomplete";

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({ isOpen, onClose }) => {
  const pathname = usePathname();
  const { language, toggleLanguage, t, loc } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { categories } = useData();
  const { user, logout } = useAuth();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden lg:hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-xs"
          />

          {/* Drawer Panel Sliding from Right */}
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="w-screen max-w-xs bg-white dark:bg-stone-900 border-l border-stone-200 dark:border-stone-800 shadow-2xl flex flex-col"
            >
              {/* Top Branding & Close */}
              <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
                <Link
                  href="/"
                  onClick={onClose}
                  className="flex items-center gap-2"
                >
                  <BrandLogo className="h-12 w-12" />
                  <div>
                    <h3 className="font-extrabold text-sm text-stone-900 dark:text-stone-100 tracking-tight leading-tight">
                      HƯƠNG VỊ TUYỆT SẮC
                    </h3>
                    <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                      Đậm đà chuẩn vị quê nhà
                    </p>
                  </div>
                </Link>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
                  aria-label="Close Menu"
                >
                  <X size={20} />
                </button>
              </div>

              {/* User Account / Login Card in Drawer */}
              <div className="pt-3 px-4">
                {user ? (
                  <Link
                    href="/tai-khoan"
                    onClick={onClose}
                    className="p-3 rounded-2xl bg-gradient-to-r from-red-950 via-stone-900 to-amber-950 border border-amber-500/30 text-white flex items-center justify-between shadow-md hover:border-amber-400 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={user.avatar || DEFAULT_AVATAR}
                        alt={user.name}
                        className="w-9 h-9 rounded-full object-cover border border-amber-400 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs truncate max-w-[120px]">{user.name}</span>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-400 text-stone-950 shrink-0">VIP</span>
                        </div>
                        <p className="text-[10px] text-amber-300 truncate">
                          Trang cá nhân & Đơn hàng
                        </p>
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-amber-300 shrink-0" />
                  </Link>
                ) : (
                  <div className="p-3 rounded-2xl bg-gradient-to-r from-red-50 to-amber-50 dark:from-stone-800/90 dark:to-stone-800/60 border border-red-100 dark:border-stone-700 flex items-center justify-between shadow-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-red-700 to-amber-600 flex items-center justify-center text-white shadow-xs shrink-0">
                        <User size={15} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-black text-stone-900 dark:text-white leading-tight">
                          Khách Hàng Thân Thiết
                        </div>
                        <div className="text-[10px] text-stone-500 dark:text-stone-400 truncate">
                          Đăng nhập nhận ưu đãi VIP
                        </div>
                      </div>
                    </div>
                    <Link
                      href="/tai-khoan"
                      onClick={onClose}
                      className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-red-700 to-amber-600 text-white font-bold text-xs shadow-xs hover:from-red-800 hover:to-amber-700 active:scale-95 transition-all flex items-center gap-0.5 shrink-0"
                    >
                      <span>Đăng nhập</span>
                      <ChevronRight size={12} />
                    </Link>
                  </div>
                )}
              </div>

              {/* Mobile Search Bar */}
              <div className="p-4 border-b border-stone-200 dark:border-stone-800">
                <SearchAutocomplete isMobile onClose={onClose} />
              </div>

              {/* Navigation Links */}
              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                <div>
                  <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">
                    {t("categories")}
                  </h4>
                  <div className="space-y-1">
                    <Link
                      href="/"
                      onClick={onClose}
                      className={`flex items-center justify-between p-2.5 rounded-xl text-sm font-semibold transition-colors ${
                        pathname === "/"
                          ? "bg-red-50 text-red-700 dark:bg-stone-800 dark:text-amber-400"
                          : "text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Home size={16} />
                        <span>{t("home")}</span>
                      </div>
                      <ChevronRight size={14} className="text-stone-400" />
                    </Link>

                    {categories.map((cat) => (
                      <Link
                        key={cat._id}
                        href={`/danh-muc/${cat.slug}`}
                        onClick={onClose}
                        className={`flex items-center justify-between p-2.5 rounded-xl text-sm font-semibold transition-colors ${
                          pathname.includes(cat.slug)
                            ? "bg-red-50 text-red-700 dark:bg-stone-800 dark:text-amber-400"
                            : "text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Grid size={16} />
                          <span>{loc(cat.name)}</span>
                        </div>
                        <ChevronRight size={14} className="text-stone-400" />
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Hot Links */}
                <div>
                  <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">
                    {language === "vi" ? "Khám phá" : "Explore"}
                  </h4>
                  <div className="space-y-1">
                      <Link href="/lien-he" onClick={onClose} className="flex items-center gap-2.5 p-2.5 rounded-xl text-sm font-semibold text-stone-700 dark:text-stone-200 hover:text-amber-500"><Phone size={16} />Liên Hệ</Link>
                      <Link
                        href="/uu-dai-gio-vang"
                      onClick={onClose}
                      className="flex items-center justify-between p-2.5 rounded-xl text-sm font-semibold text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                    >
                      <div className="flex items-center gap-2.5">
                        <Flame size={16} />
                        <span>{t("flashSale")}</span>
                      </div>
                      <span className="text-[10px] bg-red-600 text-white font-bold px-1.5 py-0.5 rounded">
                        HOT
                      </span>
                    </Link>
                  </div>
                </div>

                {/* Preferences: Language & Theme & Logout */}
                <div className="pt-4 border-t border-stone-200 dark:border-stone-800 space-y-3">
                  <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                    {language === "vi" ? "Cài đặt & Giao diện" : "Preferences"}
                  </h4>

                  <div className="grid grid-cols-2 gap-2">
                    {/* Language Toggle */}
                    <button
                      onClick={toggleLanguage}
                      className="flex items-center justify-center gap-2 p-2.5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/60 text-xs font-bold text-stone-800 dark:text-stone-200 hover:border-amber-500/50 hover:bg-stone-100 dark:hover:bg-stone-800 transition-all active:scale-95 shadow-xs"
                    >
                      <Globe size={15} className="text-amber-500 shrink-0" />
                      <span>{language === "vi" ? "🇻🇳 Tiếng Việt" : "🇬🇧 English"}</span>
                    </button>

                    {/* Theme Toggle */}
                    <button
                      onClick={toggleTheme}
                      className={`flex items-center justify-center gap-2 p-2.5 rounded-2xl text-xs font-black transition-all active:scale-95 shadow-xs cursor-pointer ${
                        theme === "dark"
                          ? "border border-amber-500/60 bg-stone-900 text-amber-300 hover:bg-stone-800"
                          : "border border-amber-300/90 bg-gradient-to-r from-amber-100 to-orange-50 text-stone-900 hover:bg-amber-100"
                      }`}
                    >
                      {theme === "dark" ? (
                        <>
                          <div className="w-5 h-5 rounded-full bg-amber-400 text-stone-950 flex items-center justify-center shadow-xs">
                            <Sun size={13} className="stroke-[2.5]" />
                          </div>
                          <span>{t("switchToLight")}</span>
                        </>
                      ) : (
                        <>
                          <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-red-700 to-amber-600 text-white flex items-center justify-center shadow-xs">
                            <Moon size={13} className="stroke-[2.5]" />
                          </div>
                          <span>{t("switchToDark")}</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Logout Button (if logged in) */}
                  {user && (
                    <button
                      onClick={() => {
                        logout();
                        onClose();
                      }}
                      className="w-full flex items-center justify-center gap-2 p-2.5 rounded-2xl border border-red-200/80 dark:border-red-900/40 bg-red-50/70 dark:bg-red-950/30 text-xs font-bold text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/60 transition-all active:scale-95 shadow-xs"
                    >
                      <LogOut size={15} className="shrink-0" />
                      <span>Đăng xuất tài khoản</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Bottom Support */}
              <div className="p-4 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/90 text-xs text-stone-500 dark:text-stone-400 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Phone size={14} className="text-red-600" />
                  <a href="tel:0824685041" className="font-semibold text-stone-800 dark:text-stone-200">
                    0824685041
                  </a>
                </div>
                <div className="flex items-center gap-1 text-[11px]">
                  <ShieldCheck size={14} className="text-emerald-600" />
                  <span>100% Chính Hãng</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};
