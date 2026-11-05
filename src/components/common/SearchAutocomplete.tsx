"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search,
  X,
  Flame,
  ArrowRight,
  Tag,
  Sparkles,
  Loader2,
  Star,
  Layers,
  MapPin,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useData } from "@/context/DataContext";
import { useLanguage } from "@/context/LanguageContext";
import { searchProducts, removeVietnameseTones } from "@/utils/search";
import { formatCurrency } from "@/utils/formatters";

interface SearchAutocompleteProps {
  isMobile?: boolean;
  onClose?: () => void;
  autoFocus?: boolean;
}

export const SearchAutocomplete: React.FC<SearchAutocompleteProps> = ({
  isMobile = false,
  onClose,
  autoFocus = false,
}) => {
  const router = useRouter();
  const { products, categories, getProductVariants } = useData();
  const { language, t, loc } = useLanguage();

  const [query, setQuery] = useState("");
  const [completedSearch, setCompletedSearch] = useState({ query: "", language, products });
  const [isOpen, setIsOpen] = useState(false);
  const isSearching = Boolean(query.trim()) && (completedSearch.query !== query || completedSearch.language !== language || completedSearch.products !== products);
  const results = query.trim() && !isSearching ? searchProducts(products, query, language).slice(0, 6) : [];
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced search with visual loading indicator
  useEffect(() => {
    if (!query.trim()) return;
    const timer = setTimeout(() => {
      setCompletedSearch({ query, products, language });
    }, 200);

    return () => clearTimeout(timer);
  }, [query, products, language]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setIsOpen(false);
    if (onClose) onClose();
    router.push(`/tim-kiem?q=${encodeURIComponent(query.trim())}`);
  };

  const handleTagClick = (tag: string) => {
    setQuery(tag);
    setIsOpen(false);
    if (onClose) onClose();
    router.push(`/tim-kiem?q=${encodeURIComponent(tag)}`);
  };

  // Safe and accurate word-based Vietnamese highlight
  const highlightMatch = (text: string, keyword: string) => {
    if (!keyword.trim()) return text;
    const queryTokens = keyword
      .trim()
      .split(/\s+/)
      .map((w) => removeVietnameseTones(w).toLowerCase())
      .filter(Boolean);

    return (
      <span>
        {text.split(/(\s+)/).map((part, i) => {
          const normPart = removeVietnameseTones(part).toLowerCase();
          const isMatch = queryTokens.some(
            (token) => token.length >= 2 && normPart.includes(token)
          );

          return isMatch ? (
            <span
              key={i}
              className="bg-amber-200 dark:bg-amber-900/90 text-red-900 dark:text-amber-200 font-black px-1 rounded-sm shadow-xs"
            >
              {part}
            </span>
          ) : (
            part
          );
        })}
      </span>
    );
  };

  const quickTags = [
    "Mì Cay 7 Cấp Độ",
    "Nước Mắm Cà Ná",
    "Muối Ớt Xanh",
    "Nước Màu Dừa",
  ];

  return (
    <div ref={containerRef} className="relative w-full max-w-full">
      <form
        onSubmit={handleSearchSubmit}
        className="relative flex items-center w-full"
      >
        <input
          ref={inputRef}
          type="text"
          autoFocus={autoFocus}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={t("searchPlaceholder")}
          className={`w-full pl-9 sm:pl-10 pr-9 sm:pr-10 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100 border border-stone-200 dark:border-stone-700 transition-all placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none ${
            isOpen
              ? "search-active-glow bg-white dark:bg-stone-900 border-amber-500 ring-2 ring-amber-500/30"
              : ""
          }`}
        />

        {/* Animated Search Icon / Loading Spinner */}
        <div className="absolute left-3 flex items-center pointer-events-none">
          {isSearching ? (
            <Loader2 size={15} className="text-amber-500 animate-spin" />
          ) : (
            <Search
              size={15}
              className={`transition-all duration-300 ${
                isOpen
                  ? "text-red-700 dark:text-amber-400 scale-110 rotate-12"
                  : "text-stone-400 dark:text-stone-500"
              }`}
            />
          )}
        </div>

        {/* Clear Button */}
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            className="absolute right-2.5 p-1 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-700 transition-all"
          >
            <X size={13} />
          </button>
        )}
      </form>

      {/* Autocomplete Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className={`absolute top-full mt-2 bg-white dark:bg-stone-900 backdrop-blur-2xl rounded-2xl sm:rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.25)] border border-stone-200 dark:border-stone-800 z-50 max-h-[75vh] overflow-y-auto overflow-x-hidden ${
              isMobile
                ? "left-0 right-0 w-full"
                : "left-0 right-0 w-full sm:left-auto sm:right-0 md:left-1/2 md:-translate-x-1/2 sm:w-[540px] md:w-[640px] lg:w-[720px]"
            }`}
          >
            {/* Quick Suggestions / Trending when input is empty */}
            {!query.trim() && (
              <div className="p-3.5 sm:p-6 space-y-3 sm:space-y-4">
                <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                  <Flame size={14} />
                  <span>{t("trendingSearches")}</span>
                </div>
                <div className="flex flex-wrap gap-1.5 sm:gap-2.5">
                  {quickTags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleTagClick(tag)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl sm:rounded-2xl text-[11px] sm:text-xs font-bold bg-stone-100 hover:bg-amber-100 dark:bg-stone-800 dark:hover:bg-amber-950/60 text-stone-700 dark:text-stone-300 hover:text-amber-900 dark:hover:text-amber-300 transition-all border border-stone-200 dark:border-stone-700 active:scale-95 shadow-xs"
                    >
                      <Tag size={11} className="text-amber-500" />
                      <span>{tag}</span>
                    </button>
                  ))}
                </div>

                {/* Popular Categories */}
                <div className="pt-2 sm:pt-3 border-t border-stone-100 dark:border-stone-800">
                  <div className="text-[10px] sm:text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-2">
                    Danh mục nổi bật
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2">
                    {categories.map((cat) => (
                      <Link
                        key={cat._id}
                        href={`/danh-muc/${cat.slug}`}
                        onClick={() => {
                          setIsOpen(false);
                          if (onClose) onClose();
                        }}
                        className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-stone-50 dark:bg-stone-800/60 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-700 text-center transition-colors group"
                      >
                        <span className="text-[11px] sm:text-xs font-bold text-stone-800 dark:text-stone-200 group-hover:text-red-700 dark:group-hover:text-amber-400 line-clamp-1">
                          {loc(cat.name)}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Results List */}
            {query.trim() && (
              <div className="p-2.5 sm:p-4 space-y-1.5 sm:space-y-2">
                <div className="flex items-center justify-between px-2.5 py-1.5 text-[11px] sm:text-xs font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider border-b border-stone-100 dark:border-stone-800 pb-2">
                  <div className="flex items-center gap-1.5">
                    <Sparkles size={13} className="text-amber-500" />
                    <span>{t("searchSuggestions")}</span>
                  </div>
                  {results.length > 0 && (
                    <span className="text-[11px] sm:text-xs font-bold text-red-700 dark:text-amber-400 normal-case">
                      {results.length} sản phẩm
                    </span>
                  )}
                </div>

                {results.length > 0 ? (
                  <motion.div
                    initial="hidden"
                    animate="show"
                    variants={{
                      hidden: { opacity: 0 },
                      show: {
                        opacity: 1,
                        transition: { staggerChildren: 0.03 },
                      },
                    }}
                    className="space-y-1.5 pt-1"
                  >
                    {results.map((product) => {
                      const category = categories.find(
                        (c) => c._id === product.categoryId
                      );
                      const variants = getProductVariants(product._id);
                      const hasVariants = variants.length > 1;

                      return (
                        <motion.div
                          key={product._id}
                          variants={{
                            hidden: { opacity: 0, y: 5 },
                            show: { opacity: 1, y: 0 },
                          }}
                        >
                          <Link
                            href={`/san-pham/${product.slug}`}
                            onClick={() => {
                              setIsOpen(false);
                              if (onClose) onClose();
                            }}
                            className="flex items-center gap-2.5 sm:gap-4 p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-stone-50/70 hover:bg-stone-100 dark:bg-stone-800/40 dark:hover:bg-stone-800/90 border border-stone-200/80 dark:border-stone-700/80 hover:border-amber-400/80 transition-all group"
                          >
                            {/* Product Image */}
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={product.images[0]}
                              alt={loc(product.name)}
                              className="w-13 h-13 sm:w-20 sm:h-20 object-cover rounded-xl sm:rounded-2xl border border-stone-200 dark:border-stone-700 shrink-0 group-hover:scale-105 transition-transform"
                            />

                            {/* Product Info */}
                            <div className="flex-1 min-w-0 space-y-0.5 sm:space-y-1">
                              {/* Title */}
                              <h4 className="text-xs sm:text-sm font-extrabold text-stone-900 dark:text-stone-100 line-clamp-2 leading-tight sm:leading-snug group-hover:text-red-700 dark:group-hover:text-amber-400 transition-colors">
                                {highlightMatch(loc(product.name), query)}
                              </h4>

                              {/* Origin */}
                              {product.origin && (
                                <div className="flex items-center gap-1 text-[10px] sm:text-[11px] text-stone-500 dark:text-stone-400">
                                  <MapPin size={10} className="text-red-600 shrink-0" />
                                  <span className="truncate">{loc(product.origin)}</span>
                                </div>
                              )}

                              {/* Price and Badges */}
                              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pt-0.5">
                                <span className="text-xs sm:text-sm font-black text-red-700 dark:text-amber-400">
                                  {formatCurrency(product.price, language)}
                                </span>

                                {product.originalPrice &&
                                  product.originalPrice > product.price && (
                                    <span className="text-[10px] sm:text-[11px] text-stone-400 line-through">
                                      {formatCurrency(product.originalPrice, language)}
                                    </span>
                                  )}

                                {category && (
                                  <span className="text-[9px] sm:text-[10px] px-2 py-0.5 rounded-md sm:rounded-full bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300 font-bold truncate max-w-[110px] sm:max-w-none">
                                    {loc(category.name)}
                                  </span>
                                )}

                                {hasVariants && (
                                  <span className="hidden sm:inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-300 font-bold">
                                    <Layers size={10} />
                                    <span>{variants.length} phân loại</span>
                                  </span>
                                )}

                                {product.rating && (
                                  <div className="hidden sm:flex items-center gap-1 text-[11px] text-amber-500 font-bold ml-auto">
                                    <Star size={11} fill="currentColor" />
                                    <span>{product.rating}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            <ArrowRight
                              size={16}
                              className="text-stone-300 dark:text-stone-600 group-hover:text-red-700 dark:group-hover:text-amber-400 group-hover:translate-x-1 transition-all shrink-0"
                            />
                          </Link>
                        </motion.div>
                      );
                    })}

                    {/* View all button */}
                    <div className="pt-2 mt-2 border-t border-stone-100 dark:border-stone-800">
                      <button
                        type="button"
                        onClick={handleSearchSubmit}
                        className="w-full flex items-center justify-center gap-1.5 py-2.5 sm:py-3 px-3 text-xs sm:text-sm font-black text-white bg-gradient-to-r from-red-700 via-red-600 to-amber-600 hover:from-red-800 hover:to-amber-700 rounded-xl sm:rounded-2xl transition-all shadow-md group"
                      >
                        <span>Xem tất cả kết quả cho &ldquo;{query}&rdquo;</span>
                        <ArrowRight
                          size={14}
                          className="group-hover:translate-x-1 transition-transform"
                        />
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <div className="py-8 text-center text-xs text-stone-500 dark:text-stone-400 space-y-1">
                    <p className="font-bold text-xs sm:text-sm text-stone-800 dark:text-stone-200">
                      {t("noProductsFound")}
                    </p>
                    <p className="text-[11px] text-stone-400">
                      Thử tìm &ldquo;mì cay&rdquo;, &ldquo;nước mắm Cà Ná&rdquo;...
                    </p>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
