"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Search } from "lucide-react";
import { Order } from "@/types";
import { useLanguage } from "@/context/LanguageContext";
import { formatCurrency, formatDateTime } from "@/utils/formatters";

type Result = { orders: Order[]; pagination: { page: number; limit: number; total: number; pages: number } };
type Option = { value: string; label: string; disabled?: boolean };

const statusLabels: Record<Order["status"], string> = {
  pending: "Chờ xử lý", confirmed: "Đã xác nhận thanh toán", shipping: "Đang vận chuyển",
  delivered: "Đã giao thành công", cancelled: "Đã hủy",
};
const allStatuses = Object.entries(statusLabels).map(([value, label]) => ({ value, label }));

function SelectMenu({ value, options, onChange, disabled, ariaLabel }: { value: string; options: Option[]; onChange: (value: string) => void; disabled?: boolean; ariaLabel: string }) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ left: 0, top: 0, width: 220, above: false });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const current = options.find((option) => option.value === value)?.label || value;
  const toggle = () => {
    if (open) return setOpen(false);
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      const menuHeight = Math.min(options.length * 42 + 12, 280);
      const above = window.innerHeight - rect.bottom < menuHeight && rect.top > menuHeight;
      setPosition({ left: Math.max(8, Math.min(rect.left, window.innerWidth - Math.max(rect.width, 220) - 8)), top: above ? rect.top - 8 : rect.bottom + 8, width: Math.max(rect.width, 220), above });
    }
    setOpen(true);
  };
  return <div className="relative min-w-0">
    <button ref={buttonRef} type="button" aria-label={ariaLabel} disabled={disabled} onClick={toggle} className="flex min-h-10 w-full items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white px-3 py-2 text-left text-xs font-semibold text-stone-800 shadow-sm outline-none transition hover:border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/15 disabled:cursor-not-allowed disabled:bg-stone-100 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100 dark:hover:border-stone-500 dark:disabled:bg-stone-800">
      <span className="truncate">{current}</span><ChevronDown size={15} className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
    </button>
    {open && !disabled && createPortal(<><button type="button" aria-label="Đóng danh sách" onClick={() => setOpen(false)} className="fixed inset-0 z-[90] cursor-default bg-transparent"/><div className="fixed z-[100] max-h-72 overflow-y-auto rounded-xl border border-stone-200 bg-white p-1.5 shadow-2xl dark:border-stone-700 dark:bg-stone-900" style={{ left: position.left, width: position.width, ...(position.above ? { bottom: window.innerHeight - position.top } : { top: position.top }) }}>
      {options.map((option) => <button key={option.value} type="button" disabled={option.disabled} onClick={() => { onChange(option.value); setOpen(false); }} className={`w-full rounded-lg px-3 py-2.5 text-left text-xs font-semibold transition ${option.value === value ? "bg-red-700 text-white" : option.disabled ? "cursor-not-allowed text-stone-300 dark:text-stone-600" : "text-stone-700 hover:bg-stone-100 dark:text-stone-200 dark:hover:bg-stone-800"}`}>{option.label}</button>)}
    </div></>, document.body)}
  </div>;
}

