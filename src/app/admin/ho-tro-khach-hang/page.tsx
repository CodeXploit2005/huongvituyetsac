"use client";

import { useEffect, useState } from "react";
import { SupportStatusSelect } from "@/components/admin/SupportStatusSelect";
import { Mail, MessagesSquare, RefreshCw, Phone, UserRound, Clock3, Inbox, CheckCircle2, Search, ChevronLeft, ChevronRight, StickyNote } from "lucide-react";
import { supportStatuses, type SupportTicket, type SupportStatus } from "@/lib/support";

const statusColors = {
  new: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
  processing: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  resolved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
};
const summaries = [
  { key: "all", label: "Tất cả yêu cầu", icon: MessagesSquare, description: "Tin nhắn từ trang Liên hệ" },
  { key: "new", label: "Yêu cầu mới", icon: Inbox, description: "Cần tiếp nhận và phản hồi" },
  { key: "processing", label: "Đang xử lý", icon: Clock3, description: "Đang theo dõi và hỗ trợ" },
  { key: "resolved", label: "Đã xử lý", icon: CheckCircle2, description: "Đã hoàn tất hỗ trợ" },
] as const;
const fieldClass = "w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-3 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 dark:border-[#283247] dark:bg-[#111827] dark:text-stone-100";
function dateLabel(value?: string) { return value ? new Date(value).toLocaleString("vi-VN") : "Chưa cập nhật"; }

