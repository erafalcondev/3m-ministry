"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";

type Theme = "dark" | "light";

/**
 * Curated 2025 designer palette — modern, vivid, premium UI brand colors
 * inspired by Linear (cobalt), Stripe (indigo), Vercel (electric blue),
 * Notion (coral) and Cal.com (cyan). All have proper contrast on both
 * light and dark backgrounds.
 */
const ACCENT_PRESETS = [
  { value: "#0ea5e9", label: "Ocean" },    // electric sky blue
  { value: "#6366f1", label: "Indigo" },   // Stripe / Linear indigo
  { value: "#8b5cf6", label: "Violet" },   // luxe violet
  { value: "#ec4899", label: "Pink" },     // Vercel pink
  { value: "#10b981", label: "Emerald" },  // rich emerald
  { value: "#f97316" },                    // sunset orange
];

const DEFAULT_HUE = 191; // hue of the original brand cyan #4fc3dc
const DEFAULT_ACCENT = "#0ea5e9";

const STORAGE_THEME = "3m-theme";
const STORAGE_ACCENT = "3m-accent";

function hexToHue(hex: string): number {
  const m = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (!m) return DEFAULT_HUE;
  const r = parseInt(m[1], 16) / 255;
  const g = parseInt(m[2], 16) / 255;
  const b = parseInt(m[3], 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  if (d === 0) return 0;
  let h = 0;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  h *= 60;
  if (h < 0) h += 360;
  return h;
}

function brandSoft(hex: string): string {
  const m = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (!m) return hex;
  const r = Math.round(parseInt(m[1], 16) * 0.78);
  const g = Math.round(parseInt(m[2], 16) * 0.78);
  const b = Math.round(parseInt(m[3], 16) * 0.78);
  return `rgb(${r}, ${g}, ${b})`;
}

function brandGlow(hex: string): string {
  const m = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (!m) return "rgba(14, 165, 233, 0.35)";
  return `rgba(${parseInt(m[1], 16)}, ${parseInt(m[2], 16)}, ${parseInt(m[3], 16)}, 0.35)`;
}

function applyAccent(hex: string) {
  const root = document.documentElement;
  root.style.setProperty("--brand", hex);
  root.style.setProperty("--brand-soft", brandSoft(hex));
  root.style.setProperty("--brand-glow", brandGlow(hex));
  const targetHue = hexToHue(hex);
  const rotation = Math.round(targetHue - DEFAULT_HUE);
  root.style.setProperty("--logo-hue-rotate", `${rotation}deg`);
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
  const [accent, setAccentState] = useState<string>(DEFAULT_ACCENT);

  // Initial sync from localStorage (instant, before async DB call lands).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedTheme = localStorage.getItem(STORAGE_THEME) as Theme | null;
    if (storedTheme === "light" || storedTheme === "dark") {
      setThemeState(storedTheme);
      document.documentElement.setAttribute("data-theme", storedTheme);
    } else {
      setThemeState("dark");
      document.documentElement.setAttribute("data-theme", "dark");
    }
    const storedAccent = localStorage.getItem(STORAGE_ACCENT);
    if (storedAccent && /^#[0-9a-f]{6}$/i.test(storedAccent)) {
      setAccentState(storedAccent);
      applyAccent(storedAccent);
    } else {
      applyAccent(DEFAULT_ACCENT);
    }
  }, []);

  // After mount: if a Supabase session exists, the DB preference wins.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = getBrowserSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: prefs } = await supabase
        .from("user_preferences")
        .select("theme,accent")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled || !prefs) return;
      const t = prefs.theme as Theme;
      const a = prefs.accent as string;
      if (t === "light" || t === "dark") {
        setThemeState(t);
        document.documentElement.setAttribute("data-theme", t);
        try { localStorage.setItem(STORAGE_THEME, t); } catch {}
      }
      if (a && /^#[0-9a-f]{6}$/i.test(a)) {
        setAccentState(a);
        applyAccent(a);
        try { localStorage.setItem(STORAGE_ACCENT, a); } catch {}
      }
    })();
    return () => { cancelled = true; };
  }, []);

  async function persistPref(patch: { theme?: Theme; accent?: string }) {
    try {
      const supabase = getBrowserSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase
        .from("user_preferences")
        .upsert(
          {
            user_id: user.id,
            theme: patch.theme ?? theme,
            accent: patch.accent ?? accent,
          },
          { onConflict: "user_id" },
        );
    } catch {}
  }

  function setTheme(t: Theme) {
    setThemeState(t);
    document.documentElement.setAttribute("data-theme", t);
    try { localStorage.setItem(STORAGE_THEME, t); } catch {}
    persistPref({ theme: t });
  }

  function toggle() {
    setTheme(theme === "dark" ? "light" : "dark");
  }

  function setAccent(hex: string) {
    if (!/^#[0-9a-f]{6}$/i.test(hex)) return;
    setAccentState(hex);
    applyAccent(hex);
    try { localStorage.setItem(STORAGE_ACCENT, hex); } catch {}
    persistPref({ accent: hex });
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
      accent: DEFAULT_ACCENT,
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
            if (!a || !/^#[a-f\\d]{6}$/i.test(a)) a = '${DEFAULT_ACCENT}';
            var root = document.documentElement;
            root.style.setProperty('--brand', a);
            var m = a.match(/^#?([a-f\\d]{2})([a-f\\d]{2})([a-f\\d]{2})$/i);
            if (m) {
              var rr = parseInt(m[1],16), gg = parseInt(m[2],16), bb = parseInt(m[3],16);
              root.style.setProperty('--brand-soft', 'rgb(' + Math.round(rr*0.78) + ',' + Math.round(gg*0.78) + ',' + Math.round(bb*0.78) + ')');
              root.style.setProperty('--brand-glow', 'rgba(' + rr + ',' + gg + ',' + bb + ',0.35)');
              var rn = rr/255, gn = gg/255, bn = bb/255;
              var max = Math.max(rn,gn,bn), min = Math.min(rn,gn,bn), d = max - min, h = 0;
              if (d !== 0) {
                if (max === rn) h = ((gn-bn)/d)%6;
                else if (max === gn) h = (bn-rn)/d + 2;
                else h = (rn-gn)/d + 4;
                h *= 60; if (h < 0) h += 360;
              }
              root.style.setProperty('--logo-hue-rotate', (Math.round(h - ${DEFAULT_HUE})) + 'deg');
            }
          } catch(_) {
            document.documentElement.setAttribute('data-theme', 'dark');
          }
        })();
      `,
    }}
  />
);
