import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models";
import { createSessionToken, SESSION_COOKIE } from "@/lib/authSession";

export async function POST(req: Request) {
  try {
    await connectDB();
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Vui lòng nhập đầy đủ email và mật khẩu." },
        { status: 400 }
      );
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).lean();
    if (!user) {
      return NextResponse.json(
        { error: "Tài khoản hoặc mật khẩu không chính xác." },
        { status: 401 }
      );
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { error: "Tài khoản hoặc mật khẩu không chính xác." },
        { status: 401 }
      );
    }

    // Omit passwordHash in response
    const safeUser: Record<string, unknown> = { ...user };
    delete safeUser.passwordHash;

    const response = NextResponse.json({
      success: true,
      user: safeUser,
      message: "Đăng nhập thành công!",
    });
    response.cookies.set(SESSION_COOKIE, createSessionToken(String(user._id), user.sessionVersion || 0), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });
    return response;
  } catch (error: unknown) {
    console.error("POST /api/auth/login error:", error);
    const message = error instanceof Error ? error.message : "Lỗi máy chủ.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
