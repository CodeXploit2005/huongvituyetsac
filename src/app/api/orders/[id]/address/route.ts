import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/authSession";
import { findOrderById } from "@/lib/orderAccess";
import { Order } from "@/models";

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 });
    if (user.role !== "user") return NextResponse.json({ error: "Chức năng này chỉ dành cho khách hàng." }, { status: 403 });
    await connectDB();
    const { id } = await context.params;
    const current = await findOrderById(id);
    if (!current) return NextResponse.json({ error: "Không tìm thấy đơn hàng." }, { status: 404 });
    if (String(current.userId || "") !== String(user._id)) return NextResponse.json({ error: "Bạn không có quyền sửa địa chỉ của đơn hàng này." }, { status: 403 });
    if (current.status !== "pending") return NextResponse.json({ error: "Đơn đã được xác nhận hoặc xử lý, bạn không thể sửa địa chỉ nữa." }, { status: 409 });

    const body = await req.json();
    const address = String(body.address || "").trim();
    const province = String(body.province || "").trim();
    const note = String(body.note || "").trim();
    if (!address || !province) return NextResponse.json({ error: "Địa chỉ và tỉnh/thành phố không được để trống." }, { status: 400 });
    if (address.length > 300 || province.length > 100 || note.length > 500) return NextResponse.json({ error: "Thông tin địa chỉ hoặc ghi chú quá dài." }, { status: 400 });

    // Phí ship hiện được cố định theo sản phẩm, không phụ thuộc tỉnh/thành phố.
    // Vì vậy chỉ cập nhật đúng ba field được phép, giữ nguyên shippingFee và total.
    const updated = await Order.collection.findOneAndUpdate(
      { _id: current._id, userId: String(user._id), status: "pending" },
      { $set: { address, province, note: note || null, updatedAt: new Date() } },
      { returnDocument: "after" },
    );
    if (!updated) return NextResponse.json({ error: "Trạng thái đơn vừa thay đổi, bạn không thể sửa địa chỉ nữa." }, { status: 409 });
    delete updated.isArchived;
    delete updated.archivedAt;
    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/orders/[id]/address error:", error);
    return NextResponse.json({ error: "Không thể cập nhật địa chỉ giao hàng." }, { status: 500 });
  }
}
