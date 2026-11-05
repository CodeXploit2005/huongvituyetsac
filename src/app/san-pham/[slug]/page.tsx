"use client";

import React, { useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ChevronRight,
  Home,
  Star,
  ShoppingBag,
  Zap,
  ShieldCheck,
  Truck,
  RotateCcw,
  Plus,
  Minus,
  Check,
  Heart,
} from "lucide-react";
import { useData } from "@/context/DataContext";
import { useLanguage } from "@/context/LanguageContext";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { formatCurrency } from "@/utils/formatters";
import { ProductGallery } from "@/components/product/ProductGallery";
import { VariantSelector } from "@/components/product/VariantSelector";
import { ProductTabs } from "@/components/product/ProductTabs";
import { RelatedProducts } from "@/components/product/RelatedProducts";
import { calculateAverageRating, getApprovedProductReviews } from "@/lib/reviewData";

export default function ProductDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const { products, categories, reviews, getProduct, getProductVariants } = useData();
  const { language, t, loc } = useLanguage();
  const { addToCart, setIsCartDrawerOpen } = useCart();
  const { user, toggleWishlist, isInWishlist } = useAuth();

  const baseProduct = getProduct(slug);

  // If baseProduct is a variant, find its parent; otherwise baseProduct is parent
  const parentId = baseProduct?.parentProductId || baseProduct?._id;
  const variants = parentId ? getProductVariants(parentId) : [];

  // Active selected variant state (defaults to baseProduct)
  const [selectedProductId, setSelectedProductId] = useState<string>();
  const selectedProduct =
    variants.find((variant) => variant._id === selectedProductId) || baseProduct || products[0];
  const approvedReviews = baseProduct
    ? getApprovedProductReviews(reviews, baseProduct, products)
    : [];
  const averageRating = calculateAverageRating(approvedReviews);
  const [quantity, setQuantity] = useState(1);
  const [addedToast, setAddedToast] = useState(false);
  const addToCartBtnRef = useRef<HTMLButtonElement>(null);

  if (!baseProduct) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8 space-y-4">
        <h2 className="text-2xl font-bold text-stone-800 dark:text-stone-200">
          Không tìm thấy sản phẩm
        </h2>
        <Link
          href="/"
          className="px-6 py-2.5 rounded-full bg-red-700 text-white text-xs font-bold"
        >
          {t("continueShopping")}
        </Link>
      </div>
    );
  }

  const category = categories.find((c) => c._id === selectedProduct.categoryId);

  const handleAddToCart = () => {
    addToCart(selectedProduct, quantity, addToCartBtnRef.current);
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 2500);
  };

  const handleBuyNow = () => {
    addToCart(selectedProduct, quantity, addToCartBtnRef.current);
    setIsCartDrawerOpen(true);
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 pb-20">
      {/* Breadcrumbs Bar */}
      <div className="bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 py-3.5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400 overflow-x-auto whitespace-nowrap">
            <Link href="/" className="hover:text-stone-900 dark:hover:text-white flex items-center gap-1">
              <Home size={13} />
              <span>{t("home")}</span>
            </Link>
            <ChevronRight size={12} />
            {category && (
              <>
                <Link
                  href={`/danh-muc/${category.slug}`}
                  className="hover:text-stone-900 dark:hover:text-white"
                >
                  {loc(category.name)}
                </Link>
                <ChevronRight size={12} />
              </>
            )}
            <span className="text-stone-900 dark:text-stone-100 font-bold truncate max-w-xs">
              {loc(selectedProduct.name)}
            </span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-12">
        {/* Main Product Section: Gallery & Details */}
        <div className="grid min-w-0 grid-cols-1 items-start gap-8 lg:grid-cols-12 lg:gap-10 xl:gap-12">
          {/* Left Column: Shopee-style Gallery (5 cols) */}
          <div className="min-w-0 lg:col-span-6">
            <ProductGallery
              images={selectedProduct.images}
              videos={selectedProduct.videos}
              videoPoster={selectedProduct.videoPoster}
              productName={loc(selectedProduct.name)}
            />
          </div>

          {/* Right Column: Info, Variants, CTA (7 cols) */}
          <div className="min-w-0 space-y-6 lg:col-span-6">
            <div>
              {/* Category badge & Rating */}
              <div className="mb-2 flex min-w-0 flex-wrap items-center justify-between gap-3">
                {category && (
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400">
                    {loc(category.name)}
                  </span>
                )}
                <div className="flex min-w-0 flex-wrap items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400">
                  <div className="flex text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={14}
                        fill={averageRating >= i + 0.5 ? "currentColor" : "none"}
                      />
                    ))}
                  </div>
                  <span className="font-bold text-stone-800 dark:text-stone-200">
                    {averageRating.toFixed(1)}
                  </span>
                  <span>({approvedReviews.length} {t("reviews")})</span>
                </div>
              </div>

              {/* Product Title */}
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-stone-900 dark:text-stone-100 leading-tight">
                {loc(selectedProduct.name)}
              </h1>

              {/* Origin & Weight Specs */}
              <div className="flex flex-wrap items-center gap-4 mt-2.5 text-xs text-stone-500 dark:text-stone-400">
                {selectedProduct.origin && (
                  <div>
                    <span className="font-medium text-stone-400">{t("origin")}</span>{" "}
                    <span className="font-bold text-stone-700 dark:text-stone-300">
                      {loc(selectedProduct.origin)}
                    </span>
                  </div>
                )}
                {selectedProduct.weight && (
                  <div>
                    <span className="font-medium text-stone-400">{t("weight")}</span>{" "}
                    <span className="font-bold text-stone-700 dark:text-stone-300">
                      {selectedProduct.weight}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Price Box */}
            <div className="flex min-w-0 flex-wrap items-center justify-between gap-3 rounded-3xl border border-amber-200/80 bg-amber-50/70 p-4 dark:border-stone-800 dark:bg-stone-900/90 sm:p-5">
              <div className="min-w-0">
                <span className="text-xs text-stone-500 dark:text-stone-400 block mb-1">
                  Giá bán chính hãng:
                </span>
                <div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="text-2xl sm:text-3xl font-black text-red-700 dark:text-amber-400">
                    {formatCurrency(selectedProduct.price, language)}
                  </span>
                  {selectedProduct.originalPrice &&
                    selectedProduct.originalPrice > selectedProduct.price && (
                      <span className="text-sm text-stone-400 line-through">
                        {formatCurrency(selectedProduct.originalPrice, language)}
                      </span>
                    )}
                </div>
              </div>

              {selectedProduct.discountBadge && loc(selectedProduct.discountBadge).trim() && (
                <div className="px-3 py-1.5 rounded-xl bg-red-700 text-white text-xs font-black shadow-md">
                  {loc(selectedProduct.discountBadge).trim()}
                </div>
              )}
            </div>

            <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-xs dark:border-stone-800 dark:bg-stone-900">
              <span className="font-bold text-stone-600 dark:text-stone-300">Phí giao hàng</span>
              <strong className={`shrink-0 ${selectedProduct.shippingFee ? "text-stone-900 dark:text-white" : "text-emerald-700 dark:text-emerald-400"}`}>
                {selectedProduct.shippingFee ? formatCurrency(selectedProduct.shippingFee, language) : "Miễn phí"}
              </strong>
            </div>

            {/* Packaging Variant Selector */}
            {variants.length > 1 && (
              <VariantSelector
                variants={variants}
                selectedProduct={selectedProduct}
                onSelectVariant={(v) => {
                  setSelectedProductId(v._id);
                }}
              />
            )}

            {/* Quantity Selector & Stock */}
            <div className="flex min-w-0 flex-wrap items-end gap-x-6 gap-y-3 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                  {t("quantity")}
                </label>
                <div className="flex items-center bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-2xl p-1 shadow-xs">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300"
                  >
                    <Minus size={15} />
                  </button>
                  <span className="font-bold text-sm px-4 min-w-[36px] text-center">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setQuantity(Math.min(selectedProduct.stock || 99, quantity + 1))
                    }
                    className="p-2 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300"
                  >
                    <Plus size={15} />
                  </button>
                </div>
              </div>

              <div className="min-w-0 break-words pb-2 text-xs text-stone-500 dark:text-stone-400">
                <span>{t("stockRemaining")} </span>
                <strong className="text-stone-800 dark:text-stone-200">
                  {selectedProduct.stock} sản phẩm
                </strong>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] gap-3 pt-2 xl:grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)]">
              <button
                type="button"
                onClick={() => {
                  if (!user) {
                    alert("Vui lòng đăng nhập để lưu sản phẩm vào danh sách yêu thích của bạn!");
                    return;
                  }
                  toggleWishlist(selectedProduct._id);
                }}
                aria-label="Thêm vào yêu thích"
                title={isInWishlist(selectedProduct._id) ? "Bỏ yêu thích" : "Lưu vào yêu thích"}
                className={`p-4 rounded-2xl border transition-all active:scale-90 flex items-center justify-center shrink-0 shadow-sm ${
                  isInWishlist(selectedProduct._id)
                    ? "bg-red-50 dark:bg-red-950/80 border-red-300 dark:border-red-800 text-red-600"
                    : "bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-500 dark:text-stone-400 hover:text-red-600 hover:border-red-200"
                }`}
              >
                <Heart
                  size={20}
                  className={isInWishlist(selectedProduct._id) ? "fill-red-600 text-red-600" : ""}
                />
              </button>

              <button
                ref={addToCartBtnRef}
                type="button"
                onClick={handleAddToCart}
                className="flex min-w-0 items-center justify-center gap-2 rounded-2xl border border-amber-300/80 bg-amber-50 px-3 py-4 text-xs font-bold text-amber-900 shadow-sm transition-all hover:bg-amber-100/80 active:scale-95 dark:border-stone-700 dark:bg-stone-800 dark:text-white dark:hover:bg-stone-700 sm:px-5 sm:text-sm"
              >
                <ShoppingBag size={18} className="text-amber-700 dark:text-amber-400" />
                <span className="truncate">{t("addToCart")}</span>
              </button>

              <button
                type="button"
                onClick={handleBuyNow}
                className="col-span-2 flex min-w-0 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-red-700 to-amber-600 px-4 py-4 text-xs font-black text-white shadow-xl transition-all hover:scale-102 hover:from-red-800 hover:to-amber-700 active:scale-95 sm:px-6 sm:text-sm xl:col-span-1"
              >
                <Zap size={18} />
                <span>{t("buyNow")}</span>
              </button>
            </div>

            {/* Added Toast Notification */}
            {addedToast && (
              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                <Check size={16} />
                <span>
                  {t("addedToCartSuccess", { name: loc(selectedProduct.name) })}
                </span>
              </div>
            )}

            {/* Trust Badges */}
            <div className="grid grid-cols-1 gap-3 border-t border-stone-200 pt-4 text-[11px] text-stone-600 dark:border-stone-800 dark:text-stone-400 sm:grid-cols-3">
              <div className="flex min-w-0 items-start gap-2">
                <Truck size={18} className="text-red-700 dark:text-amber-400 shrink-0" />
                <span>Freeship đơn từ 200.000₫</span>
              </div>
              <div className="flex min-w-0 items-start gap-2">
                <ShieldCheck size={18} className="text-emerald-600 shrink-0" />
                <span>100% Truyền Thống Tự Nhiên</span>
              </div>
              <div className="flex min-w-0 items-start gap-2">
                <RotateCcw size={18} className="text-amber-600 shrink-0" />
                <span>Đổi trả trong 7 ngày</span>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Tabs: Description, Ingredients, Usage, Reviews */}
        <ProductTabs product={selectedProduct} />

        {/* Related Products */}
        <RelatedProducts products={products} currentProductId={selectedProduct._id} />
      </div>
    </div>
  );
}
