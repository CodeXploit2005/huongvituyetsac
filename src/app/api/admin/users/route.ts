import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/authSession";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models";

export async function GET() {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Không có quyền quản trị." }, { status: 403 });

  await connectDB();
  const users = await User.find({})
    .select("name email role createdAt")
    .sort({ createdAt: -1 })
    .lean();
  return NextResponse.json({ success: true, users, currentUserId: String(admin._id) });
}

export async function PATCH(req: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Không có quyền quản trị." }, { status: 403 });

  const { userId, role } = (await req.json()) as { userId?: string; role?: string };
  if (!userId || !["admin", "user"].includes(role || "")) {
    return NextResponse.json({ error: "Dữ liệu phân quyền không hợp lệ." }, { status: 400 });
  }
  if (String(admin._id) === userId) {
    return NextResponse.json({ error: "Bạn không thể tự hạ quyền tài khoản đang đăng nhập." }, { status: 400 });
  }

  await connectDB();
  const user = await User.findByIdAndUpdate(userId, { role }, { new: true })
    .select("name email role createdAt")
    .lean();
  if (!user) return NextResponse.json({ error: "Không tìm thấy tài khoản." }, { status: 404 });
  return NextResponse.json({ success: true, user });
}

export async function DELETE(req: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Không có quyền quản trị." }, { status: 403 });

  const { userId } = (await req.json()) as { userId?: string };
  if (!userId) return NextResponse.json({ error: "Thiếu tài khoản cần xóa." }, { status: 400 });
  if (String(admin._id) === userId) {
    return NextResponse.json({ error: "Bạn không thể xóa tài khoản đang đăng nhập." }, { status: 400 });
  }

  await connectDB();
  const result = await User.findByIdAndDelete(userId);
  if (!result) return NextResponse.json({ error: "Không tìm thấy tài khoản." }, { status: 404 });
  return NextResponse.json({ success: true });
}
