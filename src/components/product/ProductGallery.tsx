"use client";

import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { Play, Volume2, VolumeX, Maximize2, X, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ProductGalleryProps {
  images: string[];
  videos?: string[];
  videoPoster?: string;
  productName: string;
}

export const ProductGallery: React.FC<ProductGalleryProps> = ({
  images,
  videos = [],
  videoPoster,
  productName,
}) => {
  const hasVideo = videos.length > 0;
  // If video exists, index 0 is video; then index 1..N are images
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  // Desktop Lens Zoom state
  const [isHovering, setIsHovering] = useState(false);
  const [lensPosition, setLensPosition] = useState({ x: 0, y: 0, bgX: 0, bgY: 0 });
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Mobile Fullscreen Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalIndex, setModalIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [zoomScale, setZoomScale] = useState(1);
  const lastTapRef = useRef<number>(0);

  useEffect(() => {
    if (!isModalOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isModalOpen]);

  const isCurrentItemVideo = hasVideo && selectedIndex === 0;

  // Handle Desktop Magnify Lens
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isCurrentItemVideo || !imageContainerRef.current) return;

    const { left, top, width, height } = imageContainerRef.current.getBoundingClientRect();
    const x = e.clientX - left;
    const y = e.clientY - top;

    // Constrain within box
    const clampedX = Math.max(0, Math.min(x, width));
    const clampedY = Math.max(0, Math.min(y, height));

    const bgX = (clampedX / width) * 100;
    const bgY = (clampedY / height) * 100;

    setLensPosition({ x: clampedX, y: clampedY, bgX, bgY });
  };

  // Mobile Swipe Handlers for Modal
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setTouchStart(e.touches[0].clientX);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart || zoomScale > 1) return;
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;

    if (diff > 50) {
      // Swipe left -> Next image
      setModalIndex((prev) => (prev + 1) % images.length);
    } else if (diff < -50) {
      // Swipe right -> Prev image
      setModalIndex((prev) => (prev - 1 + images.length) % images.length);
    }
    setTouchStart(null);
  };

  // Double tap to zoom toggle
  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      setZoomScale((prev) => (prev === 1 ? 2.2 : 1));
    }
    lastTapRef.current = now;
  };

  const activeImageSrc = hasVideo
    ? selectedIndex === 0
      ? videoPoster || images[0]
      : images[selectedIndex - 1]
    : images[selectedIndex];

  return (
    <div className="w-full space-y-4">
      {/* Main Showcase Container */}
      <div
        ref={imageContainerRef}
        onMouseEnter={() => !isCurrentItemVideo && setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onMouseMove={handleMouseMove}
        onClick={() => {
          if (!isCurrentItemVideo) {
            setModalIndex(hasVideo ? Math.max(0, selectedIndex - 1) : selectedIndex);
            setIsModalOpen(true);
          }
        }}
        className="relative aspect-square w-full rounded-3xl overflow-hidden bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-lg cursor-crosshair select-none"
      >
        {isCurrentItemVideo ? (
          // Video Player in Main Frame
          <div className="relative w-full h-full bg-black flex items-center justify-center">
            <video
              ref={videoRef}
              src={videos[0]}
              poster={videoPoster || images[0]}
              autoPlay
              muted={isMuted}
              loop
              playsInline
              className="w-full h-full object-contain"
            />

            {/* Video Controls Bar */}
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between p-2 rounded-2xl bg-black/60 backdrop-blur-md text-white">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (videoRef.current) {
                    if (videoRef.current.paused) {
                      videoRef.current.play();
                      setIsVideoPlaying(true);
                    } else {
                      videoRef.current.pause();
                      setIsVideoPlaying(false);
                    }
                  }
                }}
                className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
              >
                <Play size={16} fill={isVideoPlaying ? "currentColor" : "none"} />
              </button>

              <span className="text-xs font-semibold px-2">Video Giới Thiệu Sản Phẩm</span>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMuted(!isMuted);
                }}
                className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
              >
                {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
            </div>
          </div>
        ) : (
          // Main Image Display
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activeImageSrc}
              alt={productName}
              className="w-full h-full object-cover transition-opacity duration-300"
            />

            {/* Magnifier Lens Window (Desktop Hover) */}
            {isHovering && (
              <div
                className="hidden lg:block absolute inset-0 pointer-events-none z-20 overflow-hidden border-2 border-amber-500 rounded-3xl"
                style={{
                  backgroundImage: `url(${activeImageSrc})`,
                  backgroundPosition: `${lensPosition.bgX}% ${lensPosition.bgY}%`,
                  backgroundSize: "250%",
                  backgroundRepeat: "no-repeat",
                }}
              />
            )}

            {/* Fullscreen Button Icon */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setModalIndex(hasVideo ? Math.max(0, selectedIndex - 1) : selectedIndex);
                setIsModalOpen(true);
              }}
              className="absolute top-3 right-3 p-2 rounded-full bg-white/80 dark:bg-stone-900/80 hover:bg-white dark:hover:bg-stone-900 text-stone-700 dark:text-stone-200 shadow-md backdrop-blur-xs transition-colors z-10"
              title="Phóng to ảnh"
            >
              <Maximize2 size={16} />
            </button>
          </>
        )}
      </div>

      {/* Shopee-style Thumbnail Strip */}
      <div className="flex max-w-full items-center gap-3 overflow-x-auto px-1 pb-2 pt-1 scrollbar-none">
        {/* Video Thumbnail (Item 0 if available) */}
        {hasVideo && (
          <button
            type="button"
            onClick={() => setSelectedIndex(0)}
            className={`relative shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 transition-all ${
              selectedIndex === 0
                ? "border-red-600 ring-2 ring-red-500/40 scale-105"
                : "border-stone-200 dark:border-stone-800 opacity-70 hover:opacity-100"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={videoPoster || images[0]}
              alt="Video Preview"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white">
              <div className="w-7 h-7 rounded-full bg-red-600/90 flex items-center justify-center shadow-md">
                <Play size={13} fill="currentColor" />
              </div>
            </div>
            <span className="absolute bottom-1 left-0 right-0 text-[9px] font-bold text-center text-white bg-black/60 py-0.5">
              VIDEO
            </span>
          </button>
        )}

        {/* Image Thumbnails */}
        {images.map((img, idx) => {
          const itemIndex = hasVideo ? idx + 1 : idx;
          const isSelected = selectedIndex === itemIndex;

          return (
            <button
              key={img + idx}
              type="button"
              onClick={() => setSelectedIndex(itemIndex)}
              className={`relative shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 transition-all ${
                isSelected
                  ? "border-red-600 ring-2 ring-red-500/40 scale-105"
                  : "border-stone-200 dark:border-stone-800 opacity-70 hover:opacity-100"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img}
                alt={`${productName} thumbnail ${idx + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          );
        })}
      </div>

      {/* Mobile/Full-Screen Zoom Modal */}
      {typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex h-[100dvh] w-screen flex-col justify-between overflow-hidden bg-black/95 p-4 select-none touch-none"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {/* Top Modal Bar with Counter and Close Button */}
            <div className="flex items-center justify-between text-white pt-2 px-2 z-20">
              <span className="text-sm font-bold bg-white/20 px-3 py-1 rounded-full backdrop-blur-md">
                {modalIndex + 1} / {images.length}
              </span>

              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setZoomScale(1);
                }}
                className="p-2.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
              >
                <X size={22} />
              </button>
            </div>

            {/* Modal Image with Pinch/Double-tap Zoom */}
            <div
              onClick={handleDoubleTap}
              className="relative flex-1 flex items-center justify-center overflow-hidden"
            >
              <motion.img
                key={modalIndex}
                src={images[modalIndex]}
                alt={productName}
                animate={{ scale: zoomScale }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="max-h-[80vh] max-w-full object-contain cursor-zoom-in"
              />
            </div>

            {/* Bottom Modal Navigation */}
            <div className="flex items-center justify-center gap-6 pb-4 text-white z-20">
              <button
                onClick={() =>
                  setModalIndex((prev) => (prev - 1 + images.length) % images.length)
                }
                className="p-3 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              >
                <ChevronLeft size={24} />
              </button>
              <span className="text-xs text-stone-400">
                Chạm đúp để phóng to • Vuốt để chuyển ảnh
              </span>
              <button
                onClick={() => setModalIndex((prev) => (prev + 1) % images.length)}
                className="p-3 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              >
                <ChevronRight size={24} />
              </button>
            </div>
          </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};
