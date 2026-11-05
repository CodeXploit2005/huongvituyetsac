import { Product } from "@/types";

/**
 * Remove Vietnamese accents and diacritics
 * E.g., "Nước mắm cá cơm" -> "nuoc mam ca com"
 */
export function removeVietnameseTones(str: string): string {
  if (!str) return "";
  str = str.toLowerCase();
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
  str = str.replace(/đ/g, "d");
  // Combining diacritical marks
  str = str.replace(/\u0300|\u0301|\u0303|\u0309|\u0323/g, "");
  str = str.replace(/\u02C6|\u0306|\u031B/g, "");
  // Remove special chars and trim
  str = str.replace(/[^a-z0-9\s]/g, " ");
  return str.replace(/\s+/g, " ").trim();
}

/**
 * Check if query matches target with accent-insensitive search
 */
export function matchSearch(target: string, query: string): boolean {
  if (!target || !query) return false;
  const normalizedTarget = removeVietnameseTones(target);
  const normalizedQuery = removeVietnameseTones(query);
  
  if (normalizedTarget.includes(normalizedQuery)) return true;
  
  // Word by word matching for multi-word queries
  const queryWords = normalizedQuery.split(" ").filter(Boolean);
  return queryWords.every((word) => normalizedTarget.includes(word));
}

/**
 * Search products by name (VI/EN), tags, and description
 */
export function searchProducts(
  products: Product[],
  query: string,
  lang: "vi" | "en" = "vi"
): Product[] {
  if (!query.trim()) return [];
  const cleanQuery = query.trim();

  return products.filter((product) => {
    // Only return parent/standalone products in general search to avoid clutter
    if (product.isVariant) return false;

    const nameMatch =
      matchSearch(product.name.vi, cleanQuery) ||
      matchSearch(product.name.en, cleanQuery);

    const tagMatch = product.tags.some((tag) =>
      matchSearch(tag, cleanQuery)
    );

    const descMatch =
      matchSearch(product.description.vi, cleanQuery) ||
      matchSearch(product.description.en, cleanQuery);

    return nameMatch || tagMatch || descMatch;
  });
}
