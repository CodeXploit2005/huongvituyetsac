"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  Plus,
  ArrowRight,
  ShoppingBag,
  ChevronDown,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { formatCurrency, formatDateTime } from "@/utils/formatters";
import { AdminAnalyticsCharts } from "@/components/admin/AdminAnalyticsCharts";
import { Order } from "@/types";

const statusOptions: Array<{ value: Order["status"]; label: string; color: string }> = [
  { value: "pending", label: "Chờ xử lý", color: "text-orange-300" },
  { value: "confirmed", label: "Đã xác nhận thanh toán", color: "text-amber-300" },
  { value: "shipping", label: "Đang giao hàng", color: "text-sky-300" },
  { value: "delivered", label: "Đã giao", color: "text-emerald-300" },
  { value: "cancelled", label: "Đã hủy", color: "text-red-300" },
];

function StatusMenu({ order, onChange }: { order: Order; onChange: (status: Order["status"]) => void }) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ left: 0, top: 0, width: 220 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const current = statusOptions.find((option) => option.value === order.status) || statusOptions[0];

  const toggle = () => {
    if (open) return setOpen(false);
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      const width = Math.min(Math.max(rect.width, 220), window.innerWidth - 16);
      const menuHeight = statusOptions.length * 42 + 12;
      const openAbove = window.innerHeight - rect.bottom < menuHeight && rect.top > menuHeight;
      setPosition({
        left: window.scrollX + Math.max(8, Math.min(rect.left, window.innerWidth - width - 8)),
        top: window.scrollY + (openAbove ? rect.top - menuHeight - 8 : rect.bottom + 8),
        width,
      });
    }
    setOpen(true);
  };

  return <div>
    <button ref={buttonRef} type="button" onClick={toggle} aria-haspopup="listbox" aria-expanded={open} className={`flex min-h-9 w-full items-center justify-between gap-3 rounded-xl border border-stone-600 bg-[#080b11] px-3 py-2 text-left text-[11px] font-extrabold shadow-sm outline-none transition hover:border-amber-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 ${current.color}`}>
      <span className="truncate">{current.label}</span><ChevronDown size={15} className={`shrink-0 text-stone-300 transition-transform ${open ? "rotate-180" : ""}`} />
    </button>
    {open && createPortal(<>
      <button type="button" aria-label="Đóng danh sách trạng thái" onClick={() => setOpen(false)} className="fixed inset-0 z-[90] cursor-default bg-transparent" />
      <div role="listbox" className="absolute z-[100] overflow-hidden rounded-2xl border border-stone-600 bg-[#11151f] p-1.5 shadow-2xl shadow-black/60" style={position}>
        {statusOptions.map((option) => <button key={option.value} type="button" role="option" aria-selected={option.value === order.status} onClick={() => { onChange(option.value); setOpen(false); }} className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-xs font-bold transition ${option.value === order.status ? "bg-amber-500 text-stone-950" : `${option.color} hover:bg-white/10 hover:text-white`}`}>
          <span className={`h-2 w-2 shrink-0 rounded-full ${option.value === "pending" ? "bg-orange-400" : option.value === "confirmed" ? "bg-amber-400" : option.value === "shipping" ? "bg-sky-400" : option.value === "delivered" ? "bg-emerald-400" : "bg-red-400"}`} />
          {option.label}
        </button>)}
      </div>
    </>, document.body)}
  </div>;
}

export default function AdminDashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [totalOrders, setTotalOrders] = useState(0);
  const { language, t } = useLanguage();

  useEffect(() => {
    const loadRecentOrders = () => fetch("/api/orders?scope=admin&page=1&limit=5", { cache: "no-store" })
      .then(async (response) => { const data = await response.json(); if (!response.ok) throw new Error(data.error); setOrders(data.orders || []); setTotalOrders(data.pagination?.total || 0); })
      .catch((error) => console.error("Failed to load recent orders", error));
    void loadRecentOrders();
    const syncOrders = (event: StorageEvent) => { if (event.key === "hv_orders_changed") void loadRecentOrders(); };
    window.addEventListener("storage", syncOrders);
    return () => window.removeEventListener("storage", syncOrders);
  }, []);

  const updateOrderStatus = async (orderId: string, status: Order["status"]) => {
    const response = await fetch("/api/orders", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: orderId, status }) });
    const data = await response.json();
    if (!response.ok) return alert(data.error || "Không thể cập nhật trạng thái.");
    setOrders((current) => current.map((order) => order._id === data._id ? data : order));
    localStorage.setItem("hv_orders_changed", String(Number(localStorage.getItem("hv_orders_changed") || "0") + 1));
    window.dispatchEvent(new Event("orders:updated"));
  };

  return (
    <div className="admin-dashboard space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-stone-950 dark:text-white tracking-tight">
              {t("admin.dashboard")}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-red-600/20 text-red-400 border border-red-500/30">
              LIVE 2026
            </span>
          </div>
          <p className="text-xs text-stone-600 dark:text-stone-400 mt-1">
            Tổng quan hiệu suất kinh doanh & báo cáo doanh số thương hiệu Hương Vị Tuyệt Sắc
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/admin/san-pham"
            prefetch={false}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-red-600 via-red-700 to-amber-600 hover:brightness-110 text-white text-xs font-bold transition-all shadow-lg shadow-red-950/50 active:scale-95"
          >
            <Plus size={15} />
            <span>{t("admin.addProduct")}</span>
          </Link>
        </div>
      </div>

      {/* Main Bento Analytics Dashboard (KPIs, Growth Combo Chart, Donut, Top Ranking) */}
      <AdminAnalyticsCharts />

      {/* Recent Orders Section (Dark Styled) */}
      <div className="admin-surface bg-[#10141e] rounded-3xl border border-[#1e2638] p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#3b82f6]/20 text-[#3b82f6] flex items-center justify-center">
              <ShoppingBag size={16} />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">
                Đơn Hàng Gần Đây
              </h3>
              <p className="text-[11px] text-stone-400">
                Ghi nhận các giao dịch mới nhất từ khách hàng
              </p>
            </div>
          </div>

          <Link
            href="/admin/don-hang"
            prefetch={false}
            className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
          >
            <span>Xem tất cả ({totalOrders})</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="p-8 text-center text-xs text-stone-500 bg-[#0b0e17] rounded-2xl border border-[#1e2638]">
            Chưa có đơn hàng nào phát sinh. Đặt thử một đơn hàng ngoài Storefront để xem cập nhật real-time tại đây!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="select-none border-b border-stone-200 bg-stone-100 text-stone-600 uppercase tracking-wider dark:border-[#1e2638] dark:bg-[#0b0e17]/60 dark:text-stone-400">
                <tr>
                  <th className="py-3 px-4 rounded-l-xl">Mã Đơn</th>
                  <th className="py-3 px-4">Khách Hàng</th>
                  <th className="py-3 px-4">Thanh Toán</th>
                  <th className="py-3 px-4">Tổng Tiền</th>
                  <th className="py-3 px-4">Trạng Thái</th>
                  <th className="py-3 px-4 rounded-r-xl">Thời Gian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 font-medium dark:divide-[#1e2638]">
                {orders.slice(0, 5).map((order) => (
                  <tr key={order._id} className="transition-colors hover:bg-amber-50/70 dark:hover:bg-[#151b2a]">
                    <td className="py-3.5 px-4 font-bold text-amber-400">
                      {order.orderCode}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-stone-900 font-bold dark:text-stone-200">{order.customerName}</div>
                      <div className="text-stone-600 text-[11px] dark:text-stone-400">{order.phone}</div>
                    </td>
                    <td className="py-3.5 px-4 uppercase text-[11px] text-stone-700 font-bold dark:text-stone-300">
                      {order.paymentMethod}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-[#10b981]">
                      {formatCurrency(order.total, language)}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusMenu order={order} onChange={(status) => void updateOrderStatus(order._id, status)} />
                    </td>
                    <td className="py-3.5 px-4 text-stone-600 dark:text-stone-400">
                      {formatDateTime(order.createdAt, language)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
