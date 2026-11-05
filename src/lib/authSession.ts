import "server-only";

import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models";

export const SESSION_COOKIE = "hv_session";

function getSecret() {
  const secret = process.env.AUTH_SECRET || process.env.MONGODB_URI;
  if (!secret) throw new Error("AUTH_SECRET is missing in environment variables");
  return secret;
}

function sign(payload: string) {
  return createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

export function createSessionToken(userId: string, sessionVersion = 0) {
  const payload = Buffer.from(
    JSON.stringify({ userId, sessionVersion, expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 })
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function verifySessionToken(token?: string) {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = sign(payload);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (
    actualBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(actualBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as {
      userId: string;
      expiresAt: number;
      sessionVersion?: number;
    };
    return data.expiresAt > Date.now() ? data : null;
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const session = verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value);
  if (!session) return null;
  await connectDB();
  const user = await User.findById(session.userId).select("-passwordHash").lean();
  if (!user || (user.sessionVersion || 0) !== (session.sessionVersion || 0)) return null;
  return user;
}

export async function getCurrentAdmin() {
  const user = await getCurrentUser();
  return user?.role === "admin" ? user : null;
}
