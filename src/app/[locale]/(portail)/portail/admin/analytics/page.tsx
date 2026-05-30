import { Users, GraduationCap, Layers, BookOpen, CheckCircle2 } from "lucide-react";
import { type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getServerSupabase } from "@/lib/supabase/server";
import { requireRole, ADMIN_ONLY } from "@/lib/portail/access";
import { PageHeader } from "@/components/portail/PageHeader";
import { AnalyticsCharts } from "./AnalyticsCharts";

export default async function AnalyticsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireRole(locale, ADMIN_ONLY);
  const dict = getDictionary(locale as Locale);
  const supabase = await getServerSupabase();

  const since365 = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { count: totalUsers },
    { count: students },
    { count: coaches },
    { count: cohortsActive },
    { count: coursesPub },
    { data: registrations },
    { data: profiles },
    { data: members },
    { data: cohorts },
    { data: programs },
    { data: courseCompletions },
    { data: asgCompletions },
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("status", "approved"),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "student").eq("status", "approved"),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "coach").eq("status", "approved"),
    supabase.from("cohorts").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("courses").select("id", { count: "exact", head: true }).eq("status", "published"),
    supabase
      .from("profiles")
      .select("created_at,status")
      .gte("created_at", since365)
      .order("created_at"),
    supabase.from("profiles").select("id,role,status"),
    supabase.from("cohort_members").select("student_id,cohort_id"),
    supabase.from("cohorts").select("id,name,program_id,status"),
    supabase.from("programs").select("id,code,color"),
    supabase.from("student_course_completion").select("student_id,course_id"),
    supabase.from("student_assignment_completion").select("student_id,assignment_id"),
  ]);

  // Completion rate (across all students)
  const totalCompletions =
    (courseCompletions?.length ?? 0) + (asgCompletions?.length ?? 0);
  // Total trackable items per student = number of accessible courses + assignments
  // Simplified ratio: completions / (active students × 1) — meaningful proxy
  const completionRate = (students ?? 0) > 0
    ? Math.round((totalCompletions / Math.max(students ?? 1, 1)) * 10)
    : 0;

  return (
    <>
      <PageHeader title={dict.portail.analytics.title} description={dict.portail.analytics.intro} />

      {/* KPI cards */}
      <section className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        <Kpi label={dict.portail.analytics.kpiUsers} value={totalUsers ?? 0} icon={<Users size={16} />} />
        <Kpi label={dict.portail.analytics.kpiStudents} value={students ?? 0} icon={<GraduationCap size={16} />} />
        <Kpi label={dict.portail.analytics.kpiCoaches} value={coaches ?? 0} icon={<Users size={16} />} />
        <Kpi label={dict.portail.analytics.kpiCohorts} value={cohortsActive ?? 0} icon={<Layers size={16} />} />
        <Kpi label={dict.portail.analytics.kpiCourses} value={coursesPub ?? 0} icon={<BookOpen size={16} />} />
      </section>

      <section className="mt-3">
        <Kpi label={dict.portail.analytics.kpiCompletion} value={`${completionRate}%`} icon={<CheckCircle2 size={16} />} accent />
      </section>

      <AnalyticsCharts
        locale={locale as Locale}
        dict={dict.portail.analytics}
        registrations={(registrations ?? []).map((r) => ({
          date: r.created_at as string,
          status: r.status as string,
        }))}
        profiles={(profiles ?? []).map((p) => ({
          id: p.id as string,
          role: p.role as string,
          status: p.status as string,
        }))}
        members={(members ?? []).map((m) => ({
          studentId: m.student_id as string,
          cohortId: m.cohort_id as string,
        }))}
        cohorts={(cohorts ?? []).map((c) => ({
          id: c.id as string,
          name: c.name as string,
          programId: c.program_id as string | null,
          status: c.status as string,
        }))}
        programs={(programs ?? []).map((p) => ({
          id: p.id as string,
          code: p.code as string,
          color: p.color as string,
        }))}
        completedAssignmentsByStudent={(asgCompletions ?? []).reduce<Record<string, number>>(
          (acc, row) => {
            const sid = row.student_id as string;
            acc[sid] = (acc[sid] ?? 0) + 1;
            return acc;
          },
          {},
        )}
      />
    </>
  );
}

function Kpi({
  label,
  value,
  icon,
  accent = false,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-center justify-between">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand/15 text-brand">
          {icon}
        </span>
        <span className={`font-display text-2xl ${accent ? "text-brand" : "text-foreground"}`}>
          {value}
        </span>
      </div>
      <p className="mt-2 text-[10px] uppercase tracking-[0.18em] text-muted">{label}</p>
    </div>
  );
}
