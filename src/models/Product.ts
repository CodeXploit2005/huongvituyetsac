import mongoose, { Schema, Document, Model } from "mongoose";

export interface IProduct extends Document {
  name: {
    vi: string;
    en: string;
  };
  slug: string;
  categoryId: string;
  parentProductId?: string | null;
  isVariant: boolean;
  variantLabel?: {
    vi: string;
    en: string;
  } | null;
  description: {
    vi: string;
    en: string;
  };
  price: number;
  originalPrice?: number | null;
  shippingFee: number;
  badges?: Array<{
    id: string;
    type: "text";
    text: string;
    icon?: string | null;
    color?: string | null;
  }>;
  images: string[];
  videos?: string[];
  videoPoster?: string | null;
  stock: number;
  tags: string[];
  rating?: number;
  reviewsCount?: number;
  soldCount?: number;
  isFeatured?: boolean;
  isBestSeller?: boolean;
  discountBadge?: {
    vi: string;
    en: string;
  } | null;
  origin?: {
    vi: string;
    en: string;
  } | null;
  ingredients?: {
    vi: string;
    en: string;
  } | null;
  usage?: {
    vi: string;
    en: string;
  } | null;
  nutrition?: { vi: string; en: string } | null;
  usageInstructions?: { vi: string; en: string } | null;
  storageInstructions?: { vi: string; en: string } | null;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    name: {
      vi: { type: String, required: true, trim: true },
      en: { type: String, required: true, trim: true },
    },
    slug: { type: String, required: true, unique: true, trim: true, index: true },
    categoryId: { type: String, required: true, index: true },
    parentProductId: { type: String, default: null, index: true },
    isVariant: { type: Boolean, default: false, index: true },
    variantLabel: {
      vi: { type: String, default: null },
      en: { type: String, default: null },
    },
    description: {
      vi: { type: String, default: "" },
      en: { type: String, default: "" },
    },
    price: { type: Number, required: true, min: 0 },
    originalPrice: { type: Number, default: null, min: 0 },
    shippingFee: { type: Number, default: 0, min: 0 },
    badges: {
      type: [
        new Schema(
          {
            id: { type: String, required: true },
            type: { type: String, enum: ["text"], default: "text" },
            text: { type: String, required: true, trim: true, maxlength: 50 },
            icon: { type: String, default: null },
            color: {
              type: String,
              default: null,
              validate: {
                validator: (value: string | null) => value == null || /^#[0-9a-f]{6}$/i.test(value),
                message: "Màu badge phải là mã hex hợp lệ.",
              },
            },
          },
          { _id: false }
        ),
      ],
      default: [],
    },
    images: { type: [String], default: [] },
    videos: { type: [String], default: [] },
    videoPoster: { type: String, default: null },
    stock: { type: Number, default: 100, min: 0 },
    tags: { type: [String], default: [], index: true },
    rating: { type: Number, default: 5.0, min: 1, max: 5 },
    reviewsCount: { type: Number, default: 0 },
    soldCount: { type: Number, default: 0 },
    isFeatured: { type: Boolean, default: false, index: true },
    isBestSeller: { type: Boolean, default: false, index: true },
    discountBadge: {
      vi: { type: String, default: null },
      en: { type: String, default: null },
    },
    origin: {
      vi: { type: String, default: null },
      en: { type: String, default: null },
    },
    ingredients: {
      vi: { type: String, default: null },
      en: { type: String, default: null },
    },
    nutrition: {
      vi: { type: String, default: "" },
      en: { type: String, default: "" },
    },
    usageInstructions: {
      vi: { type: String, default: "" },
      en: { type: String, default: "" },
    },
    storageInstructions: {
      vi: { type: String, default: "" },
      en: { type: String, default: "" },
    },
    usage: {
      vi: { type: String, default: null },
      en: { type: String, default: null },
    },
  },
  {
    timestamps: true,
  }
);

// Index text search across product name and tags
ProductSchema.index({
  "name.vi": "text",
  "name.en": "text",
  tags: "text",
});

const cachedProduct = mongoose.models.Product as Model<IProduct> | undefined;
// Reload cached models when newly supported product fields are missing.
if (cachedProduct && ["shippingFee", "nutrition.vi", "usageInstructions.vi", "storageInstructions.vi"].some((path) => !cachedProduct.schema.path(path))) {
  mongoose.deleteModel("Product");
}

export const Product: Model<IProduct> =
  (mongoose.models.Product as Model<IProduct> | undefined) || mongoose.model<IProduct>("Product", ProductSchema);
