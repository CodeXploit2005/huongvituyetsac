import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { runDatabaseSeed } from "@/lib/seedData";
import { getCurrentAdmin } from "@/lib/authSession";

export async function POST() {
  try {
    if (!(await getCurrentAdmin())) {
      return NextResponse.json({ error: "Không có quyền quản trị." }, { status: 403 });
    }
    await connectDB();
    const result = await runDatabaseSeed();
    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("Seed API error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to seed database" },
      { status: 500 }
    );
  }
}
