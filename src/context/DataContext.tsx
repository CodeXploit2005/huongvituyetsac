"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Product, Category, Banner, Order, Review, Voucher } from "@/types";
import {
  initialCategories,
  initialBanners,
  initialProducts,
  sampleReviews,
  sampleVouchers,
} from "@/data/initialData";

interface DataContextType {
  products: Product[];
  categories: Category[];
  banners: Banner[];
  orders: Order[];
  reviews: Review[];
  vouchers: Voucher[];

  // Products
  getProduct: (slugOrId: string) => Product | undefined;
  getProductVariants: (parentProductId: string) => Product[];
  addProduct: (product: Omit<Product, "_id" | "createdAt" | "updatedAt">) => Promise<Product>;
  updateProduct: (product: Product) => Promise<Product>;
  deleteProduct: (id: string) => Promise<void>;
  bulkAddSeedProducts: (categoryId: string, count?: number) => void;

  // Banners
  addBanner: (banner: Omit<Banner, "_id">) => Promise<Banner>;
  updateBanner: (banner: Pick<Banner, "_id"> & Partial<Omit<Banner, "_id">>) => Promise<Banner>;
  deleteBanner: (id: string) => Promise<void>;

  // Categories
  addCategory: (category: Omit<Category, "_id">) => Promise<Category>;
  updateCategory: (category: Category) => Promise<Category>;
  deleteCategory: (id: string) => Promise<void>;

  // Orders
  createOrder: (orderData: Omit<Order, "_id" | "orderCode" | "createdAt" | "paymentStatus">) => Promise<Order>;
  updateOrderStatus: (orderId: string, status: Order["status"]) => Promise<void>;

  // Reviews
  addReview: (reviewData: Omit<Review, "_id" | "date" | "likesCount" | "status">) => Promise<Review>;
  updateReview: (review: Review) => void;
  deleteReview: (id: string) => void;
  toggleReviewStatus: (id: string, status: "approved" | "pending" | "hidden") => Promise<void>;
  replyReview: (id: string, reply: { author: string; content: string }) => Promise<void>;
  likeReview: (id: string) => void;

  // Reset
  resetToDefaultData: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

function normalizeReview(
  value: Omit<Partial<Review>, "status"> & {
    status?: Review["status"] | "rejected";
    createdAt?: string;
    helpfulCount?: number;
  }
): Review {
  const databaseReply = value.adminReply as
    | (Review["adminReply"] & { comment?: string; repliedAt?: string })
    | undefined;
  return {
    ...value,
    _id: String(value._id || `review-${Date.now()}`),
    productId: String(value.productId || ""),
    authorName: value.authorName || value.userName || "Khách hàng ẩn danh",
    rating: Number(value.rating || 0),
    comment: String(value.comment || ""),
    date: value.date || (value.createdAt ? new Date(value.createdAt).toLocaleDateString("vi-VN") : ""),
    verifiedPurchase: Boolean(value.verifiedPurchase),
    likesCount: value.likesCount ?? value.helpfulCount ?? 0,
    status: value.status === "rejected" ? "hidden" : value.status,
    adminReply: databaseReply
      ? {
          author: databaseReply.author || "Hương Vị Tuyệt Sắc CSKH",
          content: databaseReply.content || databaseReply.comment || "",
          date: databaseReply.date || databaseReply.repliedAt || "",
        }
      : undefined,
  };
}

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [banners, setBanners] = useState<Banner[]>(initialBanners);
  const [orders, setOrders] = useState<Order[]>([]);
  const [reviews, setReviews] = useState<Review[]>(sampleReviews);
  const [vouchers] = useState<Voucher[]>(sampleVouchers);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load initial data from MongoDB API endpoints with LocalStorage cache fallback
  useEffect(() => {
    async function fetchDatabaseData() {
      try {
        // Fetch in parallel
        const [catRes, prodRes, banRes, revRes] = await Promise.allSettled([
          fetch("/api/categories", { cache: "no-store" }),
          fetch("/api/products", { cache: "no-store" }),
          fetch("/api/banners?scope=admin", { cache: "no-store" }),
          fetch("/api/reviews?scope=admin"),
        ]);

        if (catRes.status === "fulfilled" && catRes.value.ok) {
          const data = await catRes.value.json();
          if (Array.isArray(data)) setCategories(data);
        }
        if (prodRes.status === "fulfilled" && prodRes.value.ok) {
          const data = await prodRes.value.json();
          if (Array.isArray(data)) setProducts(data);
        }
        if (banRes.status === "fulfilled" && banRes.value.ok) {
          const data = await banRes.value.json();
          if (Array.isArray(data)) setBanners(data);
        }
        if (revRes.status === "fulfilled" && revRes.value.ok) {
          const data = await revRes.value.json();
          if (Array.isArray(data)) setReviews(data.map(normalizeReview));
        }
      } catch (err) {
        console.warn("MongoDB API fetch fallback to local cache", err);
      } finally {
        setIsLoaded(true);
      }
    }

    // Try LocalStorage first for instant paint
    try {
      const savedProducts = localStorage.getItem("hv_products");
      const savedCategories = localStorage.getItem("hv_categories");
      const savedBanners = localStorage.getItem("hv_banners");
      const savedReviews = localStorage.getItem("hv_reviews");

      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (savedProducts) setProducts(JSON.parse(savedProducts));
      if (savedCategories) setCategories(JSON.parse(savedCategories));
      if (savedBanners) setBanners(JSON.parse(savedBanners));
      if (savedReviews) setReviews(JSON.parse(savedReviews).map(normalizeReview));
    } catch (e) {
      console.error("Failed to load initial data from storage", e);
    }

    fetchDatabaseData();
  }, []);

