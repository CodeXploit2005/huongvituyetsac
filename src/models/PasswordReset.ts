import mongoose, { Schema } from "mongoose";

const resetSchema = new Schema({
  _id: { type: String, required: true },
  userId: String,
  passwordHashAtIssue: String,
  challengeHash: { type: String, required: true, index: true },
  otpHash: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  attempts: { type: Number, default: 0 },
  status: { type: String, enum: ["pending", "verified", "used"], required: true },
  grantHash: { type: String, index: true },
  grantExpiresAt: Date,
  purgeAt: { type: Date, required: true, expires: 0 },
});
const limitSchema = new Schema({
  _id: { type: String, required: true },
  count: { type: Number, default: 0 },
  expiresAt: { type: Date, required: true, expires: 0 },
});
export const PasswordReset = mongoose.models.PasswordReset || mongoose.model("PasswordReset", resetSchema);
export const PasswordResetLimit = mongoose.models.PasswordResetLimit || mongoose.model("PasswordResetLimit", limitSchema);
