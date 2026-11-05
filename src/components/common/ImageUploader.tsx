"use client";

import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { Paperclip, LoaderCircle, X } from "lucide-react";
import { IMAGE_TYPES, validateImageFile, type UploadTarget } from "@/lib/imageUpload";
import { DEFAULT_AVATAR, VIDEO_TYPES, uploadVideoFile, validateVideoFile } from "@/lib/mediaUpload";

interface Props {
  value: string[];
  onChange: (urls: string[]) => void;
  target: UploadTarget;
  maxFiles?: number;
  label?: string;
  disabled?: boolean;
  mediaType?: "image" | "video";
  setUploadCount: Dispatch<SetStateAction<number>>;
}

export function ImageUploader({ value, onChange, target, maxFiles = 1, label = "Đính kèm ảnh", disabled = false, mediaType = "image", setUploadCount }: Props) {
  const isVideo = mediaType === "video";
  const noun = isVideo ? "video" : "ảnh";
  const input = useRef<HTMLInputElement>(null);
  const controller = useRef<AbortController | null>(null);
  const [previews, setPreviews] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const previewUrls = useRef<string[]>([]);
  useEffect(() => () => {
    controller.current?.abort();
    previewUrls.current.forEach(url => URL.revokeObjectURL(url));
  }, []);

  async function upload(files: File[]) {
    if (!files.length || controller.current || disabled) return;
    setError(""); setMessage("");
    if ((maxFiles === 1 ? files.length : value.length + files.length) > maxFiles) { setError(`Bạn chỉ có thể đính kèm tối đa ${maxFiles} ${noun}.`); return; }
    for (const file of files) {
      const invalid = isVideo ? validateVideoFile(file) : validateImageFile(file);
      if (invalid) { setError(`${file.name}: ${invalid}`); return; }
    }
    const abort = new AbortController();
    controller.current = abort;
    const local = files.map(file => URL.createObjectURL(file));
    previewUrls.current = local;
    setPreviews(local); setBusy(true); setUploadCount(count => count + 1);
    const urls = maxFiles === 1 ? [] : [...value];
    try {
      for (const [index, file] of files.entries()) {
        let uploadedUrl: string;
        if (isVideo) {
          if (target !== "reviews" && target !== "products") throw new Error("Mục này không hỗ trợ video.");
          uploadedUrl = await uploadVideoFile(file, target, AbortSignal.any([abort.signal, AbortSignal.timeout(300000)]));
        } else {
        const form = new FormData(); form.append("file", file); form.append("target", target);
        const res = await fetch("/api/upload", { method: "POST", body: form, signal: AbortSignal.any([abort.signal, AbortSignal.timeout(75000)]) });
        const data = await res.json().catch(() => null) as { url?: string; success?: boolean; error?: string } | null;
        if (!res.ok || !data?.success || !data.url?.startsWith("https://")) throw new Error(data?.error || "Tải ảnh thất bại. Vui lòng thử lại.");
        uploadedUrl = data.url;
        }
        urls.push(uploadedUrl);
        if (!abort.signal.aborted) {
          onChange([...urls]);
          setPreviews(local.slice(index + 1));
        }
      }
      if (!abort.signal.aborted) setMessage(target === "reviews" ? `Tải ${noun} thành công. Bấm Gửi đánh giá để hoàn tất.` : `Tải ${noun} thành công. Bấm lưu để hoàn tất.`);
    } catch (e) {
      if (!abort.signal.aborted) {
        const detail = e instanceof Error && e.name === "TimeoutError"
          ? `Tải ${noun} quá lâu. Vui lòng kiểm tra kết nối và thử lại.`
          : e instanceof Error ? e.message : `Tải ${noun} thất bại. Vui lòng thử lại.`;
        setError(`${detail}${urls.length > (maxFiles === 1 ? 0 : value.length) ? " Các tệp đã tải thành công được giữ lại; hãy chọn lại tệp chưa tải được." : ""}`);
      }
    } finally {
      local.forEach(url => URL.revokeObjectURL(url));
      previewUrls.current = [];
      controller.current = null;
      setUploadCount(count => Math.max(0, count - 1));
      if (!abort.signal.aborted) { setBusy(false); setPreviews([]); }
    }
  }

  return <div className="space-y-3">
    <input ref={input} type="file" accept={(isVideo ? VIDEO_TYPES : IMAGE_TYPES).join(",")} multiple={maxFiles > 1} className="hidden" tabIndex={-1} aria-label={label} disabled={busy || disabled} onChange={e => { const files = Array.from(e.target.files || []); e.target.value = ""; void upload(files); }} />
    <button type="button" aria-label={label} disabled={busy || disabled || (maxFiles > 1 && value.length >= maxFiles)} onClick={() => input.current?.click()} className="inline-flex items-center gap-2 rounded-xl border border-dashed border-amber-400/70 bg-amber-50 px-4 py-3 text-xs font-bold text-amber-800 transition hover:bg-amber-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-amber-400/30 dark:bg-amber-400/5 dark:text-amber-300 dark:hover:bg-amber-400/10">{busy ? <LoaderCircle size={17} className="animate-spin" /> : <Paperclip size={17} aria-hidden="true" />}{busy ? `Đang tải ${noun}...` : value.length && maxFiles === 1 ? `Thay ${noun} từ thiết bị` : label}</button>
    <p className="text-[11px] text-stone-500 dark:text-stone-400">{isVideo ? "MP4, WebM, MOV · Tối đa 50 MB/video" : "JPG, PNG, WebP, GIF · Tối đa 4 MB/ảnh"}{maxFiles > 1 ? ` · ${value.length}/${maxFiles} ${noun}` : ""}</p>
    {(value.length > 0 || previews.length > 0) && <div className="flex flex-wrap gap-2">{[...(maxFiles === 1 && previews.length ? [] : value), ...previews].map((url, index) => <div key={`${url}-${index}`} className={`relative overflow-hidden border border-stone-200 dark:border-stone-700 ${isVideo ? "w-full max-w-xs rounded-xl" : target === "avatars" ? "h-24 w-24 rounded-full" : "h-24 w-24 rounded-xl"}`}>
      {isVideo ? <video src={url} controls playsInline preload="metadata" aria-label={`Video đính kèm ${index + 1}`} className="aspect-video w-full bg-black object-contain" /> : (<>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt={`Ảnh đính kèm ${index + 1}`} className={`h-full w-full object-cover ${previews.includes(url) ? "opacity-60" : ""}`} />
      </>)}
      {!busy && url !== DEFAULT_AVATAR && <button type="button" disabled={disabled} aria-label={`Bỏ ${noun} ${index + 1}`} onClick={() => { onChange(value.filter((_, i) => i !== index)); setMessage(""); }} className="absolute right-1 top-1 rounded-full bg-stone-950/80 p-1.5 text-white"><X size={15} /></button>}
    </div>)}</div>}
    {error && <p role="alert" className="text-xs text-red-600 dark:text-red-400">{error}</p>}
    <p role="status" className="text-xs text-emerald-700 dark:text-emerald-400">{message}</p>
  </div>;
}