  // Save to LocalStorage on updates
  useEffect(() => {
    if (!isLoaded) return;
    try {
      const cache = { hv_products: products, hv_categories: categories, hv_banners: banners, hv_reviews: reviews };
      for (const [key, value] of Object.entries(cache)) {
        const serialized = JSON.stringify(value);
        if (localStorage.getItem(key) !== serialized) localStorage.setItem(key, serialized);
      }
    } catch (e) {
      console.error("Failed to save data to storage", e);
    }
  }, [products, categories, banners, reviews, isLoaded]);

  // Keep review moderation in sync across an open admin tab and storefront tab.
  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (!event.newValue || !["hv_products", "hv_categories", "hv_banners", "hv_reviews"].includes(event.key || "")) return;
      try {
        const nextValue = JSON.parse(event.newValue);
        if (!Array.isArray(nextValue)) return;
        if (event.key === "hv_products") setProducts(nextValue);
        if (event.key === "hv_categories") setCategories(nextValue);
        if (event.key === "hv_banners") setBanners(nextValue);
        if (event.key === "hv_reviews") {
          setReviews(nextValue.map(normalizeReview));
        }
      } catch (error) {
        console.error("Failed to sync data between tabs", error);
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  // Product helpers
  const getProduct = (slugOrId: string): Product | undefined => {
    return products.find((p) => p.slug === slugOrId || p._id === slugOrId);
  };

  const getProductVariants = (parentProductId: string): Product[] => {
    return products.filter(
      (p) => p.parentProductId === parentProductId || p._id === parentProductId
    );
  };

  const addProduct = (
    productData: Omit<Product, "_id" | "createdAt" | "updatedAt">
  ): Promise<Product> => {
    return fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(productData),
    }).then(async (response) => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Không thể thêm sản phẩm.");
      const newProduct = data as Product;
      setProducts((prev) => [newProduct, ...prev]);
      return newProduct;
    });
  };

  const updateProduct = (updated: Product): Promise<Product> => {
    const originalSlug = products.find((product) => product._id === updated._id)?.slug || updated.slug;
    return fetch(`/api/products/${encodeURIComponent(originalSlug)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    }).then(async (response) => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Không thể cập nhật sản phẩm.");
      const saved = data as Product;
      setProducts((prev) => prev.map((p) => (p._id === saved._id ? saved : p)));
      return saved;
    });
  };

  const deleteProduct = async (id: string) => {
    const prod = products.find((p) => p._id === id);
    if (prod) {
      const response = await fetch(`/api/products/${prod.slug}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Không thể xóa sản phẩm.");
      setProducts((prev) => prev.filter((p) => p._id !== id && p.parentProductId !== id));
    }
  };

  const bulkAddSeedProducts = (categoryId: string, count = 3) => {
    const cat = categories.find((c) => c._id === categoryId);
    const catNameVi = cat?.name.vi || "Gia Vị";
    const catNameEn = cat?.name.en || "Seasoning";

    const newItems: Product[] = Array.from({ length: count }).map((_, idx) => {
      const num = Date.now() + idx;
      return {
        _id: `prod-seed-${num}`,
        name: {
          vi: `[Mẫu] ${catNameVi} Thượng Hạng Đặc Biệt #${idx + 1}`,
          en: `[Sample] ${catNameEn} Supreme Special #${idx + 1}`,
        },
        slug: `mau-${cat?.slug || "sp"}-${num}`,
        categoryId: categoryId,
        parentProductId: null,
        description: {
          vi: `Sản phẩm mẫu được khởi tạo tự động trong hệ thống CMS quản trị cho danh mục ${catNameVi}. Bạn có thể chỉnh sửa tên, ảnh, giá và thông số bất kỳ lúc nào.`,
          en: `Sample product created via Bulk Seed tool for category ${catNameEn}. Easily edit details, images, prices, and variants in CMS.`,
        },
        price: 45000 + idx * 15000,
        originalPrice: 55000 + idx * 15000,
        images: [
          cat?.image ||
            "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=85",
        ],
        stock: 50 + idx * 20,
        tags: ["mau", "seed", cat?.slug || ""],
        isVariant: false,
        variantLabel: { vi: "Gói tiêu chuẩn", en: "Standard Pack" },
        rating: 4.8,
        reviewsCount: 15,
        origin: { vi: "Việt Nam", en: "Vietnam" },
        weight: "250g",
        isPlaceholder: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    });

    setProducts((prev) => [...newItems, ...prev]);
  };

  // Banner helpers
  const addBanner = async (payload: Omit<Banner, "_id">): Promise<Banner> => {
    const response = await fetch("/api/banners", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Không thể lưu dữ liệu.");
    const saved = data as Banner;
    setBanners(prev => [...prev, saved]);
    return saved;
  };
  const updateBanner = async (payload: Pick<Banner, "_id"> & Partial<Omit<Banner, "_id">>): Promise<Banner> => {
    const response = await fetch("/api/banners", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Không thể cập nhật dữ liệu.");
    const saved = data as Banner;
    setBanners(prev => prev.map(item => item._id === saved._id ? saved : item));
    return saved;
  };

  const deleteBanner = async (id: string) => {
    const response = await fetch("/api/banners", {
      method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Không thể xóa dữ liệu.");
    setBanners((prev) => prev.filter((item) => item._id !== id));
  };

  // Category helpers
  const addCategory = async (payload: Omit<Category, "_id">): Promise<Category> => {
    const response = await fetch("/api/categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Không thể lưu dữ liệu.");
    const saved = data as Category;
    setCategories(prev => [...prev, saved]);
    return saved;
  };
  const updateCategory = async (payload: Category): Promise<Category> => {
    const response = await fetch("/api/categories", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Không thể cập nhật dữ liệu.");
    const saved = data as Category;
    setCategories(prev => prev.map(item => item._id === saved._id ? saved : item));
    return saved;
  };

  const deleteCategory = async (id: string) => {
    const response = await fetch("/api/categories", {
      method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Không thể xóa dữ liệu.");
    setCategories((prev) => prev.filter((item) => item._id !== id));
  };

  // Order helpers
  const createOrder = async (
    orderData: Omit<Order, "_id" | "orderCode" | "createdAt" | "paymentStatus">
  ): Promise<Order> => {
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderData),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Không thể lưu đơn hàng.");
    const saved = data as Order;
    if (!saved.checkoutToken) setOrders((prev) => [saved, ...prev.filter((order) => order._id !== saved._id)]);
    return saved;
  };

  const updateOrderStatus = async (orderId: string, status: Order["status"]) => {
    const response = await fetch("/api/orders", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: orderId, status }) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Không thể cập nhật trạng thái đơn hàng.");
    const saved = data as Order;
    setOrders((prev) => prev.map((order) => (order._id === saved._id ? saved : order)));
  };

  // Review helpers
  const addReview = async (
    reviewData: Omit<Review, "_id" | "date" | "likesCount" | "status">
  ): Promise<Review> => {
    const response = await fetch("/api/reviews", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: reviewData.productId, rating: reviewData.rating, comment: reviewData.comment, images: reviewData.images || [], videos: reviewData.videos || [] }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Không thể lưu đánh giá.");
    const saved = normalizeReview(data);
    setReviews(prev => [saved, ...prev]);
    return saved;
  };

  const updateReview = (updated: Review) => {
    setReviews((prev) => prev.map((r) => (r._id === updated._id ? updated : r)));
  };

  const deleteReview = (id: string) => {
    const review = reviews.find((item) => item._id === id);
    fetch("/api/reviews", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        productId: review?.productId,
        comment: review?.comment,
      }),
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Không thể xóa đánh giá.");
        setReviews((prev) => prev.filter((r) => r._id !== id));
      })
      .catch((error) => alert(error instanceof Error ? error.message : "Không thể xóa đánh giá."));
  };

  const toggleReviewStatus = async (id: string, status: "approved" | "pending" | "hidden") => {
    const review = reviews.find((item) => item._id === id);
    const response = await fetch("/api/reviews", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        status,
        productId: review?.productId,
        comment: review?.comment,
      }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Không thể đổi trạng thái đánh giá.");
    const saved = normalizeReview(data);
    setReviews((prev) => prev.map((r) => (r._id === id ? saved : r)));
  };

  const replyReview = (
    id: string,
    reply: { author: string; content: string }
  ): Promise<void> => {
    const today = new Date();
    const formattedDate = `${String(today.getDate()).padStart(2, "0")}/${String(
      today.getMonth() + 1
    ).padStart(2, "0")}/${today.getFullYear()}`;

    const adminReply = {
      author: reply.author || "Hương Vị Tuyệt Sắc CSKH",
      content: reply.content,
      comment: reply.content,
      date: formattedDate,
      repliedAt: new Date().toISOString(),
    };
    const review = reviews.find((item) => item._id === id);
    return fetch("/api/reviews", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        adminReply,
        productId: review?.productId,
        comment: review?.comment,
      }),
    }).then(async (response) => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Không thể lưu phản hồi.");
      const saved = normalizeReview(data);
      setReviews((prev) => prev.map((r) => (r._id === id ? saved : r)));
    });
  };

  const likeReview = (id: string) => {
    setReviews((prev) =>
      prev.map((r) =>
        r._id === id ? { ...r, likesCount: (r.likesCount || 0) + 1 } : r
      )
    );
  };

  const resetToDefaultData = () => {
    localStorage.removeItem("hv_products");
    localStorage.removeItem("hv_categories");
    localStorage.removeItem("hv_banners");
    localStorage.removeItem("hv_reviews");
    setProducts(initialProducts);
    setCategories(initialCategories);
    setBanners(initialBanners);
    setOrders([]);
    setReviews(sampleReviews);
  };

  return (
    <DataContext.Provider
      value={{
        products,
        categories,
        banners,
        orders,
        reviews,
        vouchers,
        getProduct,
        getProductVariants,
        addProduct,
        updateProduct,
        deleteProduct,
        bulkAddSeedProducts,
        addBanner,
        updateBanner,
        deleteBanner,
        addCategory,
        updateCategory,
        deleteCategory,
        createOrder,
        updateOrderStatus,
        addReview,
        updateReview,
        deleteReview,
        toggleReviewStatus,
        replyReview,
        likeReview,
        resetToDefaultData,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
};
