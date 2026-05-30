"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, UserPlus, ExternalLink } from "lucide-react";
import Link from "next/link";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { SearchPicker } from "@/components/ui/SearchPicker";
import type { Dictionary } from "@/i18n/dictionaries/fr";
import type { Locale } from "@/i18n/config";

type CohortsDict = Dictionary["portail"]["cohorts"];

type Student = { id: string; label: string; email: string; status: string; joinedAt: string };
type EligibleOption = { id: string; label: string; email: string };

export function CohortMembersClient({
  cohortId,
  locale,
  students,
  eligible,
  dict,
  canWrite,
}: {
  cohortId: string;
  locale: Locale;
  students: Student[];
  eligible: EligibleOption[];
  dict: CohortsDict;
  canWrite: boolean;
}) {
  const router = useRouter();
  const [picking, setPicking] = useState(false);
  const [selected, setSelected] = useState(eligible[0]?.id ?? "");
  const [pending, startTransition] = useTransition();

  function add() {
    if (!selected) return;
    startTransition(async () => {
      const supabase = getBrowserSupabase();
      const { error } = await supabase.rpc("add_cohort_member", { cohort: cohortId, student: selected });
      if (!error) {
        setPicking(false);
        router.refresh();
      }
    });
  }

  function remove(studentId: string) {
    startTransition(async () => {
      const supabase = getBrowserSupabase();
      const { error } = await supabase.rpc("remove_cohort_member", { cohort: cohortId, student: studentId });
      if (!error) router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      {canWrite && (
        <>
          {!picking ? (
            <button
              type="button"
              onClick={() => setPicking(true)}
              disabled={eligible.length === 0}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-muted transition hover:border-brand/40 hover:bg-brand/10 hover:text-foreground disabled:opacity-50"
            >
              <UserPlus size={14} />
              {dict.detailAddMember}
            </button>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3"
            >
              <div className="flex-1 min-w-[240px]">
                <SearchPicker
                  options={eligible.map((s) => ({ id: s.id, label: s.label, secondary: s.email }))}
                  value={selected}
                  onChange={setSelected}
                  placeholder={dict.detailAddMember}
                />
              </div>
              <button
                type="button"
                onClick={add}
                disabled={pending || !selected}
                className="inline-flex h-11 items-center gap-1.5 rounded-full bg-brand px-4 text-xs font-medium text-[#031019] hover:shadow-[0_10px_30px_-10px_rgba(79,195,220,0.6)] disabled:opacity-50"
              >
                <Plus size={13} />
                {dict.detailAddMember}
              </button>
              <button
                type="button"
                onClick={() => setPicking(false)}
                className="rounded-full p-1 text-muted hover:bg-white/5 hover:text-foreground"
                aria-label="Cancel"
              >
                <X size={15} />
              </button>
            </motion.div>
          )}
        </>
      )}

      {students.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-10 text-center text-sm text-muted">
          {dict.detailMembersEmpty}
        </div>
      ) : (
        <ul className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] divide-y divide-white/5">
          <AnimatePresence initial={false}>
            {students.map((s) => (
              <motion.li
                key={s.id}
                layout
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-sm"
              >
                <Link
                  href={`/${locale}/portail/admin/contacts/${s.id}`}
                  className="group flex flex-1 items-center gap-3 min-w-0"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand/15 text-[10px] font-medium text-brand">
                    {(s.label.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join("") || s.email.slice(0, 2)).toUpperCase()}
                  </span>
                  <span className="min-w-0">
                    <p className="truncate text-foreground transition group-hover:text-brand">{s.label}</p>
                    <p className="truncate text-xs text-muted">{s.email}</p>
                  </span>
                  <ExternalLink size={12} className="ml-auto text-muted opacity-0 transition group-hover:opacity-100" />
                </Link>
                {canWrite && (
                  <button
                    type="button"
                    onClick={() => remove(s.id)}
                    disabled={pending}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-muted transition hover:border-red-400/40 hover:bg-red-400/10 hover:text-red-200 disabled:opacity-50"
                  >
                    {dict.detailRemoveMember}
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
