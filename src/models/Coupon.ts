import mongoose, { Document, Model, Schema } from "mongoose";
import { randomUUID } from "crypto";

export interface ICoupon extends Document<string> {
  code: string;
  discountType: "percent" | "fixed";
  discountValue: number;
  minOrderValue: number;
  description: { vi: string; en: string };
  startAt: Date;
  endAt: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CouponSchema = new Schema<ICoupon>(
  {
    _id: { type: String, default: () => `coupon-${randomUUID()}` },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    discountType: { type: String, enum: ["percent", "fixed"], default: "percent" },
    discountValue: { type: Number, required: true, min: 0 },
    minOrderValue: { type: Number, default: 0, min: 0 },
    description: {
      vi: { type: String, default: "" },
      en: { type: String, default: "" },
    },
    startAt: { type: Date, required: true },
    endAt: { type: Date, required: true, index: true },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

const cachedCoupon = mongoose.models.Coupon as Model<ICoupon> | undefined;
if (cachedCoupon && cachedCoupon.schema.path("_id")?.instance !== "String") {
  mongoose.deleteModel("Coupon");
}

export const Coupon: Model<ICoupon> =
  (mongoose.models.Coupon as Model<ICoupon> | undefined) || mongoose.model<ICoupon>("Coupon", CouponSchema);
