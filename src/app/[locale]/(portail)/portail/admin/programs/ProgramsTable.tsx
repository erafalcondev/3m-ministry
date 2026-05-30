"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { getBrowserSupabase } from "@/lib/supabase/client";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/fr";

type ProgramsDict = Dictionary["portail"]["programs"];

type Row = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  durationMonths: number | null;
  color: string;
  active: boolean;
};

export function ProgramsTable({
  dict,
  rows,
}: {
  locale: Locale;
  dict: ProgramsDict;
  rows: Row[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function toggleActive(id: string, next: boolean) {
    startTransition(async () => {
      const supabase = getBrowserSupabase();
      const { error } = await supabase.from("programs").update({ active: next }).eq("id", id);
      if (!error) router.refresh();
    });
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-16 text-center text-sm text-muted">
        {dict.empty}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-2"
    >
      {rows.map((r) => (
        <div
          key={r.id}
          className="flex flex-wrap items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4"
        >
          <span
            className="h-9 w-9 shrink-0 rounded-xl"
            style={{ background: `linear-gradient(135deg, ${r.color}, ${r.color}80)` }}
            aria-hidden
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
                {r.code}
              </span>
              <span className="text-sm text-foreground">{r.name}</span>
              {r.durationMonths != null && (
                <span className="text-xs text-muted">
                  · {r.durationMonths} {dict.colMonths}
                </span>
              )}
            </div>
            {r.description && (
              <p className="mt-1 text-sm text-muted text-pretty">{r.description}</p>
            )}
          </div>
          <label className="inline-flex shrink-0 cursor-pointer items-center gap-2 text-xs text-muted">
            <input
              type="checkbox"
              checked={r.active}
              disabled={pending}
              onChange={(e) => toggleActive(r.id, e.target.checked)}
              className="peer sr-only"
            />
            <span className="relative h-5 w-9 rounded-full bg-white/10 transition peer-checked:bg-brand">
              <span className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-foreground transition peer-checked:translate-x-4" />
            </span>
            <span className="uppercase tracking-[0.18em]">{dict.colActive}</span>
          </label>
        </div>
      ))}
    </motion.div>
  );
}
