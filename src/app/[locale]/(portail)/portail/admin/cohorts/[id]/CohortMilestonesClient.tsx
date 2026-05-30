"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Flag } from "lucide-react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/fr";

type CohortsDict = Dictionary["portail"]["cohorts"];
type KindLabels = Dictionary["portail"]["common"]["milestoneKind"];

type MilestoneKind = "start" | "end" | "session" | "evaluation" | "custom";

type Milestone = {
  id: string;
  date: string;
  title: string;
  kind: MilestoneKind;
  notes: string | null;
};

function fmtDate(iso: string, locale: Locale) {
  return new Date(iso).toLocaleDateString(locale === "fr" ? "fr-CA" : "en-CA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function CohortMilestonesClient({
  cohortId,
  locale,
  dict,
  kindLabels,
  rows,
  canWrite,
}: {
  cohortId: string;
  locale: Locale;
  dict: CohortsDict;
  kindLabels: KindLabels;
  rows: Milestone[];
  canWrite: boolean;
}) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [kind, setKind] = useState<MilestoneKind>("session");
  const [pending, startTransition] = useTransition();

  function add() {
    if (!title || !date) return;
    startTransition(async () => {
      const supabase = getBrowserSupabase();
      const { error } = await supabase
        .from("cohort_milestones")
        .insert({ cohort_id: cohortId, title, date, kind });
      if (!error) {
        setAdding(false);
        setTitle("");
        setDate("");
        setKind("session");
        router.refresh();
      }
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      const supabase = getBrowserSupabase();
      const { error } = await supabase.from("cohort_milestones").delete().eq("id", id);
      if (!error) router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      {canWrite && (
        <>
          {!adding ? (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-muted transition hover:border-brand/40 hover:bg-brand/10 hover:text-foreground"
            >
              <Flag size={14} />
              {dict.detailAddMilestone}
            </button>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3 md:grid-cols-[1fr_180px_140px_auto_auto]"
            >
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={dict.milestoneTitleLabel}
                className="h-9 rounded-xl border border-white/10 bg-background/70 px-3 text-sm text-foreground focus:border-brand/60 focus:outline-none"
              />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-9 rounded-xl border border-white/10 bg-background/70 px-3 text-sm text-foreground focus:border-brand/60 focus:outline-none"
              />
              <select
                value={kind}
                onChange={(e) => setKind(e.target.value as MilestoneKind)}
                className="h-9 rounded-xl border border-white/10 bg-background/70 px-3 text-sm text-foreground focus:border-brand/60 focus:outline-none"
              >
                <option value="start">{kindLabels.start}</option>
                <option value="session">{kindLabels.session}</option>
                <option value="evaluation">{kindLabels.evaluation}</option>
                <option value="end">{kindLabels.end}</option>
                <option value="custom">{kindLabels.custom}</option>
              </select>
              <button
                type="button"
                onClick={add}
                disabled={pending || !title || !date}
                className="inline-flex h-9 items-center gap-1.5 rounded-full bg-brand px-3 text-xs font-medium text-[#031019] hover:shadow-[0_10px_30px_-10px_rgba(79,195,220,0.6)] disabled:opacity-50"
              >
                <Plus size={13} />
                {dict.milestoneAddCta}
              </button>
              <button
                type="button"
                onClick={() => setAdding(false)}
                className="rounded-full p-1 text-muted hover:bg-white/5 hover:text-foreground"
                aria-label="Cancel"
              >
                <X size={15} />
              </button>
            </motion.div>
          )}
        </>
      )}

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-10 text-center text-sm text-muted">
          {dict.detailMilestonesEmpty}
        </div>
      ) : (
        <ul className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] divide-y divide-white/5">
          <AnimatePresence initial={false}>
            {rows.map((r) => (
              <motion.li
                key={r.id}
                layout
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-sm"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted/70">
                    {fmtDate(r.date, locale)}
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-muted">
                    {kindLabels[r.kind]}
                  </span>
                  <span className="text-foreground">{r.title}</span>
                </div>
                {canWrite && (
                  <button
                    type="button"
                    onClick={() => remove(r.id)}
                    disabled={pending}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-muted transition hover:border-red-400/40 hover:bg-red-400/10 hover:text-red-200 disabled:opacity-50"
                  >
                    {dict.detailDeleteMilestone}
                  </button>
                )}
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}
