import "server-only";
import { createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models";
import { PasswordReset, PasswordResetLimit } from "@/models/PasswordReset";
import { sendResetEmail } from "@/lib/resetEmail";

export const RESET_COOKIE = "hv_password_reset";
export const OTP_TTL = 10 * 60;
export class ResetError extends Error {
  constructor(public code: string, public status = 400, public retryAfter?: number) { super(code); }
}
export function resetDigest(value: string) {
  const secret = process.env.PASSWORD_RESET_SECRET || process.env.AUTH_SECRET;
  if (!secret) throw new Error("Password reset secret is not configured");
  return createHmac("sha256", secret).update(value).digest("hex");
}
export function validNewPassword(password: unknown): password is string {
  return typeof password === "string" && password.length >= 8 && Buffer.byteLength(password, "utf8") <= 72 && /[a-zA-Z]/.test(password) && /\d/.test(password);
}
async function rateLimit(key: string, seconds: number, max: number) {
  const bucket = Math.floor(Date.now() / (seconds * 1000));
  const retryAfter = Math.max(1, Math.ceil(((bucket + 1) * seconds * 1000 - Date.now()) / 1000));
  const id = resetDigest(`limit:${key}:${seconds}:${bucket}`);
  try {
    const hit = await PasswordResetLimit.findOneAndUpdate(
      { _id: id, count: { $lt: max } },
      { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date((bucket + 2) * seconds * 1000) } },
      { upsert: true, new: true },
    );
    if (!hit) throw new ResetError("RATE_LIMITED", 429, retryAfter);
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === 11000) throw new ResetError("RATE_LIMITED", 429, retryAfter);
    throw error;
  }
}
export async function requestPasswordReset(rawEmail: unknown, language: "vi" | "en") {
  if (typeof rawEmail !== "string" || rawEmail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail.trim())) throw new ResetError("INVALID_EMAIL");
  if (![process.env.EMAILJS_SERVICE_ID, process.env.EMAILJS_TEMPLATE_ID, process.env.EMAILJS_PUBLIC_KEY].every(Boolean)) throw new ResetError("UNAVAILABLE", 503);
  const email = rawEmail.trim().toLowerCase();
  await connectDB();
  await rateLimit(`email:${email}`, 60, 1);
  await rateLimit(`email:${email}`, 3600, 5);
  await rateLimit("service", 3600, 100);
  const user = await User.findOne({ email }).select("_id name passwordHash").lean();
  const challenge = randomBytes(32).toString("hex");
  const otp = String(randomInt(0, 1000000)).padStart(6, "0");
  const now = Date.now();
  const challengeHash = resetDigest(`challenge:${challenge}`);
  await PasswordReset.findOneAndUpdate({ _id: resetDigest(`email:${email}`) }, {
    $set: { userId: user ? String(user._id) : null, passwordHashAtIssue: user?.passwordHash || null,
      challengeHash, otpHash: resetDigest(`otp:${challenge}:${otp}`), attempts: 0,
      status: "pending", expiresAt: new Date(now + OTP_TTL * 1000), purgeAt: new Date(now + 3600000) },
    $unset: { grantHash: 1, grantExpiresAt: 1 },
  }, { upsert: true });
  if (user) {
    try { await sendResetEmail(email, user.name, otp, language); }
    catch {
      await PasswordReset.updateOne({ challengeHash }, { $set: { status: "used" } });
      // Same response for unknown accounts and delivery failures prevents account enumeration.
    }
  }
  return { challenge };
}
export async function verifyResetOtp(challenge: string | undefined, otp: unknown) {
  if (!challenge || !/^[a-f0-9]{64}$/.test(challenge) || typeof otp !== "string" || !/^\d{6}$/.test(otp)) throw new ResetError("INVALID_OTP");
  await connectDB();
  const challengeHash = resetDigest(`challenge:${challenge}`);
  // Reserve one attempt atomically before comparing; parallel guesses also consume attempts.
  const record = await PasswordReset.findOneAndUpdate({ challengeHash, status: "pending", expiresAt: { $gt: new Date() }, attempts: { $lt: 5 } }, { $inc: { attempts: 1 } }, { new: true });
  if (!record) throw new ResetError("OTP_EXPIRED");
  const actual = Buffer.from(resetDigest(`otp:${challenge}:${otp}`));
  const expected = Buffer.from(record.otpHash);
  if (!record.userId || actual.length !== expected.length || !timingSafeEqual(actual, expected)) throw new ResetError(record.attempts >= 5 ? "OTP_EXPIRED" : "INVALID_OTP");
  const grant = randomBytes(32).toString("hex");
  const updated = await PasswordReset.updateOne({ _id: record._id, challengeHash, status: "pending", expiresAt: { $gt: new Date() } }, { $set: { status: "verified", grantHash: resetDigest(`grant:${grant}`), grantExpiresAt: new Date(Date.now() + 300000) }, $unset: { otpHash: 1 } });
  if (updated.modifiedCount !== 1) throw new ResetError("OTP_EXPIRED");
  return grant;
}
export async function hasResetGrant(grant?: string) {
  if (!grant || !/^[a-f0-9]{64}$/.test(grant)) return false;
  await connectDB();
  return Boolean(await PasswordReset.exists({ grantHash: resetDigest(`grant:${grant}`), status: "verified", grantExpiresAt: { $gt: new Date() } }));
}
export async function finishPasswordReset(grant: string | undefined, password: unknown) {
  if (!validNewPassword(password)) throw new ResetError("WEAK_PASSWORD");
  if (!grant || !/^[a-f0-9]{64}$/.test(grant)) throw new ResetError("RESET_EXPIRED");
  await connectDB();
  const match = { grantHash: resetDigest(`grant:${grant}`), status: "verified", grantExpiresAt: { $gt: new Date() } };
  if (!await PasswordReset.exists(match)) throw new ResetError("RESET_EXPIRED");
  const passwordHash = await bcrypt.hash(password, 12);
  const record = await PasswordReset.findOneAndUpdate(match, { $set: { status: "used" }, $unset: { grantHash: 1 } }, { new: true });
  if (!record?.userId) throw new ResetError("RESET_EXPIRED");
  const updated = await User.updateOne({ _id: record.userId, passwordHash: record.passwordHashAtIssue }, { $set: { passwordHash }, $inc: { sessionVersion: 1 } });
  if (updated.modifiedCount !== 1) throw new ResetError("RESET_EXPIRED");
  await PasswordReset.updateOne({ _id: record._id, status: "used" }, { $unset: { passwordHashAtIssue: 1 } });
}
