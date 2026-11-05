"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useData } from "@/context/DataContext";
import { useLanguage } from "@/context/LanguageContext";

export const HeroBannerSlider: React.FC = () => {
  const { banners } = useData();
  const { loc } = useLanguage();
  const activeBanners = banners.filter((b) => b.isActive).sort((a, b) => a.order - b.order);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  // Auto-play every 4.5s
  useEffect(() => {
    if (isPaused || activeBanners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [isPaused, activeBanners.length]);

  if (activeBanners.length === 0) return null;

  const currentBanner = activeBanners[currentIndex % activeBanners.length];

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + activeBanners.length) % activeBanners.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
  };

  // Touch Swipe for Mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;

    if (diff > 50) {
      handleNext();
    } else if (diff < -50) {
      handlePrev();
    }
    touchStartX.current = null;
  };

  return (
    <section
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="relative w-full h-[360px] sm:h-[480px] md:h-[560px] lg:h-[620px] overflow-hidden bg-stone-950 select-none"
    >
        <div
          key={currentBanner._id}
          className="hero-slide absolute inset-0"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentBanner.image}
            alt={loc(currentBanner.title)}
            className="absolute inset-0 w-full h-full object-cover object-center"
          />

        </div>

      {/* Navigation Arrows */}
      <button
        onClick={handlePrev}
        aria-label="Previous Slide"
        className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-md text-white flex items-center justify-center transition-all duration-200 ease-out hover:scale-110 active:scale-95 shadow-lg z-20 transform-gpu cursor-pointer"
      >
        <ChevronLeft size={22} />
      </button>

      <button
        onClick={handleNext}
        aria-label="Next Slide"
        className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-md text-white flex items-center justify-center transition-all duration-200 ease-out hover:scale-110 active:scale-95 shadow-lg z-20 transform-gpu cursor-pointer"
      >
        <ChevronRight size={22} />
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-5 sm:bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
        {activeBanners.map((banner, idx) => (
          <button
            key={banner._id}
            onClick={() => setCurrentIndex(idx)}
            aria-label={`Go to slide ${idx + 1}`}
            className={`transition-all duration-300 rounded-full ${
              idx === currentIndex % activeBanners.length
                ? "w-8 sm:w-10 h-2 sm:h-2.5 bg-amber-400 shadow-md"
                : "w-2 sm:w-2.5 h-2 sm:h-2.5 bg-white/50 hover:bg-white"
            }`}
          />
        ))}
      </div>
    </section>
  );
};
