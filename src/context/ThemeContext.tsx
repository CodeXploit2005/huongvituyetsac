"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

function applyTheme(targetTheme: Theme) {
    const root = document.documentElement;
    root.classList.toggle("dark", targetTheme === "dark");
    root.style.colorScheme = targetTheme;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>("light");

  useEffect(() => {
    // 1. Check localStorage first
    const savedTheme = localStorage.getItem("hv_theme") as Theme | null;
    if (savedTheme === "light" || savedTheme === "dark") {
      // Restore the browser preference after hydration.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setThemeState(savedTheme);
      applyTheme(savedTheme);
    } else {
      // 2. Detect system preference
      const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const initial = systemPrefersDark ? "dark" : "light";
      setThemeState(initial);
      applyTheme(initial);
    }
  }, []);



  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem("hv_theme", newTheme);
    applyTheme(newTheme);
  };

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
