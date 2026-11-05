"use client";

import { useRef, useState } from "react";
import { Camera, X } from "lucide-react";
import { AvatarEditor } from "./AvatarEditor";

export function AvatarChangeButton({ avatar }: { avatar?: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  return <>
    <button
      type="button"
      aria-label="Thay ảnh đại diện"
      title="Thay ảnh đại diện"
      aria-haspopup="dialog"
      onClick={() => { setOpen(true); dialog.current?.showModal(); }}
      className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-stone-900 bg-amber-400 text-stone-950 shadow-sm transition hover:bg-amber-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
    >
      <Camera size={17} aria-hidden="true" />
    </button>
    <dialog
      ref={dialog}
      aria-labelledby="avatar-dialog-title"
      onClose={() => setOpen(false)}
      className="fixed inset-0 m-auto max-h-[85dvh] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-3xl border border-stone-200 bg-white p-5 text-xs text-stone-900 shadow-2xl backdrop:bg-black/70 dark:border-stone-700 dark:bg-stone-900 dark:text-white"
    >
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 id="avatar-dialog-title" className="text-base font-extrabold">Thay ảnh đại diện</h2>
        <button type="button" aria-label="Đóng" onClick={() => dialog.current?.close()} className="rounded-full p-2 hover:bg-stone-100 dark:hover:bg-stone-800"><X size={20} /></button>
      </div>
      {open && <AvatarEditor avatar={avatar} />}
    </dialog>
  </>;
}
