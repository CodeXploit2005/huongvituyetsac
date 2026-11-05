import { Coupon, FlashDeal, Product } from "@/models";

export const DEFAULT_COUPON_ID = "coupon-golden-hour";
export const DEFAULT_FLASH_DEAL_ID = "flash-deal-current";

export async function ensureDefaultCoupon() {
  const now = new Date();
  const existing = await Coupon.findOne({ isActive: true, endAt: { $gt: now } }).lean();
  if (existing) return existing;

  return Coupon.findByIdAndUpdate(
    DEFAULT_COUPON_ID,
    {
      $setOnInsert: {
        code: "GOLDEN30",
        discountType: "percent",
        discountValue: 30,
        minOrderValue: 0,
        description: {
          vi: "Giảm 30% cho Ưu Đãi Giờ Vàng",
          en: "30% off Golden Hour Deals",
        },
        startAt: new Date(now.getTime() - 60 * 60 * 1000),
        endAt: new Date(now.getTime() + 7 * 86400000),
        isActive: true,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();
}

export async function ensureDefaultFlashDeal() {
  const existing = await FlashDeal.findOne().lean();
  if (existing) return existing;

  const coupon = await ensureDefaultCoupon();
  const products = await Product.find({ isVariant: { $ne: true } }).sort({ isBestSeller: -1, createdAt: 1 }).limit(4).select({ _id: 1 }).lean();

  if (!coupon) throw new Error("Không thể khởi tạo Coupon mặc định.");
  return FlashDeal.findByIdAndUpdate(
    DEFAULT_FLASH_DEAL_ID,
    {
      $setOnInsert: {
        title: { vi: "Ưu Đãi Giờ Vàng", en: "Golden Hour Deals" },
        subtitle: {
          vi: "Giảm đến 30% cho Combo Mì Cay Hải Sản & Nước Mắm Cà Ná Thượng Hạng",
          en: "Up to 30% off Spicy Seafood Noodle Combos & Premium Ca Na Fish Sauce",
        },
        couponId: String(coupon._id),
        productIds: products.map((product) => String(product._id)),
        isActive: true,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();
}
