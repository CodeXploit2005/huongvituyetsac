import { getCurrentAdmin } from "@/lib/authSession";
import { connectDB } from "@/lib/mongodb";
import { supportStatuses } from "@/lib/support";
import { SupportTicketModel } from "@/models/SupportTicket";

export async function GET(request: Request) {
  try {
    if (!await getCurrentAdmin()) return Response.json({ error: "Không có quyền quản trị." }, { status: 403 });
    await connectDB();
    const url = new URL(request.url);
    const requestedPage = Number(url.searchParams.get("page"));
    const page = Number.isFinite(requestedPage) ? Math.max(1, Math.floor(requestedPage)) : 1;
    const status = url.searchParams.get("status");
    const query = (url.searchParams.get("q") || "").trim().slice(0, 100);
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const filter = {
      ...(status && Object.hasOwn(supportStatuses, status) ? { status } : {}),
      ...(query ? { $or: ["name", "email", "phone", "subject"].map(field => ({ [field]: { $regex: escaped, $options: "i" } })) } : {}),
    };
    const [tickets, total, counts] = await Promise.all([
      SupportTicketModel.find(filter).sort({ createdAt: -1 }).skip((page - 1) * 20).limit(20).lean(),
      SupportTicketModel.countDocuments(filter),
      SupportTicketModel.aggregate<{ _id: string; count: number }>([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    ]);
    const stats = { all: 0, new: 0, processing: 0, resolved: 0 };
    for (const row of counts) {
      stats.all += row.count;
      if (Object.hasOwn(supportStatuses, row._id)) stats[row._id as keyof typeof supportStatuses] = row.count;
    }
    return Response.json({ tickets, total, stats }, { headers: { "Cache-Control": "no-store" } });
  } catch { return Response.json({ error: "Không thể tải yêu cầu hỗ trợ." }, { status: 503 }); }
}
export async function PATCH(request: Request) {
  try {
    if (!await getCurrentAdmin()) return Response.json({ error: "Không có quyền quản trị." }, { status: 403 });
    const data = await request.json().catch(() => null);
    if (!data || typeof data.id !== "string" || !/^[a-f\d]{24}$/i.test(data.id) || typeof data.status !== "string" || !Object.hasOwn(supportStatuses, data.status) || typeof data.note !== "string" || data.note.length > 5000) return Response.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 });
    await connectDB();
    const ticket = await SupportTicketModel.findByIdAndUpdate(data.id, { status: data.status, note: data.note.trim() }, { new: true, runValidators: true }).lean();
    if (!ticket) return Response.json({ error: "Không tìm thấy yêu cầu." }, { status: 404 });
    return Response.json({ ticket });
  } catch { return Response.json({ error: "Không thể lưu thay đổi." }, { status: 503 }); }
}

export async function DELETE(request: Request) {
  try {
    if (!await getCurrentAdmin()) return Response.json({ error: "Không có quyền quản trị." }, { status: 403 });
    const data = await request.json().catch(() => null);
    if (!data || typeof data.id !== "string" || !/^[a-f\d]{24}$/i.test(data.id)) {
      return Response.json({ error: "Mã yêu cầu không hợp lệ." }, { status: 400 });
    }
    await connectDB();
    // Check the persisted status atomically so an active request cannot be deleted.
    const deleted = await SupportTicketModel.findOneAndDelete({ _id: data.id, status: "resolved" });
    if (!deleted) return Response.json({ error: "Yêu cầu không còn tồn tại hoặc chưa được đánh dấu đã xử lý. Vui lòng làm mới danh sách." }, { status: 409 });
    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "Không thể xóa yêu cầu. Vui lòng thử lại." }, { status: 503 });
  }
}
