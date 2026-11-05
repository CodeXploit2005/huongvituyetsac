import { Coupon, FlashDeal } from "@/models";

/** One-time compatibility migration for FlashDeal records created before coupons existed. */
export async function migrateLegacyFlashDeal() {
  const legacy = await FlashDeal.collection.findOne({
    isActive: true,
    $or: [{ couponId: { $exists: false } }, { couponId: null }, { couponId: "" }],
  });
  if (!legacy) return;

  const now = new Date();
  const legacyStart = legacy.startAt ? new Date(legacy.startAt) : new Date(now.getTime() - 60 * 60 * 1000);
  const legacyEnd = legacy.endAt ? new Date(legacy.endAt) : new Date(now.getTime() + 7 * 86400000);
  const endAt = legacyEnd > now ? legacyEnd : new Date(now.getTime() + 7 * 86400000);
  const couponId = `coupon-migrated-${String(legacy._id)}`;

  await Coupon.findByIdAndUpdate(
    couponId,
    {
      code: `FLASH${String(legacy._id).replace(/[^a-z0-9]/gi, "").slice(-8).toUpperCase() || "DEAL"}`,
      discountType: "percent",
      discountValue: Number(legacy.discountPercentage || 30),
      minOrderValue: 0,
      description: {
        vi: "Coupon được chuyển đổi từ Flash Deal hiện có",
        en: "Coupon migrated from the existing Flash Deal",
      },
      startAt: legacyStart > now ? legacyStart : new Date(now.getTime() - 60 * 60 * 1000),
      endAt,
      isActive: true,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  await FlashDeal.collection.updateOne(
    { _id: legacy._id },
    { $set: { couponId, updatedAt: now }, $unset: { startAt: "", endAt: "", discountPercentage: "" } }
  );
}
