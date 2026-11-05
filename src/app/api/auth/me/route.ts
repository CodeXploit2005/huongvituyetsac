import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/authSession";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: true, user: null });
  }
  return NextResponse.json({ success: true, user });
}
