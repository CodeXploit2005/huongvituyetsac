import { createHmac, timingSafeEqual } from "node:crypto";
import type { Order } from "@/types";

function signature(payload: string) {
  const secret = process.env.AUTH_SECRET || process.env.MONGODB_URI;
  if (!secret) throw new Error("Missing checkout signing secret");
  return createHmac("sha256", secret).update(`vietqr-checkout:${payload}`).digest();
}

export function signCheckout(order: Order, expiresAt: number) {
  const payload = Buffer.from(JSON.stringify({ order, expiresAt })).toString("base64url");
  return `${payload}.${signature(payload).toString("base64url")}`;
}

export function readCheckout(token: string, userId: string): Order {
  const [payload, mac, extra] = token.split(".");
  if (!payload || !mac || extra) throw new Error("Phiên thanh toán không hợp lệ.");
  const expected = signature(payload);
  const actual = Buffer.from(mac, "base64url");
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    throw new Error("Phiên thanh toán không hợp lệ.");
  }
  const { order, expiresAt } = JSON.parse(Buffer.from(payload, "base64url").toString()) as { order: Order; expiresAt: number };
  if (order.userId !== userId || order.paymentMethod !== "vietqr") throw new Error("Phiên thanh toán không thuộc tài khoản này.");
  if (expiresAt <= Date.now()) throw new Error("Phiên thanh toán đã hết hạn. Vui lòng mở lại mã QR.");
  return order;
}
