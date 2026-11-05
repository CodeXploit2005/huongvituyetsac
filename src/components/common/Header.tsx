"use client";

// Browser autofill extensions inject fdprocessedid before hydration.
// Limit suppression to form controls; keep hydration diagnostics on the surrounding tree.
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/common/BrandLogo";
import { usePathname } from "next/navigation";
import {
  ShoppingBag,
  Menu,
  ChevronDown,
  ChevronRight,
  Flame,
  User as UserIcon,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useCart } from "@/context/CartContext";
import { useData } from "@/context/DataContext";
import { useAuth } from "@/context/AuthContext";
import { SearchAutocomplete } from "./SearchAutocomplete";
import { MobileDrawer } from "./MobileDrawer";
import { ThemeToggle } from "./ThemeToggle";

export const Header: React.FC = () => {
  const pathname = usePathname();
  const isAuthPage = pathname === "/tai-khoan" || pathname.startsWith("/admin");
  const { language, setLanguage, t, loc } = useLanguage();
  const { cartCount, setIsCartDrawerOpen, isBadgeBouncing, cartIconRef } = useCart();
  const { categories } = useData();
  const { user } = useAuth();

  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <header
        className={`sticky top-0 z-40 w-full transition-all duration-300 ${
          isScrolled
            ? "bg-white/95 dark:bg-stone-900/95 backdrop-blur-md shadow-md border-b border-stone-200/80 dark:border-stone-800"
            : "bg-white dark:bg-stone-950 border-b border-stone-200 dark:border-stone-800"
        }`}
      >
        {/* Main Navbar */}
        <div className="max-w-7xl lg:max-w-[1600px] mx-auto px-2.5 sm:px-4 lg:px-8">
          <div className="site-header-row">
            {/* Brand Logo */}
            <Link href="/" className="site-header-brand flex items-center gap-2 group min-w-0">
              <BrandLogo eager className="h-11 w-11 sm:h-14 sm:w-14 shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="font-black text-xs sm:text-base lg:text-xl tracking-tight text-stone-900 dark:text-white leading-none truncate">
                  HƯƠNG VỊ <span className="text-red-700 dark:text-amber-400">TUYỆT SẮC</span>
                </span>
                <span className="hidden sm:block text-[10px] text-stone-500 dark:text-stone-400 font-medium tracking-wide mt-0.5 truncate">
                  {t("brandSlogan")}
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="site-header-nav items-center gap-1 whitespace-nowrap">
              <Link
                href="/"
                className={`px-3 py-2 rounded-xl text-xs xl:text-sm font-bold transition-all ${
                  pathname === "/"
                    ? "text-red-700 dark:text-amber-400 bg-red-50 dark:bg-stone-800"
                    : "text-stone-700 dark:text-stone-300 hover:text-red-700 dark:hover:text-amber-400 hover:bg-stone-50 dark:hover:bg-stone-800/50"
                }`}
              >
                {t("home")}
              </Link>

              {/* Categories Dropdown */}
              <div
                className="relative"
                onMouseEnter={() => setIsCategoryDropdownOpen(true)}
                onMouseLeave={() => setIsCategoryDropdownOpen(false)}
              >
                <button suppressHydrationWarning className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs xl:text-sm font-bold transition-all ${
                  isCategoryDropdownOpen
                    ? "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-stone-800/90"
                    : "text-stone-700 dark:text-stone-300 hover:text-red-700 dark:hover:text-amber-400 hover:bg-stone-50 dark:hover:bg-stone-800/50"
                }`}>
                  <span>{t("categories")}</span>
                  <ChevronDown size={14} className={`transition-transform duration-200 ${isCategoryDropdownOpen ? "rotate-180 text-amber-500" : ""}`} />
                </button>

                {isCategoryDropdownOpen && (
                  <div className="absolute top-full left-0 w-80 pt-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="bg-white/98 dark:bg-[#140f0f]/98 backdrop-blur-xl rounded-3xl shadow-2xl border border-stone-200/90 dark:border-stone-800 p-3 space-y-1 ring-1 ring-black/5">
                      <div className="px-3 py-1.5 flex items-center justify-between text-[11px] font-black uppercase tracking-wider text-stone-400 dark:text-stone-500 border-b border-stone-100 dark:border-stone-800/80 mb-1">
                        <span>Danh Mục Nổi Bật</span>
                        <Link
                          href="/danh-muc/all"
                          onClick={() => setIsCategoryDropdownOpen(false)}
                          className="text-amber-600 dark:text-amber-400 hover:underline capitalize text-[11px] font-bold"
                        >
                          Tất cả →
                        </Link>
                      </div>

                      {categories.map((cat) => (
                        <Link
                          key={cat._id}
                          href={`/danh-muc/${cat.slug}`}
                          onClick={() => setIsCategoryDropdownOpen(false)}
                          className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-stone-100 dark:hover:bg-stone-800/80 text-xs font-semibold text-stone-800 dark:text-stone-200 hover:text-red-700 dark:hover:text-amber-400 transition-all group/cat"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={cat.image}
                            alt={loc(cat.name)}
                            className="w-10 h-10 rounded-xl object-cover border border-stone-200 dark:border-stone-700/80 shadow-xs group-hover/cat:scale-105 transition-transform shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-xs sm:text-sm text-stone-800 dark:text-stone-100 group-hover/cat:text-amber-500 dark:group-hover/cat:text-amber-400 transition-colors truncate">
                              {loc(cat.name)}
                            </div>
                            <div className="text-[11px] text-stone-500 dark:text-stone-400 truncate mt-0.5">
                              {loc(cat.description)}
                            </div>
                          </div>
                          <ChevronRight size={14} className="text-stone-400 group-hover/cat:text-amber-500 group-hover/cat:translate-x-0.5 transition-all shrink-0 ml-1 opacity-60 group-hover/cat:opacity-100" />
                        </Link>
                      ))}

                      <div className="pt-2 mt-1 border-t border-stone-100 dark:border-stone-800/80">
                        <Link
                          href="/danh-muc/all"
                          onClick={() => setIsCategoryDropdownOpen(false)}
                          className="w-full py-2 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors text-center"
                        >
                          <span>Xem trọn bộ thực đơn đặc sản</span>
                          <ChevronRight size={13} />
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <Link
                href="/uu-dai-gio-vang"
                className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs xl:text-sm font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-all"
              >
                <Flame size={15} />
                <span>{t("flashSale")}</span>
              </Link>
              <Link href="/lien-he" aria-current={pathname === "/lien-he" ? "page" : undefined} className={`whitespace-nowrap px-3 py-2 rounded-xl text-xs xl:text-sm font-bold transition-colors ${pathname === "/lien-he" ? "text-red-700 dark:text-amber-400 bg-red-50 dark:bg-stone-800" : "text-stone-700 dark:text-stone-300 hover:text-amber-600 dark:hover:text-amber-400"}`}>Liên Hệ</Link>
            </nav>

            {/* Instant Search Bar (Desktop) - Hidden on auth/admin pages */}
            {!isAuthPage && (
              <div className="site-header-search min-w-0 hidden sm:block">
                <SearchAutocomplete />
              </div>
            )}

            {/* Actions: Switcher, Theme, User, Cart & Mobile Menu */}
            <div className="site-header-actions flex items-center gap-1 sm:gap-2 shrink-0">
              {/* Language Switcher Pill (Desktop only - mobile has it in drawer) */}
              <div className="hidden sm:flex items-center p-0.5 rounded-full bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-[10px] sm:text-xs font-bold">
                <button suppressHydrationWarning
                  onClick={() => setLanguage("vi")}
                  className={`px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full transition-all ${
                    language === "vi"
                      ? "bg-red-700 text-white shadow-xs"
                      : "text-stone-600 dark:text-stone-400 hover:text-stone-900"
                  }`}
                >
                  VI
                </button>
                <button suppressHydrationWarning
                  onClick={() => setLanguage("en")}
                  className={`px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full transition-all ${
                    language === "en"
                      ? "bg-amber-600 text-white shadow-xs"
                      : "text-stone-600 dark:text-stone-400 hover:text-stone-900"
                  }`}
                >
                  EN
                </button>
              </div>

              {/* Theme Toggle Button */}
              <ThemeToggle showLabel className="hidden sm:flex" />

              {/* User Account Button (Desktop) */}
              <Link
                href="/tai-khoan"
                aria-label="Tài khoản"
                className="hidden md:flex w-fit max-w-[120px] min-w-0 items-center gap-2 p-1.5 pr-3 rounded-full bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:border-amber-500 text-xs font-bold text-stone-800 dark:text-stone-200 transition-colors"
              >
                {user?.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-6 h-6 shrink-0 rounded-full object-cover border border-amber-500"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-stone-200 dark:bg-stone-700 flex items-center justify-center text-stone-600 dark:text-stone-300">
                    <UserIcon size={14} />
                  </div>
                )}
                <span className="truncate min-w-0">
                  {user ? user.name.split(" ").pop() : "Tài khoản"}
                </span>
              </Link>

              {/* Cart Button */}
              <button suppressHydrationWarning
                ref={cartIconRef}
                onClick={() => setIsCartDrawerOpen(true)}
                aria-label="Open Cart"
                className={`relative p-2 sm:p-2.5 rounded-full text-white bg-gradient-to-r from-red-700 to-amber-600 hover:from-red-800 hover:to-amber-700 shadow-md transition-all shrink-0 ${
                  isBadgeBouncing ? "animate-badge-bounce scale-110" : ""
                }`}
              >
                <ShoppingBag size={16} />
                {cartCount > 0 && (
                  <span
                    className={`absolute -top-1 -right-1 bg-amber-400 text-stone-950 font-black text-[10px] sm:text-[11px] w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center shadow-md border border-white dark:border-stone-900 transition-transform ${
                      isBadgeBouncing ? "scale-125" : "scale-100"
                    }`}
                  >
                    {cartCount}
                  </span>
                )}
              </button>

              {/* Mobile Hamburger Button (Right side on mobile) */}
              <button suppressHydrationWarning
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden p-1.5 sm:p-2 rounded-xl text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 focus:outline-none shrink-0"
                aria-label="Open Mobile Menu"
              >
                <Menu size={22} />
              </button>
            </div>
          </div>

          {/* Search bar on mobile view - Hidden on auth/admin pages */}
          {!isAuthPage && (
            <div className="pb-2.5 pt-1 sm:hidden">
              <SearchAutocomplete isMobile />
            </div>
          )}
        </div>
      </header>

      {/* Mobile Drawer */}
      <MobileDrawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />
    </>
  );
};
