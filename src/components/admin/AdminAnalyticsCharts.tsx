"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  DollarSign,
  ShoppingBag,
  Package,
  ImageIcon,
  TrendingUp,
  Award,
  ArrowRight,
  Calendar,
  PieChart as PieIcon,
  CreditCard,
} from "lucide-react";
import { motion } from "framer-motion";
import { formatCurrency } from "@/utils/formatters";

type GrowthPoint = { label: string; revenue: number; orders: number };
type AnalyticsData = {
  year: number;
  kpis: {
    totalRevenue: number; totalOrders: number; completionRate: number; avgOrderValue: number;
    growthRate: number; totalProducts: number; totalCategories: number; activeBanners: number; totalBanners: number;
  };
  growthData: Record<"7days" | "30days" | "year", GrowthPoint[]>;
  categoryBreakdown: Array<{ id: string; name: string; revenue: number; percentage: number; color: string }>;
  topProducts: Array<{ id: string; name: string; revenue: number; soldQty: number; image: string }>;
};

export const AdminAnalyticsCharts: React.FC = () => {
  const [timeRange, setTimeRange] = useState<"7days" | "30days" | "year">("year");
  const [activeHoverIndex, setActiveHoverIndex] = useState<number | null>(null);
  const [liveAnalytics, setLiveAnalytics] = useState<AnalyticsData | null>(null);

  // Fetch live MongoDB analytics computed on-the-fly
  React.useEffect(() => {
    async function loadAnalytics() {
      try {
        const res = await fetch("/api/admin/analytics");
        if (res.ok) {
          const data = await res.json();
          setLiveAnalytics(data);
        }
      } catch (e) {
        console.error("Failed to load live analytics", e);
      }
    }
    loadAnalytics();
    window.addEventListener("orders:updated", loadAnalytics);
    return () => window.removeEventListener("orders:updated", loadAnalytics);
  }, []);

  // Chỉ hiển thị dữ liệu thật do máy chủ tổng hợp; không dùng số mẫu dự phòng.
  const growthData = useMemo(() => {
    return (liveAnalytics?.growthData?.[timeRange] || []).map((point) => ({
      ...point,
      revFormatted: formatCurrency(point.revenue, "vi"),
    }));
  }, [timeRange, liveAnalytics]);

  const maxRevenue = Math.max(1, ...growthData.map((point) => point.revenue));
  const maxOrders = Math.max(1, ...growthData.map((point) => point.orders));

  const categoryShare = (liveAnalytics?.categoryBreakdown || []).map((category) => ({
    ...category, percent: category.percentage, amount: formatCurrency(category.revenue, "vi"),
  }));
  const topProductsList = (liveAnalytics?.topProducts || []).map((product, index) => ({
    ...product, rank: index + 1, sold: product.soldQty.toLocaleString("vi-VN"), revenueLabel: formatCurrency(product.revenue, "vi"),
  }));
  const kpis = liveAnalytics?.kpis;

  return (
    <div className="admin-analytics space-y-6 text-stone-900 dark:text-stone-100 font-sans">
      {/* ========================================================
          1. TOP ROW: 4 KPI CARDS WITH GLOWING NEON SPARKLINES
         ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: Tổng Doanh Thu */}
        <div className="bg-[#10141e] rounded-3xl border border-[#1e2638] p-5 sm:p-6 shadow-xl flex flex-col justify-between relative overflow-hidden group hover:border-[#10b981]/50 transition-all duration-300">
          <div className="space-y-2 relative z-10">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                TỔNG DOANH THU
              </span>
              <div className="w-9 h-9 rounded-full bg-[#10b981]/20 text-[#10b981] flex items-center justify-center font-black shadow-sm">
                <DollarSign size={18} />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {formatCurrency(kpis?.totalRevenue || 0, "vi")}
            </div>
            <div className="text-xs font-bold text-[#10b981] flex items-center gap-1">
              <span>{(kpis?.growthRate || 0) >= 0 ? "▲" : "▼"} {Math.abs(kpis?.growthRate || 0)}% so với tháng trước</span>
            </div>
          </div>

          {/* Neon Green Sparkline Wave */}
          <div className="pt-4 -mx-5 -mb-5 relative h-16">
            <svg viewBox="0 0 200 60" preserveAspectRatio="none" className="w-full h-full">
              <defs>
                <linearGradient id="gradGreen" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path
                d="M 0 45 Q 25 30, 50 48 T 100 28 T 150 40 T 200 20 L 200 60 L 0 60 Z"
                fill="url(#gradGreen)"
              />
              <path
                d="M 0 45 Q 25 30, 50 48 T 100 28 T 150 40 T 200 20"
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
                strokeLinecap="round"
                className="filter drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]"
              />
            </svg>
          </div>
        </div>

        {/* Card 2: Tổng Đơn Hàng */}
        <div className="bg-[#10141e] rounded-3xl border border-[#1e2638] p-5 sm:p-6 shadow-xl flex flex-col justify-between relative overflow-hidden group hover:border-[#3b82f6]/50 transition-all duration-300">
          <div className="space-y-2 relative z-10">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                TỔNG ĐƠN HÀNG
              </span>
              <div className="w-9 h-9 rounded-full bg-[#3b82f6]/20 text-[#3b82f6] flex items-center justify-center font-black shadow-sm">
                <ShoppingBag size={18} />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {(kpis?.totalOrders || 0).toLocaleString("vi-VN")} <span className="text-base font-semibold">đơn hàng</span>
            </div>
            <div className="text-xs text-stone-400 font-medium">
              Tỉ lệ hoàn thành {kpis?.completionRate || 0}%
            </div>
          </div>

          {/* Neon Blue Sparkline Wave */}
          <div className="pt-4 -mx-5 -mb-5 relative h-16">
            <svg viewBox="0 0 200 60" preserveAspectRatio="none" className="w-full h-full">
              <defs>
                <linearGradient id="gradBlue" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path
                d="M 0 50 Q 30 35, 60 52 T 110 32 T 160 42 T 200 22 L 200 60 L 0 60 Z"
                fill="url(#gradBlue)"
              />
              <path
                d="M 0 50 Q 30 35, 60 52 T 110 32 T 160 42 T 200 22"
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2.5"
                strokeLinecap="round"
                className="filter drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]"
              />
            </svg>
          </div>
        </div>

        {/* Card 3: Sản Phẩm Trong Kho */}
        <div className="bg-[#10141e] rounded-3xl border border-[#1e2638] p-5 sm:p-6 shadow-xl flex flex-col justify-between relative overflow-hidden group hover:border-[#f59e0b]/50 transition-all duration-300">
          <div className="space-y-2 relative z-10">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                SẢN PHẨM TRONG KHO
              </span>
              <div className="w-9 h-9 rounded-full bg-[#f59e0b]/20 text-[#f59e0b] flex items-center justify-center font-black shadow-sm">
                <Package size={18} />
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {(kpis?.totalProducts || 0).toLocaleString("vi-VN")} <span className="text-base font-semibold">mã</span>
              </div>
              <p className="text-xs text-stone-400 font-medium mt-0.5">
                Số sản phẩm hiện có
              </p>
            </div>
            <div className="text-xs text-stone-400 font-medium">
              Phân bố trong {kpis?.totalCategories || 0} nhóm danh mục
            </div>
          </div>

          {/* Neon Orange Sparkline Wave */}
          <div className="pt-4 -mx-5 -mb-5 relative h-16">
            <svg viewBox="0 0 200 60" preserveAspectRatio="none" className="w-full h-full">
              <defs>
                <linearGradient id="gradOrange" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path
                d="M 0 40 Q 35 55, 70 38 T 120 48 T 170 30 T 200 42 L 200 60 L 0 60 Z"
                fill="url(#gradOrange)"
              />
              <path
                d="M 0 40 Q 35 55, 70 38 T 120 48 T 170 30 T 200 42"
                fill="none"
                stroke="#f59e0b"
                strokeWidth="2.5"
                strokeLinecap="round"
                className="filter drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]"
              />
            </svg>
          </div>
        </div>

        {/* Card 4: Banner Đang Chạy */}
        <div className="bg-[#10141e] rounded-3xl border border-[#1e2638] p-5 sm:p-6 shadow-xl flex flex-col justify-between relative overflow-hidden group hover:border-[#a855f7]/50 transition-all duration-300">
          <div className="space-y-2 relative z-10">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                BANNER ĐANG CHẠY
              </span>
              <div className="w-9 h-9 rounded-full bg-[#a855f7]/20 text-[#a855f7] flex items-center justify-center font-black shadow-sm">
                <ImageIcon size={18} />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {kpis?.activeBanners || 0} / {kpis?.totalBanners || 0} <span className="text-base font-semibold">banner</span>
            </div>
            <div className="text-xs text-stone-400 font-medium">
              Đang hiển thị trên trang chủ
            </div>
          </div>

          {/* Neon Purple Sparkline Wave */}
          <div className="pt-4 -mx-5 -mb-5 relative h-16">
            <svg viewBox="0 0 200 60" preserveAspectRatio="none" className="w-full h-full">
              <defs>
                <linearGradient id="gradPurple" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#a855f7" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#a855f7" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path
                d="M 0 52 Q 25 35, 65 48 T 115 32 T 165 45 T 200 25 L 200 60 L 0 60 Z"
                fill="url(#gradPurple)"
              />
              <path
                d="M 0 52 Q 25 35, 65 48 T 115 32 T 165 45 T 200 25"
                fill="none"
                stroke="#a855f7"
                strokeWidth="2.5"
                strokeLinecap="round"
                className="filter drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* ========================================================
          2. MIDDLE MAIN BOX: GROWTH CHART COMBO (BARS + LINE)
         ======================================================== */}
      <div className="bg-[#10141e] rounded-3xl border border-[#1e2638] p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-amber-500 uppercase tracking-wider mb-1">
              <TrendingUp size={15} />
              <span>BÁO CÁO TĂNG TRƯỞNG</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Biểu Đồ Doanh Thu & Đơn Hàng
            </h2>
          </div>

          {/* Time Range Pills */}
          <div className="flex items-center gap-1.5 p-1 bg-[#0b0e17] border border-[#1e2638] rounded-2xl self-start md:self-auto">
            <button
              onClick={() => {
                setTimeRange("7days");
                setActiveHoverIndex(null);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                timeRange === "7days"
                  ? "bg-gradient-to-r from-red-600 to-amber-600 text-white shadow-md"
                  : "text-stone-400 hover:text-white"
              }`}
            >
              7 ngày qua
            </button>
            <button
              onClick={() => {
                setTimeRange("30days");
                setActiveHoverIndex(null);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                timeRange === "30days"
                  ? "bg-gradient-to-r from-red-600 to-amber-600 text-white shadow-md"
                  : "text-stone-400 hover:text-white"
              }`}
            >
              30 ngày qua
            </button>
            <button
              onClick={() => {
                setTimeRange("year");
                setActiveHoverIndex(null);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                timeRange === "year"
                  ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md"
                  : "text-stone-400 hover:text-white"
              }`}
            >
              <Calendar size={13} />
              <span>Năm {liveAnalytics?.year || new Date().getFullYear()}</span>
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center sm:justify-start gap-6 text-xs font-semibold">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#10b981] shadow-[0_0_6px_#10b981]" />
            <span className="text-stone-300">Doanh thu (đ)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#f59e0b] shadow-[0_0_6px_#f59e0b]" />
            <span className="text-stone-300">Đơn hàng (đơn)</span>
          </div>
        </div>

        {/* DUAL-AXIS COMBO CHART (SVG Canvas) */}
        <div className="relative pt-4 pb-2">
          <div className="relative h-64 sm:h-72 w-full flex">
            {/* Left Y-Axis (Revenue in M đ) */}
            <div className="h-full flex flex-col justify-between text-[11px] text-[#10b981] font-semibold pr-3 pb-7 select-none shrink-0">
              <span>{formatCurrency(maxRevenue, "vi")}</span>
              <span>{formatCurrency(maxRevenue * 0.75, "vi")}</span>
              <span>{formatCurrency(maxRevenue * 0.5, "vi")}</span>
              <span>{formatCurrency(maxRevenue * 0.25, "vi")}</span>
              <span>0 đ</span>
            </div>

            {/* Center Chart Plot Area */}
            <div className="relative flex-1 h-full pb-7">
              {/* Background Horizontal Grid Lines */}
              <div className="absolute inset-0 pb-7 flex flex-col justify-between pointer-events-none">
                <div className="border-b border-[#1e2638]/70 w-full" />
                <div className="border-b border-[#1e2638]/70 w-full" />
                <div className="border-b border-[#1e2638]/70 w-full" />
                <div className="border-b border-[#1e2638]/70 w-full" />
                <div className="border-b border-[#1e2638] w-full" />
              </div>

              {/* Bars + Overlay Line Points */}
              <div className="relative h-full flex items-end justify-between px-2 sm:px-4">
                {growthData.map((item, idx) => {
                  const barHeightPercent = (item.revenue / maxRevenue) * 100;
                  const isHovered = activeHoverIndex === idx;

                  return (
                    <div
                      key={idx}
                      onMouseEnter={() => setActiveHoverIndex(idx)}
                      className="relative flex-1 flex flex-col items-center justify-end h-full group cursor-pointer"
                    >
                      {/* Bar (Emerald Gradient) */}
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${barHeightPercent}%` }}
                        transition={{ duration: 0.7, delay: idx * 0.04, ease: "easeOut" }}
                        className={`w-full max-w-[28px] sm:max-w-[38px] rounded-t-xl transition-all duration-300 ${
                          isHovered
                            ? "bg-gradient-to-t from-[#059669] via-[#10b981] to-[#6ee7b7] shadow-[0_0_15px_rgba(16,185,129,0.7)] scale-105"
                            : "bg-gradient-to-t from-[#064e3b]/80 via-[#059669]/90 to-[#10b981] hover:brightness-110"
                        }`}
                      />

                      {/* X-Axis Month Label */}
                      <span
                        className={`absolute -bottom-6 text-[10px] sm:text-[11px] font-bold whitespace-nowrap transition-colors ${
                          isHovered ? "text-amber-400" : "text-stone-400"
                        }`}
                      >
                        {item.label}
                      </span>
                    </div>
                  );
                })}

                {/* SVG Connecting Line for Orders */}
                <svg
                  className="absolute inset-0 pb-7 w-full h-full pointer-events-none overflow-visible"
                  viewBox={`0 0 100 100`}
                  preserveAspectRatio="none"
                >
                  {/* Calculate SVG path coordinates */}
                  {(() => {
                    const step = 100 / growthData.length;
                    const points = growthData.map((d, i) => {
                      const x = i * step + step / 2;
                      const y = 100 - (d.orders / maxOrders) * 100;
                      return { x, y };
                    });

                    const pathStr = points.reduce((acc, p, i) => {
                      return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
                    }, "");

                    return (
                      <>
                        <path
                          d={pathStr}
                          fill="none"
                          stroke="#f59e0b"
                          strokeWidth="2"
                          className="filter drop-shadow-[0_0_6px_rgba(245,158,11,0.9)]"
                        />
                      </>
                    );
                  })()}
                </svg>

                {/* Golden Circle Dot Markers on each point */}
                {growthData.map((item, idx) => {
                  const step = 100 / growthData.length;
                  const leftPercent = idx * step + step / 2;
                  const bottomPercent = (item.orders / maxOrders) * 100;
                  const isHovered = activeHoverIndex === idx;

                  return (
                    <div
                      key={`dot-${idx}`}
                      style={{
                        left: `${leftPercent}%`,
                        bottom: `${bottomPercent}%`,
                        transform: "translate(-50%, 50%)",
                      }}
                      className="absolute z-10 pointer-events-none flex items-center justify-center"
                    >
                      <div
                        className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full border-2 border-white bg-[#f59e0b] shadow-[0_0_8px_#f59e0b] transition-transform ${
                          isHovered ? "scale-150 ring-4 ring-[#f59e0b]/40" : ""
                        }`}
                      />

                      {/* Tooltip Box when hovered */}
                      {isHovered && (
                        <div
                          className="absolute bottom-6 z-30 whitespace-nowrap px-3.5 py-2 rounded-xl bg-[#090d16] border border-amber-500/80 shadow-2xl flex flex-col gap-0.5 text-left pointer-events-none"
                          style={{
                            transform: "translateX(-50%)",
                            left: "50%",
                          }}
                        >
                          <div className="text-[11px] font-bold text-stone-300 pb-1 border-b border-stone-800">
                            {item.label}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-[#10b981] font-bold">
                            <div className="w-2 h-2 rounded-full bg-[#10b981]" />
                            <span>Doanh thu: {item.revFormatted}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-[#f59e0b] font-bold">
                            <div className="w-2 h-2 rounded-full bg-[#f59e0b]" />
                            <span>Đơn hàng: {item.orders} đơn</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Y-Axis (Orders in Units) */}
            <div className="h-full flex flex-col justify-between text-[11px] text-[#f59e0b] font-semibold pl-3 pb-7 select-none shrink-0 text-right">
              <span>{maxOrders}</span>
              <span>{Math.round(maxOrders * 0.75)}</span>
              <span>{Math.round(maxOrders * 0.5)}</span>
              <span>{Math.round(maxOrders * 0.25)}</span>
              <span>0</span>
            </div>
          </div>
        </div>

        {/* 4 Bottom Summary Indicators Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 pt-4 border-t border-[#1e2638]">
          {/* Box 1: Doanh thu lũy kế */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-[#0b0f19] border border-[#1e2638] flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#10b981]/20 text-[#10b981] flex items-center justify-center shrink-0">
              <DollarSign size={18} />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-stone-400 block">
                Doanh thu lũy kế
              </span>
              <p className="text-sm sm:text-base font-black text-[#f59e0b]">
                {formatCurrency(kpis?.totalRevenue || 0, "vi")}
              </p>
            </div>
          </div>

          {/* Box 2: Tổng số đơn hàng */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-[#0b0f19] border border-[#1e2638] flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#3b82f6]/20 text-[#3b82f6] flex items-center justify-center shrink-0">
              <ShoppingBag size={18} />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-stone-400 block">
                Tổng số đơn hàng
              </span>
              <p className="text-sm sm:text-base font-black text-white">
                {(kpis?.totalOrders || 0).toLocaleString("vi-VN")} đơn
              </p>
            </div>
          </div>

          {/* Box 3: Giá trị TB / đơn */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-[#0b0f19] border border-[#1e2638] flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#a855f7]/20 text-[#a855f7] flex items-center justify-center shrink-0">
              <CreditCard size={18} />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-stone-400 block">
                Giá trị TB / đơn
              </span>
              <p className="text-sm sm:text-base font-black text-white">
                {formatCurrency(kpis?.avgOrderValue || 0, "vi")}
              </p>
            </div>
          </div>

          {/* Box 4: Tăng trưởng */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-[#0b0f19] border border-[#1e2638] flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#10b981]/20 text-[#10b981] flex items-center justify-center shrink-0">
              <TrendingUp size={18} />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-stone-400 block">
                Tăng trưởng
              </span>
              <p className="text-xs sm:text-sm font-black text-[#10b981] flex items-center gap-1">
                <span>{(kpis?.growthRate || 0) >= 0 ? "▲" : "▼"} {Math.abs(kpis?.growthRate || 0)}% so với tháng trước</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          3. BOTTOM ROW: DONUT CHART (LEFT) & TOP PRODUCTS (RIGHT)
         ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Column: Donut Chart "Cơ Cấu Doanh Số" (5 Cols) */}
        <div className="lg:col-span-5 bg-[#10141e] rounded-3xl border border-[#1e2638] p-6 shadow-2xl flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-[#10b981] uppercase tracking-wider mb-1">
              <PieIcon size={15} />
              <span>CƠ CẤU DOANH SỐ</span>
            </div>
            <h3 className="text-lg font-black text-white">
              Phân Bố {kpis?.totalCategories || 0} Danh Mục
            </h3>
          </div>

          {/* Donut Visual SVG with Legend */}
          <div className="flex flex-col sm:flex-row items-center gap-6 justify-center">
            {/* Donut SVG */}
            <div className="relative w-44 h-44 shrink-0 flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="36" fill="transparent" stroke="#1e2638" strokeWidth="16" />
                {categoryShare.map((category, index) => {
                  const circumference = 226;
                  const previous = categoryShare.slice(0, index).reduce((sum, item) => sum + item.percent, 0);
                  const length = (category.percent / 100) * circumference;
                  return <circle key={category.id} cx="50" cy="50" r="36" fill="transparent" stroke={category.color} strokeWidth="16" strokeDasharray={`${length} ${circumference}`} strokeDashoffset={-(previous / 100) * circumference} className="transition-all duration-500" />;
                })}
              </svg>

              {/* Center Label in Donut */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-black text-white tracking-tight">{categoryShare.some((item) => item.revenue > 0) ? "100%" : "0%"}</span>
                <span className="text-[10px] text-stone-400 font-medium">Tổng doanh số</span>
              </div>
            </div>

            {/* Category Share List */}
            <div className="space-y-3 w-full">
              {categoryShare.map((cat, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                      <span className="text-stone-200 truncate">{cat.name}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-stone-400 pl-4.5 font-medium">
                    <span className="font-bold text-white">{cat.percent}%</span>
                    <span>{cat.amount}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Link Button */}
          <div className="pt-2 border-t border-[#1e2638]">
            <Link
              href="/admin/danh-muc"
              prefetch={false}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-stone-300 hover:text-white flex items-center justify-end gap-1.5 transition-colors group"
            >
              <span>Xem chi tiết danh mục</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Right Column: Top Products Ranking "Xếp Hạng Doanh Số Cao Nhất" (7 Cols) */}
        <div className="lg:col-span-7 bg-[#10141e] rounded-3xl border border-[#1e2638] p-6 shadow-2xl flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-amber-500 uppercase tracking-wider mb-1">
                <Award size={15} />
                <span>TOP SẢN PHẨM BÁN CHẠY</span>
              </div>
              <h3 className="text-lg font-black text-white">
                Xếp Hạng Doanh Số Cao Nhất
              </h3>
            </div>
            <Link
              href="/admin/san-pham"
              prefetch={false}
              className="text-xs font-bold text-stone-400 hover:text-white transition-colors"
            >
              Xem tất cả
            </Link>
          </div>

          {/* Top 5 Products List */}
          <div className="space-y-2.5">
            {topProductsList.length === 0 && (
              <div className="rounded-2xl border border-dashed border-[#2b3448] px-4 py-10 text-center text-sm text-stone-400">
                Chưa có sản phẩm phát sinh doanh số.
              </div>
            )}
            {topProductsList.map((prod) => (
              <div
                key={prod.id}
                className="p-3 sm:p-3.5 rounded-2xl bg-[#0b0e17] border border-[#1e2638] flex items-center justify-between gap-3 hover:border-amber-500/40 transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Rank Square Badge */}
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                      prod.rank === 1
                        ? "bg-[#f59e0b] text-stone-950 shadow-sm shadow-amber-500/40"
                        : prod.rank === 2
                        ? "bg-stone-300 text-stone-950 shadow-sm"
                        : prod.rank === 3
                        ? "bg-[#b45309] text-white shadow-sm"
                        : "bg-[#1e2638] text-stone-400 font-bold"
                    }`}
                  >
                    #{prod.rank}
                  </div>

                  {/* Product Thumbnail */}
                  {prod.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={prod.image} alt={prod.name} className="w-11 h-11 rounded-xl object-cover border border-[#1e2638] shrink-0" />
                  ) : (
                    <div className="w-11 h-11 rounded-xl border border-[#1e2638] bg-[#151b29] text-stone-500 flex items-center justify-center shrink-0"><Package size={18} /></div>
                  )}

                  {/* Name & Sold stats */}
                  <div className="min-w-0">
                    <h5 className="font-bold text-xs sm:text-sm text-stone-100 truncate">
                      {prod.name}
                    </h5>
                    <div className="flex items-center gap-2 text-[11px] text-stone-400 mt-0.5">
                      <span>Đã bán {prod.sold} sp</span>
                    </div>
                  </div>
                </div>

                {/* Revenue in Gold / Yellow */}
                <div className="text-right shrink-0">
                  <span className="font-black text-xs sm:text-sm text-[#f59e0b] tracking-tight">
                    {prod.revenueLabel}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
