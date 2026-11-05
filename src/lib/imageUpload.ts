export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
export type UploadTarget = "products" | "banners" | "categories" | "reviews" | "avatars";

export function validateImageFile(file: { size: number; type: string }) {
  if (!IMAGE_TYPES.includes(file.type)) return "Chỉ nhận ảnh JPG, PNG, WebP hoặc GIF.";
  if (!file.size) return "Tệp ảnh đang trống.";
  if (file.size > MAX_IMAGE_BYTES) return "Mỗi ảnh không được vượt quá 4 MB.";
  return null;
}

export function matchesImageSignature(bytes: Uint8Array, mime: string) {
  const starts = (values: number[]) => values.every((value, i) => bytes[i] === value);
  const ascii = (start: number, end: number) => String.fromCharCode(...bytes.slice(start, end));
  if (mime === "image/jpeg") return bytes.length > 3 && starts([255, 216, 255]);
  if (mime === "image/png") return bytes.length > 8 && starts([137, 80, 78, 71, 13, 10, 26, 10]);
  if (mime === "image/gif") return bytes.length > 6 && ["GIF87a", "GIF89a"].includes(ascii(0, 6));
  if (mime === "image/webp") return bytes.length > 12 && ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP";
  return false;
}
