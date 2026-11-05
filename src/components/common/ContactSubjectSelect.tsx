"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown, Handshake, List, MessageCircle, Package, ShoppingBag, Sparkles } from "lucide-react";
import { supportSubjects } from "@/lib/support";

const details = [
  { icon: Package, description: "Tìm hiểu và lựa chọn sản phẩm phù hợp" },
  { icon: ShoppingBag, description: "Giao hàng, thanh toán và đổi trả" },
  { icon: MessageCircle, description: "Chia sẻ trải nghiệm của bạn với chúng tôi" },
  { icon: Handshake, description: "Đại lý, phân phối và cơ hội hợp tác" },
  { icon: Sparkles, description: "Những điều khác bạn muốn trao đổi" },
];

export function ContactSubjectSelect({ value, onChange, invalid }: { value: string; onChange: (value: string) => void; invalid: boolean }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const listId = useId();
  const selectedIndex = supportSubjects.findIndex(subject => subject === value);
  const SelectedIcon = selectedIndex >= 0 ? details[selectedIndex].icon : List;

  useEffect(() => {
    if (!open) return;
    const closeOutside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, [open]);

  useEffect(() => {
    if (open) document.getElementById(`${listId}-${active}`)?.scrollIntoView({ block: "nearest" });
  }, [active, open, listId]);

  function choose(index: number) {
    onChange(supportSubjects[index]);
    setOpen(false);
    trigger.current?.focus();
  }

  return (
    <div ref={root} className="relative" onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
      <input type="hidden" name="subject" value={value} />
      <button
        ref={trigger} id="contact-subject" type="button" role="combobox"
        aria-label="Chủ đề liên hệ" aria-required="true" aria-invalid={invalid}
        aria-describedby={invalid ? `${listId}-error` : undefined}
        aria-expanded={open} aria-controls={listId} aria-haspopup="listbox"
        aria-activedescendant={open ? `${listId}-${active}` : undefined}
        onClick={() => { setActive(Math.max(0, selectedIndex)); setOpen(!open); }}
        onKeyDown={event => {
          if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
            event.preventDefault();
            setOpen(true);
            setActive(index => event.key === "Home" ? 0 : event.key === "End" ? supportSubjects.length - 1 : !open ? Math.max(0, selectedIndex) : (index + (event.key === "ArrowDown" ? 1 : -1) + supportSubjects.length) % supportSubjects.length);
          } else if (open && ["Enter", " "].includes(event.key)) {
            event.preventDefault(); choose(active);
          } else if (event.key === "Escape") {
            event.preventDefault(); setOpen(false);
          } else if (event.key === "Tab") setOpen(false);
        }}
        className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-all outline-none focus-visible:ring-2 focus-visible:ring-amber-500/30 ${invalid ? "border-red-500" : open ? "border-amber-500 ring-2 ring-amber-500/15" : "border-stone-200 hover:border-amber-400 dark:border-white/10 dark:hover:border-amber-500/50"} ${open ? "bg-amber-50/60 dark:bg-amber-500/5" : "bg-stone-50 dark:bg-white/[.025]"}`}
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-400/10 dark:text-amber-400"><SelectedIcon size={17} /></span>
        <span className={`flex-1 ${value ? "font-semibold text-stone-900 dark:text-stone-100" : "text-stone-500 dark:text-stone-400"}`}>{value || "Chủ đề liên hệ *"}</span>
        <ChevronDown size={17} className={`shrink-0 text-amber-600 transition-transform duration-200 dark:text-amber-400 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl shadow-stone-900/15 dark:border-amber-400/15 dark:bg-[#211b18] dark:shadow-black/40">
          <p className="border-b border-stone-100 px-4 py-3 text-[10px] font-bold uppercase tracking-[.15em] text-stone-400 dark:border-white/5 dark:text-stone-500">Chúng tôi có thể giúp gì cho bạn?</p>
          <div id={listId} role="listbox" aria-label="Chủ đề liên hệ" className="max-h-72 space-y-1 overflow-y-auto overscroll-contain p-2">
            {supportSubjects.map((subject, index) => {
              const { icon: Icon, description } = details[index];
              const selected = subject === value;
              return (
                <div key={subject} id={`${listId}-${index}`} role="option" aria-selected={selected}
                  onPointerMove={() => setActive(index)} onMouseDown={event => event.preventDefault()} onClick={() => choose(index)}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-3 transition-colors ${selected ? "border-amber-300/60 bg-gradient-to-r from-amber-50 to-orange-50 dark:border-amber-400/20 dark:from-amber-400/15 dark:to-orange-500/5" : active === index ? "border-transparent bg-stone-100 dark:bg-white/[.06]" : "border-transparent"}`}
                >
                  <span aria-hidden="true" className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${selected || active === index ? "bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-400" : "bg-stone-100 text-stone-500 dark:bg-white/5 dark:text-stone-400"}`}><Icon size={18} /></span>
                  <span className="min-w-0 flex-1"><span className={`block text-sm font-semibold ${selected ? "text-amber-800 dark:text-amber-300" : "text-stone-800 dark:text-stone-100"}`}>{subject}</span><span className="mt-0.5 block text-[11px] leading-4 text-stone-500 dark:text-stone-400">{description}</span></span>
                  {selected && <Check size={17} className="shrink-0 text-amber-600 dark:text-amber-400" />}
                </div>
              );
            })}
          </div>
        </div>
      )}
      {invalid && <p id={`${listId}-error`} className="mt-2 text-xs text-red-600 dark:text-red-400">Vui lòng chọn chủ đề liên hệ.</p>}
    </div>
  );
}
