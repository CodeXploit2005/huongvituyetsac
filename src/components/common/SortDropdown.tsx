"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";

export interface SortOptionItem {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface SortDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options?: SortOptionItem[];
  className?: string;
  labelPrefix?: string;
}

export const SortDropdown: React.FC<SortDropdownProps> = ({
  value,
  onChange,
  options,
  className = "",
  labelPrefix,
}) => {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const defaultOptions: SortOptionItem[] = [
    { value: "featured", label: t("sortOptions.featured") },
    { value: "priceAsc", label: t("sortOptions.priceAsc") },
    { value: "priceDesc", label: t("sortOptions.priceDesc") },
    { value: "rating", label: t("sortOptions.rating") },
    { value: "newest", label: t("sortOptions.newest") },
  ];

  const items = options || defaultOptions;
  const currentOption = items.find((item) => item.value === value) || items[0];

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  return (
    <div ref={dropdownRef} className={`relative inline-block text-left ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        suppressHydrationWarning
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`group flex items-center justify-between gap-3 px-3.5 py-2 sm:py-2.5 rounded-2xl bg-white dark:bg-stone-900 border text-xs font-bold transition-all shadow-xs active:scale-[0.98] ${
          isOpen
            ? "border-red-600 dark:border-amber-400 ring-2 ring-red-500/20 dark:ring-amber-400/20 text-stone-900 dark:text-white"
            : "border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200 hover:border-amber-500/70 hover:shadow-md"
        }`}
      >
        <span className="flex min-w-0 items-center gap-2.5">
          {currentOption?.icon && (
            <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700 transition-colors group-hover:bg-amber-200 dark:bg-amber-400/10 dark:text-amber-300 dark:group-hover:bg-amber-400/20">
              {currentOption.icon}
            </span>
          )}
          <span className="truncate">
            {labelPrefix ? `${labelPrefix} ` : ""}
            {currentOption ? currentOption.label : t("sortBy")}
          </span>
        </span>

        <ChevronDown
          size={14}
          className={`text-stone-400 group-hover:text-stone-700 dark:group-hover:text-stone-200 transition-transform duration-200 shrink-0 ${
            isOpen ? "rotate-180 text-red-600 dark:text-amber-400" : ""
          }`}
        />
      </button>

      {/* Popover Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            role="listbox"
            className="absolute right-0 top-full mt-2 min-w-full w-max max-w-[min(320px,calc(100vw-2rem))] z-50 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md rounded-2xl border border-stone-200 dark:border-stone-800 p-1.5 shadow-2xl space-y-0.5 origin-top-right"
          >
            {items.map((option) => {
              const isSelected = option.value === value;

              return (
                <button
                  key={option.value}
                  type="button"
                  suppressHydrationWarning
                  role="option"
                  aria-selected={isSelected}
                  title={option.label}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`group/option relative w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 text-left outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40 ${
                    isSelected
                      ? "bg-linear-to-r from-amber-50 to-orange-50 text-amber-900 shadow-xs ring-1 ring-amber-200/70 dark:from-amber-400/15 dark:to-orange-400/8 dark:text-amber-200 dark:ring-amber-400/20"
                      : "text-stone-700 hover:translate-x-0.5 hover:bg-stone-100 hover:text-stone-950 dark:text-stone-300 dark:hover:bg-stone-800/80 dark:hover:text-white"
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    {option.icon && (
                      <span className={`flex size-7 shrink-0 items-center justify-center rounded-lg transition-all duration-200 ${
                        isSelected
                          ? "bg-white/80 text-amber-700 shadow-sm dark:bg-amber-300/10 dark:text-amber-300"
                          : "bg-stone-100 text-stone-500 group-hover/option:bg-white group-hover/option:text-amber-700 group-hover/option:shadow-sm dark:bg-stone-800 dark:text-stone-400 dark:group-hover/option:bg-stone-700 dark:group-hover/option:text-amber-300"
                      }`}>
                        {option.icon}
                      </span>
                    )}
                    <span className="min-w-0 whitespace-normal break-words leading-5">
                      {option.label}
                    </span>
                  </span>

                  {isSelected && (
                    <Check
                      size={14}
                      className="text-red-700 dark:text-amber-400 shrink-0 stroke-[2.5]"
                    />
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
