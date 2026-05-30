import Link from "next/link";
import { redirect } from "next/navigation";
import { BookOpen, ClipboardList, FolderOpen, Clock, ArrowRight, Layers, ExternalLink } from "lucide-react";
import { type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getServerSupabase } from "@/lib/supabase/server";
import { portailLanding, type UserRole } from "@/lib/supabase/types";
import { PageHeader } from "@/components/portail/PageHeader";

function fmtDate(iso: string | null, locale: Locale): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString(locale === "fr" ? "fr-CA" : "en-CA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default async function StudentDashboard({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const dict = getDictionary(locale as Locale);
  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login`);

  const { data: profile } = await supabase
    .from("profiles")
    .select("role,full_name")
    .eq("id", user.id)
    .single();
  if (profile?.role && profile.role !== "student") {
    redirect(portailLanding(locale, profile.role as UserRole));
  }

  // Cohorts this student is in
  const { data: cohortLinks } = await supabase
    .from("cohort_members")
    .select("cohort_id")
    .eq("student_id", user.id);
  const myCohortIds = (cohortLinks ?? []).map((c) => c.cohort_id as string);
  let myCohorts: { id: string; name: string }[] = [];
  if (myCohortIds.length > 0) {
    const { data: cohortRows } = await supabase
      .from("cohorts")
      .select("id,name")
      .in("id", myCohortIds);
    myCohorts = (cohortRows ?? []).map((c) => ({
      id: c.id as string,
      name: c.name as string,
    }));
  }

  // Direct course access
  const { data: directCourses } = await supabase
    .from("course_students")
    .select("course_id")
    .eq("student_id", user.id);
  // Course access via cohort
  let cohortCourseIds: string[] = [];
  if (myCohortIds.length > 0) {
    const { data: viaCohort } = await supabase
      .from("course_cohorts")
      .select("course_id")
      .in("cohort_id", myCohortIds);
    cohortCourseIds = (viaCohort ?? []).map((c) => c.course_id as string);
  }
  const courseIds = Array.from(
    new Set([
      ...((directCourses ?? []).map((c) => c.course_id as string)),
      ...cohortCourseIds,
    ]),
  );

  let courses: {
    id: string;
    title: string;
    description: string | null;
    externalUrl: string | null;
    programCode: string | null;
    programColor: string | null;
  }[] = [];
  let assignments: {
    id: string;
    title: string;
    externalUrl: string | null;
    instructions: string | null;
    dueDate: string | null;
    courseTitle: string;
  }[] = [];
  let resources: { id: string; title: string; kind: string; url: string | null; storagePath: string | null }[] = [];

  if (courseIds.length > 0) {
    const [{ data: courseRows }, { data: programsRows }, { data: asgRows }, { data: crRows }] = await Promise.all([
      supabase.from("courses").select("id,title,description,external_url,program_id").in("id", courseIds).eq("status", "published"),
      supabase.from("programs").select("id,code,color"),
      supabase
        .from("assignments")
        .select("id,title,external_url,instructions,due_date,course_id")
        .in("course_id", courseIds)
        .order("due_date", { ascending: true })
        .limit(8),
      supabase.from("course_resources").select("course_id,resource_id").in("course_id", courseIds),
    ]);

    const programMap = new Map(
      (programsRows ?? []).map((p) => [
        p.id as string,
        { code: p.code as string, color: p.color as string },
      ]),
    );
    const courseTitleMap = new Map(
      (courseRows ?? []).map((c) => [c.id as string, c.title as string]),
    );
    courses = (courseRows ?? []).map((c) => {
      const prog = c.program_id ? programMap.get(c.program_id as string) : null;
      return {
        id: c.id as string,
        title: c.title as string,
        description: c.description as string | null,
        externalUrl: c.external_url as string | null,
        programCode: prog?.code ?? null,
        programColor: prog?.color ?? null,
      };
    });
    assignments = (asgRows ?? []).map((a) => ({
      id: a.id as string,
      title: a.title as string,
      externalUrl: a.external_url as string | null,
      instructions: a.instructions as string | null,
      dueDate: a.due_date as string | null,
      courseTitle: courseTitleMap.get(a.course_id as string) ?? "—",
    }));

    const resourceIds = Array.from(new Set((crRows ?? []).map((r) => r.resource_id as string)));
    if (resourceIds.length > 0) {
      const { data: resRows } = await supabase
        .from("resources")
        .select("id,title,kind,url,storage_path")
        .in("id", resourceIds);
      resources = (resRows ?? []).map((r) => ({
        id: r.id as string,
        title: r.title as string,
        kind: r.kind as string,
        url: r.url as string | null,
        storagePath: r.storage_path as string | null,
      }));
    }
  }

  // Completion for THIS student
  const [{ data: courseCompletions }, { data: asgCompletions }] = await Promise.all([
    supabase
      .from("student_course_completion")
      .select("course_id")
      .eq("student_id", user.id),
    supabase
      .from("student_assignment_completion")
      .select("assignment_id")
      .eq("student_id", user.id),
  ]);
  const completedCourseIds = new Set((courseCompletions ?? []).map((c) => c.course_id as string));
  const completedAsgIds = new Set((asgCompletions ?? []).map((a) => a.assignment_id as string));
  const totalCount = courses.length + assignments.length;
  const doneCount = completedCourseIds.size + completedAsgIds.size;
  const completionPct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  return (
    <>
      <PageHeader title={dict.portail.student.welcome} />

      {totalCount > 0 && (
        <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-display text-base text-foreground">
              {dict.portail.contact.completionTitle}
            </h2>
            <span className="text-xs text-muted">
              {doneCount} / {totalCount} · {completionPct}%
            </span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full rounded-full bg-brand transition-all"
              style={{ width: `${completionPct}%` }}
            />
          </div>
        </section>
      )}

      <section className="mt-8 grid grid-cols-1 gap-3 md:grid-cols-3">
        <StatCard label={dict.portail.sidebar.links.courses} value={courses.length} icon={<BookOpen size={18} />} />
        <StatCard label={dict.portail.sidebar.links.assignments} value={assignments.length} icon={<ClipboardList size={18} />} />
        <StatCard label={dict.portail.sidebar.links.resources} value={resources.length} icon={<FolderOpen size={18} />} />
      </section>

      {/* My courses */}
      <section className="mt-10">
        <h2 className="mb-3 font-display text-lg text-foreground">{dict.portail.student.courses.title}</h2>
        {courses.length === 0 ? (
          <EmptyCard text={dict.portail.student.courses.body} />
        ) : (
          <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {courses.map((c) => {
              const inner = (
                <div className="group flex h-full items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-brand/40 hover:bg-brand/[0.06]">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {c.programColor && (
                        <span className="h-2 w-2 rounded-full" style={{ background: c.programColor }} aria-hidden />
                      )}
                      {c.programCode && (
                        <span className="text-[10px] uppercase tracking-[0.18em] text-muted">{c.programCode}</span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-foreground">{c.title}</p>
                    {c.description && <p className="mt-1 text-xs text-muted line-clamp-2">{c.description}</p>}
                  </div>
                  {c.externalUrl ? (
                    <ExternalLink size={14} className="ml-3 shrink-0 text-muted transition group-hover:text-brand" />
                  ) : (
                    <ArrowRight size={14} className="ml-3 shrink-0 text-muted transition group-hover:text-brand" />
                  )}
                </div>
              );
              return (
                <li key={c.id}>
                  {c.externalUrl ? (
                    <a href={c.externalUrl} target="_blank" rel="noopener noreferrer">{inner}</a>
                  ) : (
                    inner
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Upcoming assignments */}
      <section className="mt-10">
        <h2 className="mb-3 font-display text-lg text-foreground">{dict.portail.student.assignments.title}</h2>
        {assignments.length === 0 ? (
          <EmptyCard text={dict.portail.student.assignments.body} />
        ) : (
          <ul className="space-y-2">
            {assignments.map((a) => (
              <li
                key={a.id}
                className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-foreground">{a.title}</p>
                    <p className="text-xs text-muted">{a.courseTitle}</p>
                    {a.instructions && (
                      <p className="mt-1 text-xs text-muted line-clamp-2 text-pretty">{a.instructions}</p>
                    )}
                  </div>
                  {a.dueDate && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-muted">
                      <Clock size={11} />
                      {fmtDate(a.dueDate, locale as Locale)}
                    </span>
                  )}
                </div>
                {a.externalUrl && (
                  <a
                    href={a.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-brand/15 px-3 py-1 text-[11px] text-brand transition hover:bg-brand/25"
                  >
                    <ExternalLink size={11} />
                    {a.externalUrl.replace(/^https?:\/\//, "").slice(0, 50)}
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Recent resources */}
      <section className="mt-10">
        <h2 className="mb-3 font-display text-lg text-foreground">{dict.portail.student.resources.title}</h2>
        {resources.length === 0 ? (
          <EmptyCard text={dict.portail.student.resources.body} />
        ) : (
          <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {resources.slice(0, 8).map((r) => (
              <li key={r.id}>
                {r.url ? (
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm transition hover:border-brand/40 hover:bg-brand/[0.06]"
                  >
                    <ExternalLink size={14} className="text-brand/80" />
                    <span className="min-w-0 flex-1 truncate text-foreground">{r.title}</span>
                  </a>
                ) : (
                  <div className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm">
                    <FolderOpen size={14} className="text-brand/80" />
                    <span className="min-w-0 flex-1 truncate text-foreground">{r.title}</span>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* My cohorts */}
      {myCohorts.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 flex items-center gap-2 font-display text-lg text-foreground">
            <Layers size={18} className="text-brand" />
            {dict.portail.sidebar.links.cohorts}
          </h2>
          <ul className="flex flex-wrap gap-2">
            {myCohorts.map((c) => (
              <li
                key={c.id}
                className="rounded-full border border-white/10 bg-brand/10 px-3 py-1 text-xs text-brand"
              >
                {c.name}
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-center justify-between">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/15 text-brand">{icon}</span>
        <span className="font-display text-2xl text-foreground">{value}</span>
      </div>
      <p className="mt-2 text-xs uppercase tracking-[0.18em] text-muted">{label}</p>
    </div>
  );
}

function EmptyCard({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-10 text-center text-sm text-muted">
      {text}
    </div>
  );
}
