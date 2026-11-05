import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/authSession";
import { findOrderById } from "@/lib/orderAccess";
import { Order } from "@/models";

export async function PUT(_req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 });
    if (user.role !== "user") return NextResponse.json({ error: "Chức năng này chỉ dành cho khách hàng." }, { status: 403 });
    await connectDB();
    const { id } = await context.params;
    const current = await findOrderById(id);
    if (!current) return NextResponse.json({ error: "Không tìm thấy đơn hàng." }, { status: 404 });
    if (String(current.userId || "") !== String(user._id)) return NextResponse.json({ error: "Bạn không có quyền hủy đơn hàng này." }, { status: 403 });
    if (current.paymentStatus === "paid") return NextResponse.json({ error: "Đơn đã thanh toán, bạn không thể tự hủy. Vui lòng liên hệ cửa hàng để được hỗ trợ." }, { status: 409 });
    if (current.status !== "pending") return NextResponse.json({ error: "Đơn đã được xác nhận hoặc xử lý, bạn không thể tự hủy. Vui lòng liên hệ cửa hàng để được hỗ trợ." }, { status: 409 });

    const updated = await Order.collection.findOneAndUpdate(
      { _id: current._id, userId: String(user._id), status: "pending", paymentStatus: { $ne: "paid" } },
      { $set: { status: "cancelled", statusChangedAt: new Date(), updatedAt: new Date() } },
      { returnDocument: "after" },
    );
    if (!updated) {
      const latest = await findOrderById(id);
      const message = latest?.paymentStatus === "paid"
        ? "Đơn vừa được ghi nhận thanh toán, bạn không thể tự hủy."
        : "Trạng thái đơn vừa thay đổi, bạn không thể tự hủy nữa.";
      return NextResponse.json({ error: message }, { status: 409 });
    }
    delete updated.isArchived;
    delete updated.archivedAt;
    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT /api/orders/[id]/cancel error:", error);
    return NextResponse.json({ error: "Không thể hủy đơn hàng." }, { status: 500 });
  }
}
