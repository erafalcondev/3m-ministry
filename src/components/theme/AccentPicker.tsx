"use client";

import { useState, useRef, useEffect } from "react";
import { Palette } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "./ThemeProvider";

export function AccentPicker() {
  const { accent, setAccent, presets } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Accent color"
        className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/5 text-foreground transition hover:border-brand/40"
      >
        <Palette size={12} style={{ color: accent }} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute bottom-full left-0 z-30 mb-2 w-48 rounded-2xl border border-white/10 bg-surface/95 p-3 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)] backdrop-blur-xl"
          >
            <p className="mb-2 text-[10px] uppercase tracking-[0.18em] text-muted">Accent</p>
            <div className="grid grid-cols-6 gap-1.5">
              {presets.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => {
                    setAccent(p.value);
                    setOpen(false);
                  }}
                  aria-label={p.label}
                  className={`h-6 w-6 rounded-full transition hover:scale-110 ${
                    accent.toLowerCase() === p.value.toLowerCase() ? "ring-2 ring-foreground/40" : ""
                  }`}
                  style={{ background: p.value }}
                />
              ))}
            </div>
            <label className="mt-3 block">
              <span className="mb-1 block text-[10px] uppercase tracking-[0.18em] text-muted">Custom</span>
              <input
                type="color"
                value={accent}
                onChange={(e) => setAccent(e.target.value)}
                className="h-8 w-full cursor-pointer rounded-lg border border-white/10 bg-background"
              />
            </label>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
