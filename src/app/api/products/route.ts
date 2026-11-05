import { getCurrentAdmin } from "@/lib/authSession";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Product } from "@/models";
import { normalizeBadges, validateProductPricing, withComputedProduct } from "@/lib/productData";

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get("categoryId");
    const search = searchParams.get("search");
    const featured = searchParams.get("featured");
    const bestSeller = searchParams.get("bestSeller");

    const query: Record<string, unknown> = {};
    if (categoryId && categoryId !== "all") {
      query.categoryId = categoryId;
    }
    if (featured === "true") {
      query.isFeatured = true;
    }
    if (bestSeller === "true") {
      query.isBestSeller = true;
    }
    if (search) {
      query.$or = [
        { "name.vi": { $regex: search, $options: "i" } },
        { "name.en": { $regex: search, $options: "i" } },
        { tags: { $regex: search, $options: "i" } },
      ];
    }

    const products = await Product.find(query).sort({ createdAt: -1 }).lean();
    return NextResponse.json(products.map((product) => withComputedProduct(product)));
  } catch (error: unknown) {
    console.error("GET /api/products error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Lỗi máy chủ." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    if (!await getCurrentAdmin()) return NextResponse.json({ error: "Không có quyền quản trị." }, { status: 403 });
    await connectDB();
    const body = await req.json();
    const price = Number(body.price);
    const originalPrice = body.originalPrice === null || body.originalPrice === "" || body.originalPrice === undefined
      ? null
      : Number(body.originalPrice);
    const pricingError = validateProductPricing(price, originalPrice);
    if (pricingError) return NextResponse.json({ error: pricingError }, { status: 400 });
    const newProduct = await Product.create({
      ...body,
      price,
      originalPrice,
      shippingFee: Math.max(0, Number(body.shippingFee) || 0),
      badges: normalizeBadges(body.badges),
      discountPercent: undefined,
      discountBadge: undefined,
      isBestSeller: body.isBestSeller === true,
      isFeatured: body.isFeatured === true,
    });
    return NextResponse.json(withComputedProduct(newProduct.toObject()), { status: 201 });
  } catch (error: unknown) {
    console.error("POST /api/products error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Dữ liệu không hợp lệ." }, { status: 400 });
  }
}
