"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { getBrowserSupabase } from "@/lib/supabase/client";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/fr";

type CoursesDict = Dictionary["portail"]["courses"];

type Option = { id: string; label: string };

export function CourseForm({
  dict,
  programs,
  instructors,
}: {
  locale: Locale;
  dict: CoursesDict;
  programs: Option[];
  instructors: Option[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [programId, setProgramId] = useState<string>("");
  const [instructorId, setInstructorId] = useState<string>("");
  const [status, setStatus] = useState<"draft" | "published" | "archived">("draft");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title) return;
    setError(null);
    startTransition(async () => {
      const supabase = getBrowserSupabase();
      const { data, error: insErr } = await supabase
        .from("courses")
        .insert({
          title,
          description: description || null,
          program_id: programId || null,
          instructor_id: instructorId || null,
          status,
        })
        .select("id")
        .single();
      if (insErr || !data) {
        setError(insErr?.message ?? "?");
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
      <Field label={dict.titleLabel}>
        <input
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="h-11 w-full rounded-xl border border-white/10 bg-background/70 px-3 text-sm text-foreground focus:border-brand/60 focus:outline-none"
        />
      </Field>
      <Field label={dict.descriptionLabel}>
        <textarea
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-background/70 px-3 py-2 text-sm text-foreground focus:border-brand/60 focus:outline-none"
        />
      </Field>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Field label={dict.programLabel}>
          <select
            value={programId}
            onChange={(e) => setProgramId(e.target.value)}
            className="h-11 w-full rounded-xl border border-white/10 bg-background/70 px-3 text-sm text-foreground focus:border-brand/60 focus:outline-none"
          >
            <option value="">—</option>
            {programs.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label={dict.instructorLabel}>
          <select
            value={instructorId}
            onChange={(e) => setInstructorId(e.target.value)}
            className="h-11 w-full rounded-xl border border-white/10 bg-background/70 px-3 text-sm text-foreground focus:border-brand/60 focus:outline-none"
          >
            <option value="">—</option>
            {instructors.map((i) => (
              <option key={i.id} value={i.id}>
                {i.label}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field label={dict.statusLabel}>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as typeof status)}
          className="h-11 w-full rounded-xl border border-white/10 bg-background/70 px-3 text-sm text-foreground focus:border-brand/60 focus:outline-none"
        >
          <option value="draft">{dict.statusDraft}</option>
          <option value="published">{dict.statusPublished}</option>
          <option value="archived">{dict.statusArchived}</option>
        </select>
      </Field>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={pending || !title}
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
