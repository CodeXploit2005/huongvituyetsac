import { getCurrentUser } from "@/lib/authSession";
import { uploadImage } from "@/lib/cloudinary";
import { MAX_IMAGE_BYTES, matchesImageSignature, validateImageFile, type UploadTarget } from "@/lib/imageUpload";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return Response.json({ error: "Vui lòng đăng nhập để tải ảnh." }, { status: 401 });
    const contentType = request.headers.get("content-type") || "";
    if (!contentType.startsWith("multipart/form-data")) return Response.json({ error: "Vui lòng gửi ảnh bằng FormData." }, { status: 400 });
    const bodyLimit = MAX_IMAGE_BYTES + 64 * 1024;
    if (Number(request.headers.get("content-length")) > bodyLimit) return Response.json({ error: "Mỗi ảnh không được vượt quá 4 MB." }, { status: 413 });
    // Bound actual bytes as well, including requests without Content-Length.
    const reader = request.body?.getReader();
    if (!reader) return Response.json({ error: "Thiếu tệp ảnh." }, { status: 400 });
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      size += part.value.byteLength;
      if (size > bodyLimit) { await reader.cancel(); return Response.json({ error: "Mỗi ảnh không được vượt quá 4 MB." }, { status: 413 }); }
      chunks.push(part.value);
    }
    const body = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.byteLength; }
    const form = await new Response(body, { headers: { "content-type": contentType } }).formData().catch(() => null);
    if (!form) return Response.json({ error: "Dữ liệu tải ảnh không hợp lệ." }, { status: 400 });
    const target = form.get("target") || "products";
    if (typeof target !== "string" || !["products", "banners", "categories", "reviews", "avatars"].includes(target)) return Response.json({ error: "Mục tải ảnh không hợp lệ." }, { status: 400 });
    if (!["reviews", "avatars"].includes(target) && user.role !== "admin") return Response.json({ error: "Chỉ quản trị viên được tải ảnh vào mục này." }, { status: 403 });
    const file = form.get("file");
    if (!(file instanceof File) || form.getAll("file").length !== 1) return Response.json({ error: "Vui lòng chọn một tệp ảnh." }, { status: 400 });
    const error = validateImageFile(file);
    if (error) return Response.json({ error }, { status: file.size > MAX_IMAGE_BYTES ? 413 : 400 });
    const buffer = Buffer.from(await file.arrayBuffer());
    if (!matchesImageSignature(buffer, file.type)) return Response.json({ error: "Nội dung tệp không đúng định dạng ảnh." }, { status: 400 });
    const result = await uploadImage(buffer, target as UploadTarget, target === "avatars" ? String(user._id) : undefined);
    return Response.json({ success: true, url: result.secure_url, publicId: result.public_id }, { status: 201 });
  } catch {
    // Do not expose provider responses, credentials or request details to clients.
    return Response.json({ error: "Chưa thể tải ảnh lên. Vui lòng thử lại sau." }, { status: 503 });
  }
}
