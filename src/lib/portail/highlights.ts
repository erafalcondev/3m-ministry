import type { getServerSupabase } from "@/lib/supabase/server";
import type { Highlight } from "@/components/portail/HighlightsCard";

type HighlightsDict = {
  pendingApprovals: string;
  cohortStartingSoon: string;
  cohortEndingSoon: string;
  studentsWithoutCoach: string;
  newRegistrationsThisWeek: string;
  coachesWithoutStudents: string;
};

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

function fmt(template: string, ...args: (string | number)[]): string {
  let i = 0;
  return template.replace(/%[sd]/g, () => String(args[i++] ?? ""));
}

export async function computeHighlights(
  supabase: Awaited<ReturnType<typeof getServerSupabase>>,
  dict: HighlightsDict,
): Promise<Highlight[]> {
  const out: Highlight[] = [];
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86_400_000).toISOString();

  const [pendingRes, recentRes, cohortsRes, coachesRes] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .gte("created_at", sevenDaysAgo),
    supabase
      .from("cohorts")
      .select("name,start_date,end_date,status")
      .in("status", ["planned", "active"]),
    supabase.from("profiles").select("id").eq("role", "coach").eq("status", "approved"),
  ]);

  const pending = pendingRes.count ?? 0;
  if (pending > 0) out.push({ kind: "warn", text: fmt(dict.pendingApprovals, pending) });

  const recent = recentRes.count ?? 0;
  if (recent > 0) out.push({ kind: "info", text: fmt(dict.newRegistrationsThisWeek, recent) });

  for (const c of cohortsRes.data ?? []) {
    const start = new Date(c.start_date as string);
    const end = new Date(c.end_date as string);
    const daysToStart = daysBetween(now, start);
    const daysToEnd = daysBetween(now, end);
    if (c.status === "planned" && daysToStart > 0 && daysToStart <= 30) {
      out.push({
        kind: "info",
        text: fmt(dict.cohortStartingSoon, c.name as string, daysToStart),
      });
    }
    if (c.status === "active" && daysToEnd > 0 && daysToEnd <= 30) {
      out.push({
        kind: "ok",
        text: fmt(dict.cohortEndingSoon, c.name as string, daysToEnd),
      });
    }
  }

  // Coaches without students
  const coachIds = (coachesRes.data ?? []).map((c) => c.id as string);
  if (coachIds.length > 0) {
    const { data: linkedCoaches } = await supabase
      .from("coach_student_links")
      .select("coach_id")
      .in("coach_id", coachIds);
    const linkedSet = new Set((linkedCoaches ?? []).map((l) => l.coach_id as string));
    const idle = coachIds.filter((id) => !linkedSet.has(id)).length;
    if (idle > 0) out.push({ kind: "warn", text: fmt(dict.coachesWithoutStudents, idle) });
  }

  // Students without an academic coach
  const { data: students } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "student")
    .eq("status", "approved");
  const studentIds = (students ?? []).map((s) => s.id as string);
  if (studentIds.length > 0) {
    const { data: linked } = await supabase
      .from("coach_student_links")
      .select("student_id")
      .eq("relationship_type", "academic")
      .in("student_id", studentIds);
    const linkedSet = new Set((linked ?? []).map((l) => l.student_id as string));
    const orphan = studentIds.filter((id) => !linkedSet.has(id)).length;
    if (orphan > 0) out.push({ kind: "warn", text: fmt(dict.studentsWithoutCoach, orphan) });
  }

  return out;
}
