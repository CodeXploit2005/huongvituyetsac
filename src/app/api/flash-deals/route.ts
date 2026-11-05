import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Coupon, FlashDeal } from "@/models";
import { migrateLegacyFlashDeal } from "@/lib/flashDealMigration";
import { ensureDefaultFlashDeal } from "@/lib/flashDealDefaults";

const fail = (error: unknown, status = 400) => NextResponse.json({ error: error instanceof Error ? error.message : "Dữ liệu không hợp lệ." }, { status });

async function listDeals() {
  const deals = await FlashDeal.find().sort({ createdAt: -1 }).lean();
  const coupons = await Coupon.find({ _id: { $in: deals.map((deal) => deal.couponId) } }).lean();
  const map = new Map(coupons.map((coupon) => [String(coupon._id), coupon]));
  return deals.map((deal) => ({ ...deal, coupon: map.get(String(deal.couponId)) || null }));
}

export async function GET() {
  try { await connectDB(); await migrateLegacyFlashDeal(); await ensureDefaultFlashDeal(); return NextResponse.json(await listDeals()); }
  catch (error) { return fail(error, 500); }
}

export async function POST(request: Request) {
  try {
    await connectDB(); const body = await request.json();
    if (!body.couponId) throw new Error("Vui lòng chọn Coupon trước khi lưu Flash Deal.");
    if (!(await Coupon.exists({ _id: body.couponId }))) throw new Error("Coupon đã chọn không tồn tại.");
    return NextResponse.json(await FlashDeal.create(body), { status: 201 });
  } catch (error) { return fail(error); }
}

export async function PUT(request: Request) {
  try {
    await connectDB(); const { _id, ...body } = await request.json();
    if (!_id) throw new Error("Thiếu mã Flash Deal.");
    if (body.couponId && !(await Coupon.exists({ _id: body.couponId }))) throw new Error("Coupon đã chọn không tồn tại.");
    const deal = await FlashDeal.findByIdAndUpdate(_id, body, { new: true, runValidators: true });
    if (!deal) return NextResponse.json({ error: "Không tìm thấy Flash Deal." }, { status: 404 });
    return NextResponse.json(deal);
  } catch (error) { return fail(error); }
}

export async function DELETE(request: Request) {
  try { await connectDB(); const { id } = await request.json(); await FlashDeal.findByIdAndDelete(id); return NextResponse.json({ ok: true }); }
  catch (error) { return fail(error); }
}
