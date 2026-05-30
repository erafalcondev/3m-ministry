"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Pencil, Trash2, X, Save, AlertTriangle } from "lucide-react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { DatePicker } from "@/components/ui/DatePicker";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/fr";

type CohortsDict = Dictionary["portail"]["cohorts"];
type StatusLabels = Dictionary["portail"]["common"]["cohortStatus"];
type CohortStatus = "planned" | "active" | "completed" | "canceled";

type Cohort = {
  id: string;
  programId: string;
  name: string;
  startDate: string;
  endDate: string;
  rhythmText: string | null;
  location: string | null;
  status: CohortStatus;
  notes: string | null;
};

type ProgramOption = { id: string; label: string };

export function CohortActions({
  locale,
  dict,
  statusLabels,
  cohort,
  programs,
}: {
  locale: Locale;
  dict: CohortsDict;
  statusLabels: StatusLabels;
  cohort: Cohort;
  programs: ProgramOption[];
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"idle" | "edit" | "confirm-delete">("idle");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [programId, setProgramId] = useState(cohort.programId);
  const [name, setName] = useState(cohort.name);
  const [startDate, setStartDate] = useState(cohort.startDate);
  const [endDate, setEndDate] = useState(cohort.endDate);
  const [rhythm, setRhythm] = useState(cohort.rhythmText ?? "");
  const [location, setLocation] = useState(cohort.location ?? "");
  const [status, setStatus] = useState<CohortStatus>(cohort.status);
  const [notes, setNotes] = useState(cohort.notes ?? "");

  function save() {
    setError(null);
    startTransition(async () => {
      const supabase = getBrowserSupabase();
      const { error: err } = await supabase
        .from("cohorts")
        .update({
          program_id: programId,
          name,
          start_date: startDate,
          end_date: endDate,
          rhythm_text: rhythm || null,
          location: location || null,
          status,
          notes: notes || null,
        })
        .eq("id", cohort.id);
      if (err) {
        setError(err.message);
        return;
      }
      setMode("idle");
      router.refresh();
    });
  }

  function remove() {
    setError(null);
    startTransition(async () => {
      const supabase = getBrowserSupabase();
      const { error: err } = await supabase.from("cohorts").delete().eq("id", cohort.id);
      if (err) {
        setError(err.message);
        return;
      }
      router.push(`/${locale}/portail/admin/cohorts`);
      router.refresh();
    });
  }

  return (
    <>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setMode(mode === "edit" ? "idle" : "edit")}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-foreground transition hover:border-brand/40 hover:bg-brand/10"
        >
          <Pencil size={12} />
          {dict.editCta}
        </button>
        <button
          type="button"
          onClick={() => setMode("confirm-delete")}
          className="inline-flex items-center gap-1.5 rounded-full border border-red-400/30 bg-red-400/10 px-3 py-1.5 text-xs text-red-200 transition hover:bg-red-400/20"
        >
          <Trash2 size={12} />
          {dict.deleteCta}
        </button>
      </div>

      <AnimatePresence>
        {mode === "edit" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-5 grid grid-cols-1 gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-5 md:grid-cols-2">
              <Field label={dict.programLabel}>
                <select
                  value={programId}
                  onChange={(e) => setProgramId(e.target.value)}
                  className="h-11 w-full rounded-xl border border-white/10 bg-background/70 px-3 text-sm text-foreground focus:border-brand/60 focus:outline-none"
                >
                  {programs.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={dict.nameLabel}>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-11 w-full rounded-xl border border-white/10 bg-background/70 px-3 text-sm text-foreground focus:border-brand/60 focus:outline-none"
                />
              </Field>
              <Field label={dict.startLabel}>
                <DatePicker locale={locale} value={startDate} onChange={setStartDate} />
              </Field>
              <Field label={dict.endLabel}>
                <DatePicker locale={locale} value={endDate} onChange={setEndDate} min={startDate} />
              </Field>
              <Field label={dict.rhythmLabel}>
                <input
                  type="text"
                  value={rhythm}
                  onChange={(e) => setRhythm(e.target.value)}
                  className="h-11 w-full rounded-xl border border-white/10 bg-background/70 px-3 text-sm text-foreground focus:border-brand/60 focus:outline-none"
                />
              </Field>
              <Field label={dict.locationLabel}>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="h-11 w-full rounded-xl border border-white/10 bg-background/70 px-3 text-sm text-foreground focus:border-brand/60 focus:outline-none"
                />
              </Field>
              <Field label={dict.statusLabel}>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as CohortStatus)}
                  className="h-11 w-full rounded-xl border border-white/10 bg-background/70 px-3 text-sm text-foreground focus:border-brand/60 focus:outline-none"
                >
                  <option value="planned">{statusLabels.planned}</option>
                  <option value="active">{statusLabels.active}</option>
                  <option value="completed">{statusLabels.completed}</option>
                  <option value="canceled">{statusLabels.canceled}</option>
                </select>
              </Field>
              <div className="md:col-span-2">
                <Field label={dict.notesLabel}>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-background/70 px-3 py-2 text-sm text-foreground focus:border-brand/60 focus:outline-none"
                  />
                </Field>
              </div>

              {error && (
                <div className="md:col-span-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {error}
                </div>
              )}

              <div className="md:col-span-2 flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setMode("idle")}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs text-muted transition hover:text-foreground"
                >
                  <X size={12} />
                  {dict.cancelCta}
                </button>
                <button
                  type="button"
                  onClick={save}
                  disabled={pending || !name || !startDate || !endDate}
                  className="inline-flex items-center gap-1.5 rounded-full bg-brand px-5 py-1.5 text-xs font-medium text-[#031019] transition hover:shadow-[0_10px_30px_-10px_var(--brand-glow)] disabled:opacity-50"
                >
                  <Save size={12} />
                  {pending ? "…" : dict.saveEditCta}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {mode === "confirm-delete" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-5 flex flex-wrap items-start gap-3 rounded-2xl border border-red-400/30 bg-red-400/10 p-5">
              <AlertTriangle size={18} className="mt-0.5 text-red-200" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-red-100">{dict.deleteConfirmTitle}</p>
                <p className="mt-1 text-xs text-red-200/80 text-pretty">{dict.deleteConfirmBody}</p>
                {error && <p className="mt-2 text-xs text-red-300">{error}</p>}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMode("idle")}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-muted hover:text-foreground"
                >
                  {dict.cancelCta}
                </button>
                <button
                  type="button"
                  onClick={remove}
                  disabled={pending}
                  className="inline-flex items-center gap-1.5 rounded-full bg-red-500 px-4 py-1.5 text-xs font-medium text-white transition hover:bg-red-400 disabled:opacity-50"
                >
                  <Trash2 size={12} />
                  {pending ? "…" : dict.deleteConfirmCta}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs uppercase tracking-[0.18em] text-muted">{label}</span>
      {children}
    </label>
  );
}
