"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown, MapPin, Search } from "lucide-react";
import { VIETNAM_PROVINCES } from "@/data/provinces";

const normalize = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").toLowerCase();

export function ProvinceSelect({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const id = useId();
  const options = value && !VIETNAM_PROVINCES.some(p => p.value === value)
    ? [{ value, label: value }, ...VIETNAM_PROVINCES] : VIETNAM_PROVINCES;
  const filtered = options.filter(p => normalize(p.label).includes(normalize(query)));

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  return <div ref={root} className="w-full min-w-0" onKeyDown={event => {
    if (event.key === "Escape") { setOpen(false); trigger.current?.focus(); }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) { setQuery(""); setOpen(true); return; }
      const buttons = Array.from(root.current?.querySelectorAll<HTMLButtonElement>('[role="option"]') || []);
      const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
      buttons[(index + (event.key === "ArrowDown" ? 1 : -1) + buttons.length) % buttons.length]?.focus();
    }
  }}>
    <button ref={trigger} type="button" aria-label="Tỉnh / Thành phố" aria-expanded={open} aria-controls={id} aria-haspopup="listbox" onClick={() => { setQuery(""); setOpen(!open); }} className={`flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left text-sm font-semibold outline-none transition-colors bg-white text-stone-800 dark:bg-stone-800 dark:text-stone-100 focus-visible:ring-2 focus-visible:ring-amber-400/40 ${open ? "border-amber-500 ring-2 ring-amber-400/15" : "border-stone-300 dark:border-stone-600 hover:border-amber-500"}`}>
      <MapPin size={18} className="shrink-0 text-amber-600 dark:text-amber-400" />
      <span className={`min-w-0 flex-1 truncate ${value ? "" : "text-stone-500 dark:text-stone-400"}`}>{value || "Chọn tỉnh / thành phố"}</span>
      <ChevronDown size={16} className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
    </button>
    {open && <div className="mt-2 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-xl shadow-stone-900/10 dark:border-stone-600 dark:bg-stone-800 dark:shadow-black/20">
      <div className="flex items-center gap-2 border-b border-stone-200 px-3 py-2.5 dark:border-stone-700">
        <Search size={16} className="shrink-0 text-amber-500" />
        <input autoFocus aria-label="Tìm tỉnh thành" placeholder="Tìm tỉnh / thành phố..." value={query} onChange={e => setQuery(e.target.value)} className="min-w-0 flex-1 bg-transparent text-sm font-normal text-stone-900 outline-none placeholder:text-stone-400 dark:text-stone-100" />
      </div>
      <div id={id} role="listbox" aria-label="Danh sách tỉnh thành" className="max-h-56 overflow-y-auto overscroll-contain p-1.5">
        {filtered.map(p => <button key={p.value} type="button" role="option" aria-selected={p.value === value} onClick={() => { onChange(p.value); setOpen(false); trigger.current?.focus(); }} className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-400 ${p.value === value ? "bg-amber-50 font-bold text-amber-800 dark:bg-amber-400/15 dark:text-amber-300" : "font-medium text-stone-700 hover:bg-stone-100 dark:text-stone-200 dark:hover:bg-stone-700"}`}>
          {p.label}{p.value === value && <Check size={16} className="shrink-0" />}
        </button>)}
        {!filtered.length && <p className="p-4 text-center text-sm font-normal text-stone-500 dark:text-stone-400">Không tìm thấy tỉnh / thành phố.</p>}
      </div>
    </div>}
  </div>;
}
