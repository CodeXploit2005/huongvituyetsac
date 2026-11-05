import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUserAddress {
  id: string;
  label: string;
  receiverName: string;
  phone: string;
  address: string;
  province: string;
  isDefault: boolean;
}

export interface IUser extends Document {
  name: string;
  email: string;
  phone?: string | null;
  passwordHash: string;
  sessionVersion?: number;
  role: "user" | "admin";
  avatar?: string | null;
  addresses?: IUserAddress[];
  wishlist?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const AddressSubSchema = new Schema<IUserAddress>(
  {
    id: { type: String, required: true },
    label: { type: String, default: "Nhà riêng" },
    receiverName: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    province: { type: String, required: true },
    isDefault: { type: Boolean, default: false },
  },
  { _id: false }
);

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    phone: { type: String, default: null, trim: true },
    passwordHash: { type: String, required: true },
    sessionVersion: { type: Number, default: 0 },
    role: { type: String, enum: ["user", "admin"], default: "user", index: true },
    avatar: { type: String, default: null },
    addresses: { type: [AddressSubSchema], default: [] },
    wishlist: { type: [String], default: [] },
  },
  {
    timestamps: true,
  }
);

if (mongoose.models.User && !mongoose.models.User.schema.path("sessionVersion")) mongoose.deleteModel("User");

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
