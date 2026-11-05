"use client";

import React from "react";
import { Star, MessageSquareQuote, CheckCircle2 } from "lucide-react";
import { useData } from "@/context/DataContext";

export const CustomerReviews: React.FC = () => {
  const { reviews } = useData();
  const visibleReviews = reviews.filter(
    (review) => (review.status || "approved") === "approved"
  );

  return (
    <section className="py-12 sm:py-16 bg-stone-50/60 dark:bg-[#120d0d] border-t border-stone-200 dark:border-stone-800/80 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-widest mb-1.5">
            <Star size={14} fill="currentColor" />
            <span>Khách Hàng Nói Về Chúng Tôi</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-white">
            Trải Nghiệm <span className="text-red-700 dark:text-amber-400">Vị Ngon Chuẩn Vị</span>
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 mt-2 font-medium">
            Hơn 50.000+ bữa cơm gia đình Việt đã đồng hành cùng Hương Vị Tuyệt Sắc mỗi ngày.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {visibleReviews.map((rev) => (
            <div
              key={rev._id}
              className="p-6 rounded-3xl bg-white dark:bg-stone-900/90 border border-stone-200/90 dark:border-stone-800 shadow-xs flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex text-amber-400">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} size={14} fill="currentColor" />
                    ))}
                  </div>
                  <MessageSquareQuote size={20} className="text-amber-400/40 dark:text-stone-700" />
                </div>

                <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed italic">
                  &ldquo;{rev.comment}&rdquo;
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs">
                <div>
                  <h4 className="font-bold text-stone-900 dark:text-stone-100">
                    {rev.authorName}
                  </h4>
                  <span className="text-[11px] text-stone-500 dark:text-stone-400">{rev.date}</span>
                </div>

                {rev.verifiedPurchase && (
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 size={13} />
                    <span>Đã mua</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
