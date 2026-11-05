import mongoose, { Schema, Document, Model } from "mongoose";

export interface IOrderItem {
  productId: string;
  productName: {
    vi: string;
    en: string;
  };
  variantLabel?: {
    vi: string;
    en: string;
  };
  image: string;
  price: number;
  quantity: number;
}

export interface IOrder extends Document {
  orderCode: string;
  userId?: string | null;
  customerName: string;
  phone: string;
  email: string;
  address: string;
  province: string;
  note?: string | null;
  paymentMethod: "cod" | "vietqr" | "momo";
  items: IOrderItem[];
  subtotal: number;
  shippingFee: number;
  discount: number;
  voucherCode?: string | null;
  paidAt?: Date | null;
  paymentTransactionId?: string | null;
  paymentStatus: "unpaid" | "paid" | "failed" | "refunded";
  total: number;
  status: "pending" | "confirmed" | "shipping" | "delivered" | "cancelled";
  statusChangedAt: Date;
  isArchived: boolean;
  archivedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    productId: { type: String, required: true },
    productName: {
      vi: { type: String, required: true },
      en: { type: String, required: true },
    },
    variantLabel: {
      vi: { type: String },
      en: { type: String },
    },
    image: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const OrderSchema = new Schema<IOrder>(
  {
    orderCode: { type: String, required: true, unique: true, index: true },
    userId: { type: String, default: null, index: true },
    customerName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true, index: true },
    email: { type: String, required: true, trim: true, lowercase: true, index: true },
    address: { type: String, required: true },
    province: { type: String, required: true },
    note: { type: String, default: null },
    paymentMethod: { type: String, enum: ["cod", "vietqr", "momo"], default: "cod" },
    items: { type: [OrderItemSchema], required: true },
    subtotal: { type: Number, required: true, min: 0 },
    shippingFee: { type: Number, default: 0, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    voucherCode: { type: String, default: null },
    paidAt: { type: Date, default: null },
    paymentTransactionId: { type: String, default: null },
    paymentStatus: { type: String, enum: ["unpaid", "paid", "failed", "refunded"], default: "unpaid", required: true, index: true },
    total: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["pending", "confirmed", "shipping", "delivered", "cancelled"],
      default: "pending",
      index: true,
    },
    statusChangedAt: { type: Date, default: Date.now, required: true, index: true },
    isArchived: { type: Boolean, default: false, required: true, index: true },
    archivedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

OrderSchema.index({ isArchived: 1, createdAt: -1 });
OrderSchema.index({ userId: 1, createdAt: -1 });
OrderSchema.index({ isArchived: 1, status: 1, createdAt: -1 });
OrderSchema.index({ status: 1, statusChangedAt: 1 });

const cachedOrder = mongoose.models.Order as Model<IOrder> | undefined;
if (cachedOrder && !cachedOrder.schema.path("paymentStatus")) mongoose.deleteModel("Order");
export const Order: Model<IOrder> =
  (mongoose.models.Order as Model<IOrder> | undefined) || mongoose.model<IOrder>("Order", OrderSchema);
