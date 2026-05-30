"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Theme = "dark" | "light";

type ThemeContextValue = {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggle: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = "3m-theme";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");

  // Initial sync from storage / system. Runs once on mount.
  useEffect(() => {
    const stored = typeof window !== "undefined" ? (localStorage.getItem(STORAGE_KEY) as Theme | null) : null;
    const initial: Theme = stored === "light" || stored === "dark" ? stored : "dark";
    setThemeState(initial);
    document.documentElement.setAttribute("data-theme", initial);
  }, []);

  function setTheme(t: Theme) {
    setThemeState(t);
    document.documentElement.setAttribute("data-theme", t);
    try {
      localStorage.setItem(STORAGE_KEY, t);
    } catch {}
  }

  function toggle() {
    setTheme(theme === "dark" ? "light" : "dark");
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggle }}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    // Sensible default when used outside a provider (e.g. server components prerender).
    return { theme: "dark", setTheme: () => {}, toggle: () => {} };
  }
  return ctx;
}

/**
 * Tiny inline script that runs before React hydrates so the html element has
 * the correct data-theme on first paint (avoids a dark→light flash). Add it
 * at the top of <body> in the root layout.
 */
export const ThemeFlashScript = () => (
  <script
    // eslint-disable-next-line react/no-danger
    dangerouslySetInnerHTML={{
      __html: `
        (function(){
          try {
            var t = localStorage.getItem('${STORAGE_KEY}');
            if (t !== 'light' && t !== 'dark') t = 'dark';
            document.documentElement.setAttribute('data-theme', t);
          } catch(_) {
            document.documentElement.setAttribute('data-theme', 'dark');
          }
        })();
      `,
    }}
  />
);
