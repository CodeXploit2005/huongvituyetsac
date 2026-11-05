import { getCurrentAdmin } from "@/lib/authSession";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Product } from "@/models";
import { normalizeBadges, validateProductPricing, withComputedProduct } from "@/lib/productData";

export async function GET(
  req: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    await connectDB();
    const { slug } = await context.params;
    const product = await Product.findOne({ slug }).lean();
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // If product has variants, also fetch variants or parent
    let variants = [] as typeof product[];
    if (!product.isVariant) {
      variants = await Product.find({ parentProductId: String(product._id) }).lean();
    } else if (product.parentProductId) {
      variants = await Product.find({ parentProductId: String(product.parentProductId) }).lean();
    }

    return NextResponse.json({
      product: withComputedProduct(product),
      variants: variants.map((variant) => withComputedProduct(variant)),
    });
  } catch (error: unknown) {
    console.error("GET /api/products/[slug] error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Lỗi máy chủ." }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    if (!await getCurrentAdmin()) return NextResponse.json({ error: "Không có quyền quản trị." }, { status: 403 });
    await connectDB();
    const { slug } = await context.params;
    const body = await req.json();
    const price = Number(body.price);
    const originalPrice = body.originalPrice === null || body.originalPrice === "" || body.originalPrice === undefined
      ? null
      : Number(body.originalPrice);
    const pricingError = validateProductPricing(price, originalPrice);
    if (pricingError) return NextResponse.json({ error: pricingError }, { status: 400 });
    const update = {
      ...body,
      price,
      originalPrice,
      shippingFee: Math.max(0, Number(body.shippingFee) || 0),
      badges: normalizeBadges(body.badges),
    };
    delete update.discountPercent;
    delete update.discountBadge;
    delete update._id;
    const updated = await Product.findOneAndUpdate({ slug }, update, {
      new: true,
      runValidators: true,
    }).lean();
    if (!updated) return NextResponse.json({ error: "Không tìm thấy sản phẩm." }, { status: 404 });
    return NextResponse.json(withComputedProduct(updated));
  } catch (error: unknown) {
    console.error("PUT /api/products/[slug] error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Dữ liệu không hợp lệ." }, { status: 400 });
  }
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    if (!await getCurrentAdmin()) return NextResponse.json({ error: "Không có quyền quản trị." }, { status: 403 });
    await connectDB();
    const { slug } = await context.params;
    await Product.findOneAndDelete({ slug });
    return NextResponse.json({ success: true, message: "Product deleted" });
  } catch (error: unknown) {
    console.error("DELETE /api/products/[slug] error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Không thể xóa sản phẩm." }, { status: 400 });
  }
}
