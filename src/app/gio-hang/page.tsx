"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  QrCode,
  Truck,
  CheckCircle2,
  Ticket,
  X,
  UserCheck,
} from "lucide-react";
import confetti from "canvas-confetti";
import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import { useData } from "@/context/DataContext";
import { useAuth } from "@/context/AuthContext";
import { formatCurrency } from "@/utils/formatters";
import { Order } from "@/types";
import { VietQRModal } from "@/components/checkout/VietQRModal";
import { ProvinceSelect } from "@/components/common/ProvinceSelect";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";



export default function CartAndCheckoutPage() {
  const router = useRouter();
  const {
    cart,
    subtotal,
    shippingFee,
    discount,
    total,
    appliedVoucher,
    applyVoucher,
    removeVoucher,
    updateQuantity,
    removeFromCart,
    clearCart,
  } = useCart();

  const { language, t, loc } = useLanguage();
  const { createOrder } = useData();
  const { user } = useAuth();

  // Checkout Form State
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    address: "",
    province: "",
    note: "",
    paymentMethod: "vietqr" as "cod" | "vietqr" | "momo",
  });

  // Auto-fill from user account
  useEffect(() => {
    if (user) {
      const defaultAddr = user.addresses?.find((a) => a.isDefault) || user.addresses?.[0];
      const timer = setTimeout(() => {
        setFormData((prev) => ({
          ...prev,
          fullName: defaultAddr?.receiverName || user.name || prev.fullName,
          phone: defaultAddr?.phone || user.phone || prev.phone,
          email: user.email || prev.email,
          address: defaultAddr?.address || prev.address,
          province: defaultAddr?.province || prev.province,
        }));
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);
  const [isVietQRModalOpen, setIsVietQRModalOpen] = useState(false);
  const [pendingVietQROrder, setPendingVietQROrder] = useState<Order | null>(null);
  const [isLeavingCart, setIsLeavingCart] = useState(false);

  useEffect(() => {
    router.prefetch("/danh-muc/all");
  }, [router]);

  const handleContinueShopping = () => {
    if (isLeavingCart) return;
    setIsLeavingCart(true);
    setTimeout(() => router.push("/danh-muc/all"), 140);
  };

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setCouponError("Vui lòng đăng nhập để sử dụng mã ưu đãi hoặc voucher.");
      return;
    }
    if (!couponInput.trim()) return;
    const res = applyVoucher(couponInput);
    if (!res.success) {
      setCouponError(res.message);
    } else {
      setCouponError("");
      setCouponInput("");
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || cart.length === 0) return;
    if (appliedVoucher && !user) {
      removeVoucher();
      alert("Vui lòng đăng nhập để sử dụng mã ưu đãi hoặc voucher.");
      return;
    }
    if (!formData.fullName || !formData.phone || !formData.address || !formData.province) {
      alert("Vui lòng điền đầy đủ Họ tên, Số điện thoại, Địa chỉ và Tỉnh/Thành phố.");
      return;
    }
    if (!/^\d{10}$/.test(formData.phone)) {
      alert("Số điện thoại không đúng.");
      return;
    }

    setIsSubmitting(true);

    const orderItems = cart.map((item) => ({
      productId: item.product._id,
      productName: item.product.name,
      variantLabel: item.product.variantLabel,
      image: item.product.images[0],
      price: item.product.price,
      quantity: item.quantity,
    }));

    try {
    const newOrder = await createOrder({
      customerName: formData.fullName,
      phone: formData.phone,
      email: formData.email || "customer@example.com",
      address: formData.address,
      province: formData.province,
      note: formData.note,
      paymentMethod: formData.paymentMethod,
      items: orderItems,
      subtotal,
      shippingFee,
      discount,
      voucherCode: appliedVoucher?.code,
      total,
      status: formData.paymentMethod === "vietqr" ? "pending" : "confirmed",
      userId: user?.id,
    });

    if (formData.paymentMethod === "vietqr") {
      setPendingVietQROrder(newOrder);
      setIsVietQRModalOpen(true);
    } else {
      clearCart();
      // COD or MoMo immediate confirmation
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
      });
      setPlacedOrder(newOrder);
    }
    } catch (error) {
      alert(error instanceof Error ? error.message : "Không thể lưu đơn hàng. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVietQRSuccess = (updated: Order) => {
    clearCart();
    setPlacedOrder(updated);
  };

  // If order is completed (COD or finished VietQR)
  if (placedOrder && !isVietQRModalOpen) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8, filter: "blur(3px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="min-h-screen bg-stone-50 dark:bg-stone-950 py-16 px-4"
      >
        <div className="max-w-2xl mx-auto bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-6 sm:p-10 shadow-2xl space-y-6 text-center">
          <div className="w-18 h-18 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-md">
            <CheckCircle2 size={42} />
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-white">
              {t("orderSuccessTitle")}
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-2">
              {t("orderSuccessMessage")}{" "}
              <strong className="text-red-700 dark:text-amber-400 text-base font-mono">
                {placedOrder.orderCode}
              </strong>
            </p>
          </div>

          {/* Recipient summary */}
          <div className="p-5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 text-xs text-stone-600 dark:text-stone-300 text-left space-y-2 border border-stone-200 dark:border-stone-700">
            <div className="flex justify-between border-b border-stone-200/60 pb-2">
              <span className="text-stone-400">Người nhận hàng:</span>
              <strong className="text-stone-900 dark:text-stone-100">
                {placedOrder.customerName} ({placedOrder.phone})
              </strong>
            </div>
            <div className="flex justify-between border-b border-stone-200/60 pb-2">
              <span className="text-stone-400">Địa chỉ giao hàng:</span>
              <span className="text-right font-medium text-stone-800 dark:text-stone-200">
                {placedOrder.address}, {placedOrder.province}
              </span>
            </div>
            <div className="flex justify-between border-b border-stone-200/60 pb-2">
              <span className="text-stone-400">Phương thức:</span>
              <strong className="uppercase font-bold text-red-700 dark:text-amber-400">
                {placedOrder.paymentMethod === "vietqr"
                  ? "Chuyển khoản QR 24/7 (Chờ xác nhận thanh toán)"
                  : "Thanh toán khi nhận hàng (COD)"}
              </strong>
            </div>
            <div className="flex justify-between pt-1 text-sm">
              <span className="font-bold text-stone-900 dark:text-stone-100">Tổng thanh toán:</span>
              <strong className="font-black text-red-700 dark:text-amber-400">
                {formatCurrency(placedOrder.total, language)}
              </strong>
            </div>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row justify-center gap-3">
            <Link
              href="/tai-khoan"
              className="px-6 py-3 rounded-2xl border border-stone-300 dark:border-stone-700 text-xs font-bold text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              Xem trong Tài Khoản Khách Hàng
            </Link>

            <Link
              href="/"
              className="px-6 py-3 rounded-2xl bg-red-700 text-white text-xs font-bold hover:bg-red-800 transition-colors shadow-lg"
            >
              {t("continueShopping")}
            </Link>
          </div>
        </div>
      </motion.div>
    );
  }

  if (cart.length === 0 && !pendingVietQROrder) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: isLeavingCart ? 0 : 1, y: isLeavingCart ? -6 : 0 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className="min-h-[70vh] flex flex-col items-center justify-center text-center p-8 space-y-4"
      >
        <div className="w-20 h-20 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-400">
          <ShoppingBag size={40} />
        </div>
        <h2 className="text-2xl font-black text-stone-900 dark:text-white">
          {t("emptyCart")}
        </h2>
        <p className="text-xs sm:text-sm text-stone-500 max-w-sm">
          Khám phá ngay các dòng nước mắm cốt nhĩ Cà Ná và mì cay hải sản 7 cấp độ độc bản để thêm vào giỏ hàng.
        </p>
        <button
          type="button"
          onClick={handleContinueShopping}
          disabled={isLeavingCart}
          className="px-6 py-3 rounded-2xl bg-red-700 text-white text-xs font-bold hover:bg-red-800 transition-all shadow-md"
        >
          {isLeavingCart ? "Đang mở sản phẩm..." : t("continueShopping")}
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, filter: "blur(3px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="min-h-screen bg-stone-50 dark:bg-stone-950 pb-24 pt-8"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400">
            <ShoppingBag size={24} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-white">
              Giỏ Hàng & Thanh Toán
            </h1>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Kiểm tra sản phẩm và điền thông tin giao nhận hàng
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Cart Items List (7 cols) */}
          <div className="lg:col-span-7 min-w-0 space-y-4">
            <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-4 sm:p-6 shadow-sm space-y-4">
              <h2 className="font-bold text-sm text-stone-900 dark:text-stone-100 uppercase tracking-wider">
                Danh sách sản phẩm ({cart.length})
              </h2>

              <div className="divide-y divide-stone-100 dark:divide-stone-800">
                {cart.map(({ product, quantity }) => (
                  <div
                    key={product._id}
                    className="py-4 flex flex-wrap sm:flex-nowrap gap-3 items-center justify-between"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={product.images[0]}
                        alt={loc(product.name)}
                        className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-2xl border border-stone-200 dark:border-stone-700 shrink-0"
                      />
                      <div className="min-w-0">
                        <Link
                          href={`/san-pham/${product.slug}`}
                          className="font-bold text-xs sm:text-sm text-stone-900 dark:text-stone-100 hover:text-red-700 dark:hover:text-amber-400 line-clamp-2"
                        >
                          {loc(product.name)}
                        </Link>
                        {product.variantLabel && (
                          <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                            {loc(product.variantLabel)}
                          </span>
                        )}
                        <div className="text-xs font-bold text-red-700 dark:text-amber-400 mt-1 sm:hidden">
                          {formatCurrency(product.price * quantity, language)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <div className="flex items-center bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl p-0.5">
                        <button
                          onClick={() =>
                            updateQuantity(product._id, quantity - 1)
                          }
                          className="p-1 rounded hover:bg-stone-200 dark:hover:bg-stone-700"
                        >
                          <Minus size={13} />
                        </button>
                        <span className="text-xs font-bold px-2.5 min-w-[20px] text-center">
                          {quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(product._id, quantity + 1)
                          }
                          className="p-1 rounded hover:bg-stone-200 dark:hover:bg-stone-700"
                        >
                          <Plus size={13} />
                        </button>
                      </div>

                      <span className="hidden sm:inline font-black text-sm text-red-700 dark:text-amber-400 min-w-[80px] text-right">
                        {formatCurrency(product.price * quantity, language)}
                      </span>

                      <button
                        onClick={() => removeFromCart(product._id)}
                        className="text-stone-400 hover:text-red-600 transition-colors p-1"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Voucher code box */}
            <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-4 sm:p-6 shadow-sm space-y-3">
              <h3 className="font-bold text-xs text-stone-900 dark:text-stone-100 uppercase tracking-wider flex items-center gap-1.5">
                <Ticket size={16} className="text-amber-500" />
                <span>Mã Ưu Đãi / Voucher Giảm Giá</span>
              </h3>

              {appliedVoucher ? (
                <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs">
                  <div className="text-emerald-800 dark:text-emerald-300 font-bold">
                    ✓ Đang áp dụng mã {appliedVoucher.code} ({loc(appliedVoucher.description)})
                  </div>
                  <button
                    onClick={removeVoucher}
                    className="p-1 text-stone-400 hover:text-red-600"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input
                    type="text"
                    disabled={!user}
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    placeholder="Nhập mã (HUONGVI10, FREESHIP, VIP50)..."
                    className="min-w-0 flex-1 px-4 py-2.5 rounded-2xl text-xs bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 placeholder:text-stone-500 dark:placeholder:text-stone-400 uppercase focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                  <button
                    type="submit"
                    disabled={!user}
                    className="px-5 py-2.5 rounded-2xl bg-stone-900 dark:bg-stone-700 text-white text-xs font-bold hover:bg-black transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {t("applyCoupon")}
                  </button>
                </form>
              )}

              {!user && (
                <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                  <Link href="/tai-khoan" className="font-bold underline underline-offset-2">
                    Đăng nhập
                  </Link>{" "}
                  để sử dụng mã ưu đãi hoặc voucher.
                </p>
              )}

              {couponError && (
                <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                  {couponError}
                </p>
              )}
            </div>
          </div>

          {/* Right Column: Customer Info & Checkout Form (5 cols) */}
          <div className="lg:col-span-5 min-w-0" id="checkout">
            <form
              onSubmit={handlePlaceOrder}
              className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-6 sm:p-8 shadow-xl space-y-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-extrabold text-lg text-stone-900 dark:text-stone-100">
                  {t("checkoutTitle")}
                </h2>
                {user && (
                  <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                    <UserCheck size={14} />
                    <span className="min-w-0 break-all">Đã đăng nhập ({user.name})</span>
                  </div>
                )}
              </div>

              <div className="space-y-3.5 text-xs">
                <div>
                  <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                    {t("fullName")}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                    placeholder="Nguyễn Văn A"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 placeholder:text-stone-500 dark:placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                      {t("phone")}
                    </label>
                    <input
                      type="tel"
                      required
                      inputMode="numeric"
                      maxLength={10}
                      pattern="[0-9]{10}"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          phone: e.target.value.replace(/\D/g, "").slice(0, 10),
                        })
                      }
                      placeholder="0988888888"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 placeholder:text-stone-500 dark:placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                      {t("city")}
                    </label>
                    <ProvinceSelect value={formData.province} onChange={(province) => setFormData({ ...formData, province })} />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                    {t("address")}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    placeholder="Số 88, Đường Làng Chài, Phường Bến Nghé"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 placeholder:text-stone-500 dark:placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                    {t("orderNote")}
                  </label>
                  <textarea
                    rows={2}
                    value={formData.note}
                    onChange={(e) =>
                      setFormData({ ...formData, note: e.target.value })
                    }
                    placeholder="Giao hàng giờ hành chính, đóng gói cẩn thận..."
                    className="w-full px-3.5 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 placeholder:text-stone-500 dark:placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Payment Methods */}
              <div className="space-y-2">
                <label className="font-bold text-xs text-stone-900 dark:text-stone-100 uppercase tracking-wider block">
                  {t("paymentMethod")}
                </label>

                <div className="space-y-2 text-xs">
                  <label
                    className={`flex items-center gap-3 p-3 rounded-2xl border-2 cursor-pointer transition-all ${
                      formData.paymentMethod === "vietqr"
                        ? "border-red-700 bg-red-50/60 dark:border-amber-400 dark:bg-amber-950/30"
                        : "border-stone-200 dark:border-stone-800"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      checked={formData.paymentMethod === "vietqr"}
                      onChange={() =>
                        setFormData({ ...formData, paymentMethod: "vietqr" })
                      }
                      className="text-red-700 focus:ring-red-600"
                    />
                    <div className="flex items-center gap-2 font-bold text-stone-800 dark:text-stone-200">
                      <QrCode size={16} className="text-red-700 dark:text-amber-400" />
                      <span>{t("paymentVietQR")} (Cửa hàng đối soát)</span>
                    </div>
                  </label>

                  <label
                    className={`flex items-center gap-3 p-3 rounded-2xl border-2 cursor-pointer transition-all ${
                      formData.paymentMethod === "cod"
                        ? "border-red-700 bg-red-50/60 dark:border-amber-400 dark:bg-amber-950/30"
                        : "border-stone-200 dark:border-stone-800"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      checked={formData.paymentMethod === "cod"}
                      onChange={() =>
                        setFormData({ ...formData, paymentMethod: "cod" })
                      }
                      className="text-red-700 focus:ring-red-600"
                    />
                    <div className="flex items-center gap-2 font-bold text-stone-800 dark:text-stone-200">
                      <Truck size={16} className="text-stone-600 dark:text-stone-300" />
                      <span>{t("paymentCOD")}</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Cost Summary */}
              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 space-y-2 text-xs">
                <div className="flex justify-between text-stone-600 dark:text-stone-400">
                  <span>{t("subtotal")}</span>
                  <span className="font-bold text-stone-900 dark:text-stone-100">
                    {formatCurrency(subtotal, language)}
                  </span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                    <span>{t("discount")}</span>
                    <span>-{formatCurrency(discount, language)}</span>
                  </div>
                )}

                <div className="flex justify-between text-stone-600 dark:text-stone-400">
                  <span>{t("shipping")}</span>
                  <span className="font-bold text-stone-900 dark:text-stone-100">
                    {shippingFee === 0 ? (
                      <span className="text-emerald-600 font-bold">
                        {t("freeShipping")}
                      </span>
                    ) : (
                      formatCurrency(shippingFee, language)
                    )}
                  </span>
                </div>

                <div className="pt-2 border-t border-stone-200 dark:border-stone-700 flex justify-between items-baseline text-base">
                  <span className="font-bold text-stone-900 dark:text-stone-100">
                    {t("total")}
                  </span>
                  <span className="font-black text-2xl text-red-700 dark:text-amber-400">
                    {formatCurrency(total, language)}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-red-700 via-red-600 to-amber-600 hover:from-red-800 hover:to-amber-700 text-white font-black text-sm tracking-wide shadow-xl hover:scale-102 transition-all duration-200 flex items-center justify-center gap-2"
              >
                <span>
                  {formData.paymentMethod === "vietqr"
                    ? "Mở Cổng Thanh Toán QR"
                    : t("placeOrder")}
                </span>
                <ArrowRight size={16} />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Interactive VietQR Scanning Modal */}
      {pendingVietQROrder && (
        <VietQRModal
          key={pendingVietQROrder._id}
          isOpen={isVietQRModalOpen}
          order={pendingVietQROrder}
          onSuccess={handleVietQRSuccess}
          onClose={() => {
            setIsVietQRModalOpen(false);
            setPendingVietQROrder(null);
          }}
        />
      )}
    </motion.div>
  );
}
