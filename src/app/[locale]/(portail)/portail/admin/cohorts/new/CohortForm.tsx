"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { DatePicker } from "@/components/ui/DatePicker";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/fr";

type CohortsDict = Dictionary["portail"]["cohorts"];
type StatusLabels = Dictionary["portail"]["common"]["cohortStatus"];

type ProgramOption = { id: string; label: string; durationMonths: number | null; color: string };

function addMonths(date: string, months: number): string {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  const target = new Date(d);
  target.setMonth(target.getMonth() + months);
  return target.toISOString().slice(0, 10);
}

export function CohortForm({
  locale,
  dict,
  statusLabels,
  programs,
}: {
  locale: Locale;
  dict: CohortsDict;
  statusLabels: StatusLabels;
  programs: ProgramOption[];
}) {
  const router = useRouter();
  const [programId, setProgramId] = useState(programs[0]?.id ?? "");
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [rhythm, setRhythm] = useState("");
  const [location, setLocation] = useState("La Cité Mascouche");
  const [status, setStatus] = useState<"planned" | "active" | "completed" | "canceled">("planned");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Auto-suggest end date when program + start_date are filled.
  useEffect(() => {
    if (!startDate) return;
    const program = programs.find((p) => p.id === programId);
    if (!program?.durationMonths) return;
    setEndDate((prev) => prev || addMonths(startDate, program.durationMonths!));
  }, [programId, startDate, programs]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!programId || !name || !startDate || !endDate) return;

    startTransition(async () => {
      const supabase = getBrowserSupabase();
      const { data, error: insertErr } = await supabase
        .from("cohorts")
        .insert({
          program_id: programId,
          name,
          start_date: startDate,
          end_date: endDate,
          rhythm_text: rhythm || null,
          location: location || null,
          status,
          notes: notes || null,
        })
        .select("id")
        .single();

      if (insertErr || !data) {
        setError(insertErr?.message ?? "Erreur");
        return;
      }
      router.push(`./${data.id}`);
      router.refresh();
    });
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      onSubmit={submit}
      className="space-y-5 rounded-2xl border border-white/10 bg-white/[0.03] p-6"
    >
      <Field label={dict.programLabel}>
        <select
          value={programId}
          onChange={(e) => setProgramId(e.target.value)}
          required
          className="h-11 w-full rounded-xl border border-white/10 bg-background/70 px-3 text-sm text-foreground focus:border-brand/60 focus:outline-none focus:ring-2 focus:ring-brand/30"
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
          required
          value={name}
          placeholder={dict.namePlaceholder}
          onChange={(e) => setName(e.target.value)}
          className="h-11 w-full rounded-xl border border-white/10 bg-background/70 px-3 text-sm text-foreground focus:border-brand/60 focus:outline-none focus:ring-2 focus:ring-brand/30"
        />
      </Field>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Field label={dict.startLabel}>
          <DatePicker
            locale={locale}
            value={startDate}
            onChange={setStartDate}
            required
          />
        </Field>
        <Field label={dict.endLabel}>
          <DatePicker
            locale={locale}
            value={endDate}
            onChange={setEndDate}
            min={startDate || undefined}
            required
          />
        </Field>
      </div>

      <Field label={dict.rhythmLabel}>
        <input
          type="text"
          value={rhythm}
          placeholder={dict.rhythmPlaceholder}
          onChange={(e) => setRhythm(e.target.value)}
          className="h-11 w-full rounded-xl border border-white/10 bg-background/70 px-3 text-sm text-foreground focus:border-brand/60 focus:outline-none focus:ring-2 focus:ring-brand/30"
        />
      </Field>

      <Field label={dict.locationLabel}>
        <input
          type="text"
          value={location}
          placeholder={dict.locationPlaceholder}
          onChange={(e) => setLocation(e.target.value)}
          className="h-11 w-full rounded-xl border border-white/10 bg-background/70 px-3 text-sm text-foreground focus:border-brand/60 focus:outline-none focus:ring-2 focus:ring-brand/30"
        />
      </Field>

      <Field label={dict.statusLabel}>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as typeof status)}
          className="h-11 w-full rounded-xl border border-white/10 bg-background/70 px-3 text-sm text-foreground focus:border-brand/60 focus:outline-none focus:ring-2 focus:ring-brand/30"
        >
          <option value="planned">{statusLabels.planned}</option>
          <option value="active">{statusLabels.active}</option>
          <option value="completed">{statusLabels.completed}</option>
          <option value="canceled">{statusLabels.canceled}</option>
        </select>
      </Field>

      <Field label={dict.notesLabel}>
        <textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-background/70 px-3 py-2 text-sm text-foreground focus:border-brand/60 focus:outline-none focus:ring-2 focus:ring-brand/30"
        />
      </Field>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={pending || !programId || !name || !startDate || !endDate}
        className="inline-flex h-11 items-center rounded-full bg-brand px-5 text-sm font-medium text-[#031019] transition hover:shadow-[0_12px_30px_-10px_rgba(79,195,220,0.6)] disabled:opacity-50"
      >
        {pending ? "…" : dict.saveCta}
      </button>
    </motion.form>
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
