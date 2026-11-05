"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight, Check, Ticket } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import { formatCurrency } from "@/utils/formatters";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

interface CartDrawerProps {
  onCheckoutClick?: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onCheckoutClick }) => {
  const router = useRouter();
  const {
    cart,
    cartCount,
    subtotal,
    shippingFee,
    discount,
    appliedVoucher,
    applyVoucher,
    removeVoucher,
    updateQuantity,
    removeFromCart,
    isCartDrawerOpen,
    setIsCartDrawerOpen,
  } = useCart();

  const { language, t, loc } = useLanguage();
  const { user } = useAuth();
  const [couponCode, setCouponCode] = useState("");
  const [couponFeedback, setCouponFeedback] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const effectiveDiscount = user ? discount : 0;
  const effectiveShippingFee =
    !user && appliedVoucher?.code === "FREESHIP" && subtotal < 200000
      ? 30000
      : shippingFee;
  const effectiveTotal = subtotal + effectiveShippingFee - effectiveDiscount;

  useEffect(() => {
    if (isCartDrawerOpen) {
      router.prefetch("/gio-hang");
      router.prefetch("/danh-muc/all");
    }
  }, [isCartDrawerOpen, router]);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setCouponFeedback({
        success: false,
        message: "Vui lòng đăng nhập để sử dụng mã giảm giá.",
      });
      return;
    }
    if (!couponCode.trim()) return;
    const res = applyVoucher(couponCode);
    setCouponFeedback(res);
    if (res.success) {
      setCouponCode("");
    }
  };

  return (
    <AnimatePresence>
      {isCartDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCartDrawerOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-xs"
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="w-screen max-w-md bg-white dark:bg-stone-900 border-l border-stone-200 dark:border-stone-800 shadow-2xl flex flex-col"
            >
              {/* Header */}
              <div className="p-4 sm:p-6 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-400">
                    <ShoppingBag size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-stone-900 dark:text-stone-100">
                      {t("cart")}
                    </h3>
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      ({cartCount} {language === "vi" ? "sản phẩm" : "items"})
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsCartDrawerOpen(false)}
                  className="p-2 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Free Shipping Progress */}
              <div className="px-4 sm:px-6 py-3 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200/60 dark:border-amber-900/40">
                {subtotal >= 200000 || (user && appliedVoucher?.code === "FREESHIP") ? (
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                    <Check size={16} />
                    <span>
                      {language === "vi"
                        ? "Chúc mừng! Bạn được Miễn Phí Vận Chuyển toàn quốc!"
                        : "Congratulations! You've unlocked Free Shipping nationwide!"}
                    </span>
                  </div>
                ) : (
                  <div>
                    <div className="flex justify-between text-xs font-medium text-amber-800 dark:text-amber-300 mb-1.5">
                      <span>
                        {language === "vi"
                          ? `Mua thêm ${formatCurrency(
                              200000 - subtotal,
                              language
                            )} để được Miễn Phí Vận Chuyển`
                          : `Add ${formatCurrency(
                              200000 - subtotal,
                              language
                            )} more for Free Shipping`}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-amber-200 dark:bg-amber-900 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, (subtotal / 200000) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Items List */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center py-12">
                    <div className="w-20 h-20 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-400 mb-4">
                      <ShoppingBag size={36} />
                    </div>
                    <h4 className="font-semibold text-stone-800 dark:text-stone-200 mb-1">
                      {t("emptyCart")}
                    </h4>
                    <p className="text-xs text-stone-500 dark:text-stone-400 max-w-xs mb-6">
                      {language === "vi"
                        ? "Hãy thêm những gia vị thơm ngon và mì cay đặc sản vào giỏ hàng ngay nhé!"
                        : "Explore our gourmet seasonings and specialty spicy noodles to start shopping!"}
                    </p>
                    <button
                      onClick={() => setIsCartDrawerOpen(false)}
                      className="px-6 py-2.5 rounded-full text-sm font-semibold bg-red-700 hover:bg-red-800 text-white transition-all shadow-md"
                    >
                      {t("continueShopping")}
                    </button>
                  </div>
                ) : (
                  cart.map(({ product, quantity }) => (
                    <div
                      key={product._id}
                      className="flex gap-3 sm:gap-4 p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700/70"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={product.images[0]}
                        alt={loc(product.name)}
                        className="w-18 h-18 sm:w-20 sm:h-20 object-cover rounded-xl border border-stone-200 dark:border-stone-700 shrink-0"
                      />
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <h4 className="text-sm font-semibold text-stone-900 dark:text-stone-100 line-clamp-2 leading-tight">
                            {loc(product.name)}
                          </h4>
                          {product.variantLabel && (
                            <span className="inline-block mt-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900">
                              {loc(product.variantLabel)}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between mt-2 pt-1 border-t border-stone-200/50 dark:border-stone-700/50">
                          <span className="text-sm font-bold text-red-700 dark:text-amber-400">
                            {formatCurrency(product.price * quantity, language)}
                          </span>

                          <div className="flex items-center gap-1.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-0.5">
                            <button
                              onClick={() => updateQuantity(product._id, quantity - 1)}
                              className="p-1 rounded hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300"
                            >
                              <Minus size={13} />
                            </button>
                            <span className="text-xs font-semibold px-2 min-w-[20px] text-center">
                              {quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(product._id, quantity + 1)}
                              className="p-1 rounded hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300"
                            >
                              <Plus size={13} />
                            </button>
                            <button
                              onClick={() => removeFromCart(product._id)}
                              className="p-1 ml-1 text-stone-400 hover:text-red-600 transition-colors"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Footer Summary & Checkout */}
              {cart.length > 0 && (
                <div className="p-4 sm:p-6 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/90 space-y-4">
                  {/* Coupon Form */}
                  <div>
                    {appliedVoucher && user ? (
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs">
                        <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 font-semibold">
                          <Ticket size={15} />
                          <span>
                            {appliedVoucher.code} ({loc(appliedVoucher.description)})
                          </span>
                        </div>
                        <button
                          onClick={removeVoucher}
                          className="text-stone-400 hover:text-red-600"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <form onSubmit={handleApplyCoupon} className="flex gap-2">
                        <input
                          type="text"
                          suppressHydrationWarning
                          disabled={!user}
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value)}
                          placeholder="Mã giảm giá (HUONGVI10, FREESHIP)"
                          className="flex-1 px-3 py-2 text-xs rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 placeholder:text-stone-500 dark:placeholder:text-stone-400 uppercase focus:outline-none focus:ring-1 focus:ring-amber-500 disabled:cursor-not-allowed disabled:opacity-60"
                        />
                        <button
                          type="submit"
                          suppressHydrationWarning
                          disabled={!user}
                          className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-stone-800 hover:bg-stone-900 dark:bg-stone-700 dark:hover:bg-stone-600 text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {t("applyCoupon")}
                        </button>
                      </form>
                    )}

                    {!user && (
                      <p className="mt-2 text-[11px] text-amber-700 dark:text-amber-400">
                        <Link
                          href="/tai-khoan"
                          onClick={() => setIsCartDrawerOpen(false)}
                          className="font-bold underline underline-offset-2"
                        >
                          Đăng nhập
                        </Link>{" "}
                        để sử dụng mã giảm giá.
                      </p>
                    )}

                    {couponFeedback && (
                      <p
                        className={`text-[11px] mt-1 ${
                          couponFeedback.success
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {couponFeedback.message}
                      </p>
                    )}
                  </div>

                  {/* Summary Rows */}
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-stone-600 dark:text-stone-400">
                      <span>{t("subtotal")}</span>
                      <span className="font-semibold text-stone-900 dark:text-stone-100">
                        {formatCurrency(subtotal, language)}
                      </span>
                    </div>

                    {effectiveDiscount > 0 && (
                      <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                        <span>{t("discount")}</span>
                        <span className="font-semibold">
                          -{formatCurrency(effectiveDiscount, language)}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between text-stone-600 dark:text-stone-400">
                      <span>{t("shipping")}</span>
                      <span className="font-semibold text-stone-900 dark:text-stone-100">
                        {effectiveShippingFee === 0 ? (
                          <span className="text-emerald-600 font-bold">
                            {t("freeShipping")}
                          </span>
                        ) : (
                          formatCurrency(effectiveShippingFee, language)
                        )}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-stone-200 dark:border-stone-800 flex justify-between items-baseline text-base">
                      <span className="font-bold text-stone-900 dark:text-stone-100">
                        {t("total")}
                      </span>
                      <span className="font-extrabold text-xl text-red-700 dark:text-amber-400">
                        {formatCurrency(effectiveTotal, language)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      href="/gio-hang"
                      onClick={() => setIsCartDrawerOpen(false)}
                      className="w-full py-3 rounded-xl text-xs font-bold text-center border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                    >
                      {t("viewCart")}
                    </Link>

                    <button
                      onClick={() => {
                        setIsCartDrawerOpen(false);
                        if (onCheckoutClick) {
                          onCheckoutClick();
                        } else {
                          setTimeout(() => router.push("/gio-hang#checkout"), 170);
                        }
                      }}
                      className="w-full py-3 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-red-700 to-amber-600 hover:from-red-800 hover:to-amber-700 transition-all shadow-lg flex items-center justify-center gap-1.5"
                    >
                      <span>{t("checkout")}</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};
