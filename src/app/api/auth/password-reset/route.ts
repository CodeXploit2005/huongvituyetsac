import { NextRequest, NextResponse } from "next/server";
import { RESET_COOKIE, ResetError, requestPasswordReset, verifyResetOtp, finishPasswordReset } from "@/lib/passwordReset";
import { SESSION_COOKIE } from "@/lib/authSession";

export const runtime = "nodejs";
export async function POST(req: NextRequest) {
  const respond = (body: object, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
  try {
    const origin = req.headers.get("origin");
    if (origin && origin !== new URL(req.url).origin) return respond({ code: "INVALID_REQUEST" }, 403);
    let body;
    try { body = await req.json(); } catch { return respond({ code: "INVALID_REQUEST" }, 400); }
    if (!body || typeof body !== "object") return respond({ code: "INVALID_REQUEST" }, 400);
    const cookie = req.cookies.get(RESET_COOKIE)?.value;
    const options = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict" as const, path: "/" };
    if (body.action === "request") {
      const { challenge } = await requestPasswordReset(body.email, body.language === "en" ? "en" : "vi");
      const response = respond({ success: true, expiresIn: 600, retryAfter: 60 });
      response.cookies.set(RESET_COOKIE, challenge, { ...options, maxAge: 600 });
      return response;
    }
    if (body.action === "verify") {
      const grant = await verifyResetOtp(cookie, body.otp);
      const response = respond({ success: true });
      response.cookies.set(RESET_COOKIE, grant, { ...options, maxAge: 300 });
      return response;
    }
    if (body.action === "reset") {
      if (body.password !== body.confirmPassword) return respond({ code: "PASSWORD_MISMATCH" }, 400);
      await finishPasswordReset(cookie, body.password);
      const response = respond({ success: true });
      response.cookies.set(RESET_COOKIE, "", { ...options, maxAge: 0 });
      response.cookies.set(SESSION_COOKIE, "", { ...options, sameSite: "lax", maxAge: 0 });
      return response;
    }
    return respond({ code: "INVALID_REQUEST" }, 400);
  } catch (error) {
    if (error instanceof ResetError) {
      const response = respond({ code: error.code, ...(error.retryAfter ? { retryAfter: error.retryAfter } : {}) }, error.status);
      if (error.retryAfter) response.headers.set("Retry-After", String(error.retryAfter));
      return response;
    }
    console.error("Password reset request failed", error instanceof Error ? error.name : "UnknownError");
    return respond({ code: "UNAVAILABLE" }, 503);
  }
}
