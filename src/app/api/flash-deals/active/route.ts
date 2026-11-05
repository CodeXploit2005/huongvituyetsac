import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Coupon, FlashDeal, Product } from "@/models";
import { migrateLegacyFlashDeal } from "@/lib/flashDealMigration";
import { ensureDefaultFlashDeal } from "@/lib/flashDealDefaults";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectDB();
    await migrateLegacyFlashDeal();
    await ensureDefaultFlashDeal();
    const now = new Date();
    const coupons = await Coupon.find({ isActive: true, startAt: { $lte: now }, endAt: { $gt: now } }).lean();
    const couponMap = new Map(coupons.map((coupon) => [String(coupon._id), coupon]));
    const deal = coupons.length ? await FlashDeal.findOne({ isActive: true, couponId: { $in: [...couponMap.keys()] } }).sort({ updatedAt: -1 }).lean() : null;
    if (!deal) return NextResponse.json(null, { headers: { "Cache-Control": "no-store" } });

    const productIds = deal.productIds.map(String);
    const products = productIds.length ? await Product.aggregate([{ $match: { $expr: { $in: [{ $toString: "$_id" }, productIds] } } }]) : [];
    const productMap = new Map(products.map((product) => [String(product._id), product]));
    return NextResponse.json(
      { ...deal, coupon: couponMap.get(String(deal.couponId)), products: productIds.map((id) => productMap.get(id)).filter(Boolean), serverNow: now.toISOString() },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("GET /api/flash-deals/active error:", error);
    return NextResponse.json({ error: "Lỗi máy chủ." }, { status: 500 });
  }
}
