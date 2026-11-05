import { connectDB } from "@/lib/mongodb";
import { validateSupport } from "@/lib/support";
import { SupportTicketModel } from "@/models/SupportTicket";

export async function POST(request: Request) {
  let input: unknown;
  try { input = await request.json(); } catch { return Response.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 }); }
  const data = validateSupport(input);
  if (!data) return Response.json({ error: "Vui lòng kiểm tra họ tên, email, số điện thoại (9–15 chữ số nếu có), chủ đề và nội dung (tối đa 5.000 ký tự)." }, { status: 400 });
  try {
    await connectDB();
    await SupportTicketModel.create(data);
    return Response.json({ success: true }, { status: 201 });
  } catch {
    return Response.json({ error: "Chưa thể gửi tin nhắn. Vui lòng thử lại hoặc liên hệ qua email." }, { status: 503 });
  }
}
