"use client";

import { ImageUploader } from "@/components/common/ImageUploader";
import React, { useEffect, useState, useMemo } from "react";
import {
  Star,
  ShieldCheck,
  ShoppingBag,
  PenSquare,
  ThumbsUp,
  MoreVertical,
  CheckCircle2,
  X,
  ChevronDown,
  Sparkles,
  Share2,
  Flag,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { Product } from "@/types";
import { useData } from "@/context/DataContext";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { calculateAverageRating, getApprovedProductReviews } from "@/lib/reviewData";

interface ProductReviewsProps {
  product: Product;
}

export const ProductReviews: React.FC<ProductReviewsProps> = ({ product }) => {
  const { reviews, products, addReview, likeReview } = useData();
  const { loc } = useLanguage();
  const { user } = useAuth();
  const router = useRouter();

  // Active filters & sorting
  const [selectedStar, setSelectedStar] = useState<number | "all">("all");
  const [sortBy, setSortBy] = useState<"newest" | "helpful" | "ratingHigh" | "ratingLow">("newest");
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [likedReviews, setLikedReviews] = useState<Record<string, boolean>>({});

  // Modals state
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    authorName: "",
    rating: 5,
    title: "",
    comment: "",
    images: [] as string[],
    videos: [] as string[],
  });
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [uploadCount, setUploadCount] = useState(0);
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    if (!lightboxImage && !isWriteModalOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [lightboxImage, isWriteModalOpen]);

  // Approved reviews for the product family (parent and all variants)
  const productReviews = useMemo(() => {
    return getApprovedProductReviews(reviews, product, products);
  }, [reviews, product, products]);

  // Statistics
  const totalCount = productReviews.length;
  const avgRating = calculateAverageRating(productReviews).toFixed(1);

  // Rating distribution counts
  const starCounts = useMemo(() => {
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    productReviews.forEach((r) => {
      const star = Math.min(5, Math.max(1, Math.round(r.rating))) as 1 | 2 | 3 | 4 | 5;
      counts[star] = (counts[star] || 0) + 1;
    });
    return counts;
  }, [productReviews]);

  // Filtered and sorted reviews
  const displayedReviews = useMemo(() => {
    let result = [...productReviews];

    if (selectedStar !== "all") {
      result = result.filter((r) => Math.round(r.rating) === selectedStar);
    }

    result.sort((a, b) => {
      if (sortBy === "helpful") return (b.likesCount || 0) - (a.likesCount || 0);
      if (sortBy === "ratingHigh") return b.rating - a.rating;
      if (sortBy === "ratingLow") return a.rating - b.rating;
      return 0; // Default newest
    });

    return result;
  }, [productReviews, selectedStar, sortBy]);

  const handleLike = (reviewId: string) => {
    if (likedReviews[reviewId]) return;
    likeReview(reviewId);
    setLikedReviews((prev) => ({ ...prev, [reviewId]: true }));
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploadCount > 0 || isSubmitting) return;
    setSubmitError("");
    if (!user) {
      sessionStorage.setItem("hv_return_after_login", window.location.pathname);
      router.push("/tai-khoan");
      return;
    }
    if (!formData.authorName.trim() || !formData.comment.trim()) {
      alert("Vui lòng điền họ tên và nội dung đánh giá!");
      return;
    }

    setIsSubmitting(true);
    try {
      await addReview({
        productId: product._id,
        authorName: formData.authorName,
        rating: formData.rating,
        title: formData.title || "Đánh giá sản phẩm",
        comment: formData.comment,
        verifiedPurchase: true,
        images: formData.images,
        videos: formData.videos,
      });
      setIsSubmitting(false);
      setSubmitSuccess(true);
      setTimeout(() => {
        setSubmitSuccess(false);
        setIsWriteModalOpen(false);
        setFormData({
          authorName: "",
          rating: 5,
          title: "",
          comment: "",
          images: [],
          videos: [],
        });
      }, 1200);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Không thể gửi đánh giá.");
    } finally { setIsSubmitting(false); }
  };

  const handleOpenReviewForm = () => {
    if (!user) {
      sessionStorage.setItem("hv_return_after_login", window.location.pathname);
      router.push("/tai-khoan");
      return;
    }
    setFormData((current) => ({ ...current, authorName: current.authorName || user.name }));
    setIsWriteModalOpen(true);
  };

  return (
    <div className="pt-2">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* ================= LEFT COLUMN: Rating Summary ================= */}
        <div className="lg:col-span-4 space-y-5">
          {/* Main Glowing Rating Box */}
          <div className="relative overflow-hidden rounded-3xl bg-stone-50 dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 p-6 sm:p-7 flex flex-col items-center text-center shadow-md">
            {/* Circular Warm Halo Glow */}
            <div className="relative w-40 h-40 flex flex-col items-center justify-center mb-4">
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-500/20 via-red-500/15 to-amber-400/30 blur-2xl animate-pulse pointer-events-none" />
              <div className="relative w-36 h-36 rounded-full border border-amber-400/50 dark:border-amber-500/40 bg-gradient-to-b from-white via-amber-50/40 to-white dark:from-stone-800/80 dark:via-stone-900/90 dark:to-stone-950 flex flex-col items-center justify-center shadow-inner shadow-amber-500/20">
                <span className="text-4xl sm:text-5xl font-black text-stone-900 dark:text-white tracking-tight">
                  {avgRating}
                </span>
                <div className="flex items-center gap-1 text-amber-500 dark:text-amber-400 mt-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={15} fill="currentColor" />
                  ))}
                </div>
              </div>
            </div>

            <p className="text-xs text-stone-500 dark:text-stone-400 font-medium mb-6">
              Dựa trên {totalCount} đánh giá thực tế
            </p>

            {/* Star Distribution Progress Bars */}
            <div className="w-full space-y-2.5">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = starCounts[star as 1 | 2 | 3 | 4 | 5] || 0;
                const percentage =
                  totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;

                return (
                  <button
                    key={star}
                    onClick={() => setSelectedStar(selectedStar === star ? "all" : star)}
                    className={`w-full flex items-center gap-2.5 text-xs font-bold transition-opacity hover:opacity-80 ${
                      selectedStar === star ? "text-amber-600 dark:text-amber-400" : "text-stone-600 dark:text-stone-400"
                    }`}
                  >
                    <span className="w-6 text-right flex items-center justify-end gap-1">
                      <span>{star}</span>
                      <Star size={11} fill="currentColor" className="text-amber-500 dark:text-amber-400" />
                    </span>

                    <div className="flex-1 h-2 rounded-full bg-stone-200 dark:bg-stone-800 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="h-full rounded-full bg-gradient-to-r from-red-600 to-amber-500"
                      />
                    </div>

                    <span className="w-16 text-right text-[11px] text-stone-500 dark:text-stone-400 font-mono">
                      {percentage}% ({count})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2 Stat Highlights */}
          <div className="grid grid-cols-2 gap-3.5">
            <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 flex flex-col items-center text-center space-y-1">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 mb-1">
                <ShieldCheck size={22} className="stroke-[2.2]" />
              </div>
              <span className="text-lg font-black text-amber-600 dark:text-amber-400">100%</span>
              <span className="text-[11px] text-stone-600 dark:text-stone-400 font-medium">
                Khách hàng hài lòng
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 flex flex-col items-center text-center space-y-1">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 mb-1">
                <ShoppingBag size={22} className="stroke-[2.2]" />
              </div>
              <span className="text-lg font-black text-amber-600 dark:text-amber-400">{totalCount}</span>
              <span className="text-[11px] text-stone-600 dark:text-stone-400 font-medium">
                Đánh giá đã xác thực
              </span>
            </div>
          </div>

          {/* Write a Review CTA Card */}
          <div className="p-5 sm:p-6 rounded-3xl bg-stone-50 dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 text-center space-y-3.5 shadow-md">
            <h4 className="font-extrabold text-sm sm:text-base text-stone-900 dark:text-white">
              Bạn đã sử dụng sản phẩm này?
            </h4>
            <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
              Chia sẻ trải nghiệm của bạn để giúp người khác lựa chọn tốt hơn.
            </p>
            <button
              onClick={handleOpenReviewForm}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-red-700 via-red-800 to-amber-600 hover:from-red-800 hover:to-amber-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-red-900/30 active:scale-[0.98] transition-all"
            >
              <PenSquare size={16} />
              <span>{user ? "Viết đánh giá" : "Đăng nhập để đánh giá"}</span>
            </button>
          </div>
        </div>

        {/* ================= RIGHT COLUMN: Review Filters & List ================= */}
        <div className="lg:col-span-8 space-y-4">
          {/* Top Filter Bar */}
          <div className="p-3 sm:p-4 rounded-2xl bg-stone-50 dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 flex flex-wrap items-center justify-between gap-3 shadow-xs">
            {/* Left: Star Filter Pills */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setSelectedStar("all")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedStar === "all"
                    ? "bg-red-700 text-white shadow-sm"
                    : "bg-stone-200/70 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-300/80 dark:hover:bg-stone-700/80"
                }`}
              >
                Tất cả đánh giá ({totalCount})
              </button>

              {[5, 4, 3, 2, 1].map((star) => (
                <button
                  key={star}
                  onClick={() => setSelectedStar(star)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                    selectedStar === star
                      ? "bg-red-700 text-white shadow-sm"
                      : "bg-stone-200/70 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-300/80 dark:hover:bg-stone-700/80"
                  }`}
                >
                  <span>{star}</span>
                  <Star size={11} fill="currentColor" className="text-amber-500 dark:text-amber-400" />
                </button>
              ))}
            </div>

            {/* Right: Sort Select */}
            <div className="relative">
              <button
                onClick={() => setIsSortOpen(!isSortOpen)}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-stone-200/70 dark:bg-stone-800 text-xs font-bold text-stone-800 dark:text-stone-200 hover:bg-stone-300/80 dark:hover:bg-stone-700/80 transition-colors"
              >
                <span>
                  {sortBy === "newest"
                    ? "Mới nhất"
                    : sortBy === "helpful"
                    ? "Hữu ích nhất"
                    : sortBy === "ratingHigh"
                    ? "Đánh giá cao"
                    : "Đánh giá thấp"}
                </span>
                <ChevronDown size={13} className="text-stone-500 dark:text-stone-400" />
              </button>

              <AnimatePresence>
                {isSortOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="absolute right-0 top-full mt-1.5 w-40 z-30 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-1 shadow-2xl space-y-0.5"
                  >
                    {([
                      { value: "newest", label: "Mới nhất" },
                      { value: "helpful", label: "Hữu ích nhất" },
                      { value: "ratingHigh", label: "Đánh giá cao" },
                      { value: "ratingLow", label: "Đánh giá thấp" },
                    ] as const).map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => {
                          setSortBy(opt.value);
                          setIsSortOpen(false);
                        }}
                        className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                          sortBy === opt.value
                            ? "bg-red-700 text-white"
                            : "text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Review List */}
          <div className="space-y-4">
            {displayedReviews.length === 0 ? (
              <div className="p-12 text-center rounded-3xl bg-stone-50 dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 text-stone-500 dark:text-stone-400 text-xs sm:text-sm">
                Chưa có đánh giá nào cho mức lọc này.
              </div>
            ) : (
              displayedReviews.map((rev) => {
                const isLiked = likedReviews[rev._id];
                const likes = (rev.likesCount || 0) + (isLiked ? 1 : 0);

                return (
                  <motion.div
                    key={rev._id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-5 sm:p-6 rounded-3xl bg-stone-50 dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 shadow-xs space-y-3.5"
                  >
                    {/* Author & Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {/* Avatar */}
                        {rev.authorAvatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={rev.authorAvatar}
                            alt={rev.authorName}
                            className="w-10 h-10 rounded-full object-cover border border-amber-500/30"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-red-700 to-amber-600 flex items-center justify-center text-white font-bold text-sm shadow-xs">
                            {rev.authorName.charAt(0)}
                          </div>
                        )}

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-extrabold text-sm sm:text-base text-stone-900 dark:text-white">
                              {rev.authorName}
                            </span>
                            {rev.verifiedPurchase && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-500/30 px-2 py-0.5 rounded-full">
                                <CheckCircle2 size={11} />
                                <span>Đã mua hàng</span>
                              </span>
                            )}
                          </div>

                          {/* Star Rating */}
                          <div className="flex items-center gap-1 text-amber-500 dark:text-amber-400 mt-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                size={13}
                                fill={i < rev.rating ? "currentColor" : "none"}
                                className={i < rev.rating ? "text-amber-500 dark:text-amber-400" : "text-stone-300 dark:text-stone-700"}
                              />
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Date & 3 dots */}
                      <div className="flex items-center gap-2 text-stone-500 dark:text-stone-400 text-xs">
                        <span>{rev.date}</span>
                        <div className="relative">
                          <button
                            onClick={() =>
                              setActionMenuOpen(actionMenuOpen === rev._id ? null : rev._id)
                            }
                            className="p-1 text-stone-500 hover:text-stone-900 dark:hover:text-white transition-colors"
                          >
                            <MoreVertical size={16} />
                          </button>
                          {actionMenuOpen === rev._id && (
                            <div className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl p-1 shadow-xl z-20 space-y-1">
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(window.location.href);
                                  alert("Đã sao chép liên kết đánh giá!");
                                  setActionMenuOpen(null);
                                }}
                                className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 flex items-center gap-2"
                              >
                                <Share2 size={13} />
                                <span>Chia sẻ</span>
                              </button>
                              <button
                                onClick={() => {
                                  alert("Cảm ơn bạn đã báo cáo. Ban quản trị sẽ kiểm duyệt!");
                                  setActionMenuOpen(null);
                                }}
                                className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-stone-100 dark:hover:bg-stone-700 flex items-center gap-2"
                              >
                                <Flag size={13} />
                                <span>Báo cáo</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Review Title & Content */}
                    <div className="space-y-1.5">
                      {rev.title && (
                        <h5 className="font-extrabold text-sm sm:text-base text-stone-900 dark:text-white">
                          {rev.title}
                        </h5>
                      )}
                      <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed whitespace-pre-line">
                        {rev.comment}
                      </p>
                    </div>

                    {/* Customer Review Photos (with lightbox zoom) */}
                    {rev.images && rev.images.length > 0 && (
                      <div className="flex items-center gap-2.5 pt-1 overflow-x-auto pb-1">
                        {rev.images.map((img, idx) => (
                          <button
                            key={idx}
                            onClick={() => setLightboxImage(img)}
                            className="relative group shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border border-stone-200 dark:border-stone-800 hover:border-amber-500 transition-all shadow-sm active:scale-95"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={img}
                              alt="Review attachment"
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                          </button>
                        ))}
                      </div>
                    )}

                    {rev.videos && rev.videos.length > 0 && <div className="flex flex-wrap gap-3 pt-1">
                      {rev.videos.map((url, index) => <video key={url} src={url} controls playsInline preload="metadata" aria-label={`Video đánh giá ${index + 1}`} className="aspect-video w-full max-w-sm rounded-2xl border border-stone-200 bg-black dark:border-stone-800" />)}
                    </div>}

                    {/* Admin Response Box */}
                    {rev.adminReply && (
                      <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-50/70 dark:bg-stone-950/70 border border-amber-200/80 dark:border-stone-800 space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5 font-bold text-amber-700 dark:text-amber-400">
                            <Sparkles size={13} />
                            <span>Phản hồi từ {rev.adminReply.author}</span>
                          </div>
                          <span className="text-[11px] text-stone-500">
                            {rev.adminReply.date}
                          </span>
                        </div>
                        <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
                          {rev.adminReply.content}
                        </p>
                      </div>
                    )}

                    {/* Bottom Action: Like / Helpful */}
                    <div className="flex items-center justify-end pt-1">
                      <button
                        onClick={() => handleLike(rev._id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          isLiked
                            ? "bg-amber-100 dark:bg-amber-400/20 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-400/40 shadow-xs"
                            : "text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-200/60 dark:hover:bg-stone-800"
                        }`}
                      >
                        <ThumbsUp size={14} className={isLiked ? "fill-amber-500" : ""} />
                        <span>Hữu ích ({likes})</span>
                      </button>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ================= WRITE REVIEW MODAL ================= */}
      {typeof document !== "undefined" && createPortal(
      <AnimatePresence>
        {isWriteModalOpen && (
          <div role="dialog" aria-modal="true" aria-labelledby="write-review-title" className="fixed inset-0 z-[90] flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative flex max-h-[calc(100dvh-2rem)] min-h-0 w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl text-stone-900 dark:text-white"
            >
              <div className="relative shrink-0 border-b border-stone-200 dark:border-stone-800 p-4 pr-14 sm:p-6 sm:pr-16">
              {/* Close Button */}
              <button
                type="button"
                aria-label="Đóng đánh giá sản phẩm"
                onClick={() => setIsWriteModalOpen(false)}
                className="absolute top-5 right-5 p-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1">
                <Sparkles size={14} />
                <span>Chia Sẻ Trải Nghiệm</span>
              </div>
              <h3 id="write-review-title" className="text-xl font-black text-stone-900 dark:text-white">Đánh Giá Sản Phẩm</h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 line-clamp-2">
                {loc(product.name)}
              </p>
              </div>
              <div className="min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6">
              {submitSuccess ? (
                <div className="py-10 text-center space-y-3">
                  <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto animate-bounce">
                    <CheckCircle2 size={32} />
                  </div>
                  <h4 className="font-extrabold text-lg text-stone-900 dark:text-white">
                    Gửi Đánh Giá Thành Công!
                  </h4>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Cảm ơn bạn đã đóng góp đánh giá quý báu cho cộng đồng.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmitReview} className="space-y-4">
                  {/* Star Picker */}
                  <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 flex flex-col items-center justify-center space-y-2">
                    <span className="text-xs text-stone-500 dark:text-stone-400 font-semibold">
                      Chất lượng sản phẩm tổng thể
                    </span>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => {
                        const isFilled = (hoverRating ?? formData.rating) >= star;
                        return (
                          <button
                            key={star}
                            type="button"
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(null)}
                            onClick={() => setFormData({ ...formData, rating: star })}
                            className="p-1 text-amber-500 dark:text-amber-400 hover:scale-125 transition-transform"
                          >
                            <Star
                              size={28}
                              fill={isFilled ? "currentColor" : "none"}
                              className={isFilled ? "text-amber-500 dark:text-amber-400" : "text-stone-300 dark:text-stone-700"}
                            />
                          </button>
                        );
                      })}
                    </div>
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                      {formData.rating === 5
                        ? "Tuyệt vời (5/5)"
                        : formData.rating === 4
                        ? "Hài lòng (4/5)"
                        : formData.rating === 3
                        ? "Bình thường (3/5)"
                        : formData.rating === 2
                        ? "Chưa ưng ý (2/5)"
                        : "Rất thất vọng (1/5)"}
                    </span>
                  </div>

                  {/* Name Input */}
                  <div>
                    <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                      Họ và tên của bạn *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="vd: Nguyễn Minh Tuấn"
                      value={formData.authorName}
                      onChange={(e) =>
                        setFormData({ ...formData, authorName: e.target.value })
                      }
                      className="w-full px-4 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-white placeholder:text-stone-500 dark:placeholder:text-stone-400 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  {/* Title Input */}
                  <div>
                    <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                      Tiêu đề đánh giá
                    </label>
                    <input
                      type="text"
                      placeholder="vd: Mì cay 7 cấp độ quá ngon, giao hàng nhanh!"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      className="w-full px-4 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-white placeholder:text-stone-500 dark:placeholder:text-stone-400 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  {/* Comment Input */}
                  <div>
                    <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                      Nội dung nhận xét chi tiết *
                    </label>
                    <textarea
                      required
                      rows={3}
                      placeholder="Chia sẻ cảm nhận về hương vị, cách đóng gói, chất lượng sản phẩm..."
                      value={formData.comment}
                      onChange={(e) =>
                        setFormData({ ...formData, comment: e.target.value })
                      }
                      className="w-full px-4 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-white placeholder:text-stone-500 dark:placeholder:text-stone-400 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div><p className="mb-2 text-xs font-bold text-stone-700 dark:text-stone-300">Đính kèm ảnh chụp thực tế</p><ImageUploader target="reviews" label="Chọn ảnh của bạn" maxFiles={4} value={formData.images} onChange={images => setFormData(current => ({ ...current, images }))} setUploadCount={setUploadCount} disabled={isSubmitting || uploadCount > 0} /></div>
                  <div><p className="mb-2 text-xs font-bold text-stone-700 dark:text-stone-300">Đính kèm video thực tế (tối đa 1 video)</p><ImageUploader target="reviews" mediaType="video" label="Chọn video của bạn" value={formData.videos} onChange={videos => setFormData(current => ({ ...current, videos }))} setUploadCount={setUploadCount} disabled={isSubmitting || uploadCount > 0} /></div>
                  {submitError && <p role="alert" className="text-xs text-red-500">{submitError}</p>}
                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting || uploadCount > 0 || submitSuccess}
                      className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-red-700 to-amber-600 hover:from-red-800 hover:to-amber-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                      {uploadCount > 0 ? "Đang tải ảnh..." : isSubmitting ? "Đang gửi đánh giá..." : "Gửi Đánh Giá Ngay"}
                    </button>
                  </div>
                </form>
              )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      , document.body)}

      {/* ================= LIGHTBOX IMAGE MODAL ================= */}
      {typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {lightboxImage && (
          <div
            onClick={() => setLightboxImage(null)}
            className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-black/90 p-4 backdrop-blur-md cursor-pointer sm:p-6"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative flex max-h-[calc(100dvh-2rem)] w-fit max-w-[calc(100vw-2rem)] items-center justify-center overflow-hidden rounded-3xl border border-stone-800 bg-black shadow-2xl sm:max-h-[calc(100dvh-3rem)] sm:max-w-[min(42rem,calc(100vw-3rem))]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={lightboxImage}
                alt="Enlarged review photo"
                className="block h-auto max-h-[calc(100dvh-2rem)] w-auto max-w-full object-contain sm:max-h-[calc(100dvh-3rem)]"
              />
              <button
                onClick={() => setLightboxImage(null)}
                aria-label="Đóng ảnh phóng to"
                className="absolute right-3 top-3 z-10 rounded-full bg-black/75 p-2.5 text-white shadow-lg transition-colors hover:bg-black sm:right-4 sm:top-4"
              >
                <X size={20} />
              </button>
            </motion.div>
          </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};
