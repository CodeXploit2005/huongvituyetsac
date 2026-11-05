"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { supportStatuses, type SupportStatus } from "@/lib/support";

const statuses = Object.keys(supportStatuses) as SupportStatus[];
const dots = { new: "bg-amber-400", processing: "bg-blue-400", resolved: "bg-emerald-400" };

export function SupportStatusSelect({ value, onChange }: { value: SupportStatus; onChange: (value: SupportStatus) => void }) {
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (!open) return;
    function closeOutside(event: PointerEvent) {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, [open]);

  function choose(index: number) { onChange(statuses[index]); setOpen(false); }

  return <div ref={root} className="relative w-full sm:max-w-64" onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
    <label id={`${id}-label`} htmlFor={`${id}-trigger`} className="mb-2.5 block text-xs font-semibold leading-5">Trạng thái yêu cầu</label>
    <button id={`${id}-trigger`} type="button" role="combobox" aria-labelledby={`${id}-label`} aria-expanded={open} aria-haspopup="listbox" aria-controls={`${id}-list`} aria-activedescendant={open ? `${id}-${active}` : undefined}
      onClick={() => { setActive(statuses.indexOf(value)); setOpen(!open); }}
      onKeyDown={event => {
        if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
          event.preventDefault(); setOpen(true);
          setActive(index => event.key === "Home" ? 0 : event.key === "End" ? statuses.length - 1 : !open ? statuses.indexOf(value) : (index + (event.key === "ArrowDown" ? 1 : -1) + statuses.length) % statuses.length);
        } else if (open && ["Enter", " "].includes(event.key)) { event.preventDefault(); choose(active); }
        else if (event.key === "Escape") { event.preventDefault(); setOpen(false); }
        else if (event.key === "Tab") setOpen(false);
      }}
      className={`flex min-h-12 w-full items-center justify-between gap-3 rounded-xl border bg-stone-50 px-4 py-3 text-sm font-semibold text-stone-900 outline-none transition focus-visible:ring-2 focus-visible:ring-amber-500/25 dark:bg-[#111827] dark:text-stone-100 ${open ? "border-amber-500 ring-2 ring-amber-500/15" : "border-stone-200 hover:border-amber-400 dark:border-[#283247] dark:hover:border-amber-500/60"}`}>
      <span className="flex items-center gap-2.5"><span aria-hidden="true" className={`size-2 shrink-0 rounded-full ${dots[value]}`} />{supportStatuses[value]}</span>
      <ChevronDown size={16} className={`shrink-0 text-stone-400 transition-transform ${open ? "rotate-180 text-amber-500" : ""}`} />
    </button>
    {open && <div id={`${id}-list`} role="listbox" aria-labelledby={`${id}-label`} className="absolute inset-x-0 top-full z-30 mt-2 space-y-1 rounded-xl border border-stone-200 bg-white p-1.5 shadow-xl dark:border-[#283247] dark:bg-[#141c2b] dark:shadow-black/40">
      {statuses.map((status, index) => <div key={status} id={`${id}-${index}`} role="option" aria-selected={status === value} onPointerMove={() => setActive(index)} onMouseDown={event => event.preventDefault()} onClick={() => choose(index)}
        className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-3 text-sm transition-colors ${status === value ? "bg-amber-50 font-semibold text-amber-800 dark:bg-amber-500/10 dark:text-amber-300" : active === index ? "bg-stone-100 text-stone-900 dark:bg-white/5 dark:text-white" : "text-stone-600 dark:text-stone-300"}`}>
        <span className="flex items-center gap-2.5"><span aria-hidden="true" className={`size-2 shrink-0 rounded-full ${dots[status]}`} />{supportStatuses[status]}</span>
        {status === value && <Check size={16} className="shrink-0 text-amber-600 dark:text-amber-400" />}
      </div>)}
    </div>}
  </div>;
}
