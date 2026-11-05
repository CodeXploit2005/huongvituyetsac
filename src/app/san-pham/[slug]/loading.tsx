export default function ProductDetailLoading() {
  return (
    <div className="min-h-screen bg-stone-50 pb-20 dark:bg-stone-950" role="status" aria-label="Đang tải chi tiết sản phẩm">
      <div className="border-b border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900">
        <div className="mx-auto h-11 max-w-7xl animate-pulse px-4 py-3 motion-reduce:animate-none sm:px-6 lg:px-8">
          <div className="h-4 w-52 rounded-full bg-stone-200 dark:bg-stone-800" />
        </div>
      </div>
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-2 lg:gap-14 lg:px-8 lg:py-12">
        <div className="aspect-square animate-pulse rounded-[28px] bg-gradient-to-br from-stone-200 via-stone-100 to-stone-200 motion-reduce:animate-none dark:from-stone-800 dark:via-stone-900 dark:to-stone-800" />
        <div className="space-y-6 pt-2">
          <div className="h-7 w-28 animate-pulse rounded-full bg-red-100 motion-reduce:animate-none dark:bg-red-950" />
          <div className="space-y-3">
            <div className="h-10 w-5/6 animate-pulse rounded-xl bg-stone-200 motion-reduce:animate-none dark:bg-stone-800" />
            <div className="h-5 w-2/5 animate-pulse rounded-lg bg-stone-200 motion-reduce:animate-none dark:bg-stone-800" />
          </div>
          <div className="h-28 animate-pulse rounded-3xl bg-stone-200 motion-reduce:animate-none dark:bg-stone-900" />
          <div className="h-14 animate-pulse rounded-2xl bg-stone-200 motion-reduce:animate-none dark:bg-stone-900" />
          <div className="grid grid-cols-2 gap-3 pt-3">
            <div className="h-16 animate-pulse rounded-2xl bg-stone-200 motion-reduce:animate-none dark:bg-stone-800" />
            <div className="h-16 animate-pulse rounded-2xl bg-gradient-to-r from-red-200 to-amber-200 motion-reduce:animate-none dark:from-red-950 dark:to-amber-950" />
          </div>
        </div>
      </div>
      <span className="sr-only">Đang tải sản phẩm...</span>
    </div>
  );
}
