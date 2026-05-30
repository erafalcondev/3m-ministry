"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider";

export function ThemeToggle({ variant = "pill" }: { variant?: "pill" | "icon" }) {
  const { theme, toggle } = useTheme();
  const next = theme === "dark" ? "light" : "dark";

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={toggle}
        aria-label={`Switch to ${next} theme`}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-foreground transition hover:border-brand/40 hover:bg-brand/10"
      >
        {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
      </button>
    );
  }

  return (
    <div
      role="group"
      aria-label="Theme"
      className="flex items-center rounded-full border border-white/10 bg-background/40 p-0.5 text-[10px] uppercase tracking-[0.18em]"
    >
      <button
        type="button"
        onClick={() => theme === "light" && toggle()}
        aria-pressed={theme === "dark"}
        className={`inline-flex items-center gap-1 rounded-full px-3 py-1 transition ${
          theme === "dark"
            ? "bg-brand text-[#031019] font-medium"
            : "text-muted hover:text-foreground"
        }`}
      >
        <Moon size={11} />
      </button>
      <button
        type="button"
        onClick={() => theme === "dark" && toggle()}
        aria-pressed={theme === "light"}
        className={`inline-flex items-center gap-1 rounded-full px-3 py-1 transition ${
          theme === "light"
            ? "bg-brand text-[#031019] font-medium"
            : "text-muted hover:text-foreground"
        }`}
      >
        <Sun size={11} />
      </button>
    </div>
  );
}
