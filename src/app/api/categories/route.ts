import { getCurrentAdmin } from "@/lib/authSession";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Category, Product } from "@/models";

export async function GET() {
  try {
    await connectDB();
    const categories = await Category.find({}).sort({ order: 1 }).lean();
    return NextResponse.json(categories);
  } catch (error: unknown) {
    console.error("GET /api/categories error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Không thể lưu dữ liệu." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    if (!await getCurrentAdmin()) return NextResponse.json({ error: "Không có quyền quản trị." }, { status: 403 });
    await connectDB();
    const body = await req.json();
    const newCategory = await Category.create(body);
    return NextResponse.json(newCategory, { status: 201 });
  } catch (error: unknown) {
    console.error("POST /api/categories error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Không thể lưu dữ liệu." }, { status: 400 });
  }
}

export async function PUT(req: Request) {
  try {
    if (!await getCurrentAdmin()) return NextResponse.json({ error: "Không có quyền quản trị." }, { status: 403 });
    const body = await req.json();
    if (!body || typeof body._id !== "string" || !/^[a-f\d]{24}$/i.test(body._id)) return NextResponse.json({ error: "Mã dữ liệu không hợp lệ." }, { status: 400 });
    await connectDB();
    const fields = ["name","slug","order","image","description"];
    const payload = Object.fromEntries(fields.filter(key => body[key] !== undefined).map(key => [key, body[key]]));
    const saved = await Category.findByIdAndUpdate(body._id, { $set: payload }, { new: true, runValidators: true });
    if (!saved) return NextResponse.json({ error: "Không tìm thấy dữ liệu." }, { status: 404 });
    return NextResponse.json(saved);
  } catch { return NextResponse.json({ error: "Không thể cập nhật dữ liệu." }, { status: 400 }); }
}

export async function DELETE(req: Request) {
  try {
    if (!await getCurrentAdmin()) return NextResponse.json({ error: "Không có quyền quản trị." }, { status: 403 });
    const { id } = await req.json();
    if (typeof id !== "string" || !/^[a-f\d]{24}$/i.test(id)) return NextResponse.json({ error: "Mã dữ liệu không hợp lệ." }, { status: 400 });
    await connectDB();
    if (await Product.exists({ categoryId: id })) return NextResponse.json({ error: "Hãy chuyển sản phẩm sang danh mục khác trước khi xóa." }, { status: 409 });
    const deleted = await Category.findByIdAndDelete(id);
    if (!deleted) return NextResponse.json({ error: "Không tìm thấy dữ liệu." }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch { return NextResponse.json({ error: "Không thể xóa dữ liệu." }, { status: 400 }); }
}
