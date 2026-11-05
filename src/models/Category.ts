import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICategory extends Document {
  name: {
    vi: string;
    en: string;
  };
  slug: string;
  order: number;
  image: string;
  description: {
    vi: string;
    en: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    name: {
      vi: { type: String, required: true, trim: true },
      en: { type: String, required: true, trim: true },
    },
    slug: { type: String, required: true, unique: true, trim: true, index: true },
    order: { type: Number, default: 0 },
    image: { type: String, required: true },
    description: {
      vi: { type: String, default: "" },
      en: { type: String, default: "" },
    },
  },
  {
    timestamps: true,
  }
);

export const Category: Model<ICategory> =
  mongoose.models.Category || mongoose.model<ICategory>("Category", CategorySchema);
