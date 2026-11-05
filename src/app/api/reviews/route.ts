import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Review } from "@/models";
import { getCurrentUser } from "@/lib/authSession";
import { isCloudinaryMediaUrl } from "@/lib/mediaUpload";

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");

    const query: Record<string, unknown> = {};
    if (productId) query.productId = productId;
    if (searchParams.get("scope") !== "admin") {
      query.status = "approved";
    }

    const reviews = await Review.find(query).sort({ createdAt: -1 }).lean();
    return NextResponse.json(reviews);
  } catch (error: unknown) {
    console.error("GET /api/reviews error:", error);
    const message = error instanceof Error ? error.message : "Lỗi máy chủ.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Vui lòng đăng nhập để gửi đánh giá." },
        { status: 401 }
      );
    }
    await connectDB();
    const body = await req.json();
    const images: unknown = body.images ?? [];
    const videos: unknown = body.videos ?? [];
    if (!Array.isArray(videos) || videos.length > 1 || videos.some(video => !isCloudinaryMediaUrl(video, process.env.CLOUDINARY_CLOUD_NAME, "video", `reviews/${user._id}`))) {
      return NextResponse.json({ error: "Chỉ được đính kèm 1 video tải lên từ tài khoản của bạn." }, { status: 400 });
    }
    if (!Array.isArray(images) || images.length > 4 || images.some(image => {
      if (typeof image !== "string") return true;
      try {
        const url = new URL(image);
        return url.protocol !== "https:" || url.hostname !== "res.cloudinary.com" || !url.pathname.startsWith(`/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/`) || !url.pathname.includes("/huongvituyetsac/reviews/");
      } catch { return true; }
    })) return NextResponse.json({ error: "Chỉ được đính kèm tối đa 4 ảnh tải lên từ biểu mẫu đánh giá." }, { status: 400 });
    const review = await Review.create({
      productId: body.productId,
      rating: body.rating,
      comment: body.comment,
      images,
      videos,
      userName: user.name,
      userEmail: user.email,
    });
    return NextResponse.json(review, { status: 201 });
  } catch (error: unknown) {
    console.error("POST /api/reviews error:", error);
    const message = error instanceof Error ? error.message : "Dữ liệu đánh giá không hợp lệ.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PUT(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { id, adminReply, status, productId, comment } = body;
    const update: Record<string, unknown> = {};
    if (adminReply !== undefined) update.adminReply = adminReply;
    if (status !== undefined) {
      if (!["approved", "pending", "hidden"].includes(status)) {
        return NextResponse.json({ error: "Trạng thái đánh giá không hợp lệ." }, { status: 400 });
      }
      update.status = status;
    }

    const fallbackFilters = productId && comment
      ? [{ productId: String(productId), comment: String(comment) }]
      : [];
    const filter = {
      $or: [
        { $expr: { $eq: [{ $toString: "$_id" }, String(id)] } },
        ...fallbackFilters,
      ],
    };
    const updated = await Review.findOneAndUpdate(
      filter,
      update,
      { new: true, sort: { createdAt: -1 } }
    );
    if (!updated) return NextResponse.json({ error: "Không tìm thấy đánh giá." }, { status: 404 });
    return NextResponse.json(updated);
  } catch (error: unknown) {
    console.error("PUT /api/reviews error:", error);
    const message = error instanceof Error ? error.message : "Dữ liệu cập nhật không hợp lệ.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  try {
    await connectDB();
    const url = new URL(req.url);
    const requestBody = await req.json().catch(() => ({}));
    const id = url.searchParams.get("id") || requestBody.id;
    if (!id) return NextResponse.json({ error: "Thiếu mã đánh giá." }, { status: 400 });
    const fallbackFilters = requestBody.productId && requestBody.comment
      ? [
          {
            productId: String(requestBody.productId),
            comment: String(requestBody.comment),
          },
        ]
      : [];
    const filter = {
      $or: [
        { $expr: { $eq: [{ $toString: "$_id" }, String(id)] } },
        ...fallbackFilters,
      ],
    };
    const deleted = await Review.findOneAndDelete(filter, {
      sort: { createdAt: -1 },
    });
    if (!deleted) return NextResponse.json({ error: "Không tìm thấy đánh giá." }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Không thể xóa đánh giá.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
