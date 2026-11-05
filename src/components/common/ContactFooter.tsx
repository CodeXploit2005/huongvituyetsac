"use client";
import Link from "next/link";
import { BrandLogo } from "@/components/common/BrandLogo";
import { useState } from "react";

export function ContactFooter() {
  const [notice, setNotice] = useState("");
  return <footer className="border-t border-stone-200 bg-stone-100 px-5 py-8 text-stone-600 dark:border-white/10 dark:bg-[#0d0d0d] dark:text-stone-400"><div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-7 xl:flex-row">
    <Link href="/" className="flex items-center gap-3"><BrandLogo className="h-20 w-20" /><span><span className="block text-sm font-black text-stone-900 dark:text-white">HƯƠNG VỊ <span className="text-red-700 dark:text-amber-400">TUYỆT SẮC</span></span><span className="text-[10px]">Đậm đà chuẩn vị quê nhà</span></span></Link>
    <nav aria-label="Liên kết cuối trang" className="flex flex-wrap justify-center gap-x-3 gap-y-2 text-xs"><Link href="/">Trang chủ</Link><span>·</span><Link href="/#brand-story">Giới thiệu</Link><span>·</span><Link href="/danh-muc/all">Sản phẩm</Link><span>·</span><button onClick={() => setNotice("Tin tức đang được cập nhật.")}>Tin tức</button><span>·</span><Link href="/lien-he">Liên hệ</Link></nav>
    <div className="flex gap-3">{["Facebook", "Zalo"].map(label => <button key={label} aria-label={label} onClick={() => setNotice(`Kênh ${label} đang cập nhật. Vui lòng liên hệ qua biểu mẫu hoặc email.`)} className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-white">{label === "Facebook" ? <span className="text-xl font-black">f</span> : <span className="text-[10px] font-bold">Zalo</span>}</button>)}</div>
    <p className="text-center text-[10px] leading-5 xl:text-right">© 2025 Hương Vị Tuyệt Sắc.<br />All rights reserved.</p>
  </div><p role="status" className="mx-auto mt-3 max-w-6xl text-center text-xs">{notice}</p></footer>;
}

