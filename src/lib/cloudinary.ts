import "server-only";
import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";
import type { UploadTarget } from "./imageUpload";

export function getCloudinary() {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    throw new Error("Dịch vụ tải ảnh chưa được cấu hình.");
  }
  cloudinary.config({ cloud_name: CLOUDINARY_CLOUD_NAME, api_key: CLOUDINARY_API_KEY, api_secret: CLOUDINARY_API_SECRET, secure: true });
  return cloudinary;
}

export async function uploadImage(buffer: Buffer, target: UploadTarget, ownerId?: string): Promise<UploadApiResponse> {
  const client = getCloudinary();
  return new Promise((resolve, reject) => {
    const stream = client.uploader.upload_stream({
      folder: `huongvituyetsac/${target}${target === "avatars" && ownerId ? `/${ownerId}` : ""}`,
      resource_type: "image",
      allowed_formats: ["jpg", "jpeg", "png", "webp", "gif"],
      overwrite: false,
      timeout: 60000,
    }, (error, result) => {
      if (error || !result) reject(new Error("Cloudinary chưa thể nhận ảnh. Vui lòng thử lại."));
      else resolve(result);
    });
    stream.on("error", () => reject(new Error("Không thể kết nối dịch vụ tải ảnh.")));
    stream.end(buffer);
  });
}
