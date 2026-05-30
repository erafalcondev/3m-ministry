"use client";

import { useEffect, useRef, useState } from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

function parseISO(s: string | null | undefined): Date | undefined {
  if (!s) return undefined;
  // Treat YYYY-MM-DD as local-time midnight to avoid TZ off-by-one.
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const d = new Date(s);
  return isNaN(d.getTime()) ? undefined : d;
}

function toISO(d: Date | undefined): string {
  if (!d) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function fmtPretty(d: Date | undefined, locale: string): string {
  if (!d) return "";
  return d.toLocaleDateString(locale === "fr" ? "fr-CA" : "en-CA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function DatePicker({
  value,
  onChange,
  locale,
  placeholder,
  min,
  required,
  className,
}: {
  value: string;
  onChange: (iso: string) => void;
  locale: string;
  placeholder?: string;
  min?: string;
  required?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState<Date>(parseISO(value) ?? new Date());
  const ref = useRef<HTMLDivElement | null>(null);
  const selected = parseISO(value);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Re-sync the visible month if the controlled value jumps externally.
  useEffect(() => {
    const parsed = parseISO(value);
    if (parsed) setMonth(parsed);
  }, [value]);

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex h-11 w-full items-center justify-between rounded-xl border border-white/10 bg-background/70 px-3 text-left text-sm transition focus:border-brand/60 focus:outline-none focus:ring-2 focus:ring-brand/30",
          selected ? "text-foreground" : "text-muted/70",
        )}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <span>{selected ? fmtPretty(selected, locale) : placeholder || "—"}</span>
        <CalendarIcon size={15} className="text-brand/80" />
      </button>

      {/* Hidden input keeps form `required` behaviour and DOM accessibility. */}
      <input
        type="hidden"
        value={value}
        required={required}
        readOnly
      />

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            role="dialog"
            aria-label="Choose date"
            className="absolute left-0 top-full z-50 mt-2 rounded-2xl border border-white/10 bg-surface/95 p-3 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)] backdrop-blur-xl"
          >
            <DayPicker
              mode="single"
              selected={selected}
              month={month}
              onMonthChange={setMonth}
              onSelect={(d) => {
                if (d) {
                  onChange(toISO(d));
                  setOpen(false);
                }
              }}
              disabled={min ? { before: parseISO(min) ?? new Date(0) } : undefined}
              showOutsideDays
              weekStartsOn={locale === "fr" ? 1 : 0}
              locale={undefined}
              classNames={{
                root: "rdp text-foreground",
                months: "flex flex-col",
                month: "space-y-2",
                caption: "flex items-center justify-between px-1 py-1",
                caption_label: "text-sm font-medium",
                nav: "flex items-center gap-1",
                button_previous:
                  "h-7 w-7 rounded-full border border-white/10 bg-white/5 text-foreground hover:bg-white/10 inline-flex items-center justify-center",
                button_next:
                  "h-7 w-7 rounded-full border border-white/10 bg-white/5 text-foreground hover:bg-white/10 inline-flex items-center justify-center",
                month_grid: "border-collapse",
                weekdays: "",
                weekday: "h-8 w-8 text-center text-[10px] font-medium uppercase tracking-[0.18em] text-muted",
                week: "",
                day: "h-8 w-8 p-0 text-center",
                day_button:
                  "h-8 w-8 rounded-full text-sm transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40",
                selected: "bg-brand text-[#031019] hover:bg-brand",
                today: "ring-1 ring-brand/50",
                outside: "text-muted/40",
                disabled: "text-muted/30 line-through cursor-not-allowed",
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
