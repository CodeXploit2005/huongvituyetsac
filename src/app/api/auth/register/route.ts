import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models";
import { createSessionToken, SESSION_COOKIE } from "@/lib/authSession";

export async function POST(req: Request) {
  try {
    await connectDB();
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Vui lòng điền đầy đủ họ tên, email và mật khẩu." },
        { status: 400 }
      );
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return NextResponse.json(
        { error: "Email này đã được đăng ký tài khoản. Vui lòng đăng nhập!" },
        { status: 409 }
      );
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role: "user",
      addresses: [],
      wishlist: [],
    });

    const userObj = newUser.toObject();
    const safeUser: Record<string, unknown> = { ...userObj };
    delete safeUser.passwordHash;

    const response = NextResponse.json(
      {
        success: true,
        user: safeUser,
        message: "Đăng ký tài khoản thành công!",
      },
      { status: 201 }
    );
    response.cookies.set(SESSION_COOKIE, createSessionToken(String(newUser._id)), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });
    return response;
  } catch (error: unknown) {
    console.error("POST /api/auth/register error:", error);
    const message = error instanceof Error ? error.message : "Lỗi máy chủ.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
