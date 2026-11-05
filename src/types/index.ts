export interface MultilingualText {
  vi: string;
  en: string;
}

export interface ProductBadge {
  id: string;
  type: "text";
  text: string;
  icon?: string | null;
  color?: string | null;
}

export interface Product {
  _id: string;
  name: MultilingualText;
  slug: string;
  categoryId: string;
  parentProductId: string | null;   // null nếu là sản phẩm gốc, có giá trị nếu là biến thể
  description: MultilingualText;
  price: number;
  originalPrice?: number | null;
  shippingFee?: number;
  discountPercent?: number | null;
  badges?: ProductBadge[];
  images: string[];        // URLs
  videos?: string[];       // URLs, optional
  videoPoster?: string;    // URL ảnh poster cho video, optional
  stock: number;
  tags: string[];          // hỗ trợ tìm kiếm
  isVariant: boolean;
  variantLabel?: MultilingualText; // vd: "Gói lẻ 115g", "Combo 3 gói", "Hộp 5 gói tặng 1", "Hộp 10 gói tặng 2"
  rating?: number;
  reviewsCount?: number;
  origin?: MultilingualText;
  weight?: string;
  ingredients?: MultilingualText;
  nutrition?: MultilingualText;
  usageInstructions?: MultilingualText;
  storageInstructions?: MultilingualText;
  isFeatured?: boolean;
  isBestSeller?: boolean;
  isNewArrival?: boolean;
  discountBadge?: MultilingualText;
  isPlaceholder?: boolean; // đánh dấu dữ liệu mẫu
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  _id: string;
  name: MultilingualText;
  slug: string;
  order: number;
  image?: string;
  icon?: string;
  description?: MultilingualText;
}

export interface Banner {
  _id: string;
  image: string;
  title: MultilingualText;
  subtitle?: MultilingualText;
  ctaText: MultilingualText;
  ctaLink: string;
  order: number;
  isActive: boolean;
  badge?: MultilingualText;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface OrderItem {
  productId: string;
  productName: MultilingualText;
  variantLabel?: MultilingualText;
  image: string;
  price: number;
  quantity: number;
}

export interface Order {
  checkoutToken?: string;
  checkoutExpiresAt?: number;
  _id: string;
  orderCode: string;
  customerName: string;
  phone: string;
  email: string;
  address: string;
  province: string;
  note?: string;
  paymentMethod: "cod" | "vietqr" | "momo";
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  discount: number;
  voucherCode?: string;
  total: number;
  status: "pending" | "confirmed" | "shipping" | "delivered" | "cancelled";
  createdAt: string;
  userId?: string;
  paidAt?: string;
  paymentTransactionId?: string;
  paymentStatus: "unpaid" | "paid" | "failed" | "refunded";
  statusChangedAt?: string;
  isArchived?: boolean;
  archivedAt?: string | null;
}

export interface ReviewAdminReply {
  author: string;
  content: string;
  date: string;
}

export interface Review {
  _id: string;
  productId: string;
  authorName: string;
  userName?: string;
  userEmail?: string;
  authorAvatar?: string;
  rating: number;
  title?: string;
  comment: string;
  date: string;
  verifiedPurchase: boolean;
  images?: string[];
  videos?: string[];
  likesCount?: number;
  adminReply?: ReviewAdminReply;
  status?: "approved" | "pending" | "hidden";
}

export interface Voucher {
  code: string;
  discountPercent?: number;
  discountAmount?: number;
  minOrderValue: number;
  description: MultilingualText;
}

export interface Coupon {
  _id: string;
  code: string;
  discountType: "percent" | "fixed";
  discountValue: number;
  minOrderValue: number;
  description: MultilingualText;
  startAt: string;
  endAt: string;
  isActive: boolean;
}

export interface FlashDeal {
  _id: string;
  title: MultilingualText;
  subtitle: MultilingualText;
  couponId: string;
  productIds: string[];
  isActive: boolean;
  coupon?: Coupon;
  products?: Product[];
  serverNow?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserAddress {
  id: string;
  label: string;
  receiverName: string;
  phone: string;
  address: string;
  province: string;
  isDefault: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role?: "user" | "admin";
  avatar?: string;
  addresses: UserAddress[];
  wishlist: string[]; // array of product IDs
  createdAt: string;
}
