import { getCurrentUser } from "@/lib/authSession";
import { isCloudinaryMediaUrl } from "@/lib/mediaUpload";
import { User } from "@/models";

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return Response.json({ error: "Vui lòng đăng nhập để thay ảnh đại diện." }, { status: 401 });
    const { avatar } = await request.json();
    if (avatar !== null && !isCloudinaryMediaUrl(avatar, process.env.CLOUDINARY_CLOUD_NAME, "image", `avatars/${user._id}`)) {
      return Response.json({ error: "Vui lòng chọn ảnh đại diện từ thiết bị của bạn." }, { status: 400 });
    }
    const saved = await User.findByIdAndUpdate(user._id, { $set: { avatar } }, { new: true, runValidators: true }).select("avatar").lean();
    if (!saved) return Response.json({ error: "Không tìm thấy tài khoản." }, { status: 404 });
    return Response.json({ success: true, avatar: saved.avatar });
  } catch {
    return Response.json({ error: "Không thể lưu ảnh đại diện. Vui lòng thử lại." }, { status: 400 });
  }
}
