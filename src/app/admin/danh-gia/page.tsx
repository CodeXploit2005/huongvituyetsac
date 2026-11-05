"use client";

import React, { useState, useMemo } from "react";
import {
  MessageSquare,
  Star,
  Search,
  Filter,
  CheckCircle2,
  EyeOff,
  Eye,
  Trash2,
  Reply,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  ThumbsUp,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useData } from "@/context/DataContext";
import { useLanguage } from "@/context/LanguageContext";
import { Review } from "@/types";

export default function AdminReviewsPage() {
  const { reviews, products, toggleReviewStatus, deleteReview, replyReview } = useData();
  const { loc } = useLanguage();

  const [searchTerm, setSearchTerm] = useState("");
  const [starFilter, setStarFilter] = useState<number | "all">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "approved" | "hidden">("all");
  const [selectedProductId, setSelectedProductId] = useState<string>("all");

  // Reply Modal State
  const [replyingReview, setReplyingReview] = useState<Review | null>(null);
  const [replyAuthor, setReplyAuthor] = useState("Hương Vị Tuyệt Sắc CSKH");
  const [replyContent, setReplyContent] = useState("");

  // Key metrics
  const totalReviews = reviews.length;
  const avgScore = totalReviews
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)
    : "5.0";
  const fiveStarCount = reviews.filter((r) => r.rating === 5).length;
  const hiddenCount = reviews.filter((r) => r.status === "hidden").length;
  const visibleCount = reviews.filter((r) => (r.status || "approved") === "approved").length;

  // Filtered reviews
  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      // Search
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const prod = products.find((p) => p._id === r.productId);
        const prodName = prod ? loc(prod.name).toLowerCase() : "";
        const matchAuthor = (r.authorName || r.userName || "").toLowerCase().includes(query);
        const matchTitle = (r.title || "").toLowerCase().includes(query);
        const matchComment = r.comment.toLowerCase().includes(query);
        const matchProd = prodName.includes(query);
        if (!matchAuthor && !matchTitle && !matchComment && !matchProd) return false;
      }

      // Star
      if (starFilter !== "all" && Math.round(r.rating) !== starFilter) {
        return false;
      }

      // Status
      if (statusFilter !== "all") {
        const revStatus = r.status || "approved";
        if (revStatus !== statusFilter) return false;
      }

      // Product
      if (selectedProductId !== "all" && r.productId !== selectedProductId) {
        return false;
      }

      return true;
    });
  }, [reviews, products, searchTerm, starFilter, statusFilter, selectedProductId, loc]);

  const handleOpenReplyModal = (rev: Review) => {
    setReplyingReview(rev);
    setReplyAuthor(rev.adminReply?.author || "Hương Vị Tuyệt Sắc CSKH");
    setReplyContent(rev.adminReply?.content || "");
  };

  const handleSaveReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyingReview || !replyContent.trim()) return;

    try {
      await replyReview(replyingReview._id, {
        author: replyAuthor,
        content: replyContent,
      });
      setReplyingReview(null);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Không thể lưu phản hồi.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-white">
            Quản Lý Đánh Giá & Bình Luận
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Kiểm duyệt phản hồi khách hàng, trả lời đánh giá và theo dõi độ hài lòng sản phẩm
          </p>
        </div>
      </div>

      {/* 4 Stats KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-blue-600 dark:text-blue-400">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Tổng số đánh giá
            </span>
            <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950/60">
              <MessageSquare size={18} />
            </div>
          </div>
          <div className="text-2xl font-black text-stone-900 dark:text-stone-100">
            {totalReviews} nhận xét
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
            <CheckCircle2 size={13} />
            <span>100% từ khách hàng thực tế</span>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-amber-500">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Điểm hài lòng TB
            </span>
            <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/60">
              <Star size={18} />
            </div>
          </div>
          <div className="text-2xl font-black text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <span>{avgScore} / 5.0</span>
            <div className="flex text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={14} fill="currentColor" />
              ))}
            </div>
          </div>
          <div className="text-[11px] text-stone-500">
            {fiveStarCount} lượt đánh giá 5 sao
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Đang hiển thị
            </span>
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/60">
              <Eye size={18} />
            </div>
          </div>
          <div className="text-2xl font-black text-stone-900 dark:text-stone-100">
            {visibleCount} bài viết
          </div>
          <div className="text-[11px] text-stone-500">
            Hiển thị trực tiếp trên Storefront
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-rose-600 dark:text-rose-400">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Đang ẩn / Cần duyệt
            </span>
            <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-950/60">
              <EyeOff size={18} />
            </div>
          </div>
          <div className="text-2xl font-black text-stone-900 dark:text-stone-100">
            {hiddenCount} bài
          </div>
          <div className="text-[11px] text-stone-500">
            Không xuất hiện ngoài trang mua sắm
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Tìm theo tên khách, nội dung hoặc tên sản phẩm..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-medium text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Star filter */}
          <select
            value={starFilter}
            onChange={(e) =>
              setStarFilter(e.target.value === "all" ? "all" : Number(e.target.value))
            }
            className="px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-bold text-stone-800 dark:text-stone-200"
          >
            <option value="all">Tất cả số sao</option>
            <option value="5">5 Sao ⭐</option>
            <option value="4">4 Sao ⭐</option>
            <option value="3">3 Sao ⭐</option>
            <option value="2">2 Sao ⭐</option>
            <option value="1">1 Sao ⭐</option>
          </select>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-bold text-stone-800 dark:text-stone-200"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="approved">Đang hiển thị</option>
            <option value="hidden">Đang ẩn</option>
          </select>

          {/* Product filter */}
          <select
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            className="px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-bold text-stone-800 dark:text-stone-200 max-w-[180px] truncate"
          >
            <option value="all">Tất cả sản phẩm</option>
            {products
              .filter((p) => !p.isVariant)
              .map((p) => (
                <option key={p._id} value={p._id}>
                  {loc(p.name)}
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* Review Items List */}
      <div className="space-y-4">
        {filteredReviews.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-500 text-xs sm:text-sm">
            Không tìm thấy đánh giá nào phù hợp với bộ lọc hiện tại.
          </div>
        ) : (
          filteredReviews.map((rev) => {
            const prod = products.find(
              (p) => p._id === rev.productId || p.parentProductId === rev.productId
            );
            const isHidden = rev.status === "hidden";

            return (
              <div
                key={rev._id}
                className={`p-5 sm:p-6 rounded-3xl bg-white dark:bg-stone-900 border shadow-sm space-y-4 transition-all ${
                  isHidden
                    ? "border-rose-300 dark:border-rose-900/50 bg-rose-50/20 dark:bg-rose-950/10"
                    : "border-stone-200 dark:border-stone-800"
                }`}
              >
                {/* Header Row: Product Info & Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100 dark:border-stone-800">
                  <div className="flex items-center gap-3">
                    {prod ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={prod.images[0]}
                          alt={loc(prod.name)}
                          className="w-11 h-11 rounded-xl object-cover border border-stone-200 dark:border-stone-700"
                        />
                        <div>
                          <h4 className="font-bold text-xs sm:text-sm text-stone-900 dark:text-stone-100 line-clamp-1">
                            {loc(prod.name)}
                          </h4>
                          <span className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
                            Mã SP: {prod.slug}
                          </span>
                        </div>
                      </>
                    ) : (
                      <span className="text-xs text-stone-400">Sản phẩm chung</span>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      onClick={() => handleOpenReplyModal(rev)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 hover:bg-amber-100 hover:text-amber-950 dark:hover:bg-amber-900/70 dark:hover:text-amber-100 font-bold text-xs transition-colors"
                    >
                      <Reply size={13} />
                      <span>{rev.adminReply ? "Sửa phản hồi" : "Phản hồi shop"}</span>
                    </button>

                    <button
                      onClick={async () => {
                        try {
                          await toggleReviewStatus(rev._id, isHidden ? "approved" : "hidden");
                        } catch (error) {
                          alert(error instanceof Error ? error.message : "Không thể đổi trạng thái.");
                        }
                      }}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                        isHidden
                          ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 hover:text-emerald-900 dark:hover:bg-emerald-900/70 dark:hover:text-emerald-100"
                          : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 hover:text-stone-900 dark:hover:bg-stone-700 dark:hover:text-white"
                      }`}
                    >
                      {isHidden ? <Eye size={13} /> : <EyeOff size={13} />}
                      <span>{isHidden ? "Hiện lại" : "Ẩn đánh giá"}</span>
                    </button>

                    <button
                      onClick={() => {
                        if (confirm(`Bạn có chắc muốn xóa đánh giá của "${rev.authorName}"?`)) {
                          deleteReview(rev._id);
                        }
                      }}
                      className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="Xóa vĩnh viễn"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Reviewer Details & Rating */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      {rev.authorAvatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={rev.authorAvatar}
                          alt={rev.authorName || "Khách hàng"}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-stone-200 dark:bg-stone-700 flex items-center justify-center text-xs font-bold">
                          {(rev.authorName || "K").charAt(0)}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs sm:text-sm text-stone-900 dark:text-white">
                            {rev.authorName || "Khách hàng ẩn danh"}
                          </span>
                          {rev.verifiedPurchase && (
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                              ✓ Đã mua hàng
                            </span>
                          )}
                          {isHidden && (
                            <span className="text-[10px] font-bold text-rose-600 bg-rose-100 dark:bg-rose-950/60 px-2 py-0.5 rounded-full">
                              Đang ẩn
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <span className="text-xs text-stone-400 font-medium">{rev.date}</span>
                  </div>

                  {/* Stars */}
                  <div className="flex items-center gap-1 text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={14}
                        fill={i < rev.rating ? "currentColor" : "none"}
                        className={i < rev.rating ? "text-amber-400" : "text-stone-300 dark:text-stone-700"}
                      />
                    ))}
                    <span className="text-xs text-stone-400 font-bold ml-1">
                      ({rev.rating}/5)
                    </span>
                  </div>

                  {/* Title & Comment */}
                  {rev.title && (
                    <h5 className="font-bold text-xs sm:text-sm text-stone-900 dark:text-stone-100">
                      {rev.title}
                    </h5>
                  )}
                  <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
                    {rev.comment}
                  </p>

                  {/* Attached Photos */}
                  {rev.images && rev.images.length > 0 && (
                    <div className="flex items-center gap-2 pt-1">
                      {rev.images.map((img, idx) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={idx}
                          src={img}
                          alt="Review attachment"
                          className="w-16 h-16 rounded-xl object-cover border border-stone-200 dark:border-stone-700 shadow-xs"
                        />
                      ))}
                    </div>
                  )}

                  {rev.videos && rev.videos.length > 0 && <div className="flex flex-wrap gap-3 pt-2">
                    {rev.videos.map((url, index) => <video key={url} src={url} controls playsInline preload="metadata" aria-label={`Video đánh giá ${index + 1}`} className="aspect-video w-full max-w-sm rounded-xl bg-black" />)}
                  </div>}

                  {/* Shop Admin Reply Thread */}
                  {rev.adminReply && (
                    <div className="mt-3 p-3.5 rounded-2xl bg-amber-50/70 dark:bg-stone-800 border border-amber-200 dark:border-stone-700 space-y-1">
                      <div className="flex items-center justify-between text-xs font-bold text-amber-900 dark:text-amber-400">
                        <div className="flex items-center gap-1.5">
                          <Sparkles size={13} />
                          <span>Phản hồi: {rev.adminReply.author}</span>
                        </div>
                        <span className="text-[11px] text-stone-400 font-normal">
                          {rev.adminReply.date}
                        </span>
                      </div>
                      <p className="text-xs text-stone-700 dark:text-stone-300">
                        {rev.adminReply.content}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Reply Modal */}
      <AnimatePresence>
        {replyingReview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-6 sm:p-7 shadow-2xl space-y-4"
            >
              <button
                onClick={() => setReplyingReview(null)}
                className="absolute top-5 right-5 p-2 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-white transition-colors"
              >
                <X size={18} />
              </button>

              <div>
                <h3 className="text-lg font-black text-stone-900 dark:text-white">
                  Phản Hồi Đánh Giá Khách Hàng
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Phản hồi của bạn sẽ hiển thị công khai dưới đánh giá của khách hàng ngoài Storefront.
                </p>
              </div>

              {/* Customer original comment preview */}
              <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 text-xs space-y-1">
                <span className="font-bold text-stone-900 dark:text-stone-100">
                  {replyingReview.authorName} ({replyingReview.rating}★):
                </span>
                <p className="text-stone-600 dark:text-stone-300 italic">
                  &ldquo;{replyingReview.comment}&rdquo;
                </p>
              </div>

              <form onSubmit={handleSaveReply} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Tên người đại diện / Chức danh
                  </label>
                  <input
                    type="text"
                    required
                    value={replyAuthor}
                    onChange={(e) => setReplyAuthor(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-medium text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Nội dung phản hồi chính thức *
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="vd: Cảm ơn bạn đã tin chọn sản phẩm của shop! Chúc bạn và gia đình luôn có những bữa ăn thơm ngon..."
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-medium text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setReplyingReview(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold text-xs shadow-md transition-all"
                  >
                    Lưu & Đăng phản hồi
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
