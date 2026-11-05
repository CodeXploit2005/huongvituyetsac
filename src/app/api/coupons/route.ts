import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Coupon } from "@/models";
import { ensureDefaultCoupon } from "@/lib/flashDealDefaults";

const fail = (error: unknown, status = 400) => NextResponse.json({ error: error instanceof Error ? error.message : "Dữ liệu không hợp lệ." }, { status });

export async function GET() {
  try { await connectDB(); await ensureDefaultCoupon(); return NextResponse.json(await Coupon.find().sort({ createdAt: -1 }).lean()); }
  catch (error) { return fail(error, 500); }
}

export async function POST(request: Request) {
  try {
    await connectDB(); const body = await request.json();
    if (new Date(body.endAt) <= new Date(body.startAt)) throw new Error("Ngày kết thúc phải sau ngày bắt đầu.");
    return NextResponse.json(await Coupon.create(body), { status: 201 });
  } catch (error) { return fail(error); }
}

export async function PUT(request: Request) {
  try {
    await connectDB(); const { _id, ...body } = await request.json();
    if (!_id) throw new Error("Thiếu mã coupon.");
    if (body.endAt && body.startAt && new Date(body.endAt) <= new Date(body.startAt)) throw new Error("Ngày kết thúc phải sau ngày bắt đầu.");
    const coupon = await Coupon.findByIdAndUpdate(_id, body, { new: true, runValidators: true });
    if (!coupon) return NextResponse.json({ error: "Không tìm thấy coupon." }, { status: 404 });
    return NextResponse.json(coupon);
  } catch (error) { return fail(error); }
}

export async function DELETE(request: Request) {
  try { await connectDB(); const { id } = await request.json(); await Coupon.findByIdAndDelete(id); return NextResponse.json({ ok: true }); }
  catch (error) { return fail(error); }
}
