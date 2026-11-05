import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Order } from "@/models";

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "Không được phép." }, { status: 401 });
  await connectDB();
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const result = await Order.updateMany({ isArchived: false, status: { $in: ["delivered", "cancelled"] }, statusChangedAt: { $lte: cutoff } }, { $set: { isArchived: true, archivedAt: new Date() } });
  return NextResponse.json({ archived: result.modifiedCount, cutoff });
}
