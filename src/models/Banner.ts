import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBanner extends Document {
  image: string;
  title: {
    vi: string;
    en: string;
  };
  subtitle?: {
    vi: string;
    en: string;
  } | null;
  ctaText: {
    vi: string;
    en: string;
  };
  ctaLink: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BannerSchema = new Schema<IBanner>(
  {
    image: { type: String, required: true },
    title: {
      vi: { type: String, required: true },
      en: { type: String, required: true },
    },
    subtitle: {
      vi: { type: String, default: null },
      en: { type: String, default: null },
    },
    ctaText: {
      vi: { type: String, default: "Khám Phá Ngay" },
      en: { type: String, default: "Explore Now" },
    },
    ctaLink: { type: String, default: "/danh-muc/all" },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true, index: true },
  },
  {
    timestamps: true,
  }
);

export const Banner: Model<IBanner> =
  mongoose.models.Banner || mongoose.model<IBanner>("Banner", BannerSchema);
