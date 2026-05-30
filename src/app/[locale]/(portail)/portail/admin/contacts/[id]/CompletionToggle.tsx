"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, RotateCcw } from "lucide-react";
import { getBrowserSupabase } from "@/lib/supabase/client";

export function CompletionToggle({
  studentId,
  table,
  idColumn,
  refId,
  completed,
  labelMark,
  labelUndo,
}: {
  studentId: string;
  table: "student_course_completion" | "student_assignment_completion";
  idColumn: "course_id" | "assignment_id";
  refId: string;
  completed: boolean;
  labelMark: string;
  labelUndo: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    const supabase = getBrowserSupabase();
    if (completed) {
      await supabase.from(table).delete().eq("student_id", studentId).eq(idColumn, refId);
    } else {
      await supabase.from(table).insert({ student_id: studentId, [idColumn]: refId });
    }
    setBusy(false);
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      className={
        completed
          ? "inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-[11px] font-medium text-emerald-200 hover:bg-emerald-400/15 disabled:opacity-50"
          : "inline-flex items-center gap-1.5 rounded-full bg-brand px-3 py-1 text-[11px] font-medium text-[#031019] shadow-[0_6px_18px_-6px_rgba(79,195,220,0.5)] hover:scale-[1.03] disabled:opacity-50"
      }
    >
      {completed ? <RotateCcw size={11} /> : <Check size={11} />}
      {completed ? labelUndo : labelMark}
    </button>
  );
}
