"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/common/BrandLogo";
import { motion } from "framer-motion";
import {
  User,
  ShoppingBag,
  Heart,
  MapPin,
  Lock,
  Mail,
  LogOut,
  Plus,
  Trash2,
  ShieldCheck,
  ArrowRight,
  Eye,
  EyeOff,
  Check,
  Pencil,
  X,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import { useLanguage } from "@/context/LanguageContext";
import { formatCurrency, formatDateTime } from "@/utils/formatters";
import { ProductCard } from "@/components/product/ProductCard";
import { Order } from "@/types";
import { AUTH_TRANSITION_EVENT } from "@/components/common/AuthTransitionOverlay";
import { AvatarEditor } from "@/components/common/AvatarEditor";
import { AvatarChangeButton } from "@/components/common/AvatarChangeButton";
import { DEFAULT_AVATAR } from "@/lib/mediaUpload";
import { ProvinceSelect } from "@/components/common/ProvinceSelect";
import type { UserAddress } from "@/types";

export default function AccountPage() {
  const {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    updateProfile,
    addAddress,
    updateAddress,
    removeAddress,
  } = useAuth();

  const { products } = useData();
  const { language, loc } = useLanguage();

  // Auth Mode State (login / register)
  const [authTab, setAuthTab] = useState<"login" | "register">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [termsAccepted, setTermsAccepted] = useState(true);

  // Form states
  const [loginInput, setLoginInput] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");
  const [authSubmitting, setAuthSubmitting] = useState(false);

  // Portal Tab State
  type PortalTab = "orders" | "profile" | "addresses" | "wishlist";
  const [portalTab, setPortalTab] = useState<PortalTab>("orders");
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [orderPage, setOrderPage] = useState(1);
  const [orderPagination, setOrderPagination] = useState({ total: 0, pages: 1 });
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersRefreshKey, setOrdersRefreshKey] = useState(0);
  const [orderActionError, setOrderActionError] = useState("");
  const [orderActionBusy, setOrderActionBusy] = useState<string | null>(null);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [editAddress, setEditAddress] = useState("");
  const [editProvince, setEditProvince] = useState("");
  const [editNote, setEditNote] = useState("");

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const loadOrders = async () => {
      setOrdersLoading(true);
      try {
        const response = await fetch(`/api/orders?page=${orderPage}&limit=10`, { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Không thể tải lịch sử đơn hàng.");
        if (!cancelled) {
          setUserOrders(Array.isArray(data.orders) ? data.orders : []);
          setOrderPagination({ total: Number(data.pagination?.total || 0), pages: Number(data.pagination?.pages || 1) });
        }
      } catch (error) {
        if (!cancelled) console.error("Failed to load customer orders", error);
      } finally {
        if (!cancelled) setOrdersLoading(false);
      }
    };
    void loadOrders();
    return () => { cancelled = true; };
  }, [user, orderPage, ordersRefreshKey]);

  useEffect(() => {
    const syncOrders = (event: StorageEvent) => {
      if (event.key === "hv_orders_changed") setOrdersRefreshKey((value) => value + 1);
    };
    window.addEventListener("storage", syncOrders);
    return () => window.removeEventListener("storage", syncOrders);
  }, []);

  const publishOrderChange = () => localStorage.setItem("hv_orders_changed", String(Number(localStorage.getItem("hv_orders_changed") || "0") + 1));

  const replaceOrderFromServer = (updated: Order) => {
    setUserOrders((orders) => orders.map((order) => order._id === updated._id ? updated : order));
    publishOrderChange();
  };

  const handleCancelOrder = async (order: Order) => {
    if (!window.confirm(`Bạn có chắc muốn hủy đơn #${order.orderCode} không?`)) return;
    setOrderActionError("");
    setOrderActionBusy(order._id);
    try {
      const response = await fetch(`/api/orders/${order._id}/cancel`, { method: "PUT" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Không thể hủy đơn hàng.");
      replaceOrderFromServer(data as Order);
    } catch (error) {
      setOrderActionError(error instanceof Error ? error.message : "Không thể hủy đơn hàng.");
      setOrdersRefreshKey((value) => value + 1);
    } finally {
      setOrderActionBusy(null);
    }
  };

  const openAddressEditor = (order: Order) => {
    setOrderActionError("");
    setEditingOrder(order);
    setEditAddress(order.address);
    setEditProvince(order.province);
    setEditNote(order.note || "");
  };

  const handleSaveOrderAddress = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingOrder) return;
    setOrderActionError("");
    setOrderActionBusy(editingOrder._id);
    try {
      const response = await fetch(`/api/orders/${editingOrder._id}/address`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: editAddress, province: editProvince, note: editNote }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Không thể cập nhật địa chỉ.");
      replaceOrderFromServer(data as Order);
      setEditingOrder(null);
    } catch (error) {
      setOrderActionError(error instanceof Error ? error.message : "Không thể cập nhật địa chỉ.");
      setOrdersRefreshKey((value) => value + 1);
    } finally {
      setOrderActionBusy(null);
    }
  };

  // New Address modal state
  const [isAddingAddr, setIsAddingAddr] = useState(false);
  const [newAddrLabel, setNewAddrLabel] = useState("Nhà riêng");
  const [newAddrReceiver, setNewAddrReceiver] = useState("");
  const [newAddrPhone, setNewAddrPhone] = useState("");
  const [newAddrText, setNewAddrText] = useState("");
  const [newAddrProvince, setNewAddrProvince] = useState("");
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressActionError, setAddressActionError] = useState("");
  const [addressActionBusy, setAddressActionBusy] = useState<string | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthSubmitting(true);
    const res = await login(loginInput, loginPassword);
    if (!res.success) {
      setAuthError(res.message || "Đăng nhập thất bại.");
      setAuthSubmitting(false);
    } else {
      const returnPath = sessionStorage.getItem("hv_return_after_login");
      sessionStorage.removeItem("hv_return_after_login");
      setAuthSubmitting(false);
      window.dispatchEvent(new CustomEvent(AUTH_TRANSITION_EVENT, { detail: { kind: "login", destination: returnPath || "/" } }));
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthSubmitting(true);

    if (regPassword !== regConfirmPassword) {
      setAuthError("Mật khẩu xác nhận không khớp. Vui lòng nhập lại!");
      setAuthSubmitting(false);
      return;
    }

    if (!termsAccepted) {
      setAuthError("Vui lòng đồng ý với Điều khoản sử dụng và Chính sách bảo mật!");
      setAuthSubmitting(false);
      return;
    }

    const res = await register(regName, regEmail, regPassword);
    if (!res.success) {
      setAuthError(res.message || "Đăng ký thất bại.");
      setAuthSubmitting(false);
    } else {
      setAuthSuccess("Đăng ký tài khoản thành công!");
      const returnPath = sessionStorage.getItem("hv_return_after_login");
      sessionStorage.removeItem("hv_return_after_login");
      setAuthSubmitting(false);
      window.dispatchEvent(new CustomEvent(AUTH_TRANSITION_EVENT, { detail: { kind: "register", name: regName.trim(), destination: returnPath || "/" } }));
    }
  };

  const handleAddAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (addressActionBusy) return;
    if (!newAddrProvince) { setAddressActionError('Vui lòng chọn tỉnh / thành phố.'); return; }
    if (!/^[0-9]{10}$/.test(newAddrPhone)) { setAddressActionError('Số điện thoại phải gồm đúng 10 chữ số.'); return; }

    setAddressActionError("");
    setAddressActionBusy("add");
    const addressData = {
      label: newAddrLabel,
      receiverName: newAddrReceiver,
      phone: newAddrPhone,
      address: newAddrText,
      province: newAddrProvince,
      isDefault: false,
    };
    const result = editingAddressId ? await updateAddress(editingAddressId, addressData) : await addAddress(addressData);

    setAddressActionBusy(null);
    if (!result.success) {
      setAddressActionError(result.message || "Không thể lưu địa chỉ.");
      return;
    }

    setIsAddingAddr(false);
    setNewAddrText("");
    setNewAddrReceiver("");
    setNewAddrPhone("");
    setNewAddrProvince("");
    setEditingAddressId(null);
  };

  const openSavedAddressEditor = (address?: UserAddress) => {
    setEditingAddressId(address?.id || null);
    setNewAddrLabel(address?.label || "Nhà riêng");
    setNewAddrReceiver(address?.receiverName || "");
    setNewAddrPhone(address?.phone || "");
    setNewAddrText(address?.address || "");
    setNewAddrProvince(address?.province || "");
    setAddressActionError("");
    setIsAddingAddr(true);
  };

  const handleRemoveAddress = async (addressId: string) => {
    if (addressActionBusy) return;
    setAddressActionError("");
    setAddressActionBusy(addressId);
    const result = await removeAddress(addressId);
    setAddressActionBusy(null);
    if (!result.success) setAddressActionError(result.message || "Không thể xóa địa chỉ.");
    else if (editingAddressId === addressId) { setIsAddingAddr(false); setEditingAddressId(null); }
  };

  // ---------------- GIAO DIỆN CHƯA ĐĂNG NHẬP (LOGIN / REGISTER) ----------------
  if (isLoading) {
    return <div className="min-h-[60vh] flex items-center justify-center bg-stone-50 text-sm font-bold text-stone-500 dark:bg-stone-950 dark:text-stone-400">Đang tải thông tin tài khoản...</div>;
  }

  if (!isAuthenticated || !user) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.992 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 150, damping: 22, mass: 0.75 }}
        className="min-h-[calc(100vh-120px)] bg-stone-50 dark:bg-[#0a0707] py-8 sm:py-14 px-4 sm:px-6 lg:px-8 flex items-center justify-center relative overflow-hidden transition-colors duration-300"
      >
        {/* Subtle Ambient Background Light */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-96 h-96 bg-gradient-to-b from-amber-500/10 dark:from-amber-600/15 via-red-600/5 dark:via-red-700/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-[420px] space-y-6 relative z-10">
          {/* Header Branding */}
          <div className="text-center space-y-3">
            <Link href="/" className="inline-block group">
              <BrandLogo eager className="h-28 w-28 sm:h-32 sm:w-32 mx-auto" />
            </Link>
            <div>
              <h2 className="font-black text-2xl tracking-wide text-stone-900 dark:text-white">
                HƯƠNG VỊ <span className="text-red-700 dark:text-[#f59e0b]">TUYỆT SẮC</span>
              </h2>
              <p className="text-xs text-stone-600 dark:text-stone-400 font-medium mt-1">
                Cổng Tài Khoản Khách Hàng Thân Thiết
              </p>
            </div>
          </div>

          {/* Form Card */}
          <div className="bg-white dark:bg-[#140f0f] rounded-[28px] border border-stone-200/90 dark:border-stone-800/90 p-5 sm:p-7 shadow-2xl space-y-5">
            {/* Tabs Switcher */}
            <div className="grid grid-cols-2 p-1 rounded-2xl bg-stone-100 dark:bg-[#0c0909] border border-stone-200 dark:border-stone-800/80 text-xs sm:text-sm font-bold">
              <button
                type="button"
                onClick={() => {
                  setAuthTab("login");
                  setAuthError("");
                  setAuthSuccess("");
                }}
                className={`py-3 rounded-xl transition-all active:scale-[0.98] ${
                  authTab === "login"
                    ? "bg-gradient-to-r from-[#b81818] via-[#c22e0a] to-[#ea580c] text-white shadow-md"
                    : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white"
                }`}
              >
                Đăng Nhập
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthTab("register");
                  setAuthError("");
                  setAuthSuccess("");
                }}
                className={`py-3 rounded-xl transition-all active:scale-[0.98] ${
                  authTab === "register"
                    ? "bg-gradient-to-r from-[#b81818] via-[#c22e0a] to-[#ea580c] text-white shadow-md"
                    : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white"
                }`}
              >
                Tạo Tài Khoản
              </button>
            </div>

            {/* Login Form */}
            {authTab === "login" && (
              <form onSubmit={handleLoginSubmit} className="space-y-4 pt-1">
                {/* Email / Phone Field */}
                <div>
                  <label className="font-bold text-xs sm:text-sm text-stone-800 dark:text-stone-200 block mb-2">
                    Email hoặc Số điện thoại *
                  </label>
                  <div className="flex items-center gap-3 px-4 py-3 sm:py-3.5 rounded-2xl bg-stone-50 dark:bg-[#0c0909] border border-stone-200 dark:border-stone-800/90 focus-within:border-amber-500/80 focus-within:ring-1 focus-within:ring-amber-500/40 transition-all">
                    <Mail size={18} className="text-stone-400 shrink-0" />
                    <input
                      type="text"
                      required
                      value={loginInput}
                      onChange={(e) => setLoginInput(e.target.value)}
                      placeholder="Nhập email hoặc số điện thoại"
                      className="w-full bg-transparent text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 text-sm focus:outline-none"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="font-bold text-xs sm:text-sm text-stone-800 dark:text-stone-200">
                      Mật khẩu *
                    </label>
                    <Link href="/quen-mat-khau" className="text-xs text-amber-700 dark:text-[#f59e0b] hover:underline font-semibold">
                      {language === "vi" ? "Quên mật khẩu?" : "Forgot password?"}
                    </Link>
                  </div>
                  <div className="flex items-center gap-3 px-4 py-3 sm:py-3.5 rounded-2xl bg-stone-50 dark:bg-[#0c0909] border border-stone-200 dark:border-stone-800/90 focus-within:border-amber-500/80 focus-within:ring-1 focus-within:ring-amber-500/40 transition-all">
                    <Lock size={18} className="text-stone-400 shrink-0" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Nhập mật khẩu"
                      className="w-full bg-transparent text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 text-sm focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors p-1"
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Remember Me Checkbox */}
                <div className="flex items-center gap-2.5 pt-0.5">
                  <button
                    type="button"
                    onClick={() => setRememberMe(!rememberMe)}
                    className={`w-4 h-4 rounded-sm flex items-center justify-center transition-all ${
                      rememberMe
                        ? "bg-[#ea580c] text-white"
                        : "bg-white dark:bg-[#0c0909] border border-stone-300 dark:border-stone-700"
                    }`}
                  >
                    {rememberMe && <Check size={12} className="stroke-[3]" />}
                  </button>
                  <span
                    onClick={() => setRememberMe(!rememberMe)}
                    className="text-xs sm:text-sm font-medium text-stone-700 dark:text-stone-300 cursor-pointer select-none"
                  >
                    Ghi nhớ đăng nhập
                  </span>
                </div>

                {authError && (
                  <div className="p-3 rounded-xl bg-red-100 dark:bg-red-950/60 border border-red-200 dark:border-red-800/60 text-xs text-red-700 dark:text-red-300 font-medium">
                    {authError}
                  </div>
                )}

                {/* Login Button */}
                <button
                  type="submit"
                  disabled={authSubmitting}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#b81818] via-[#c22e0a] to-[#ea580c] hover:from-[#a01414] hover:to-[#d94e08] text-white font-bold text-sm sm:text-base tracking-wide shadow-lg shadow-red-700/25 transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-2 disabled:cursor-wait disabled:opacity-70"
                >
                  {authSubmitting ? <><Loader2 size={18} className="animate-spin motion-reduce:animate-none" /><span>Đang đăng nhập...</span></> : <><span>Đăng Nhập Ngay</span><ArrowRight size={18} /></>}
                </button>

              </form>
            )}

            {/* Register Form */}
            {authTab === "register" && (
              <form onSubmit={handleRegisterSubmit} className="space-y-3.5 pt-1">
                {/* Name */}
                <div>
                  <label className="font-bold text-xs sm:text-sm text-stone-800 dark:text-stone-200 block mb-1.5">
                    Họ và tên *
                  </label>
                  <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-stone-50 dark:bg-[#0c0909] border border-stone-200 dark:border-stone-800/90 focus-within:border-amber-500/80 focus-within:ring-1 focus-within:ring-amber-500/40 transition-all">
                    <User size={18} className="text-stone-400 shrink-0" />
                    <input
                      type="text"
                      required
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="Nhập họ và tên"
                      className="w-full bg-transparent text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 text-sm focus:outline-none"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="font-bold text-xs sm:text-sm text-stone-800 dark:text-stone-200 block mb-1.5">
                    Email *
                  </label>
                  <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-stone-50 dark:bg-[#0c0909] border border-stone-200 dark:border-stone-800/90 focus-within:border-amber-500/80 focus-within:ring-1 focus-within:ring-amber-500/40 transition-all">
                    <Mail size={18} className="text-stone-400 shrink-0" />
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="Nhập email của bạn"
                      className="w-full bg-transparent text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 text-sm focus:outline-none"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="font-bold text-xs sm:text-sm text-stone-800 dark:text-stone-200 block mb-1.5">
                    Mật khẩu *
                  </label>
                  <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-stone-50 dark:bg-[#0c0909] border border-stone-200 dark:border-stone-800/90 focus-within:border-amber-500/80 focus-within:ring-1 focus-within:ring-amber-500/40 transition-all">
                    <Lock size={18} className="text-stone-400 shrink-0" />
                    <input
                      type={showRegPassword ? "text" : "password"}
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Tạo mật khẩu"
                      className="w-full bg-transparent text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 text-sm focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors p-1"
                      aria-label="Toggle password visibility"
                    >
                      {showRegPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="font-bold text-xs sm:text-sm text-stone-800 dark:text-stone-200 block mb-1.5">
                    Xác nhận mật khẩu *
                  </label>
                  <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-stone-50 dark:bg-[#0c0909] border border-stone-200 dark:border-stone-800/90 focus-within:border-amber-500/80 focus-within:ring-1 focus-within:ring-amber-500/40 transition-all">
                    <Lock size={18} className="text-stone-400 shrink-0" />
                    <input
                      type={showRegConfirmPassword ? "text" : "password"}
                      required
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="Nhập lại mật khẩu"
                      className="w-full bg-transparent text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 text-sm focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                      className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors p-1"
                      aria-label="Toggle password visibility"
                    >
                      {showRegConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Terms Agreement Checkbox */}
                <div className="flex items-start gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setTermsAccepted(!termsAccepted)}
                    className={`w-4 h-4 rounded-sm flex items-center justify-center mt-0.5 shrink-0 transition-all ${
                      termsAccepted
                        ? "bg-[#ea580c] text-white"
                        : "bg-white dark:bg-[#0c0909] border border-stone-300 dark:border-stone-700"
                    }`}
                  >
                    {termsAccepted && <Check size={12} className="stroke-[3]" />}
                  </button>
                  <span className="text-xs text-stone-600 dark:text-stone-300 leading-snug">
                    Tôi đồng ý với{" "}
                    <span
                      onClick={() => alert("Điều khoản sử dụng dịch vụ Hương Vị Tuyệt Sắc.")}
                      className="text-amber-700 dark:text-[#f59e0b] font-semibold hover:underline cursor-pointer"
                    >
                      Điều khoản sử dụng
                    </span>{" "}
                    và{" "}
                    <span
                      onClick={() => alert("Chính sách bảo mật dữ liệu người dùng.")}
                      className="text-amber-700 dark:text-[#f59e0b] font-semibold hover:underline cursor-pointer"
                    >
                      Chính sách bảo mật
                    </span>
                  </span>
                </div>

                {authError && (
                  <div className="p-3 rounded-xl bg-red-100 dark:bg-red-950/60 border border-red-200 dark:border-red-800/60 text-xs text-red-700 dark:text-red-300 font-medium">
                    {authError}
                  </div>
                )}

                {authSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 text-xs text-emerald-800 dark:text-emerald-300 font-medium">
                    {authSuccess}
                  </div>
                )}

                {/* Register Button */}
                <button
                  type="submit"
                  disabled={authSubmitting}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#b81818] via-[#c22e0a] to-[#ea580c] hover:from-[#a01414] hover:to-[#d94e08] text-white font-bold text-sm sm:text-base tracking-wide shadow-lg shadow-red-950/60 transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-2 disabled:cursor-wait disabled:opacity-70"
                >
                  {authSubmitting ? <><Loader2 size={18} className="animate-spin motion-reduce:animate-none" /><span>Đang tạo tài khoản...</span></> : <><span>Tạo Tài Khoản</span><ArrowRight size={18} /></>}
                </button>
              </form>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  // Wishlist products
  const wishlistProducts = products.filter((p) => user.wishlist?.includes(p._id));

  const portalNavItems: Array<{ id: PortalTab; label: string; icon: typeof ShoppingBag; count?: number }> = [
    { id: "orders", label: "Lịch sử đơn hàng", icon: ShoppingBag, count: orderPagination.total },
    { id: "profile", label: "Thông tin cá nhân", icon: User },
    { id: "addresses", label: "Sổ địa chỉ nhận hàng", icon: MapPin, count: user.addresses?.length },
    { id: "wishlist", label: "Sản phẩm yêu thích", icon: Heart, count: user.wishlist?.length },
  ];

  // ---------------- GIAO DIỆN ĐÃ ĐĂNG NHẬP (USER DASHBOARD PORTAL) ----------------
  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 pb-24 pt-6 sm:pt-8">
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
        {/* User Hero Banner Card */}
        <div className="bg-gradient-to-r from-red-950 via-stone-900 to-amber-950 text-white rounded-3xl p-5 sm:p-8 border border-stone-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-5 sm:gap-6">
          <div className="flex items-center gap-3.5 sm:gap-6">
            <div className="relative shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={user.avatar || DEFAULT_AVATAR}
                alt={user.name}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-amber-400 shadow-lg"
              />
              <AvatarChangeButton avatar={user.avatar} />
            </div>

            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-2xl font-black truncate">{user.name}</h1>
                <span className={`px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black shrink-0 ${user.role === "admin" ? "bg-red-600 text-white" : "bg-amber-400 text-stone-950"}`}>
                  {user.role === "admin" ? "ADMIN MEMBER" : "MEMBER"}
                </span>
              </div>
              <p className="text-xs text-stone-300 flex items-center gap-2 flex-wrap truncate">
                <span>{user.email}</span>
                <span className="hidden sm:inline">•</span>
                <span>{user.phone}</span>
              </p>
            </div>
          </div>

          <button
            onClick={logout}
            className="self-end md:self-auto flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-stone-200 hover:text-white transition-colors border border-white/10 shrink-0 active:scale-95"
          >
            <LogOut size={14} />
            <span>Đăng xuất</span>
          </button>
        </div>

        {/* Mobile Navigation Tabs (Grid 2x2 on small screens) */}
        <div className="lg:hidden grid grid-cols-2 gap-2">
          {portalNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = portalTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setPortalTab(item.id)}
                className={`flex items-center justify-between p-3 rounded-2xl text-xs font-bold transition-all active:scale-98 ${
                  isActive
                    ? "bg-gradient-to-r from-red-700 to-amber-600 text-white shadow-md"
                    : "bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-800"
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <Icon size={16} className="shrink-0" />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.count !== undefined && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full shrink-0 ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-stone-100 dark:bg-stone-800 text-stone-500"
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
          {/* Desktop Sidebar Nav (3 cols) */}
          <div className="hidden lg:block lg:col-span-3 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-3 shadow-sm space-y-1">
            {portalNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = portalTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setPortalTab(item.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl text-xs font-bold transition-all ${
                    isActive
                      ? "bg-gradient-to-r from-red-700 to-amber-600 text-white shadow-md"
                      : "text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon size={16} />
                    <span>{item.label}</span>
                  </div>
                  {item.count !== undefined && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-stone-100 dark:bg-stone-800 text-stone-500"
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab Content (9 cols) */}
          <div className="lg:col-span-9">
            {/* 1. ORDERS TAB */}
            {portalTab === "orders" && (
              <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-4 sm:p-8 shadow-sm space-y-5 sm:space-y-6">
                <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-4">
                  <h3 className="font-extrabold text-sm sm:text-base text-stone-900 dark:text-white">
                    Đơn Hàng Của Bạn ({orderPagination.total})
                  </h3>
                  <Link
                    href="/danh-muc/all"
                    className="text-xs font-bold text-red-700 dark:text-amber-400 hover:underline flex items-center gap-1"
                  >
                    <span>Tiếp tục mua sắm</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>

                {orderActionError && (
                  <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300">
                    {orderActionError}
                  </div>
                )}

                {ordersLoading ? (
                  <div className="py-12 text-center text-xs text-stone-500">Đang tải lịch sử đơn hàng...</div>
                ) : userOrders.length === 0 ? (
                  <div className="py-12 text-center text-xs text-stone-500 space-y-3">
                    <ShoppingBag size={36} className="mx-auto text-stone-400" />
                    <p>Bạn chưa có đơn hàng nào.</p>
                    <Link
                      href="/danh-muc/all"
                      className="inline-block px-5 py-2 rounded-xl bg-red-700 text-white font-bold"
                    >
                      Khám phá sản phẩm
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {userOrders.map((order) => (
                      <div
                        key={order._id}
                        className="p-5 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700/70 space-y-4"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-stone-200/60 dark:border-stone-700/60 text-xs">
                          <div>
                            <span className="font-mono font-bold text-red-700 dark:text-amber-400 text-sm">
                              #{order.orderCode}
                            </span>
                            <span className="text-stone-400 ml-2">
                              {formatDateTime(order.createdAt, language)}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                order.status === "delivered" || order.status === "confirmed"
                                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                                  : order.status === "shipping"
                                  ? "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
                                  : order.status === "cancelled"
                                  ? "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300"
                                  : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                              }`}
                            >
                              {order.status === "delivered"
                                ? "Đã giao thành công"
                                : order.status === "shipping"
                                ? "Đang vận chuyển"
                                : order.status === "confirmed"
                                ? "Đã xác nhận thanh toán"
                                : order.status === "cancelled"
                                ? "Đã hủy"
                                : "Chờ xử lý"}
                            </span>
                          </div>
                        </div>

                        {/* Items in order */}
                        <div className="divide-y divide-stone-200/40 dark:divide-stone-700/40">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                              <div className="flex items-center gap-3">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={item.image}
                                  alt={loc(item.productName)}
                                  className="w-12 h-12 rounded-xl object-cover border border-stone-200 dark:border-stone-700"
                                />
                                <div>
                                  <div className="font-bold text-stone-900 dark:text-stone-100">
                                    {loc(item.productName)}
                                  </div>
                                  {item.variantLabel && (
                                    <span className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold">
                                      {loc(item.variantLabel)}
                                    </span>
                                  )}
                                  <div className="text-[11px] text-stone-400">
                                    SL: {item.quantity} x {formatCurrency(item.price, language)}
                                  </div>
                                </div>
                              </div>
                              <span className="font-bold text-stone-900 dark:text-stone-100">
                                {formatCurrency(item.price * item.quantity, language)}
                              </span>
                            </div>
                          ))}
                        </div>

                        <div className="flex justify-between items-baseline pt-2 border-t border-stone-200/60 dark:border-stone-700/60 text-xs">
                          <span className="text-stone-500">
                            Phương thức: <strong className="uppercase">{order.paymentMethod}</strong>
                          </span>
                          <div>
                            <span className="text-stone-500 mr-2">Tổng tiền:</span>
                            <strong className="text-base font-black text-red-700 dark:text-amber-400">
                              {formatCurrency(order.total, language)}
                            </strong>
                          </div>
                        </div>
                        <div className="grid gap-2 rounded-xl bg-white/60 p-3 text-[11px] text-stone-600 dark:bg-stone-900/50 dark:text-stone-300 sm:grid-cols-2">
                          <span><strong>Giao đến:</strong> {order.address}, {order.province}</span>
                          {order.note && <span><strong>Ghi chú:</strong> {order.note}</span>}
                          <span><strong>Thanh toán:</strong> {order.paymentStatus === "paid" ? "Đã thanh toán" : order.paymentStatus === "refunded" ? "Đã hoàn tiền" : order.paymentStatus === "failed" ? "Thanh toán thất bại" : "Chưa thanh toán"}</span>
                          <span><strong>Tạm tính:</strong> {formatCurrency(order.subtotal, language)}</span>
                          <span><strong>Giảm giá:</strong> -{formatCurrency(order.discount, language)}</span>
                          <span><strong>Phí giao hàng:</strong> {formatCurrency(order.shippingFee, language)}</span>
                          {order.voucherCode && <span><strong>Coupon:</strong> {order.voucherCode}</span>}
                        </div>
                        {order.status === "pending" && (
                          <div className="flex flex-col gap-2 border-t border-stone-200/60 pt-3 dark:border-stone-700/60 sm:flex-row sm:justify-end">
                            <button type="button" disabled={orderActionBusy === order._id} onClick={() => openAddressEditor(order)} className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-xs font-bold text-stone-700 transition hover:border-amber-500 hover:text-amber-700 disabled:cursor-wait disabled:opacity-50 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-200 dark:hover:border-amber-500 dark:hover:text-amber-300">
                              <Pencil size={14} /> Sửa địa chỉ
                            </button>
                            <button type="button" disabled={orderActionBusy === order._id || order.paymentStatus === "paid"} onClick={() => void handleCancelOrder(order)} title={order.paymentStatus === "paid" ? "Đơn đã thanh toán, vui lòng liên hệ cửa hàng nếu cần hỗ trợ." : undefined} className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-red-300 bg-red-50 px-4 py-2.5 text-xs font-bold text-red-700 transition hover:bg-red-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-800 dark:hover:text-white">
                              <Trash2 size={14} /> Hủy đơn
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                    {orderPagination.pages > 1 && <div className="flex items-center justify-center gap-3 pt-3 text-xs">
                      <button disabled={orderPage <= 1 || ordersLoading} onClick={() => setOrderPage((page) => page - 1)} className="rounded-xl border border-stone-300 px-4 py-2 font-bold disabled:cursor-not-allowed disabled:opacity-40 dark:border-stone-700">Trang trước</button>
                      <span className="font-bold text-stone-600 dark:text-stone-300">{orderPage}/{orderPagination.pages}</span>
                      <button disabled={orderPage >= orderPagination.pages || ordersLoading} onClick={() => setOrderPage((page) => page + 1)} className="rounded-xl border border-stone-300 px-4 py-2 font-bold disabled:cursor-not-allowed disabled:opacity-40 dark:border-stone-700">Trang sau</button>
                    </div>}
                  </div>
                )}
              </div>
            )}

            {/* 2. PROFILE TAB */}
            {portalTab === "profile" && (
              <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-4 sm:p-8 shadow-sm space-y-5 sm:space-y-6">
                <h3 className="font-extrabold text-sm sm:text-base text-stone-900 dark:text-white border-b border-stone-200 dark:border-stone-800 pb-3">
                  Thông Tin Cá Nhân
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1.5">
                      Họ và tên
                    </label>
                    <input
                      type="text"
                      defaultValue={user.name}
                      onBlur={(e) => updateProfile({ name: e.target.value })}
                      className="w-full p-3 sm:p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 text-base sm:text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1.5">
                      Email
                    </label>
                    <input
                      type="email"
                      defaultValue={user.email}
                      onBlur={(e) => updateProfile({ email: e.target.value })}
                      className="w-full p-3 sm:p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 text-base sm:text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>

                  <AvatarEditor key={`${user.id}-${user.avatar}`} avatar={user.avatar} />
                </div>

                <div className="p-3.5 sm:p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-xs text-emerald-800 dark:text-emerald-300 font-semibold flex items-center gap-2">
                  <ShieldCheck size={18} className="shrink-0" />
                  <span>Dữ liệu tài khoản của bạn được bảo mật tuyệt đối theo tiêu chuẩn SSL.</span>
                </div>
              </div>
            )}

            {/* 3. ADDRESSES TAB */}
            {portalTab === "addresses" && (
              <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-4 sm:p-8 shadow-sm space-y-5 sm:space-y-6">
                <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
                  <h3 className="font-extrabold text-sm sm:text-base text-stone-900 dark:text-white">
                    Sổ Địa Chỉ Giao Hàng ({user.addresses?.length || 0})
                  </h3>

                  <button
                    onClick={() => openSavedAddressEditor()}
                    disabled={Boolean(addressActionBusy)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-red-700 to-amber-600 text-white text-xs font-bold hover:from-red-800 hover:to-amber-700 shadow-sm active:scale-95 transition-all"
                  >
                    <Plus size={14} />
                    <span>Thêm địa chỉ</span>
                  </button>
                </div>

                {isAddingAddr && (
                  <form
                    onSubmit={handleAddAddressSubmit}
                    className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 space-y-3 text-xs"
                  >
                    <h4 className="font-bold text-amber-900 dark:text-amber-200">
                      {editingAddressId ? "Chỉnh sửa địa chỉ giao nhận" : "Thêm địa chỉ giao nhận mới"}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <input
                        type="text"
                        placeholder="Nhãn (Nhà riêng, Văn phòng...)"
                        value={newAddrLabel}
                        onChange={(e) => setNewAddrLabel(e.target.value)}
                        className="p-2.5 rounded-xl bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-600 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-400/20 transition-colors min-w-0 text-base sm:text-xs"
                      />
                      <input
                        type="text"
                        placeholder="Tên người nhận"
                        required
                        value={newAddrReceiver}
                        onChange={(e) => setNewAddrReceiver(e.target.value)}
                        className="p-2.5 rounded-xl bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-600 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-400/20 transition-colors min-w-0 text-base sm:text-xs"
                      />
                      <input
                        type="tel"
                        placeholder="Số điện thoại"
                        required
                        value={newAddrPhone}
                        inputMode="numeric" pattern="[0-9]{10}" minLength={10} maxLength={10} title="Số điện thoại phải gồm đúng 10 chữ số" onChange={(e) => setNewAddrPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                        className="p-2.5 rounded-xl bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-600 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-400/20 transition-colors min-w-0 text-base sm:text-xs"
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="Địa chỉ chi tiết (Số nhà, tên đường, phường/xã)..."
                      required
                      value={newAddrText}
                      onChange={(e) => setNewAddrText(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-600 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-400/20 transition-colors min-w-0 text-base sm:text-xs"
                    />
                    <div className="space-y-1.5"><p className="font-bold text-stone-700 dark:text-stone-200">Tỉnh / Thành phố *</p><ProvinceSelect value={newAddrProvince} onChange={setNewAddrProvince} /></div>
                    <p className="text-stone-500 dark:text-stone-400">Địa chỉ được lưu vào tài khoản sau khi bấm Lưu và chỉ bị xóa khi bạn chọn biểu tượng thùng rác.</p>
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsAddingAddr(false)}
                        disabled={Boolean(addressActionBusy)}
                        className="px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 font-bold"
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        disabled={addressActionBusy === "add"}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-700 to-amber-600 text-white font-bold hover:from-red-800 hover:to-amber-700 active:scale-95 transition-all shadow-sm disabled:cursor-wait disabled:opacity-60"
                      >
                        {addressActionBusy === "add" ? "Đang lưu..." : "Lưu địa chỉ"}
                      </button>
                    </div>
                  </form>
                )}

                {addressActionError && (
                  <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300">
                    {addressActionError}
                  </div>
                )}

                <div className="space-y-3">
                  {user.addresses?.map((addr) => (
                    <div
                      key={addr.id}
                      className="p-4 sm:p-5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/70 flex items-start justify-between gap-3 text-xs transition-all hover:border-amber-500/40"
                    >
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-stone-900 dark:text-stone-100">
                            {addr.receiverName}
                          </span>
                          <span className="text-stone-500 dark:text-stone-400 font-mono text-xs">
                            ({addr.phone})
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full bg-stone-200 dark:bg-stone-700 text-[11px] font-semibold text-stone-700 dark:text-stone-300 whitespace-nowrap">
                            {addr.label || "Địa chỉ"}
                          </span>
                          {addr.isDefault && (
                            <span className="px-2.5 py-0.5 rounded-full bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-amber-400 border border-red-300 dark:border-red-900/60 text-[10px] font-bold whitespace-nowrap">
                              Mặc định
                            </span>
                          )}
                        </div>
                        <p className="text-stone-600 dark:text-stone-300 leading-relaxed text-xs sm:text-sm">
                          {addr.address}, {addr.province}
                        </p>
                      </div>

                      <div className="flex shrink-0 gap-1">
                      <button type="button" onClick={() => openSavedAddressEditor(addr)} disabled={Boolean(addressActionBusy)} aria-label={`Sửa địa chỉ ${addr.label}`} title="Sửa địa chỉ" className="p-2 rounded-xl text-stone-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/50 transition-colors">
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => void handleRemoveAddress(addr.id)}
                        disabled={Boolean(addressActionBusy)}
                        className="p-2 rounded-xl text-stone-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors shrink-0"
                        title="Xóa địa chỉ"
                      >
                        {addressActionBusy === addr.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                      </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. WISHLIST TAB */}
            {portalTab === "wishlist" && (
              <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-4 sm:p-8 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
                  <h3 className="font-extrabold text-sm sm:text-base text-stone-900 dark:text-white flex items-center gap-2">
                    <Heart size={18} className="fill-red-600 text-red-600" />
                    <span>Sản Phẩm Yêu Thích ({wishlistProducts.length})</span>
                  </h3>
                  <Link
                    href="/danh-muc/all"
                    className="text-xs font-bold text-red-700 dark:text-amber-400 hover:underline flex items-center gap-1"
                  >
                    <span>Khám phá thêm</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>

                {wishlistProducts.length === 0 ? (
                  <div className="py-14 text-center text-xs text-stone-500 space-y-3">
                    <div className="w-14 h-14 rounded-full bg-red-50 dark:bg-red-950/40 text-red-500 flex items-center justify-center mx-auto shadow-inner">
                      <Heart size={24} className="text-red-400" />
                    </div>
                    <div className="font-bold text-stone-800 dark:text-stone-200 text-sm">
                      Chưa có sản phẩm yêu thích nào
                    </div>
                    <p className="text-stone-500 dark:text-stone-400 max-w-sm mx-auto">
                      Hãy nhấn biểu tượng trái tim (thả tim) trên các sản phẩm bạn thích để lưu lại và xem nhanh tại đây!
                    </p>
                    <Link
                      href="/danh-muc/all"
                      className="inline-block px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-700 to-amber-600 text-white font-bold text-xs shadow-md hover:from-red-800 hover:to-amber-700 transition-all active:scale-95 mt-2"
                    >
                      Dạo xem sản phẩm ngay
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                    {wishlistProducts.map((p) => (
                      <ProductCard key={p._id} product={p} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {editingOrder && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <form onSubmit={handleSaveOrderAddress} className="w-full max-w-lg space-y-4 rounded-3xl border border-stone-200 bg-white p-5 shadow-2xl dark:border-stone-700 dark:bg-stone-900 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div><h2 className="text-lg font-black text-stone-900 dark:text-white">Sửa địa chỉ giao hàng</h2><p className="mt-1 text-xs text-stone-500">Đơn #{editingOrder.orderCode} · chỉ sửa được khi còn chờ xử lý</p></div>
              <button type="button" onClick={() => setEditingOrder(null)} className="rounded-xl p-2 text-stone-500 transition hover:bg-stone-100 dark:hover:bg-stone-800" aria-label="Đóng"><X size={18} /></button>
            </div>
            {orderActionError && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300">{orderActionError}</div>}
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-200">Địa chỉ chi tiết *<textarea required value={editAddress} onChange={(event) => setEditAddress(event.target.value)} maxLength={300} rows={3} className="mt-1.5 w-full resize-none rounded-xl border border-stone-300 bg-stone-50 px-3 py-2.5 text-sm font-normal text-stone-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 dark:border-stone-700 dark:bg-stone-950 dark:text-white" /></label>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-200">Tỉnh/Thành phố *<input required value={editProvince} onChange={(event) => setEditProvince(event.target.value)} maxLength={100} className="mt-1.5 w-full rounded-xl border border-stone-300 bg-stone-50 px-3 py-2.5 text-sm font-normal text-stone-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 dark:border-stone-700 dark:bg-stone-950 dark:text-white" /></label>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-200">Ghi chú giao hàng<textarea value={editNote} onChange={(event) => setEditNote(event.target.value)} maxLength={500} rows={3} className="mt-1.5 w-full resize-none rounded-xl border border-stone-300 bg-stone-50 px-3 py-2.5 text-sm font-normal text-stone-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 dark:border-stone-700 dark:bg-stone-950 dark:text-white" /></label>
            <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end"><button type="button" onClick={() => setEditingOrder(null)} className="rounded-xl border border-stone-300 px-4 py-2.5 text-xs font-bold dark:border-stone-700">Không lưu</button><button type="submit" disabled={orderActionBusy === editingOrder._id} className="rounded-xl bg-gradient-to-r from-red-700 to-amber-600 px-5 py-2.5 text-xs font-bold text-white shadow-md disabled:cursor-wait disabled:opacity-60">{orderActionBusy === editingOrder._id ? "Đang lưu..." : "Lưu địa chỉ"}</button></div>
          </form>
        </div>
      )}
    </div>
  );
}
