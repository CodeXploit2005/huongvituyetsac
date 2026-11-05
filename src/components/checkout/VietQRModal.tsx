"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  QrCode,
  CheckCircle2,
  Clock,
  Copy,
  Check,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Loader2,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Order } from "@/types";
import { useLanguage } from "@/context/LanguageContext";
import { buildVietQRUrl, VIETQR_BANK } from "@/lib/vietqr";
import { formatCurrency, formatDateTime } from "@/utils/formatters";

interface VietQRModalProps {
  isOpen: boolean;
  order: Order;
  onSuccess: (updatedOrder: Order) => void;
  onClose: () => void;
}

export const VietQRModal: React.FC<VietQRModalProps> = ({
  isOpen,
  order,
  onSuccess,
  onClose,
}) => {
  const { language } = useLanguage();

  const [paymentStep, setPaymentStep] = useState<"scanning" | "verifying" | "success">("scanning");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(600); // 10 minutes
  const [paymentError, setPaymentError] = useState("");
  const confirming = useRef(false);
  const qrRequestKey = `${order.orderCode}:${order.total}`;
  const [qrImageState, setQrImageState] = useState<{
    requestKey: string;
    status: "loading" | "loaded" | "error";
    retryAttempt: number;
  }>({ requestKey: qrRequestKey, status: "loading", retryAttempt: 0 });

  // Treat a new order as a fresh request immediately, without waiting for an effect.
  // The request key also prevents late load/error events from an old QR changing the new QR state.
  const activeQrImageState = qrImageState.requestKey === qrRequestKey
    ? qrImageState
    : { requestKey: qrRequestKey, status: "loading" as const, retryAttempt: 0 };
  const qrUrl = buildVietQRUrl(order.total, order.orderCode, activeQrImageState.retryAttempt);

  // Countdown timer
  useEffect(() => {
    if (!isOpen || paymentStep === "success") return;
    const expiresAt = order.checkoutExpiresAt || Date.now() + 600_000;
    const interval = setInterval(() => {
      setSecondsLeft(Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000)));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, paymentStep, order.checkoutExpiresAt]);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && paymentStep === "scanning" && secondsLeft === 0 && !paymentError) {
      onClose();
    }
  }, [isOpen, onClose, paymentStep, secondsLeft, paymentError]);

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleConfirmPayment = async () => {
    if (confirming.current) return;
    confirming.current = true;
    setPaymentError("");
    setPaymentStep("verifying");
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checkoutToken: order.checkoutToken }),
      });
      const updated = await response.json();
      if (!response.ok) throw new Error(updated.error || "Không thể gửi thông báo chuyển khoản.");
      setPaymentStep("success");
      onSuccess(updated as Order);
    } catch (error) {
      setPaymentError(error instanceof Error ? error.message : "Lỗi kết nối. Vui lòng thử lại.");
      setPaymentStep("scanning");
    } finally {
      confirming.current = false;
    }
  };

  const handleRetryQr = () => {
    setQrImageState((current) => ({
      requestKey: qrRequestKey,
      status: "loading",
      retryAttempt: current.requestKey === qrRequestKey ? current.retryAttempt + 1 : 1,
    }));
  };

  if (!isOpen) return null;

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  return createPortal(
    <div role="dialog" aria-modal="true" aria-label="Thanh toán QR" className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-start justify-center p-3 sm:p-4 overflow-y-auto overscroll-contain">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 w-full max-w-2xl my-auto shrink-0 shadow-2xl overflow-hidden"
      >
        {/* Top Header */}
        <div className="bg-gradient-to-r from-red-900 via-stone-900 to-amber-900 text-white p-5 sm:p-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
              <QrCode size={22} />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg leading-tight">
                Cổng Thanh Toán QR 24/7
              </h3>
              <p className="text-[11px] text-amber-300">
                Chuyển khoản và chờ cửa hàng đối soát
              </p>
            </div>
          </div>

          {paymentStep !== "success" && (
            <button
              type="button"
              aria-label="Đóng thanh toán QR"
              disabled={paymentStep === "verifying"}
              onClick={onClose}
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-stone-300 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 space-y-6">
          <AnimatePresence mode="wait">
            {/* Step 1: Scanning Mode */}
            {paymentStep === "scanning" && (
              <motion.div
                key="scanning"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                {/* Timer & Alert */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-amber-900 dark:text-amber-300">
                    <Clock size={15} />
                    <span>Giao dịch hết hạn sau:</span>
                  </div>
                  <span className="font-mono font-black text-red-700 dark:text-amber-400 text-sm">
                    {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
                  </span>
                </div>

                {/* QR Code Container with Radar Laser Scanner */}
                <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-3xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700">
                  <div className="relative w-[202px] h-[202px] p-3 bg-white rounded-2xl shadow-lg border border-stone-200 shrink-0 overflow-hidden flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      key={qrUrl}
                      src={qrUrl}
                      alt={`Mã QR thanh toán đơn ${order.orderCode}`}
                      className={`w-44 h-44 object-contain ${activeQrImageState.status === "loaded" ? "block" : "hidden"}`}
                      onLoad={() => setQrImageState({ ...activeQrImageState, status: "loaded" })}
                      onError={() => setQrImageState({ ...activeQrImageState, status: "error" })}
                    />
                    {activeQrImageState.status === "loading" && (
                      <div className="absolute inset-3 flex flex-col items-center justify-center gap-2 text-stone-500 text-xs text-center" role="status">
                        <Loader2 size={28} className="text-amber-500 animate-spin" />
                        <span>Đang tạo mã QR...</span>
                      </div>
                    )}
                    {activeQrImageState.status === "error" && (
                      <div className="absolute inset-3 flex flex-col items-center justify-center gap-2 px-2 text-stone-600 text-xs text-center" role="alert">
                        <QrCode size={30} className="text-red-700" />
                        <span>Không tải được mã QR. Vui lòng kiểm tra mạng và thử lại.</span>
                        <button
                          type="button"
                          onClick={handleRetryQr}
                          className="rounded-lg bg-red-700 px-3 py-1.5 font-bold text-white hover:bg-red-800 transition-colors"
                        >
                          Thử lại
                        </button>
                      </div>
                    )}
                    {activeQrImageState.status === "loaded" && <div className="qr-laser-beam" />}
                  </div>

                  {/* Account details */}
                  <div className="flex-1 min-w-0 space-y-2.5 text-xs w-full [&>div]:gap-2 [&>div]:flex-wrap">
                    <div className="flex justify-between items-center pb-1.5 border-b border-stone-200 dark:border-stone-700">
                      <span className="text-stone-400">Ngân hàng:</span>
                      <strong className="text-stone-900 dark:text-stone-100 font-bold">
                        {VIETQR_BANK.name}
                      </strong>
                    </div>

                    <div className="flex justify-between items-center pb-1.5 border-b border-stone-200 dark:border-stone-700">
                      <span className="text-stone-400">Số tài khoản:</span>
                      <div className="flex items-center gap-1.5">
                        <strong className="font-mono font-black text-red-700 dark:text-amber-400 text-sm">
                          {VIETQR_BANK.formattedAccountNumber}
                        </strong>
                        <button
                          type="button"
                          onClick={() => handleCopy(VIETQR_BANK.accountNumber, "stk")}
                          className="p-1 rounded hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-500"
                          title="Sao chép STK"
                        >
                          {copiedField === "stk" ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pb-1.5 border-b border-stone-200 dark:border-stone-700">
                      <span className="text-stone-400">Số tiền:</span>
                      <strong className="font-black text-sm text-red-700 dark:text-amber-400">
                        {formatCurrency(order.total, language)}
                      </strong>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-stone-400">Nội dung CK:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-extrabold bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 px-2 py-0.5 rounded border border-amber-300 dark:border-amber-800">
                          {order.orderCode}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(order.orderCode, "memo")}
                          className="p-1 rounded hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-500"
                          title="Sao chép nội dung"
                        >
                          {copiedField === "memo" ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Instructions */}
                <div className="p-3 rounded-2xl bg-stone-100 dark:bg-stone-800/80 text-[11px] text-stone-500 dark:text-stone-400 space-y-1">
                  <div className="flex items-center gap-1.5 text-stone-800 dark:text-stone-200 font-bold">
                    <ShieldCheck size={14} className="text-emerald-600" />
                    <span>Hướng dẫn quét mã thanh toán:</span>
                  </div>
                  <p>1. Mở App ngân hàng và chọn Quét QR.</p>
                  <p>2. Quét mã phía trên, kiểm tra đúng Techcombank và tài khoản {VIETQR_BANK.formattedAccountNumber}.</p>
                  <p>3. Kiểm tra số tiền và nội dung chuyển khoản đã được điền sẵn trước khi chuyển.</p>
                  <p>4. Sau khi chuyển tiền thành công, bấm nút xác nhận bên dưới.</p>
                </div>

                <p className="text-xs text-stone-500 dark:text-stone-400">Đơn hàng chỉ được gửi khi bạn bấm xác nhận bên dưới. Đóng cửa sổ sẽ giữ nguyên giỏ hàng.</p>
                {paymentError && <p role="alert" className="text-sm text-red-700 dark:text-red-400">{paymentError}</p>}
                {/* Confirm Action Button */}
                <button
                  type="button"
                  onClick={handleConfirmPayment}
                  className="w-full py-3.5 sm:py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs sm:text-sm tracking-wide shadow-xl flex items-center justify-center gap-2 transition-all active:scale-98"
                >
                  <CheckCircle2 size={18} />
                  <span>Tôi đã quét mã và chuyển tiền xong</span>
                </button>
              </motion.div>
            )}

            {/* Step 2: Verifying Transaction */}
            {paymentStep === "verifying" && (
              <motion.div
                key="verifying"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="py-12 text-center space-y-4"
              >
                <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                  <Loader2 size={54} className="text-amber-500 animate-spin" />
                  <Sparkles size={24} className="absolute text-red-600" />
                </div>
                <h4 className="font-extrabold text-lg text-stone-900 dark:text-white">
                  Đang ghi nhận thông báo chuyển khoản...
                </h4>
                <p className="text-xs text-stone-500 max-w-xs mx-auto">
                  Đơn <strong>{order.orderCode}</strong> sẽ tiếp tục ở trạng thái chờ xử lý cho đến khi Admin kiểm tra tiền thực nhận.
                </p>
              </motion.div>
            )}

            {/* Step 3: Success Mode */}
            {paymentStep === "success" && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                className="text-center space-y-6"
              >
                {/* Animated Green Checkmark Circle */}
                <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-xl ring-8 ring-emerald-500/20">
                  <CheckCircle2 size={48} strokeWidth={2.5} />
                </div>

                <div>
                  <span className="px-3 py-1 rounded-full text-[10px] font-black bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                    Đang chờ đối soát
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-white mt-2">
                    Đã Gửi Thông Báo Chuyển Khoản
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                    Admin sẽ kiểm tra tài khoản ngân hàng. Chỉ sau khi tiền được xác nhận, đơn hàng mới chuyển sang “Đã xác nhận thanh toán”.
                  </p>
                </div>

                {/* Receipt Card */}
                <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 text-left text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-stone-400">Mã đơn hàng:</span>
                    <strong className="font-mono text-red-700 dark:text-amber-400 font-bold">
                      {order.orderCode}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-400">Trạng thái:</span>
                    <strong className="text-amber-700 dark:text-amber-300">Chờ Admin xác nhận</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-400">Số tiền cần đối soát:</span>
                    <strong className="font-black text-sm text-amber-700 dark:text-amber-400">
                      {formatCurrency(order.total, language)}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-400">Thời gian gửi thông báo:</span>
                    <span>{formatDateTime(new Date().toISOString(), language)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <Link
                    href="/tai-khoan"
                    onClick={onClose}
                    className="py-3 px-4 rounded-xl border border-stone-300 dark:border-stone-700 text-xs font-bold text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                  >
                    Xem lịch sử đơn hàng
                  </Link>

                  <Link
                    href="/"
                    onClick={onClose}
                    className="py-3 px-4 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5"
                  >
                    <span>Tiếp tục mua sắm</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>,
    document.body,
  );
};
