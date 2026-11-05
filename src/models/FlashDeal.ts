import mongoose, { Schema, Document, Model } from "mongoose";
import { randomUUID } from "crypto";

export interface IFlashDeal extends Document<string> {
  title: {
    vi: string;
    en: string;
  };
  subtitle?: {
    vi: string;
    en: string;
  } | null;
  couponId: string;
  isActive: boolean;
  productIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

const FlashDealSchema = new Schema<IFlashDeal>(
  {
    _id: { type: String, default: () => `flash-deal-${randomUUID()}` },
    title: {
      vi: { type: String, default: "Ưu Đãi Giờ Vàng" },
      en: { type: String, default: "Flash Sale Deals" },
    },
    subtitle: {
      vi: { type: String, default: "Giá sốc chỉ trong hôm nay - Số lượng có hạn!" },
      en: { type: String, default: "Special discounts for limited time only!" },
    },
    couponId: { type: String, required: true, index: true, ref: "Coupon" },
    isActive: { type: Boolean, default: true, index: true },
    productIds: { type: [String], default: [] },
  },
  {
    timestamps: true,
  }
);

const cachedFlashDeal = mongoose.models.FlashDeal as Model<IFlashDeal> | undefined;
if (cachedFlashDeal && cachedFlashDeal.schema.path("_id")?.instance !== "String") {
  mongoose.deleteModel("FlashDeal");
}

export const FlashDeal: Model<IFlashDeal> =
  (mongoose.models.FlashDeal as Model<IFlashDeal> | undefined) || mongoose.model<IFlashDeal>("FlashDeal", FlashDealSchema);
