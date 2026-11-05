import Image from "next/image";

interface BrandLogoProps {
  className?: string;
  eager?: boolean;
}

/** Keep the original artwork intact; each placement controls only its display size. */
export function BrandLogo({ className = "h-14 w-14", eager = false }: BrandLogoProps) {
  return (
    <Image
      src="/brand-logo.png"
      alt="Hương Vị Tuyệt Sắc — Tinh hoa ẩm thực Việt"
      width={1280}
      height={1280}
      sizes="(max-width: 640px) 144px, 192px"
      loading={eager ? "eager" : "lazy"}
      className={`shrink-0 rounded-full bg-black object-contain ring-1 ring-amber-500/30 shadow-lg shadow-amber-950/15 ${className}`}
    />
  );
}
