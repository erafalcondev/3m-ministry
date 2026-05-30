"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Theme = "dark" | "light";

const ACCENT_PRESETS = [
  { value: "#4fc3dc", label: "Cyan" }, // default brand
  { value: "#a78bfa", label: "Violet" },
  { value: "#f472b6", label: "Rose" },
  { value: "#34d399", label: "Émeraude" },
  { value: "#f59e0b", label: "Ambre" },
  { value: "#fb7185", label: "Corail" },
];

const STORAGE_THEME = "3m-theme";
const STORAGE_ACCENT = "3m-accent";

function brandSoft(hex: string): string {
  // Approximate a darker variant for hover/shadow tone.
  try {
    const m = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
    if (!m) return hex;
    const r = Math.round(parseInt(m[1], 16) * 0.78);
    const g = Math.round(parseInt(m[2], 16) * 0.78);
    const b = Math.round(parseInt(m[3], 16) * 0.78);
    return `rgb(${r}, ${g}, ${b})`;
  } catch {
    return hex;
  }
}

function brandGlow(hex: string): string {
  try {
    const m = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
    if (!m) return "rgba(79, 195, 220, 0.35)";
    return `rgba(${parseInt(m[1], 16)}, ${parseInt(m[2], 16)}, ${parseInt(m[3], 16)}, 0.35)`;
  } catch {
    return "rgba(79, 195, 220, 0.35)";
  }
}

function applyAccent(hex: string) {
  const root = document.documentElement;
  root.style.setProperty("--brand", hex);
  root.style.setProperty("--brand-soft", brandSoft(hex));
  root.style.setProperty("--brand-glow", brandGlow(hex));
}

type ThemeContextValue = {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggle: () => void;
  accent: string;
  setAccent: (hex: string) => void;
  presets: typeof ACCENT_PRESETS;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");
  const [accent, setAccentState] = useState<string>("#4fc3dc");

  useEffect(() => {
    const storedTheme = typeof window !== "undefined" ? (localStorage.getItem(STORAGE_THEME) as Theme | null) : null;
    const initial: Theme = storedTheme === "light" || storedTheme === "dark" ? storedTheme : "dark";
    setThemeState(initial);
    document.documentElement.setAttribute("data-theme", initial);

    const storedAccent = typeof window !== "undefined" ? localStorage.getItem(STORAGE_ACCENT) : null;
    if (storedAccent && /^#[a-f\d]{6}$/i.test(storedAccent)) {
      setAccentState(storedAccent);
      applyAccent(storedAccent);
    }
  }, []);

  function setTheme(t: Theme) {
    setThemeState(t);
    document.documentElement.setAttribute("data-theme", t);
    try { localStorage.setItem(STORAGE_THEME, t); } catch {}
  }

  function toggle() {
    setTheme(theme === "dark" ? "light" : "dark");
  }

  function setAccent(hex: string) {
    setAccentState(hex);
    applyAccent(hex);
    try { localStorage.setItem(STORAGE_ACCENT, hex); } catch {}
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggle, accent, setAccent, presets: ACCENT_PRESETS }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    return {
      theme: "dark",
      setTheme: () => {},
      toggle: () => {},
      accent: "#4fc3dc",
      setAccent: () => {},
      presets: ACCENT_PRESETS,
    };
  }
  return ctx;
}

export const ThemeFlashScript = () => (
  <script
    dangerouslySetInnerHTML={{
      __html: `
        (function(){
          try {
            var t = localStorage.getItem('${STORAGE_THEME}');
            if (t !== 'light' && t !== 'dark') t = 'dark';
            document.documentElement.setAttribute('data-theme', t);
            var a = localStorage.getItem('${STORAGE_ACCENT}');
            if (a && /^#[a-f\\d]{6}$/i.test(a)) {
              document.documentElement.style.setProperty('--brand', a);
            }
          } catch(_) {
            document.documentElement.setAttribute('data-theme', 'dark');
          }
        })();
      `,
    }}
  />
);
