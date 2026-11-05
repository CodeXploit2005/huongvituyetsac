import mongoose, { Schema, Document, Model } from "mongoose";

export interface IReview extends Document {
  productId: string;
  userName: string;
  userEmail: string;
  rating: number;
  comment: string;
  images: string[];
  videos: string[];
  verifiedPurchase: boolean;
  adminReply?: {
    comment: string;
    repliedAt: string;
  } | null;
  helpfulCount: number;
  status: "approved" | "pending" | "hidden" | "rejected";
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    productId: { type: String, required: true, index: true },
    userName: { type: String, required: true, trim: true },
    userEmail: { type: String, required: true, trim: true, lowercase: true },
    rating: { type: Number, required: true, min: 1, max: 5, index: true },
    comment: { type: String, required: true },
    images: { type: [String], default: [] },
    videos: { type: [String], default: [], validate: { validator: (urls: string[]) => urls.length <= 1, message: "Tối đa 1 video mỗi đánh giá." } },
    verifiedPurchase: { type: Boolean, default: true },
    adminReply: {
      comment: { type: String },
      repliedAt: { type: String },
    },
    helpfulCount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["approved", "pending", "hidden", "rejected"],
      default: "approved",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Review: Model<IReview> =
  mongoose.models.Review || mongoose.model<IReview>("Review", ReviewSchema);
