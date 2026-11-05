import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getCurrentAdmin, getCurrentUser } from "@/lib/authSession";
import { findOrderById } from "@/lib/orderAccess";

export async function GET(_req: Request, context: RouteContext<"/api/orders/[id]">) {
  await connectDB();
  const { id } = await context.params;
  const [admin, user] = await Promise.all([getCurrentAdmin(), getCurrentUser()]);
  if (!admin && !user) return NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 });
  const order = await findOrderById(id);
  if (!order) return NextResponse.json({ error: "Không tìm thấy đơn hàng." }, { status: 404 });
  if (!admin && String(order.userId || "") !== String(user!._id)) return NextResponse.json({ error: "Bạn không có quyền xem đơn hàng này." }, { status: 403 });
  if (!admin) { delete order.isArchived; delete order.archivedAt; }
  return NextResponse.json(order);
}
