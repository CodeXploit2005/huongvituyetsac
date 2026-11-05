"use client";

import React, { useSyncExternalStore } from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";

const subscribe = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;

interface ThemeToggleProps {
  showLabel?: boolean;
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  showLabel = true,
  className = "",
}) => {
  const { theme, toggleTheme } = useTheme();
  const { t } = useLanguage();
  const mounted = useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);

  if (!mounted) {
    // Return placeholder with matching dimensions to prevent SSR mismatch
    return (
      <div className={`h-8 w-20 sm:w-24 rounded-full bg-stone-200 dark:bg-stone-800 animate-pulse ${className}`} />
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? t("switchToLight") : t("switchToDark")}
      title={isDark ? t("switchToLight") : t("switchToDark")}
      aria-pressed={isDark}
      className={`group relative flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-black transition-all duration-300 active:scale-95 cursor-pointer select-none shadow-md ${
        isDark
          ? "bg-gradient-to-r from-stone-900 via-stone-800 to-black text-amber-300 border border-amber-500/50 hover:border-amber-400 shadow-amber-950/40 hover:shadow-amber-500/20"
          : "bg-gradient-to-r from-amber-100 via-orange-50 to-amber-50 text-stone-900 border border-amber-300/90 hover:border-amber-400 shadow-stone-300/40 hover:shadow-amber-200/50"
      } ${className}`}
    >
      {/* Icon Badge with gentle rotational micro-animation */}
      <div
        className={`w-5 h-5 rounded-full flex items-center justify-center transition-transform duration-500 ease-out transform-gpu group-hover:scale-115 ${
          isDark
            ? "bg-amber-400 text-stone-950 shadow-sm shadow-amber-400/50 group-hover:rotate-45"
            : "bg-gradient-to-tr from-red-700 to-amber-600 text-white shadow-xs group-hover:-rotate-20"
        }`}
      >
        {isDark ? (
          <Sun size={12} className="stroke-[2.5]" />
        ) : (
          <Moon size={12} className="stroke-[2.5]" />
        )}
      </div>

      {/* High Contrast Multilingual Label */}
      {showLabel && (
        <span
          className={`font-black text-[11px] sm:text-xs tracking-wide transition-colors ${
            isDark
              ? "text-amber-300 group-hover:text-amber-200"
              : "text-stone-900 group-hover:text-red-700"
          }`}
        >
          {isDark ? t("lightMode") : t("darkMode")}
        </span>
      )}
    </button>
  );
};
