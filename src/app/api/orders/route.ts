import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getCurrentAdmin, getCurrentUser } from "@/lib/authSession";
import { Coupon, Order, Product } from "@/models";
import { randomBytes } from "node:crypto";
import { readCheckout, signCheckout } from "@/lib/checkoutToken";
import type { Order as CheckoutOrder } from "@/types";

const STATUSES = ["pending", "confirmed", "shipping", "delivered", "cancelled"] as const;
const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const positiveInt = (value: string | null, fallback: number, max = 100) => Math.min(max, Math.max(1, Number.parseInt(value || "", 10) || fallback));

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const adminScope = url.searchParams.get("scope") === "admin";
    const admin = adminScope ? await getCurrentAdmin() : null;
    const user = adminScope ? null : await getCurrentUser();
    if (adminScope && !admin) return NextResponse.json({ error: "Bạn không có quyền xem danh sách này." }, { status: 403 });
    if (!adminScope && !user) return NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 });
    await connectDB();

    const page = positiveInt(url.searchParams.get("page"), 1, 100000);
    const limit = positiveInt(url.searchParams.get("limit"), adminScope ? 15 : 50, 50);
    const query: Record<string, unknown> = adminScope ? { isArchived: url.searchParams.get("archived") === "true" } : { userId: String(user!._id) };
    const status = url.searchParams.get("status");
    if (status && status !== "all" && STATUSES.includes(status as typeof STATUSES[number])) query.status = status;
    if (adminScope) {
      const search = url.searchParams.get("search")?.trim();
      if (search) {
        const pattern = new RegExp(escapeRegex(search), "i");
        query.$or = [{ orderCode: pattern }, { customerName: pattern }, { phone: pattern }, { email: pattern }, { "items.productName.vi": pattern }, { "items.productName.en": pattern }];
      }
      const payment = url.searchParams.get("payment");
      if (payment && ["cod", "vietqr", "momo"].includes(payment)) query.paymentMethod = payment;
      const from = url.searchParams.get("from");
      const to = url.searchParams.get("to");
      if (from || to) {
        const createdAt: Record<string, Date> = {};
        if (from && !Number.isNaN(Date.parse(from))) createdAt.$gte = new Date(from);
        if (to && !Number.isNaN(Date.parse(to))) { const end = new Date(to); end.setHours(23, 59, 59, 999); createdAt.$lte = end; }
        if (Object.keys(createdAt).length) query.createdAt = createdAt;
      }
    }
    const [orders, total] = await Promise.all([
      Order.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Order.countDocuments(query),
    ]);
    const safeOrders = adminScope ? orders : orders.map((order) => { const safe = { ...order } as Record<string, unknown>; delete safe.isArchived; delete safe.archivedAt; return safe; });
    return NextResponse.json({ orders: safeOrders, pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) } });
  } catch (error: unknown) {
    console.error("GET /api/orders error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Không thể tải đơn hàng." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const user = await getCurrentUser();
    if (body.checkoutToken) {
      if (!user) return NextResponse.json({ error: "Vui lòng đăng nhập để xác nhận thanh toán." }, { status: 401 });
      let draft: CheckoutOrder;
      try {
        draft = readCheckout(String(body.checkoutToken), String(user._id));
      } catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : "Phiên thanh toán không hợp lệ." }, { status: 400 });
      }
      // The unique code makes retries idempotent, including a lost HTTP response.
      const { _id: draftId, ...orderData } = draft;
      void draftId;
      const order = await Order.findOneAndUpdate(
        { orderCode: draft.orderCode },
        { $setOnInsert: { ...orderData, statusChangedAt: new Date() } },
        { upsert: true, new: true, runValidators: true },
      );
      return NextResponse.json(order, { status: 201 });
    }
    if (!Array.isArray(body.items) || body.items.length === 0) return NextResponse.json({ error: "Đơn hàng phải có ít nhất một sản phẩm." }, { status: 400 });
    const requested = new Map<string, number>();
    for (const item of body.items) {
      const id = String(item.productId || "");
      const quantity = Number(item.quantity);
      if (!id || !Number.isInteger(quantity) || quantity < 1 || quantity > 100) return NextResponse.json({ error: "Sản phẩm hoặc số lượng không hợp lệ." }, { status: 400 });
      requested.set(id, (requested.get(id) || 0) + quantity);
    }
    const resolvedProducts = await Promise.all([...requested.keys()].map(async (requestedId) => {
      // Hỗ trợ đồng thời ObjectId thật và ID chuỗi của dữ liệu cũ mà không ép
      // requestedId thành ObjectId, tránh CastError khi giỏ hàng chứa slug/legacy ID.
      const product = await Product.collection.findOne({
        $or: [
          { slug: requestedId },
          { $expr: { $eq: [{ $toString: "$_id" }, requestedId] } },
        ],
      });
      return product ? { requestedId, product } : null;
    }));
    if (resolvedProducts.some((entry) => !entry)) return NextResponse.json({ error: "Có sản phẩm không còn tồn tại hoặc đã bị xóa. Vui lòng tải lại giỏ hàng." }, { status: 400 });
    const products = resolvedProducts.flatMap((entry) => entry ? [entry.product] : []);
    const items = resolvedProducts.flatMap((entry) => entry ? [{ productId: String(entry.product._id), productName: entry.product.name, variantLabel: entry.product.variantLabel || undefined, image: entry.product.images?.[0] || "/file.svg", price: Number(entry.product.price), quantity: requested.get(entry.requestedId)! }] : []);
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    let discount = 0;
    let voucherCode: string | null = null;
    if (body.voucherCode) {
      if (!user) return NextResponse.json({ error: "Vui lòng đăng nhập để sử dụng coupon." }, { status: 401 });
      const now = new Date();
      const coupon = await Coupon.findOne({ code: String(body.voucherCode).trim().toUpperCase(), isActive: true, startAt: { $lte: now }, endAt: { $gt: now } }).lean();
      if (!coupon || subtotal < coupon.minOrderValue) return NextResponse.json({ error: "Coupon không hợp lệ hoặc chưa đủ giá trị tối thiểu." }, { status: 400 });
      discount = coupon.discountType === "percent" ? Math.round(subtotal * Math.min(100, coupon.discountValue) / 100) : Math.min(subtotal, coupon.discountValue);
      voucherCode = coupon.code;
    }
    const shippingFee = voucherCode === "FREESHIP" ? 0 : Math.max(...products.map((product) => Number(product.shippingFee) || 0), 0);
    const paymentMethod = ["cod", "vietqr", "momo"].includes(body.paymentMethod) ? body.paymentMethod : "cod";
    if (paymentMethod === "vietqr" && !user) return NextResponse.json({ error: "Vui lòng đăng nhập để thanh toán VietQR." }, { status: 401 });
    if (["customerName", "phone", "email", "address", "province"].some((key) => !String(body[key] || "").trim())) return NextResponse.json({ error: "Vui lòng nhập đủ thông tin nhận hàng." }, { status: 400 });
    const phone = String(body.phone).trim();
    if (!/^\d{10}$/.test(phone)) return NextResponse.json({ error: "Số điện thoại không đúng." }, { status: 400 });
    const orderData = {
      orderCode: "HV" + randomBytes(8).toString("hex").toUpperCase(), userId: user ? String(user._id) : null,
      customerName: String(body.customerName).trim(), phone, email: String(body.email).trim().toLowerCase(), address: String(body.address).trim(), province: String(body.province).trim(), note: String(body.note || "").trim() || null,
      paymentMethod, paymentStatus: "unpaid" as const, items, subtotal, shippingFee, discount, voucherCode, total: Math.max(0, subtotal + shippingFee - discount), status: "pending" as const, statusChangedAt: new Date(), isArchived: false,
    };
    if (paymentMethod === "vietqr") {
      // A signed quote contains server-validated prices; opening/closing QR writes no order.
      const expiresAt = Date.now() + 10 * 60 * 1000;
      const draft: CheckoutOrder = {
        ...orderData,
        _id: orderData.orderCode,
        userId: orderData.userId || undefined,
        note: orderData.note || undefined,
        voucherCode: orderData.voucherCode || undefined,
        statusChangedAt: orderData.statusChangedAt.toISOString(),
        createdAt: new Date().toISOString(),
      };
      return NextResponse.json({ ...draft, checkoutToken: signCheckout(draft, expiresAt), checkoutExpiresAt: expiresAt });
    }
    const order = await Order.create(orderData);
    return NextResponse.json(order, { status: 201 });
  } catch (error: unknown) {
    console.error("POST /api/orders error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Không thể lưu đơn hàng." }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) return NextResponse.json({ error: "Chỉ quản trị viên được đổi trạng thái đơn hàng." }, { status: 403 });
    await connectDB();
    const { id, status } = await req.json();
    if (!id || !STATUSES.includes(status)) return NextResponse.json({ error: "Trạng thái không hợp lệ." }, { status: 400 });
    const match = await Order.collection.findOne({ $expr: { $eq: [{ $toString: "$_id" }, String(id)] } });
    if (!match) return NextResponse.json({ error: "Không tìm thấy đơn hàng." }, { status: 404 });
    const terminal = status === "delivered" || status === "cancelled";
    const update: Record<string, unknown> = { status, statusChangedAt: new Date() };
    // Chỉ thao tác xác nhận của Admin mới ghi nhận tiền vào doanh thu.
    if (status === "confirmed" || (status === "delivered" && match.paymentMethod === "cod")) {
      update.paymentStatus = "paid";
      update.paidAt = match.paidAt || new Date();
    }
    if (match.isArchived && !terminal) {
      update.isArchived = false;
      update.archivedAt = null;
    }
    const order = await Order.collection.findOneAndUpdate({ _id: match._id }, { $set: update }, { returnDocument: "after" });
    return NextResponse.json(order);
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Không thể cập nhật đơn hàng." }, { status: 400 });
  }
}
