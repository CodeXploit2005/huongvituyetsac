import type { Product, ProductBadge } from "@/types";

export function calculateDiscountPercent(
  price: number,
  originalPrice?: number | null
): number | null {
  if (originalPrice == null || originalPrice <= price || price < 0) return null;
  const percent = Math.round((1 - price / originalPrice) * 100);
  return percent > 0 ? percent : null;
}

export function normalizeBadges(value: unknown): ProductBadge[] {
  if (!Array.isArray(value)) return [];
  const result: ProductBadge[] = [];
  value.forEach((badge, index) => {
      if (!badge || typeof badge !== "object") return;
      const raw = badge as Record<string, unknown>;
      const text = String(raw.text || "").trim();
      if (!text || text.length > 50) return;
      const color = typeof raw.color === "string" && /^#[0-9a-f]{6}$/i.test(raw.color) ? raw.color : null;
      result.push({
        id: String(raw.id || `badge-${Date.now()}-${index}`),
        type: "text",
        text,
        icon: typeof raw.icon === "string" && raw.icon ? raw.icon : null,
        color,
      });
    });
  return result;
}

export function withComputedProduct<T extends object>(product: T) {
  const source = product as Record<string, unknown>;
  const price = Number(source.price || 0);
  const originalPrice = source.originalPrice == null ? null : Number(source.originalPrice);
  const badges = normalizeBadges(source.badges);
  const legacyBadge = source.discountBadge && typeof source.discountBadge === "object"
    ? String((source.discountBadge as Record<string, unknown>).vi || "").trim()
    : "";
  if (badges.length === 0 && legacyBadge && !/^-?\d+%$/.test(legacyBadge)) {
    badges.push({
      id: `legacy-${String(source._id || "badge")}`,
      type: "text",
      text: legacyBadge.slice(0, 50),
      icon: null,
      color: null,
    });
  }
  return {
    ...product,
    // Preserve legacy instructions until the product is explicitly edited.
    usageInstructions: source.usageInstructions ?? source.usage,
    originalPrice,
    shippingFee: Math.max(0, Number(source.shippingFee) || 0),
    badges,
    discountPercent: calculateDiscountPercent(price, originalPrice),
  };
}

export function validateProductPricing(price: number, originalPrice?: number | null) {
  if (!Number.isFinite(price) || price < 0) return "Giá bán phải lớn hơn hoặc bằng 0.";
  if (originalPrice != null && (!Number.isFinite(originalPrice) || originalPrice < 0)) {
    return "Giá gốc phải lớn hơn hoặc bằng 0.";
  }
  if (originalPrice != null && originalPrice < price) {
    return "Giá gốc phải lớn hơn hoặc bằng giá bán.";
  }
  return null;
}

export type ProductInput = Omit<Product, "_id" | "createdAt" | "updatedAt" | "discountPercent">;
