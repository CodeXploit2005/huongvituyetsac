"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { DEFAULT_AVATAR } from "@/lib/mediaUpload";
import { ImageUploader } from "./ImageUploader";

export function AvatarEditor({ avatar }: { avatar?: string }) {
  const { updateAvatar } = useAuth();
  const [draft, setDraft] = useState(avatar || DEFAULT_AVATAR);
  const [uploadCount, setUploadCount] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const changed = draft !== (avatar || DEFAULT_AVATAR);

  async function save() {
    if (saving || uploadCount > 0 || !changed) return;
    setSaving(true); setError(""); setMessage("");
    try {
      await updateAvatar(draft === DEFAULT_AVATAR ? null : draft);
      setMessage("Đã lưu ảnh đại diện.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể lưu ảnh đại diện.");
    } finally { setSaving(false); }
  }

  return <div className="sm:col-span-2 space-y-3 rounded-2xl border border-stone-200 p-4 dark:border-stone-700">
    <p className="font-bold text-stone-700 dark:text-stone-300">Ảnh đại diện</p>
    <ImageUploader target="avatars" label="Chọn ảnh đại diện" value={[draft]} onChange={urls => { setDraft(urls[0] || DEFAULT_AVATAR); setMessage(""); setError(""); }} setUploadCount={setUploadCount} disabled={saving || uploadCount > 0} />
    <div className="flex flex-wrap items-center gap-3">
      <button type="button" onClick={() => void save()} disabled={saving || uploadCount > 0 || !changed} className="rounded-xl bg-amber-500 px-4 py-2.5 font-bold text-stone-950 disabled:cursor-not-allowed disabled:opacity-50">{saving ? "Đang lưu..." : "Lưu ảnh đại diện"}</button>
      {draft !== DEFAULT_AVATAR && <button type="button" disabled={saving || uploadCount > 0} onClick={() => { setDraft(DEFAULT_AVATAR); setMessage(""); }} className="text-stone-600 underline underline-offset-4 disabled:opacity-50 dark:text-stone-400">Dùng ảnh mặc định</button>}
    </div>
    {error && <p role="alert" className="text-red-600 dark:text-red-400">{error}</p>}
    <p role="status" className="text-emerald-700 dark:text-emerald-400">{message}</p>
  </div>;
}
