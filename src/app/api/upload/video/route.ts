import { randomUUID } from "node:crypto";
import { getCurrentUser } from "@/lib/authSession";
import { getCloudinary } from "@/lib/cloudinary";
import { MAX_VIDEO_BYTES, validateVideoFile } from "@/lib/mediaUpload";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return Response.json({ error: "Vui lòng đăng nhập để tải video." }, { status: 401 });
    const body = await request.json();
    if (body.target !== "products" && body.target !== "reviews") return Response.json({ error: "Mục tải video không hợp lệ." }, { status: 400 });
    if (body.target === "products" && user.role !== "admin") return Response.json({ error: "Chỉ Admin được tải video sản phẩm." }, { status: 403 });
    if (typeof body.size !== "number" || !Number.isSafeInteger(body.size) || body.size <= 0 || typeof body.type !== "string") return Response.json({ error: "Tệp video không hợp lệ." }, { status: 400 });
    const error = validateVideoFile(body);
    if (error) return Response.json({ error }, { status: 400 });
    const client = getCloudinary();
    const params = {
      timestamp: Math.floor(Date.now() / 1000),
      public_id: `huongvituyetsac/${body.target}/${user._id}/${randomUUID()}`,
      overwrite: false,
      allowed_formats: "mp4,webm,mov",
      // Normalize phone videos for playback in browser players.
      format: "mp4",
      transformation: "vc_h264,ac_aac",
    };
    return Response.json({
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      params,
      signature: client.utils.api_sign_request(params, process.env.CLOUDINARY_API_SECRET!),
    }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Không thể bắt đầu tải video. Vui lòng thử lại." }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return Response.json({ error: "Vui lòng đăng nhập." }, { status: 401 });
    const body = await request.json();
    if (body.target !== "products" && body.target !== "reviews") return Response.json({ error: "Mục tải video không hợp lệ." }, { status: 400 });
    if (body.target === "products" && user.role !== "admin") return Response.json({ error: "Không có quyền tải video sản phẩm." }, { status: 403 });
    const prefix = `huongvituyetsac/${body.target}/${user._id}/`;
    if (typeof body.publicId !== "string" || !body.publicId.startsWith(prefix) || !/^[a-f0-9-]{36}$/.test(body.publicId.slice(prefix.length))) return Response.json({ error: "Video không thuộc tài khoản này." }, { status: 400 });
    const client = getCloudinary();
    const asset = await client.api.resource(body.publicId, { resource_type: "video" });
    // Check provider metadata, never trust size/type reported by the browser.
    if (asset.resource_type !== "video" || !asset.width || !asset.height || asset.format !== "mp4" || asset.bytes > MAX_VIDEO_BYTES) {
      await client.uploader.destroy(body.publicId, { resource_type: "video" });
      return Response.json({ error: "Video không hợp lệ hoặc vượt quá 50 MB." }, { status: 400 });
    }
    return Response.json({ success: true, url: asset.secure_url, publicId: asset.public_id });
  } catch {
    return Response.json({ error: "Chưa thể xác nhận video. Vui lòng thử lại." }, { status: 503 });
  }
}
