export const DEFAULT_AVATAR = "/default-avatar.png";
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
export const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
export type VideoTarget = "products" | "reviews";

export function validateVideoFile(file: { size: number; type: string }) {
  if (!VIDEO_TYPES.includes(file.type)) return "Chỉ nhận video MP4, WebM hoặc MOV.";
  if (!file.size) return "Tệp video đang trống.";
  if (file.size > MAX_VIDEO_BYTES) return "Mỗi video không được vượt quá 50 MB.";
  return null;
}

export function isCloudinaryMediaUrl(value: unknown, cloudName: string | undefined, kind: "image" | "video", folder: string): value is string {
  if (typeof value !== "string" || !cloudName || value.length > 2048) return false;
  try {
    const url = new URL(value);
    const prefix = `/${cloudName}/${kind}/upload/`;
    if (url.protocol !== "https:" || url.hostname !== "res.cloudinary.com" || url.port || url.username || url.password || url.search || url.hash || !url.pathname.startsWith(prefix)) return false;
    const asset = url.pathname.slice(prefix.length).replace(/^v\d+\//, "");
    return asset.startsWith(`huongvituyetsac/${folder}/`) && !asset.includes("%") && !asset.includes("..");
  } catch { return false; }
}

interface SignedVideoUpload {
  cloudName: string;
  apiKey: string;
  signature: string;
  params: Record<string, string | number | boolean>;
}

export async function uploadVideoFile(file: File, target: VideoTarget, signal: AbortSignal): Promise<string> {
  const signedResponse = await fetch("/api/upload/video", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ target, size: file.size, type: file.type }), signal,
  });
  const signed = await signedResponse.json() as SignedVideoUpload & { error?: string };
  if (!signedResponse.ok) throw new Error(signed.error || "Không thể bắt đầu tải video.");
  const form = new FormData();
  form.append("file", file);
  form.append("api_key", signed.apiKey);
  form.append("signature", signed.signature);
  Object.entries(signed.params).forEach(([key, value]) => form.append(key, String(value)));
  const response = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(signed.cloudName)}/video/upload`, { method: "POST", body: form, signal });
  const uploaded = await response.json() as { public_id?: string };
  if (!response.ok || !uploaded.public_id) throw new Error("Không thể tải video. Hãy kiểm tra định dạng và kết nối rồi thử lại.");
  const complete = await fetch("/api/upload/video", {
    method: "PATCH", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ target, publicId: uploaded.public_id }), signal,
  });
  const result = await complete.json() as { url?: string; error?: string };
  if (!complete.ok || !result.url) throw new Error(result.error || "Không thể xác nhận video.");
  return result.url;
}
