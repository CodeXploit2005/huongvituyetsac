"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Edit2, Plus, Search, Trash2, X, Zap } from "lucide-react";
import { useData } from "@/context/DataContext";
import type { Coupon, FlashDeal } from "@/types";

const localValue = (value: string | Date) => {
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};
const emptyForm = { titleVi: "Ưu Đãi Giờ Vàng", titleEn: "Golden Hour Deals", subtitleVi: "", subtitleEn: "", couponId: "", couponStartAt: "", couponEndAt: "", productIds: [] as string[], isActive: true };
const dateTime = (value?: string) => value ? new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(new Date(value)) : "—";
const discount = (coupon?: Coupon) => coupon ? coupon.discountType === "percent" ? `${coupon.discountValue}%` : `${coupon.discountValue.toLocaleString("vi-VN")}₫` : "—";

export default function FlashDealsAdminPage() {
  const { products } = useData();
  const [deals, setDeals] = useState<FlashDeal[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<FlashDeal | null>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [dealQuery, setDealQuery] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const [dealRes, couponRes] = await Promise.all([fetch("/api/flash-deals", { cache: "no-store" }), fetch("/api/coupons", { cache: "no-store" })]);
    if (dealRes.ok) setDeals(await dealRes.json());
    if (couponRes.ok) setCoupons(await couponRes.json());
  }, []);
  useEffect(() => {
    let cancelled = false;
    Promise.all([fetch("/api/flash-deals", { cache: "no-store" }), fetch("/api/coupons", { cache: "no-store" })]).then(async ([dealRes, couponRes]) => {
      if (cancelled) return;
      if (dealRes.ok) setDeals(await dealRes.json());
      if (couponRes.ok) setCoupons(await couponRes.json());
    });
    return () => { cancelled = true; };
  }, []);

  const activeCoupons = coupons.filter((coupon) => coupon.isActive);
  const filteredDeals = deals.filter((deal) => [deal.title.vi, deal.title.en, deal.subtitle.vi, deal.subtitle.en, deal.coupon?.code].join(" ").toLocaleLowerCase("vi").includes(dealQuery.trim().toLocaleLowerCase("vi")));
  const visibleProducts = useMemo(() => products.filter((product) => !product.isVariant && product.name.vi.toLowerCase().includes(query.toLowerCase())), [products, query]);
  const selectedCoupon = coupons.find((coupon) => coupon._id === form.couponId);
  const expiredSelected = Boolean(selectedCoupon && new Date(selectedCoupon.endAt) <= new Date());

  const showAdd = () => {
    const coupon = activeCoupons[0];
    setEditing(null);
    setForm({ ...emptyForm, couponId: coupon?._id || "", couponStartAt: coupon ? localValue(coupon.startAt) : "", couponEndAt: coupon ? localValue(coupon.endAt) : "" });
    setError(""); setOpen(true);
  };
  const showEdit = (deal: FlashDeal) => {
    setEditing(deal);
    setForm({ titleVi: deal.title.vi, titleEn: deal.title.en, subtitleVi: deal.subtitle.vi, subtitleEn: deal.subtitle.en, couponId: deal.couponId, couponStartAt: deal.coupon ? localValue(deal.coupon.startAt) : "", couponEndAt: deal.coupon ? localValue(deal.coupon.endAt) : "", productIds: deal.productIds, isActive: deal.isActive });
    setError(""); setOpen(true);
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault(); setError("");
    if (!selectedCoupon) return setError("Vui lòng chọn một Coupon hợp lệ.");
    if (new Date(form.couponEndAt) <= new Date(form.couponStartAt)) return setError("Thời gian kết thúc phải sau thời gian bắt đầu.");
    const couponResponse = await fetch("/api/coupons", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ _id: selectedCoupon._id, startAt: new Date(form.couponStartAt).toISOString(), endAt: new Date(form.couponEndAt).toISOString() }) });
    const couponData = await couponResponse.json();
    if (!couponResponse.ok) return setError(couponData.error || "Không thể cập nhật thời gian Coupon.");
    const payload = { ...(editing ? { _id: editing._id } : {}), title: { vi: form.titleVi, en: form.titleEn }, subtitle: { vi: form.subtitleVi, en: form.subtitleEn }, couponId: form.couponId, productIds: form.productIds, isActive: form.isActive };
    const response = await fetch("/api/flash-deals", { method: editing ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const data = await response.json();
    if (!response.ok) return setError(data.error || "Không thể lưu Flash Deal.");
    setOpen(false); await load();
  };

  const updateActive = async (deal: FlashDeal) => { await fetch("/api/flash-deals", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ _id: deal._id, isActive: !deal.isActive }) }); await load(); };
  const remove = async (id: string) => { if (!confirm("Xóa Flash Deal này?")) return; await fetch("/api/flash-deals", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) }); await load(); };
  const status = (deal: FlashDeal) => !deal.isActive ? "Đã tắt" : !deal.coupon ? "Thiếu coupon" : new Date(deal.coupon.endAt) <= new Date() ? "Hết hạn" : new Date(deal.coupon.startAt) > new Date() ? "Sắp diễn ra" : "Đang chạy";

  return <div className="space-y-6">
    <div className="flex items-center justify-between gap-4"><div><h1 className="text-2xl sm:text-3xl font-black">Quản Lý Flash Deal</h1><p className="mt-1 text-xs text-stone-500">Coupon là nguồn giảm giá và thời gian duy nhất cho khối Ưu Đãi Giờ Vàng.</p></div><button onClick={showAdd} className="flex items-center gap-2 rounded-2xl bg-red-700 px-4 py-2.5 text-xs font-bold text-white"><Plus size={16}/>Tạo Flash Deal</button></div>
    <label className="relative block max-w-xl"><Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"/><input value={dealQuery} onChange={(event) => setDealQuery(event.target.value)} placeholder="Tìm tiêu đề, mô tả hoặc mã Coupon..." className="w-full rounded-2xl border border-stone-200 bg-white py-3 pl-10 pr-4 text-xs outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/15 dark:border-stone-800 dark:bg-stone-900"/></label>
    <div className="overflow-x-auto rounded-3xl border border-stone-200 bg-white shadow-sm dark:border-stone-800 dark:bg-stone-900"><table className="w-full min-w-[900px] text-left text-xs"><thead className="bg-stone-50 text-stone-500 dark:bg-stone-950"><tr><th className="p-4">Tiêu đề</th><th className="p-4">Coupon liên kết</th><th className="p-4">Sản phẩm</th><th className="p-4">Trạng thái</th><th className="p-4">Hiển thị</th><th className="p-4 text-right">Thao tác</th></tr></thead><tbody>{filteredDeals.map((deal) => { const expired = Boolean(deal.coupon && new Date(deal.coupon.endAt) <= new Date()); const dealStatus = status(deal); return <tr key={deal._id} className="border-t border-stone-100 align-top dark:border-stone-800"><td className="p-4"><div className="font-bold">{deal.title.vi}</div><div className="text-stone-500">{deal.title.en}</div>{expired && deal.isActive && <div className="mt-2 flex max-w-xs items-center gap-1 text-red-600"><AlertTriangle size={13}/>Coupon đã hết hạn — khối này sẽ không hiển thị trên trang chủ</div>}</td><td className="p-4"><div className="font-mono font-bold">{deal.coupon?.code || "—"}</div><div className="text-red-600">Giảm {discount(deal.coupon)}</div><div className="text-stone-500">Hết {dateTime(deal.coupon?.endAt)}</div></td><td className="p-4 font-bold">{deal.productIds.length}</td><td className="p-4"><span className={`rounded-full px-2.5 py-1 font-bold ${dealStatus === "Đang chạy" ? "bg-emerald-100 text-emerald-700" : dealStatus === "Sắp diễn ra" ? "bg-amber-100 text-amber-700" : dealStatus === "Đã tắt" ? "bg-stone-200 text-stone-600 dark:bg-stone-700 dark:text-stone-300" : "bg-red-100 text-red-700"}`}>{dealStatus}</span></td><td className="p-4"><button onClick={() => updateActive(deal)} className={`relative h-6 w-11 rounded-full ${deal.isActive ? "bg-emerald-500" : "bg-stone-300"}`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${deal.isActive ? "left-6" : "left-1"}`}/></button></td><td className="p-4"><div className="flex justify-end gap-2"><button onClick={() => showEdit(deal)} className="rounded-lg bg-stone-100 p-2 dark:bg-stone-800"><Edit2 size={14}/></button><button onClick={() => remove(deal._id)} className="rounded-lg bg-red-50 p-2 text-red-700 dark:bg-red-950"><Trash2 size={14}/></button></div></td></tr>; })}{!filteredDeals.length && <tr><td colSpan={6} className="p-10 text-center text-stone-500">Không tìm thấy Flash Deal phù hợp.</td></tr>}</tbody></table></div>

    {open && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"><div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl dark:bg-stone-900"><div className="mb-5 flex items-center justify-between"><h2 className="flex items-center gap-2 text-lg font-black"><Zap className="text-amber-500"/>{editing ? "Sửa Flash Deal" : "Tạo Flash Deal"}</h2><button onClick={() => setOpen(false)}><X/></button></div><form onSubmit={save} className="space-y-5 text-xs">
      <div className="grid gap-3 sm:grid-cols-2">{[["Tiêu đề VI", "titleVi"], ["Title EN", "titleEn"], ["Mô tả VI", "subtitleVi"], ["Description EN", "subtitleEn"]].map(([label, key]) => <label key={key} className="font-bold">{label}<input required value={form[key as keyof typeof form] as string} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50 p-2.5 dark:border-stone-700 dark:bg-stone-800"/></label>)}</div>
      <label className="block font-bold">Coupon đang hoạt động<select required value={form.couponId} onChange={(e) => { const coupon = coupons.find((item) => item._id === e.target.value); setForm({ ...form, couponId: e.target.value, couponStartAt: coupon ? localValue(coupon.startAt) : "", couponEndAt: coupon ? localValue(coupon.endAt) : "" }); }} className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50 p-2.5 dark:border-stone-700 dark:bg-stone-800"><option value="">Chọn coupon</option>{activeCoupons.map((coupon) => <option key={coupon._id} value={coupon._id}>{coupon.code} · Giảm {discount(coupon)} · Hết {dateTime(coupon.endAt)}</option>)}</select></label>
      <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 dark:border-amber-900 dark:bg-amber-950/30"><div className="mb-3 font-black text-amber-900 dark:text-amber-300">Thời gian Flash Deal (lưu trực tiếp vào Coupon)</div><div className="grid gap-3 sm:grid-cols-2"><label className="font-bold">Bắt đầu<input type="datetime-local" required value={form.couponStartAt} onChange={(e) => setForm({ ...form, couponStartAt: e.target.value })} className="mt-1 w-full rounded-xl border border-amber-200 bg-white p-2.5 dark:border-amber-800 dark:bg-stone-900"/></label><label className="font-bold">Kết thúc<input type="datetime-local" required value={form.couponEndAt} onChange={(e) => setForm({ ...form, couponEndAt: e.target.value })} className="mt-1 w-full rounded-xl border border-amber-200 bg-white p-2.5 dark:border-amber-800 dark:bg-stone-900"/></label></div><p className="mt-2 text-[11px] text-amber-800 dark:text-amber-400">Thay đổi tại đây cũng cập nhật thời gian của Coupon {selectedCoupon?.code || "đã chọn"}.</p></div>
      {expiredSelected && form.isActive && <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3 font-bold text-red-700 dark:bg-red-950"><AlertTriangle size={16}/>Coupon đã hết hạn — khối này sẽ không hiển thị trên trang chủ</div>}
      <div><div className="mb-2 flex items-center justify-between"><span className="font-bold">Sản phẩm áp dụng ({form.productIds.length})</span><label className="relative"><Search size={14} className="absolute left-2.5 top-2.5 text-stone-400"/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm theo tên..." className="rounded-xl border border-stone-200 py-2 pl-8 pr-3 dark:border-stone-700 dark:bg-stone-800"/></label></div><div className="grid max-h-52 gap-2 overflow-y-auto rounded-2xl border border-stone-200 p-3 sm:grid-cols-2 dark:border-stone-700">{visibleProducts.map((product) => <label key={product._id} className="flex cursor-pointer items-center gap-2 rounded-xl p-2 hover:bg-stone-50 dark:hover:bg-stone-800"><input type="checkbox" checked={form.productIds.includes(product._id)} onChange={() => setForm({ ...form, productIds: form.productIds.includes(product._id) ? form.productIds.filter((id) => id !== product._id) : [...form.productIds, product._id] })}/><span>{product.name.vi}</span></label>)}</div></div>
      <label className="flex items-center gap-2 font-bold"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })}/>Bật hiển thị khối trên trang chủ</label>{error && <p className="text-red-600">{error}</p>}<div className="flex justify-end gap-3 border-t border-stone-200 pt-4 dark:border-stone-700"><button type="button" onClick={() => setOpen(false)} className="rounded-xl border px-4 py-2">Hủy</button><button className="rounded-xl bg-red-700 px-5 py-2 font-bold text-white">Lưu Flash Deal</button></div>
    </form></div></div>}
  </div>;
}
