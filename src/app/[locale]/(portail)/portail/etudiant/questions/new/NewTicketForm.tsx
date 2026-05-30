"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Send } from "lucide-react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/fr";

type TicketsDict = Dictionary["portail"]["tickets"];

type Category = "personal" | "technical" | "coaching" | "assignment" | "course" | "other";

const CATEGORIES: Category[] = ["personal", "technical", "coaching", "assignment", "course", "other"];

export function NewTicketForm({
  locale,
  dict,
  userId,
  courses,
  assignments,
}: {
  locale: Locale;
  dict: TicketsDict;
  userId: string;
  courses: { id: string; label: string }[];
  assignments: { id: string; label: string; courseId: string }[];
}) {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState<Category>("personal");
  const [courseId, setCourseId] = useState<string>("");
  const [assignmentId, setAssignmentId] = useState<string>("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const filteredAssignments = useMemo(
    () => (courseId ? assignments.filter((a) => a.courseId === courseId) : assignments),
    [assignments, courseId],
  );

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!subject || !body) return;
    setError(null);
    startTransition(async () => {
      const supabase = getBrowserSupabase();
      const { data: ticket, error: tErr } = await supabase
        .from("tickets")
        .insert({
          student_id: userId,
          subject,
          status: "open",
          category,
          course_id: courseId || null,
          assignment_id: assignmentId || null,
        })
        .select("id")
        .single();
      if (tErr || !ticket) {
        setError(tErr?.message || "?");
        return;
      }
      const { error: mErr } = await supabase
        .from("ticket_messages")
        .insert({ ticket_id: ticket.id, author_id: userId, body });
      if (mErr) {
        setError(mErr.message);
        return;
      }
      router.replace(`/${locale}/portail/etudiant/questions/${ticket.id}`);
    });
  }

  return (
    <motion.form
      onSubmit={submit}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5 rounded-2xl border border-white/10 bg-white/[0.03] p-6"
    >
      <Field label={dict.subjectLabel}>
        <input
          type="text"
          required
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder={dict.subjectPlaceholder}
          className="h-11 w-full rounded-xl border border-white/10 bg-background/70 px-3 text-sm text-foreground focus:border-brand/60 focus:outline-none"
        />
      </Field>

      <Field label={dict.categoryLabel}>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={`rounded-full border px-3.5 py-1.5 text-xs transition ${
                category === c
                  ? "border-brand/40 bg-brand/15 text-brand"
                  : "border-white/10 bg-white/5 text-muted hover:border-brand/30 hover:text-foreground"
              }`}
            >
              {dict.categories[c]}
            </button>
          ))}
        </div>
      </Field>

      {courses.length > 0 && (
        <Field label={dict.courseLabel}>
          <select
            value={courseId}
            onChange={(e) => {
              setCourseId(e.target.value);
              setAssignmentId("");
            }}
            className="h-11 w-full rounded-xl border border-white/10 bg-background/70 px-3 text-sm text-foreground focus:border-brand/60 focus:outline-none"
          >
            <option value="">{dict.none}</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </Field>
      )}

      {filteredAssignments.length > 0 && (
        <Field label={dict.assignmentLabel}>
          <select
            value={assignmentId}
            onChange={(e) => setAssignmentId(e.target.value)}
            className="h-11 w-full rounded-xl border border-white/10 bg-background/70 px-3 text-sm text-foreground focus:border-brand/60 focus:outline-none"
          >
            <option value="">{dict.none}</option>
            {filteredAssignments.map((a) => (
              <option key={a.id} value={a.id}>
                {a.label}
              </option>
            ))}
          </select>
        </Field>
      )}

      <Field label={dict.messageLabel}>
        <textarea
          rows={5}
          required
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={dict.messagePlaceholder}
          className="w-full rounded-xl border border-white/10 bg-background/70 px-3 py-2 text-sm text-foreground focus:border-brand/60 focus:outline-none"
        />
      </Field>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={pending || !subject || !body}
        className="inline-flex h-11 items-center gap-2 rounded-full bg-brand px-5 text-sm font-medium text-[#031019] transition hover:shadow-[0_12px_30px_-10px_rgba(79,195,220,0.6)] disabled:opacity-50"
      >
        <Send size={14} />
        {dict.sendCta}
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
