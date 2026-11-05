import { FlashSaleSection } from "@/components/home/FlashSaleSection";
export const metadata = { title: "Ưu đãi giờ vàng | Hương Vị Tuyệt Sắc" };
export default function GoldenHourPage() {
  return <div className="min-h-[60vh]"><div className="mx-auto max-w-7xl px-5 pt-12"><p className="text-sm font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">Ưu Đãi Hot</p><h1 className="mt-3 text-3xl font-black sm:text-4xl">Ưu đãi giờ vàng</h1><p className="mt-3 text-stone-500 dark:text-stone-400">Khám phá những ưu đãi đang diễn ra tại Hương Vị Tuyệt Sắc.</p></div><FlashSaleSection showEmpty /></div>;
}
