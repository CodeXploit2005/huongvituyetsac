import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/context/ThemeContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { DataProvider } from "@/context/DataContext";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import { Header } from "@/components/common/Header";
import { Footer } from "@/components/common/Footer";
import { CartDrawer } from "@/components/common/CartDrawer";
import { FlyToCartEffect } from "@/components/common/FlyToCartEffect";
import { MobileBottomNav } from "@/components/common/MobileBottomNav";
import { AuthTransitionOverlay } from "@/components/common/AuthTransitionOverlay";

export const metadata: Metadata = {
  icons: { icon: "/brand-logo.png", shortcut: "/brand-logo.png", apple: "/brand-logo.png" },
  title: "Hương Vị Tuyệt Sắc | Nước Mắm Truyền Thống, Mì Gói Đặc Sản & Gia Vị Quê Nhà",
  description:
    "Thương hiệu chuyên cung cấp nước mắm cốt nhĩ truyền thống Cà Ná Phú Quốc, Mì Cay Hải Sản Seoul 7 cấp độ 6 gói gia vị Làng Chài Xưa, Gia vị kho nấu đậm đà và Sốt tiện lợi cao cấp.",
  keywords: [
    "Hương Vị Tuyệt Sắc",
    "Nước mắm Cà Ná",
    "Nước mắm truyền thống",
    "Mì cay 7 cấp độ",
    "Mì cay Làng Chài Xưa",
    "Nước màu dừa",
    "Muối ớt xanh Nha Trang",
    "Gia vị kho cá",
  ],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#8B1E1E" },
    { media: "(prefers-color-scheme: dark)", color: "#120D0D" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning data-scroll-behavior="smooth">
      <body className="min-h-screen flex flex-col antialiased selection:bg-amber-200 selection:text-stone-950 dark:selection:bg-amber-400/30 dark:selection:text-amber-100 pb-14 lg:pb-0">
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              <DataProvider>
                <CartProvider>
                  <Header />
                  <main className="flex-1">{children}</main>
                  <Footer />
                  <CartDrawer />
                  <FlyToCartEffect />
                  <MobileBottomNav />
                  <AuthTransitionOverlay />
                </CartProvider>
              </DataProvider>
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
