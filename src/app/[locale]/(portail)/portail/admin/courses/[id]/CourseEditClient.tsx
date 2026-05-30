"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Pencil, Trash2, X } from "lucide-react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import type { Dictionary } from "@/i18n/dictionaries/fr";

type CoursesDict = Dictionary["portail"]["courses"];

type Option = { id: string; label: string };

type Course = {
  id: string;
  title: string;
  description: string | null;
  externalUrl: string | null;
  programId: string | null;
  instructorId: string | null;
  status: "draft" | "published" | "archived";
};

export function CourseEditClient({
  course,
  dict,
  programs,
  instructors,
  locale,
}: {
  course: Course;
  dict: CoursesDict;
  programs: Option[];
  instructors: Option[];
  locale: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(course.title);
  const [description, setDescription] = useState(course.description ?? "");
  const [externalUrl, setExternalUrl] = useState(course.externalUrl ?? "");
  const [programId, setProgramId] = useState(course.programId ?? "");
  const [instructorId, setInstructorId] = useState(course.instructorId ?? "");
  const [status, setStatus] = useState(course.status);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function save() {
    setError(null);
    startTransition(async () => {
      const supabase = getBrowserSupabase();
      const { error: err } = await supabase
        .from("courses")
        .update({
          title,
          description: description || null,
          external_url: externalUrl || null,
          program_id: programId || null,
          instructor_id: instructorId || null,
          status,
        })
        .eq("id", course.id);
      if (err) {
        setError(err.message);
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  function removeCourse() {
    if (!confirm(dict.deleteCourse + "?")) return;
    startTransition(async () => {
      const supabase = getBrowserSupabase();
      const { error: err } = await supabase.from("courses").delete().eq("id", course.id);
      if (err) {
        setError(err.message);
        return;
      }
      router.replace(`/${locale}/portail/admin/courses`);
    });
  }

  return (
    <>
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs text-muted transition hover:border-brand/40 hover:bg-brand/10 hover:text-foreground"
        >
          <Pencil size={12} />
          {dict.editCourse}
        </button>
        <button
          type="button"
          onClick={removeCourse}
          disabled={pending}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs text-muted transition hover:border-red-400/40 hover:bg-red-400/10 hover:text-red-200 disabled:opacity-50"
        >
          <Trash2 size={12} />
          {dict.deleteCourse}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -4, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-4 space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <Field label={dict.titleLabel}>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="h-11 w-full rounded-xl border border-white/10 bg-background/70 px-3 text-sm text-foreground focus:border-brand/60 focus:outline-none"
                  />
                </Field>
                <Field label={dict.statusLabel}>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as Course["status"])}
                    className="h-11 w-full rounded-xl border border-white/10 bg-background/70 px-3 text-sm text-foreground focus:border-brand/60 focus:outline-none"
                  >
                    <option value="draft">{dict.statusDraft}</option>
                    <option value="published">{dict.statusPublished}</option>
                    <option value="archived">{dict.statusArchived}</option>
                  </select>
                </Field>
              </div>
              <Field label={dict.descriptionLabel}>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-background/70 px-3 py-2 text-sm text-foreground focus:border-brand/60 focus:outline-none"
                />
              </Field>
              <Field label={dict.externalUrlLabel}>
                <input
                  type="url"
                  value={externalUrl}
                  onChange={(e) => setExternalUrl(e.target.value)}
                  placeholder={dict.externalUrlPlaceholder}
                  className="h-11 w-full rounded-xl border border-white/10 bg-background/70 px-3 text-sm text-foreground focus:border-brand/60 focus:outline-none"
                />
              </Field>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
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

              {error && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs text-muted hover:text-foreground"
                >
                  <X size={12} />
                  {dict.cancelEdit}
                </button>
                <button
                  type="button"
                  onClick={save}
                  disabled={pending || !title}
                  className="inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-1.5 text-xs font-medium text-[#031019] hover:shadow-[0_10px_30px_-10px_rgba(79,195,220,0.6)] disabled:opacity-50"
                >
                  {pending ? "…" : dict.saveChanges}
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
      <span className="mb-1.5 block text-[10px] uppercase tracking-[0.18em] text-muted">{label}</span>
      {children}
    </label>
  );
}
