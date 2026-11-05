import { Product, Review } from "@/types";

export function getApprovedProductReviews(
  reviews: Review[],
  product: Product,
  products: Product[]
) {
  const parentId = product.parentProductId || product._id;
  const productIds = new Set(
    products
      .filter((item) => item._id === parentId || item.parentProductId === parentId)
      .map((item) => item._id)
  );

  productIds.add(parentId);

  return reviews.filter(
    (review) =>
      productIds.has(review.productId) &&
      (review.status || "approved") === "approved"
  );
}

export function calculateAverageRating(reviews: Review[]) {
  if (reviews.length === 0) return 0;
  return reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
}
