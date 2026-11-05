import { getCurrentAdmin } from "@/lib/authSession";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Banner } from "@/models";

const isBannerId = (id: unknown): id is string => typeof id === "string" && /^(?:[a-f\d]{24}|ban(?:ner)?-\d+)$/i.test(id);

export async function GET(req: Request) {
  try {
    await connectDB();
    const adminScope = new URL(req.url).searchParams.get("scope") === "admin" && await getCurrentAdmin();
    const banners = await Banner.find(adminScope ? {} : { isActive: true }).sort({ order: 1 }).lean();
    return NextResponse.json(banners);
  } catch (error: unknown) {
    console.error("GET /api/banners error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Không thể lưu dữ liệu." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    if (!await getCurrentAdmin()) return NextResponse.json({ error: "Không có quyền quản trị." }, { status: 403 });
    await connectDB();
    const body = await req.json();
    const newBanner = await Banner.create(body);
    return NextResponse.json(newBanner, { status: 201 });
  } catch (error: unknown) {
    console.error("POST /api/banners error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Không thể lưu dữ liệu." }, { status: 400 });
  }
}

export async function PUT(req: Request) {
  try {
    if (!await getCurrentAdmin()) return NextResponse.json({ error: "Không có quyền quản trị." }, { status: 403 });
    const body = await req.json();
    if (!body || !isBannerId(body._id)) return NextResponse.json({ error: "Mã dữ liệu không hợp lệ." }, { status: 400 });
    await connectDB();
    const fields = ["image","title","subtitle","ctaText","ctaLink","order","isActive","badge"];
    const payload = Object.fromEntries(fields.filter(key => body[key] !== undefined).map(key => [key, body[key]]));
    // Older seeded banners have string IDs; bypass ObjectId casting for those records.
    let saved;
    if (/^ban(?:ner)?-\d+$/.test(body._id)) {
      await Banner.validate(payload, Object.keys(payload));
      saved = await Banner.collection.findOneAndUpdate(
        { $expr: { $eq: ["$_id", body._id] } },
        { $set: { ...payload, updatedAt: new Date() } },
        { returnDocument: "after" }
      );
    } else {
      saved = await Banner.findByIdAndUpdate(body._id, { $set: payload }, { new: true, runValidators: true });
    }
    if (!saved) return NextResponse.json({ error: "Không tìm thấy dữ liệu." }, { status: 404 });
    return NextResponse.json(saved);
  } catch { return NextResponse.json({ error: "Không thể cập nhật dữ liệu." }, { status: 400 }); }
}

export async function DELETE(req: Request) {
  try {
    if (!await getCurrentAdmin()) return NextResponse.json({ error: "Không có quyền quản trị." }, { status: 403 });
    const { id } = await req.json();
    if (!isBannerId(id)) return NextResponse.json({ error: "Mã dữ liệu không hợp lệ." }, { status: 400 });
    await connectDB();
    
    const deleted = /^ban(?:ner)?-\d+$/.test(id)
      ? await Banner.collection.findOneAndDelete({ $expr: { $eq: ["$_id", id] } })
      : await Banner.findByIdAndDelete(id);
    if (!deleted) return NextResponse.json({ error: "Không tìm thấy dữ liệu." }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch { return NextResponse.json({ error: "Không thể xóa dữ liệu." }, { status: 400 }); }
}