export default function SupportAdminPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState({ all: 0, new: 0, processing: 0, resolved: 0 });
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true); setError("");
      try {
        const params = new URLSearchParams({ page: String(page), status, q: query });
        const res = await fetch(`/api/admin/support?${params}`, { signal: controller.signal, cache: "no-store" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        if (controller.signal.aborted) return;
        if (page > 1 && page > Math.max(1, Math.ceil(data.total / 20))) { setPage(Math.max(1, Math.ceil(data.total / 20))); return; }
        setTickets(data.tickets); setTotal(data.total); setStats(data.stats);
      } catch (e) { if (!controller.signal.aborted) setError(e instanceof Error ? e.message : "Không thể tải dữ liệu."); }
      finally { if (!controller.signal.aborted) setLoading(false); }
    }
    void load(); return () => controller.abort();
  }, [page, status, query, refresh]);

  return <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div><p className="mb-2 text-[10px] font-bold uppercase tracking-[.2em] text-amber-600 dark:text-amber-400">Chăm sóc & kết nối</p><h1 className="flex items-center gap-3 text-2xl font-black sm:text-3xl"><MessagesSquare className="shrink-0 text-amber-500" />Hỗ trợ khách hàng</h1><p className="mt-3 max-w-xl text-sm leading-6 text-stone-500 dark:text-stone-400">Tiếp nhận phản hồi, liên hệ khách hàng và theo dõi từng yêu cầu đến khi hoàn tất.</p></div>
      <button disabled={loading} onClick={() => setRefresh(n => n + 1)} className="flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm font-semibold transition hover:border-amber-500 disabled:opacity-50 dark:border-[#283247] dark:bg-[#0e121c]"><RefreshCw size={16} className={loading ? "animate-spin" : ""} />Làm mới</button>
    </div>
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">{summaries.map(({ key, label, icon: Icon, description }) => <button key={key} onClick={() => { setStatus(key === "all" ? "" : key); setPage(1); }} aria-pressed={status === (key === "all" ? "" : key)} className={`rounded-2xl border bg-white p-4 text-left transition sm:p-5 dark:bg-[#0e121c] ${status === (key === "all" ? "" : key) ? "border-amber-400 ring-1 ring-amber-400/20" : "border-stone-200 hover:border-amber-400/50 dark:border-[#1e2638]"}`}><span className={`mb-4 flex size-9 items-center justify-center rounded-xl ${key === "all" ? "bg-stone-100 text-stone-600 dark:bg-white/5 dark:text-stone-300" : statusColors[key]}`}><Icon size={19} /></span><span className="block text-2xl font-black">{loading || error ? "—" : stats[key]}</span><span className="mt-1 block text-sm font-semibold">{label}</span><span className="mt-1 hidden text-[11px] text-stone-500 dark:text-stone-400 sm:block">{description}</span></button>)}</div>
    <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-[#1e2638] dark:bg-[#0e121c]">
      <form onSubmit={e => { e.preventDefault(); setQuery(search.trim()); setPage(1); }} className="flex flex-wrap items-center gap-3"><label className="relative min-w-0 flex-1 basis-64"><Search size={17} className="absolute left-3 top-3.5 text-stone-400" /><span className="sr-only">Tìm yêu cầu</span><input value={search} onChange={e => setSearch(e.target.value)} maxLength={100} placeholder="Tìm tên, email, số điện thoại hoặc chủ đề..." className={`${fieldClass} pl-10`} /></label><button className="rounded-xl bg-stone-900 px-4 py-3 text-sm font-bold text-white dark:bg-amber-400 dark:text-stone-950">Tìm kiếm</button>{query && <button type="button" onClick={() => { setSearch(""); setQuery(""); setPage(1); }} className="px-2 text-sm text-stone-500">Xóa tìm kiếm</button>}</form>
      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-stone-100 pt-4 dark:border-white/5">{[["", "Tất cả"], ...Object.entries(supportStatuses)].map(([key, label]) => <button key={key} onClick={() => { setStatus(key); setPage(1); }} aria-pressed={status === key} className={`rounded-full px-4 py-2 text-xs font-bold transition ${status === key ? "bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-300" : "text-stone-500 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-white/5"}`}>{label}</button>)}<span className="ml-auto text-xs text-stone-500">{loading ? "Đang tải..." : `${total} kết quả · Mới nhất trước`}</span></div>
    </div>
    {notice && <p role="status" className="rounded-xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400">{notice}</p>}
    {error && <p role="alert" className="text-red-600 dark:text-red-400">{error}</p>}
    {loading ? <p role="status" className="py-8 text-center text-stone-500">Đang tải yêu cầu...</p> : !error && (tickets.length ? <div className="space-y-5">{tickets.map(ticket => <TicketCard key={`${ticket._id}-${ticket.updatedAt}`} ticket={ticket} onDeleted={() => { setNotice("Đã xóa yêu cầu hỗ trợ."); setTickets(items => items.filter(item => item._id !== ticket._id)); setRefresh(n => n + 1); }} onSaved={() => { setNotice("Đã lưu thông tin xử lý yêu cầu."); setRefresh(n => n + 1); }} />)}</div> : <div className="rounded-2xl border border-dashed border-stone-300 p-12 text-center dark:border-stone-700"><Inbox size={32} className="mx-auto mb-4 text-stone-400" /><p className="font-bold">Không có yêu cầu phù hợp</p><p className="mt-2 text-sm text-stone-500">Tin nhắn từ trang Liên hệ sẽ xuất hiện tại đây. Bạn cũng có thể thử đổi bộ lọc hoặc từ khóa.</p></div>)}
    <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-stone-500"><span>{total ? `Hiển thị ${(page - 1) * 20 + 1}–${Math.min(page * 20, total)} trong ${total} yêu cầu` : "0 yêu cầu"}</span><div className="flex items-center gap-4"><button aria-label="Trang trước" disabled={page <= 1 || loading} onClick={() => setPage(n => n - 1)} className="rounded-lg border border-stone-200 p-2 disabled:opacity-30 dark:border-stone-700"><ChevronLeft size={16} /></button><span>Trang {page} / {Math.max(1, Math.ceil(total / 20))}</span><button aria-label="Trang sau" disabled={page * 20 >= total || loading} onClick={() => setPage(n => n + 1)} className="rounded-lg border border-stone-200 p-2 disabled:opacity-30 dark:border-stone-700"><ChevronRight size={16} /></button></div></div>
  </div>;
}

function TicketCard({ ticket, onSaved, onDeleted }: { ticket: SupportTicket; onSaved: () => void; onDeleted: () => void }) {
  const [status, setStatus] = useState<SupportStatus>(ticket.status);
  const [note, setNote] = useState(ticket.note || "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  async function remove() {
    if (saving || deleting || ticket.status !== "resolved" || status !== "resolved") return;
    if (!confirm(`Xóa vĩnh viễn yêu cầu #${ticket._id.slice(-8)} của ${ticket.name}? Nội dung và ghi chú sẽ bị xóa, không thể khôi phục.`)) return;
    setDeleting(true); setError("");
    try {
      const res = await fetch("/api/admin/support", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: ticket._id }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Không thể xóa yêu cầu.");
      onDeleted();
    } catch (e) { setError(e instanceof Error ? e.message : "Không thể xóa yêu cầu."); }
    finally { setDeleting(false); }
  }
  async function save() {
    setSaving(true); setError("");
    try {
      const res = await fetch("/api/admin/support", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: ticket._id, status, note }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onSaved();
    } catch (e) { setError(e instanceof Error ? e.message : "Không thể lưu."); }
    finally { setSaving(false); }
  }
  return <article className="overflow-hidden rounded-2xl border border-stone-200 bg-white dark:border-[#1e2638] dark:bg-[#0e121c]">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 px-5 py-4 dark:border-white/5 sm:px-6"><div><p className="mb-1 font-mono text-[10px] uppercase tracking-wider text-stone-500">Yêu cầu #{ticket._id.slice(-8)}</p><h2 className="text-lg font-bold">{ticket.subject}</h2></div><span className={`rounded-full px-3 py-1.5 text-xs font-bold ${statusColors[ticket.status]}`}>{supportStatuses[ticket.status]}</span></div>
    <div className="grid lg:grid-cols-[260px_1fr]">
      <aside className="space-y-5 border-b border-stone-100 bg-stone-50/70 p-5 dark:border-white/5 dark:bg-white/[.015] sm:p-6 lg:border-b-0 lg:border-r"><h3 className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Thông tin khách hàng</h3><div className="flex items-center gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-400/10 dark:text-amber-400"><UserRound size={20} /></span><span className="break-words text-sm font-bold">{ticket.name}</span></div><div><p className="mb-1 text-[11px] text-stone-500">Email</p><a href={`mailto:${ticket.email}`} className="flex items-start gap-2 break-all text-sm text-stone-700 hover:text-amber-600 dark:text-stone-300"><Mail size={15} className="mt-0.5 shrink-0" />{ticket.email}</a></div><div><p className="mb-1 text-[11px] text-stone-500">Số điện thoại</p>{ticket.phone ? <a href={`tel:${ticket.phone.replace(/[^+\d]/g, "")}`} className="flex items-center gap-2 text-sm font-semibold text-amber-700 dark:text-amber-400"><Phone size={15} />{ticket.phone}</a> : <span className="text-sm text-stone-400">Chưa cung cấp</span>}</div><div className="space-y-3 border-t border-stone-200 pt-4 text-xs dark:border-white/5"><div><p className="text-stone-500">Tiếp nhận lúc</p><p className="mt-1">{dateLabel(ticket.createdAt)}</p></div><div><p className="text-stone-500">Cập nhật gần nhất</p><p className="mt-1">{dateLabel(ticket.updatedAt || ticket.createdAt)}</p></div><p className="text-stone-500">Nguồn: Biểu mẫu Liên hệ</p></div></aside>
      <div className="min-w-0 space-y-5 p-5 sm:p-6"><div><h3 className="mb-3 flex items-center gap-2 text-sm font-bold"><MessagesSquare size={17} className="text-amber-500" />Nội dung yêu cầu</h3><p className="min-h-24 whitespace-pre-wrap break-words rounded-xl bg-stone-50 p-4 text-sm leading-7 dark:bg-[#111827]">{ticket.message}</p></div><div className="border-t border-stone-100 pt-5 dark:border-white/5"><h3 className="mb-4 flex items-center gap-2 text-sm font-bold"><StickyNote size={17} className="text-amber-500" />Thông tin xử lý</h3><SupportStatusSelect value={status} onChange={setStatus} /><label className="mt-4 block text-xs font-semibold">Ghi chú nội bộ<textarea value={note} onChange={e => setNote(e.target.value)} maxLength={5000} rows={3} placeholder="Ghi lại nội dung đã trao đổi, hướng xử lý và việc cần theo dõi..." className={`${fieldClass} mt-2.5 block resize-y`} /></label><p className="mt-2 text-[11px] text-stone-500">Chỉ quản trị viên thấy ghi chú này. Ghi chú không được gửi cho khách hàng.</p></div><div className="flex flex-wrap items-center justify-end gap-3">{ticket.phone && <a href={`tel:${ticket.phone.replace(/[^+\d]/g, "")}`} className="flex items-center gap-2 rounded-xl border border-stone-200 px-3 py-2.5 text-xs font-bold dark:border-stone-700"><Phone size={15} />Gọi khách hàng</a>}<a href={`mailto:${ticket.email}?subject=${encodeURIComponent(`Re: ${ticket.subject}`)}`} className="flex items-center gap-2 rounded-xl border border-amber-200 px-3 py-2.5 text-xs font-bold text-amber-700 dark:border-amber-500/20 dark:text-amber-400"><Mail size={15} />Mở email phản hồi</a><button disabled={saving || deleting} onClick={save} className="flex items-center gap-2 rounded-xl bg-red-700 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-red-800 disabled:opacity-50">{saving ? "Đang lưu..." : "Lưu thay đổi"}</button>{ticket.status === "resolved" && status === "resolved" && <button type="button" disabled={saving || deleting} onClick={remove} className="rounded-xl border border-red-200 px-4 py-2.5 text-xs font-bold text-red-700 transition hover:bg-red-50 disabled:cursor-wait disabled:opacity-50 dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-500/10">{deleting ? "Đang xóa..." : "Xóa yêu cầu"}</button>}</div>{error && <p role="alert" className="text-sm text-red-500">{error}</p>}</div>
    </div>
  </article>;
}


