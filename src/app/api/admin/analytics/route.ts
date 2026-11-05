import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Banner, Category, Order, Product, Review, User } from "@/models";
import { getCurrentAdmin } from "@/lib/authSession";

type AnalyticsOrder = { createdAt: Date | string; status: string; paymentStatus?: string; total?: number; items?: Array<{ productId: string; price: number; quantity: number }> };
const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#a855f7", "#06b6d4"];
const sumRevenue = (orders: AnalyticsOrder[]) => orders.reduce((sum, order) => sum + Number(order.total || 0), 0);

function makeDailySeries(orders: AnalyticsOrder[], days: number, now: Date) {
  return Array.from({ length: days }, (_, offset) => {
    const date = new Date(now);
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (days - 1 - offset));
    const next = new Date(date);
    next.setDate(next.getDate() + 1);
    const dayOrders = orders.filter((order) => {
      const createdAt = new Date(order.createdAt);
      return createdAt >= date && createdAt < next;
    });
    return { label: date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" }), revenue: sumRevenue(dayOrders), orders: dayOrders.length };
  });
}

export async function GET() {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) return NextResponse.json({ error: "Bạn không có quyền xem thống kê." }, { status: 403 });
    await connectDB();
    const [orders, products, categories, users, reviews, banners] = await Promise.all([
      Order.find({}).lean<AnalyticsOrder[]>(), Product.find({}).lean(), Category.find({}).lean(),
      User.find({}).select("_id").lean(), Review.find({}).select("_id").lean(), Banner.find({}).select("isActive").lean(),
    ]);

    const revenueOrders = orders.filter((order) => order.paymentStatus === "paid" && order.status !== "cancelled");
    const totalRevenue = sumRevenue(revenueOrders);
    const completedOrders = orders.filter((order) => order.status === "delivered").length;
    const now = new Date();
    const year = now.getFullYear();
    const currentMonthStart = new Date(year, now.getMonth(), 1);
    const previousMonthStart = new Date(year, now.getMonth() - 1, 1);
    const currentMonthRevenue = sumRevenue(revenueOrders.filter((order) => new Date(order.createdAt) >= currentMonthStart));
    const previousMonthRevenue = sumRevenue(revenueOrders.filter((order) => { const d = new Date(order.createdAt); return d >= previousMonthStart && d < currentMonthStart; }));
    const growthRate = previousMonthRevenue > 0 ? ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100 : currentMonthRevenue > 0 ? 100 : 0;
    const monthlyGrowth = Array.from({ length: 12 }, (_, monthIndex) => {
      const monthOrders = revenueOrders.filter((order) => { const d = new Date(order.createdAt); return d.getFullYear() === year && d.getMonth() === monthIndex; });
      return { label: `Th${monthIndex + 1}/${year}`, revenue: sumRevenue(monthOrders), orders: monthOrders.length };
    });

    const categoryMap = new Map(categories.map((category, index) => [String(category._id), { id: String(category._id), name: category.name?.vi || category.name?.en || "Chưa phân loại", revenue: 0, quantity: 0, color: COLORS[index % COLORS.length] }]));
    const productsById = new Map(products.map((product) => [String(product._id), product]));
    const productSales = new Map(products.map((product) => [String(product._id), { id: String(product._id), name: product.name?.vi || product.name?.en || "Sản phẩm", revenue: 0, soldQty: 0, image: product.images?.[0] || "" }]));
    revenueOrders.forEach((order) => order.items?.forEach((item) => {
      const product = productsById.get(String(item.productId));
      const amount = Number(item.price || 0) * Number(item.quantity || 0);
      const category = product ? categoryMap.get(String(product.categoryId)) : undefined;
      if (category) { category.revenue += amount; category.quantity += Number(item.quantity || 0); }
      const sale = productSales.get(String(item.productId));
      if (sale) { sale.revenue += amount; sale.soldQty += Number(item.quantity || 0); }
    }));
    const categorizedRevenue = Array.from(categoryMap.values()).reduce((sum, category) => sum + category.revenue, 0);
    const categoryBreakdown = Array.from(categoryMap.values()).map((category) => ({ ...category, percentage: categorizedRevenue > 0 ? Number(((category.revenue / categorizedRevenue) * 100).toFixed(1)) : 0 }));
    const topProducts = Array.from(productSales.values()).filter((product) => product.soldQty > 0).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

    return NextResponse.json({
      year,
      kpis: {
        totalRevenue, totalOrders: orders.length, completedOrders,
        completionRate: orders.length > 0 ? Number(((completedOrders / orders.length) * 100).toFixed(1)) : 0,
        pendingOrders: orders.filter((order) => order.status === "pending" || order.status === "confirmed").length,
        avgOrderValue: revenueOrders.length > 0 ? Math.round(totalRevenue / revenueOrders.length) : 0,
        growthRate: Number(growthRate.toFixed(1)), totalCustomers: users.length, totalProducts: products.length,
        totalCategories: categories.length, totalReviews: reviews.length,
        activeBanners: banners.filter((banner) => banner.isActive).length, totalBanners: banners.length,
      },
      growthData: { "7days": makeDailySeries(revenueOrders, 7, now), "30days": makeDailySeries(revenueOrders, 30, now), year: monthlyGrowth },
      categoryBreakdown, topProducts,
    });
  } catch (error) {
    console.error("GET /api/admin/analytics error:", error);
    return NextResponse.json({ error: "Không thể tải số liệu tổng quan." }, { status: 500 });
  }
}
