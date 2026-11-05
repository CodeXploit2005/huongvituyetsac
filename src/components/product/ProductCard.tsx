"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { ShoppingBag, Star, Layers, Flame, Heart, Gift, Crown, Truck } from "lucide-react";
import { Product } from "@/types";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useData } from "@/context/DataContext";
import { formatCurrency } from "@/utils/formatters";
import { calculateDiscountPercent } from "@/lib/productData";

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCart();
  const { user, toggleWishlist, isInWishlist } = useAuth();
  const { language, t, loc } = useLanguage();
  const { categories, getProductVariants } = useData();
  const cardRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const category = categories.find((c) => c._id === product.categoryId);
  const variantGroupId = product.parentProductId || product._id;
  const variants = getProductVariants(variantGroupId);
  const hasVariants = variants.length > 1;
  const isFavorite = isInWishlist(product._id);
  const discountPercent = product.discountPercent ?? calculateDiscountPercent(product.price, product.originalPrice);
  const badgeIcons = { flame: Flame, gift: Gift, star: Star, crown: Crown, truck: Truck, heart: Heart };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1, buttonRef.current);
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      alert("Vui lòng đăng nhập để lưu sản phẩm vào danh sách yêu thích của bạn!");
      return;
    }
    toggleWishlist(product._id);
  };

  return (
    <div
      ref={cardRef}
      className="group relative bg-white dark:bg-[#161010] rounded-3xl border border-stone-200/90 dark:border-stone-800 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 ease-out flex flex-col overflow-hidden transform-gpu will-change-transform"
    >
      {/* Top Badges */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 pointer-events-none">
        {discountPercent && (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black tracking-wide bg-red-700 text-white shadow-md">
            -{discountPercent}%
          </span>
        )}
        {(product.badges || []).slice(0, 3).map((badge) => {
          const Icon = badge.icon ? badgeIcons[badge.icon as keyof typeof badgeIcons] : null;
          return (
            <span
              key={badge.id}
              className="max-w-[150px] px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white flex items-center gap-1 shadow-sm"
              style={{ backgroundColor: badge.color || "#b91c1c" }}
            >
              {Icon && <Icon size={12} className="shrink-0" />}
              <span className="truncate">{badge.text}</span>
            </span>
          );
        })}
      </div>

      {/* Top-Right Heart / Wishlist Button */}
      <button
        type="button"
        suppressHydrationWarning
        onClick={handleToggleWishlist}
        aria-label={isFavorite ? "Bỏ yêu thích" : "Thêm vào yêu thích"}
        title={isFavorite ? "Bỏ yêu thích" : "Lưu vào yêu thích"}
        className={`absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ease-out shadow-md active:scale-85 cursor-pointer ${
          isFavorite
            ? "bg-red-50 dark:bg-red-950/80 text-red-600 border border-red-200 dark:border-red-800/80"
            : "bg-white/90 dark:bg-stone-900/90 backdrop-blur-xs text-stone-500 dark:text-stone-400 hover:text-red-600 hover:bg-white dark:hover:bg-stone-900 border border-stone-200/60 dark:border-stone-800"
        }`}
      >
        <Heart
          size={16}
          className={`transition-transform duration-200 ease-out ${
            isFavorite
              ? "fill-red-600 text-red-600 scale-110"
              : "group-hover:scale-110"
          }`}
        />
      </button>

      {/* Image Container with Zoom hover */}
      <Link
        href={`/san-pham/${product.slug}`}
        className="relative block aspect-square overflow-hidden bg-stone-100 dark:bg-stone-800"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.images[0]}
          alt={loc(product.name)}
          className="w-full h-full object-cover group-hover:scale-106 transition-transform duration-500 ease-out transform-gpu will-change-transform"
          loading="lazy"
        />

        {/* Quick variant count pill */}
        {hasVariants && (
          <div className="absolute bottom-2.5 right-2.5 bg-black/70 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
            <Layers size={11} className="text-amber-300" />
            <span>{variants.length} phân loại</span>
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Category & Rating */}
          <div className="flex items-center justify-between text-xs text-stone-400 dark:text-stone-500 mb-1.5">
            {category && (
              <span className="font-semibold text-amber-700 dark:text-amber-400 truncate max-w-[65%]">
                {loc(category.name)}
              </span>
            )}
            {product.rating && (
              <div className="flex items-center gap-1 text-amber-500 font-bold ml-auto">
                <Star size={12} fill="currentColor" />
                <span>{product.rating}</span>
                <span className="text-stone-400 font-normal">
                  ({product.reviewsCount || 50})
                </span>
              </div>
            )}
          </div>

          {/* Title */}
          <Link href={`/san-pham/${product.slug}`}>
            <h3 className="font-bold text-sm sm:text-base text-stone-900 dark:text-stone-100 group-hover:text-red-700 dark:group-hover:text-amber-400 transition-colors duration-200 line-clamp-2 leading-snug">
              {loc(product.name)}
            </h3>
          </Link>

          {product.isVariant && product.variantLabel && (
            <div className="mt-1.5 inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
              <Layers size={11} />
              <span>{loc(product.variantLabel)}</span>
            </div>
          )}

          {/* Short specs / origin */}
          {product.origin && (
            <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1 truncate">
              {loc(product.origin)}
            </p>
          )}
        </div>

        {/* Price & Action */}
        <div className="pt-3 mt-3 border-t border-stone-100 dark:border-stone-800/80 flex items-center justify-between gap-2">
          <div className="flex flex-col">
            <div className="flex items-baseline gap-1.5">
              <span className="text-base sm:text-lg font-black text-red-700 dark:text-amber-400">
                {formatCurrency(product.price, language)}
              </span>
            </div>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-xs text-stone-400 line-through">
                {formatCurrency(product.originalPrice, language)}
              </span>
            )}
            <span className={`mt-0.5 text-[10px] font-semibold ${product.shippingFee ? "text-stone-500 dark:text-stone-400" : "text-emerald-700 dark:text-emerald-400"}`}>
              Ship: {product.shippingFee ? formatCurrency(product.shippingFee, language) : "Miễn phí"}
            </span>
          </div>

          <button
            type="button"
            suppressHydrationWarning
            ref={buttonRef}
            onClick={handleAddToCart}
            aria-label="Add to cart"
            className="px-3 py-2 sm:px-3.5 sm:py-2 rounded-2xl bg-gradient-to-r from-red-700 via-red-800 to-amber-600 hover:from-red-800 hover:to-amber-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all duration-200 active:scale-95 shadow-md shadow-red-700/20 shrink-0 cursor-pointer"
          >
            <ShoppingBag size={14} className="stroke-[2.2]" />
            <span className="inline">{t("addToCart")}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
