"use client";

import React from "react";
import { HeroBannerSlider } from "@/components/home/HeroBannerSlider";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { FlashSaleSection } from "@/components/home/FlashSaleSection";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { BrandStory } from "@/components/home/BrandStory";
import { CustomerReviews } from "@/components/home/CustomerReviews";

export default function HomePage() {
  return (
    <div className="space-y-4">
      <HeroBannerSlider />
      <CategoryGrid />
      <FlashSaleSection />
      <FeaturedProducts />
      <BrandStory />
      <CustomerReviews />
    </div>
  );
}
