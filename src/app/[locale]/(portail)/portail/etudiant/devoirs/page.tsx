import { redirect } from "next/navigation";
import { ClipboardList, Clock, ExternalLink } from "lucide-react";
import { type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getServerSupabase } from "@/lib/supabase/server";
import { PageHeader } from "@/components/portail/PageHeader";

function fmtDate(iso: string, locale: Locale) {
  return new Date(iso).toLocaleDateString(locale === "fr" ? "fr-CA" : "en-CA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default async function StudentAssignmentsPage({
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

  const { data: cohortLinks } = await supabase
    .from("cohort_members")
    .select("cohort_id")
    .eq("student_id", user.id);
  const myCohortIds = (cohortLinks ?? []).map((c) => c.cohort_id as string);
  const { data: directCourses } = await supabase
    .from("course_students")
    .select("course_id")
    .eq("student_id", user.id);
  let viaCohort: string[] = [];
  if (myCohortIds.length > 0) {
    const { data } = await supabase
      .from("course_cohorts")
      .select("course_id")
      .in("cohort_id", myCohortIds);
    viaCohort = (data ?? []).map((c) => c.course_id as string);
  }
  const courseIds = Array.from(
    new Set([
      ...((directCourses ?? []).map((c) => c.course_id as string)),
      ...viaCohort,
    ]),
  );

  let assignments: { id: string; title: string; courseTitle: string; dueDate: string | null; externalUrl: string | null; instructions: string | null }[] = [];
  let completedIds = new Set<string>();
  if (courseIds.length > 0) {
    const [{ data: asgRows }, { data: courseRows }, { data: completions }] = await Promise.all([
      supabase
        .from("assignments")
        .select("id,title,external_url,instructions,due_date,course_id")
        .in("course_id", courseIds)
        .order("due_date", { ascending: true }),
      supabase.from("courses").select("id,title").in("id", courseIds),
      supabase
        .from("student_assignment_completion")
        .select("assignment_id")
        .eq("student_id", user.id),
    ]);
    const titleMap = new Map((courseRows ?? []).map((c) => [c.id as string, c.title as string]));
    completedIds = new Set((completions ?? []).map((c) => c.assignment_id as string));
    assignments = (asgRows ?? []).map((a) => ({
      id: a.id as string,
      title: a.title as string,
      courseTitle: titleMap.get(a.course_id as string) ?? "—",
      dueDate: a.due_date as string | null,
      externalUrl: a.external_url as string | null,
      instructions: a.instructions as string | null,
    }));
  }

  const active = assignments.filter((a) => !completedIds.has(a.id));

  return (
    <>
      <PageHeader title={dict.portail.student.assignments.title} />
      <div className="mt-6">
        {active.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-16 text-center">
            <ClipboardList size={36} className="text-muted/60" />
            <p className="mt-4 text-sm text-muted text-pretty">{dict.portail.studentPages.assignmentsEmpty}</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {active.map((a) => (
              <li key={a.id} className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 text-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-foreground">{a.title}</p>
                    <p className="text-xs text-muted">{a.courseTitle}</p>
                    {a.instructions && <p className="mt-1 text-xs text-muted line-clamp-3 text-pretty">{a.instructions}</p>}
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
      </div>
    </>
  );
}
