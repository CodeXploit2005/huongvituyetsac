"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { translations } from "@/data/translations";
import { MultilingualText } from "@/types";

export type Language = "vi" | "en";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (keyPath: string, params?: Record<string, string | number>) => string;
  loc: (textObj?: MultilingualText | { vi: string; en: string } | string | null) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>("vi");

  useEffect(() => {
    const saved = localStorage.getItem("hv_lang") as Language | null;
    if (saved === "vi" || saved === "en") {
      // Restore browser preferences after hydration to match the server snapshot.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("hv_lang", lang);
  };

  const toggleLanguage = () => {
    const nextLang = language === "vi" ? "en" : "vi";
    setLanguage(nextLang);
  };

  /**
   * Helper to look up translation by dot-notation key (e.g. "productTabs.description")
   */
  const t = (keyPath: string, params?: Record<string, string | number>): string => {
    const dict = translations[language];
    const keys = keyPath.split(".");
    let current: unknown = dict;

    for (const k of keys) {
      if (current && typeof current === "object" && k in current) {
        current = (current as Record<string, unknown>)[k];
      } else {
        // Fallback to Vietnamese if key not found in English
        let fallback: unknown = translations.vi;
        for (const fbKey of keys) {
          if (fallback && typeof fallback === "object" && fbKey in fallback) {
            fallback = (fallback as Record<string, unknown>)[fbKey];
          } else {
            fallback = keyPath;
            break;
          }
        }
        current = fallback;
        break;
      }
    }

    let result = typeof current === "string" ? current : keyPath;

    if (params) {
      Object.entries(params).forEach(([paramKey, paramVal]) => {
        result = result.replace(new RegExp(`\\{${paramKey}\\}`, "g"), String(paramVal));
      });
    }

    return result;
  };

  /**
   * Helper to extract localized string from MultilingualText object
   */
  const loc = (textObj?: MultilingualText | { vi: string; en: string } | string | null): string => {
    if (!textObj) return "";
    if (typeof textObj === "string") return textObj;
    return textObj[language] || textObj.vi || textObj.en || "";
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t, loc }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
