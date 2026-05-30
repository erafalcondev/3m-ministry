"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2 } from "lucide-react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/fr";

type AdminDict = Dictionary["portail"]["admin"];
type RelationshipLabels = Dictionary["portail"]["common"]["relationship"];

export type SimpleProfile = { id: string; label: string };

type RelationshipType = "academic" | "ministry_mentor" | "team_leader";

type Link = {
  coachId: string;
  studentId: string;
  relationshipType: RelationshipType;
  assignedAt: string;
};

const RELATIONSHIP_TYPES: RelationshipType[] = ["academic", "ministry_mentor", "team_leader"];

const RELATIONSHIP_COLORS: Record<RelationshipType, string> = {
  academic: "border-brand/30 bg-brand/10 text-brand",
  ministry_mentor: "border-amber-400/30 bg-amber-400/10 text-amber-200",
  team_leader: "border-purple-400/30 bg-purple-400/10 text-purple-200",
};

function fmtDate(iso: string, locale: Locale) {
  return new Date(iso).toLocaleDateString(locale === "fr" ? "fr-CA" : "en-CA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function AssignmentsClient({
  locale,
  dict,
  relationshipLabels,
  coaches,
  students,
  links,
}: {
  locale: Locale;
  dict: AdminDict;
  relationshipLabels: RelationshipLabels;
  coaches: SimpleProfile[];
  students: SimpleProfile[];
  links: Link[];
}) {
  const router = useRouter();
  const [coachId, setCoachId] = useState<string>(coaches[0]?.id ?? "");
  const [studentId, setStudentId] = useState<string>(students[0]?.id ?? "");
  const [relType, setRelType] = useState<RelationshipType>("academic");
  const [pending, startTransition] = useTransition();

  const coachLabel = useMemo(
    () => Object.fromEntries(coaches.map((c) => [c.id, c.label])),
    [coaches],
  );
  const studentLabel = useMemo(
    () => Object.fromEntries(students.map((s) => [s.id, s.label])),
    [students],
  );

  function assign() {
    if (!coachId || !studentId) return;
    startTransition(async () => {
      const supabase = getBrowserSupabase();
      const { error } = await supabase.rpc("assign_coach", {
        coach: coachId,
        student: studentId,
        rel: relType,
      });
      if (!error) router.refresh();
    });
  }

  function unassign(coach: string, student: string, rel: RelationshipType) {
    startTransition(async () => {
      const supabase = getBrowserSupabase();
      const { error } = await supabase.rpc("unassign_coach", { coach, student, rel });
      if (!error) router.refresh();
    });
  }

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_1fr_220px_auto] md:items-end">
          <label className="block">
            <span className="mb-1.5 block text-xs uppercase tracking-[0.18em] text-muted">
              {dict.assignCoach}
            </span>
            <select
              value={coachId}
              onChange={(e) => setCoachId(e.target.value)}
              disabled={coaches.length === 0}
              className="h-11 w-full rounded-xl border border-white/10 bg-background/70 px-3 text-sm text-foreground focus:border-brand/60 focus:outline-none focus:ring-2 focus:ring-brand/30 disabled:opacity-50"
            >
              {coaches.length === 0 ? (
                <option>—</option>
              ) : (
                coaches.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))
              )}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs uppercase tracking-[0.18em] text-muted">
              {dict.assignStudent}
            </span>
            <select
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              disabled={students.length === 0}
              className="h-11 w-full rounded-xl border border-white/10 bg-background/70 px-3 text-sm text-foreground focus:border-brand/60 focus:outline-none focus:ring-2 focus:ring-brand/30 disabled:opacity-50"
            >
              {students.length === 0 ? (
                <option>—</option>
              ) : (
                students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))
              )}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs uppercase tracking-[0.18em] text-muted">
              {dict.assignRelationship}
            </span>
            <select
              value={relType}
              onChange={(e) => setRelType(e.target.value as RelationshipType)}
              className="h-11 w-full rounded-xl border border-white/10 bg-background/70 px-3 text-sm text-foreground focus:border-brand/60 focus:outline-none focus:ring-2 focus:ring-brand/30"
            >
              {RELATIONSHIP_TYPES.map((r) => (
                <option key={r} value={r}>
                  {relationshipLabels[r]}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={assign}
            disabled={pending || !coachId || !studentId}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-medium text-[#031019] transition hover:shadow-[0_12px_30px_-10px_rgba(79,195,220,0.6)] disabled:opacity-50"
          >
            <Plus size={15} />
            {dict.assignCta}
          </button>
        </div>
      </motion.div>

      <div>
        <h2 className="font-display text-lg text-foreground">{dict.assignedTitle}</h2>
        <div className="mt-3 space-y-2">
          {links.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-10 text-center text-sm text-muted">
              {dict.assignedEmpty}
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {links.map((l) => (
                <motion.div
                  key={`${l.coachId}/${l.studentId}/${l.relationshipType}`}
                  layout
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3"
                >
                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] uppercase tracking-[0.18em] ${RELATIONSHIP_COLORS[l.relationshipType]}`}
                    >
                      {relationshipLabels[l.relationshipType]}
                    </span>
                    <span className="text-foreground">{coachLabel[l.coachId] || "—"}</span>
                    <span className="text-muted">↔</span>
                    <span className="text-foreground">{studentLabel[l.studentId] || "—"}</span>
                    <span className="text-[11px] text-muted/70">{fmtDate(l.assignedAt, locale)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => unassign(l.coachId, l.studentId, l.relationshipType)}
                    disabled={pending}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-muted transition hover:border-red-400/40 hover:bg-red-400/10 hover:text-red-200 disabled:opacity-50"
                  >
                    <Trash2 size={12} />
                    {dict.unassign}
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}