function StatusBadge({ status }: { status: Order["status"] }) {
  const color = status === "delivered" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" : status === "shipping" ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300" : status === "cancelled" ? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300" : status === "confirmed" ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300" : "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300";
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black ${color}`}>{statusLabels[status]}</span>;
}

export default function AdminOrdersPage() {
  const { language, loc } = useLanguage();
  const [result, setResult] = useState<Result>({ orders: [], pagination: { page: 1, limit: 15, total: 0, pages: 1 } });
  const [page, setPage] = useState(1);
  const [archive, setArchive] = useState(false);
  const [status, setStatus] = useState("all");
  const [payment, setPayment] = useState("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [selected, setSelected] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => { const timer = setTimeout(() => setDebouncedSearch(search.trim()), 350); return () => clearTimeout(timer); }, [search]);
  const resetPage = <T,>(setter: (value: T) => void, value: T) => { setPage(1); setter(value); };
  const load = useCallback(async () => {
    setLoading(true); setError("");
    const params = new URLSearchParams({ scope: "admin", archived: String(archive), page: String(page), limit: "15" });
    if (status !== "all") params.set("status", status);
    if (payment !== "all") params.set("payment", payment);
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    try { const response = await fetch(`/api/orders?${params}`, { cache: "no-store" }); const data = await response.json(); if (!response.ok) throw new Error(data.error); setResult(data); setSelected((current) => current ? data.orders.find((order: Order) => order._id === current._id) || current : null); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Không thể tải đơn hàng."); }
    finally { setLoading(false); }
  }, [archive, page, status, payment, debouncedSearch, from, to]);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    const syncOrders = (event: StorageEvent) => { if (event.key === "hv_orders_changed") void load(); };
    window.addEventListener("storage", syncOrders);
    return () => window.removeEventListener("storage", syncOrders);
  }, [load]);

  const updateStatus = async (order: Order, value: string) => {
    const response = await fetch("/api/orders", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: order._id, status: value }) });
    const data = await response.json();
    if (!response.ok) return alert(data.error || "Không thể cập nhật trạng thái.");
    setSelected((current) => current?._id === order._id ? data : current);
    localStorage.setItem("hv_orders_changed", String(Number(localStorage.getItem("hv_orders_changed") || "0") + 1));
    await load();
  };
  const statusOptions = (): Option[] => allStatuses;

  return <div className="space-y-5 sm:space-y-6">
    <div><h1 className="text-2xl font-black text-stone-950 dark:text-white sm:text-3xl">Quản Lý Đơn Hàng</h1><p className="mt-1 text-xs text-stone-500 dark:text-stone-400">Theo dõi, tìm kiếm và cập nhật tiến trình đơn hàng.</p></div>

    <div className="inline-flex w-full gap-1 rounded-2xl border border-stone-200 bg-white p-1.5 shadow-sm dark:border-stone-800 dark:bg-stone-900 sm:w-auto">
      <button onClick={() => resetPage(setArchive, false)} className={`flex-1 rounded-xl px-4 py-2.5 text-xs font-bold transition sm:flex-none ${!archive ? "bg-red-700 text-white shadow-md shadow-red-900/20" : "text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800"}`}>Đơn hoạt động</button>
      <button onClick={() => resetPage(setArchive, true)} className={`flex-1 rounded-xl px-4 py-2.5 text-xs font-bold transition sm:flex-none ${archive ? "bg-red-700 text-white shadow-md shadow-red-900/20" : "text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800"}`}>Lịch sử lưu trữ</button>
    </div>

    <div className="grid gap-3 rounded-2xl border border-stone-200 bg-white p-3 shadow-sm dark:border-stone-800 dark:bg-stone-900 sm:p-4 lg:grid-cols-12">
      <label className="relative lg:col-span-4"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"/><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Mã đơn, khách hàng, SĐT..." className="min-h-10 w-full rounded-xl border border-stone-200 bg-stone-50 py-2 pl-9 pr-3 text-xs text-stone-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/15 dark:border-stone-700 dark:bg-stone-950 dark:text-white"/></label>
      <div className="lg:col-span-2"><SelectMenu ariaLabel="Lọc trạng thái" value={status} onChange={(value) => resetPage(setStatus, value)} options={[{ value: "all", label: "Mọi trạng thái" }, ...allStatuses]} /></div>
      <div className="lg:col-span-2"><SelectMenu ariaLabel="Lọc thanh toán" value={payment} onChange={(value) => resetPage(setPayment, value)} options={[{ value: "all", label: "Mọi thanh toán" }, { value: "cod", label: "COD" }, { value: "vietqr", label: "VietQR" }, { value: "momo", label: "MoMo" }]} /></div>
      <div className="grid grid-cols-2 gap-2 lg:col-span-4"><input type="date" aria-label="Từ ngày" value={from} onChange={(e) => resetPage(setFrom, e.target.value)} className="min-h-10 min-w-0 rounded-xl border border-stone-200 bg-stone-50 px-2 text-xs text-stone-700 [color-scheme:light] dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100 dark:[color-scheme:dark]"/><input type="date" aria-label="Đến ngày" value={to} onChange={(e) => resetPage(setTo, e.target.value)} className="min-h-10 min-w-0 rounded-xl border border-stone-200 bg-stone-50 px-2 text-xs text-stone-700 [color-scheme:light] dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100 dark:[color-scheme:dark]"/></div>
    </div>

    {error && <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">{error}</p>}
    {loading ? <div className="rounded-2xl border border-stone-200 bg-white p-12 text-center text-xs text-stone-500 dark:border-stone-800 dark:bg-stone-900">Đang tải đơn hàng...</div> : result.orders.length === 0 ? <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-12 text-center text-xs text-stone-500 dark:border-stone-700 dark:bg-stone-900">Không có đơn hàng phù hợp.</div> : <>
      <div className="hidden overflow-visible rounded-2xl border border-stone-200 bg-white shadow-sm dark:border-stone-800 dark:bg-stone-900 md:block"><div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead className="border-b border-stone-200 bg-stone-50 text-stone-500 dark:border-stone-800 dark:bg-stone-950 dark:text-stone-400"><tr><th className="p-4">Mã đơn</th><th className="p-4">Khách hàng</th><th className="p-4">Sản phẩm</th><th className="p-4">Thanh toán</th><th className="p-4">Tổng tiền</th><th className="p-4">Trạng thái</th><th className="p-4 text-right">Chi tiết</th></tr></thead><tbody className="divide-y divide-stone-100 text-stone-800 dark:divide-stone-800 dark:text-stone-100">{result.orders.map((order) => <tr key={order._id} className="hover:bg-stone-50 dark:hover:bg-stone-800/50"><td className="p-4 font-black text-red-700 dark:text-amber-400">{order.orderCode}<small className="block font-normal text-stone-400">{formatDateTime(order.createdAt, language)}</small></td><td className="p-4"><b>{order.customerName}</b><small className="block text-stone-400">{order.phone}</small></td><td className="max-w-xs truncate p-4">{order.items.map((item) => `${item.quantity}x ${loc(item.productName)}`).join(", ")}</td><td className="p-4 font-bold uppercase">{order.paymentMethod}</td><td className="p-4 font-black text-red-700 dark:text-amber-400">{formatCurrency(order.total, language)}</td><td className="relative min-w-56 p-4"><SelectMenu ariaLabel={`Trạng thái đơn ${order.orderCode}`} value={order.status} onChange={(value) => void updateStatus(order, value)} options={statusOptions()} /></td><td className="p-4 text-right"><button onClick={() => setSelected(order)} className="rounded-xl bg-stone-900 px-4 py-2 font-bold text-white transition hover:bg-red-700 dark:bg-stone-700 dark:hover:bg-red-700">Xem chi tiết</button></td></tr>)}</tbody></table></div></div>
      <div className="space-y-3 md:hidden">{result.orders.map((order) => <article key={order._id} className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm dark:border-stone-800 dark:bg-stone-900"><div className="flex items-start justify-between gap-3"><div><b className="text-sm text-red-700 dark:text-amber-400">#{order.orderCode}</b><p className="text-[10px] text-stone-400">{formatDateTime(order.createdAt, language)}</p></div><StatusBadge status={order.status}/></div><div className="mt-4 space-y-2 text-xs text-stone-700 dark:text-stone-200"><p><b>Khách:</b> {order.customerName} · {order.phone}</p><p className="line-clamp-2"><b>Sản phẩm:</b> {order.items.map((item) => `${item.quantity}x ${loc(item.productName)}`).join(", ")}</p><div className="flex justify-between border-t border-stone-100 pt-3 dark:border-stone-800"><span className="font-bold uppercase">{order.paymentMethod}</span><strong className="text-base text-red-700 dark:text-amber-400">{formatCurrency(order.total, language)}</strong></div></div><div className="mt-3"><SelectMenu ariaLabel={`Trạng thái đơn ${order.orderCode}`} value={order.status} onChange={(value) => void updateStatus(order, value)} options={statusOptions()} /></div><button onClick={() => setSelected(order)} className="mt-3 w-full rounded-xl bg-stone-900 py-2.5 text-xs font-bold text-white dark:bg-stone-700">Xem chi tiết</button></article>)}</div>
    </>}

    <div className="flex flex-col items-center justify-between gap-3 text-xs text-stone-500 sm:flex-row"><span>{result.pagination.total} đơn hàng</span><div className="flex items-center gap-2"><button disabled={page <= 1} onClick={() => setPage((value) => value - 1)} className="rounded-xl border border-stone-300 bg-white px-3 py-2 font-semibold disabled:cursor-not-allowed disabled:opacity-40 dark:border-stone-700 dark:bg-stone-900">Trang trước</button><span className="min-w-10 text-center font-bold">{page}/{result.pagination.pages}</span><button disabled={page >= result.pagination.pages} onClick={() => setPage((value) => value + 1)} className="rounded-xl border border-stone-300 bg-white px-3 py-2 font-semibold disabled:cursor-not-allowed disabled:opacity-40 dark:border-stone-700 dark:bg-stone-900">Trang sau</button></div></div>

    {selected && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-5 text-sm text-stone-800 shadow-2xl dark:bg-stone-900 dark:text-stone-100 sm:p-6">
        <div className="flex justify-between gap-3"><div><h2 className="text-xl font-black">Chi tiết #{selected.orderCode}</h2><p className="mt-1 text-xs text-stone-500">{formatDateTime(selected.createdAt, language)} · {statusLabels[selected.status]}</p></div><button onClick={() => setSelected(null)} className="h-fit rounded-xl border border-stone-300 px-3 py-2 text-xs font-bold dark:border-stone-700">Đóng</button></div>
        <div className="mt-5 space-y-4">
          <div className="grid gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-4 text-xs dark:border-stone-800 dark:bg-stone-950 sm:grid-cols-2">
            <div><p className="text-[10px] font-bold uppercase tracking-wide text-stone-400">Người nhận</p><p className="mt-1 font-bold text-stone-900 dark:text-white">{selected.customerName}</p></div>
            <div><p className="text-[10px] font-bold uppercase tracking-wide text-stone-400">Số điện thoại</p><p className="mt-1 font-semibold text-stone-800 dark:text-stone-100">{selected.phone}</p></div>
            <div><p className="text-[10px] font-bold uppercase tracking-wide text-stone-400">Email</p><p className="mt-1 break-all font-semibold text-stone-800 dark:text-stone-100">{selected.email}</p></div>
            <div><p className="text-[10px] font-bold uppercase tracking-wide text-stone-400">Địa chỉ giao hàng</p><p className="mt-1 font-semibold leading-relaxed text-stone-800 dark:text-stone-100">{selected.address}, {selected.province}</p></div>
            {selected.note && <div className="sm:col-span-2"><p className="text-[10px] font-bold uppercase tracking-wide text-stone-400">Ghi chú giao hàng</p><p className="mt-1 font-semibold leading-relaxed text-stone-800 dark:text-stone-100">{selected.note}</p></div>}
          </div>
          <div className="divide-y divide-stone-100 rounded-2xl border border-stone-200 dark:divide-stone-800 dark:border-stone-800">
            {selected.items.map((item, index) => <div key={`${item.productId}-${index}`} className="flex items-center gap-3 p-3">
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-stone-200 bg-stone-100 dark:border-stone-700 dark:bg-stone-800">
                {item.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.image} alt={loc(item.productName)} className="h-full w-full object-cover" />
                ) : <span className="flex h-full items-center justify-center text-[10px] font-bold text-stone-400">Chưa có ảnh</span>}
              </div>
              <div className="min-w-0 flex-1"><p className="font-bold leading-snug">{loc(item.productName)}</p>{item.variantLabel && <p className="mt-0.5 text-[11px] text-stone-500">{loc(item.variantLabel)}</p>}<p className="mt-1 text-xs text-stone-500">Số lượng: {item.quantity} × {formatCurrency(item.price, language)}</p></div>
              <b className="shrink-0 text-right">{formatCurrency(item.price * item.quantity, language)}</b>
            </div>)}
          </div>
          <div className="space-y-2"><p className="flex justify-between"><span>Tạm tính</span><span>{formatCurrency(selected.subtotal, language)}</span></p><p className="flex justify-between"><span>Giảm giá</span><span>-{formatCurrency(selected.discount, language)}</span></p><p className="flex justify-between"><span>Phí giao hàng</span><span>{formatCurrency(selected.shippingFee, language)}</span></p><p className="flex justify-between border-t border-stone-200 pt-2 text-lg font-black text-red-700 dark:border-stone-700 dark:text-amber-400"><span>Tổng tiền</span><span>{formatCurrency(selected.total, language)}</span></p><p><b>Phương thức:</b> {selected.paymentMethod.toUpperCase()} · {selected.paidAt ? `Đã thanh toán ${formatDateTime(selected.paidAt, language)}` : "Chưa ghi nhận thanh toán"}</p></div>
        </div>
      </div>
    </div>}
  </div>;
}
