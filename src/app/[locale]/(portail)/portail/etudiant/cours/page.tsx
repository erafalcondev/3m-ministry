import Link from "next/link";
import { redirect } from "next/navigation";
import { BookOpen, ExternalLink, ArrowRight } from "lucide-react";
import { type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getServerSupabase } from "@/lib/supabase/server";
import { PageHeader } from "@/components/portail/PageHeader";

export default async function StudentCoursesPage({
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

  let courses: { id: string; title: string; description: string | null; externalUrl: string | null; programCode: string | null; programColor: string | null }[] = [];
  if (courseIds.length > 0) {
    const [{ data: rows }, { data: progs }] = await Promise.all([
      supabase
        .from("courses")
        .select("id,title,description,external_url,program_id")
        .in("id", courseIds)
        .eq("status", "published"),
      supabase.from("programs").select("id,code,color"),
    ]);
    const progMap = new Map((progs ?? []).map((p) => [p.id as string, { code: p.code as string, color: p.color as string }]));
    courses = (rows ?? []).map((c) => {
      const prog = c.program_id ? progMap.get(c.program_id as string) : null;
      return {
        id: c.id as string,
        title: c.title as string,
        description: c.description as string | null,
        externalUrl: c.external_url as string | null,
        programCode: prog?.code ?? null,
        programColor: prog?.color ?? null,
      };
    });
  }

  return (
    <>
      <PageHeader title={dict.portail.student.courses.title} />
      <div className="mt-6">
        {courses.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-16 text-center">
            <BookOpen size={36} className="text-muted/60" />
            <p className="mt-4 text-sm text-muted text-pretty">{dict.portail.studentPages.coursesEmpty}</p>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {courses.map((c) => {
              const inner = (
                <div className="group flex h-full items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-brand/40 hover:bg-brand/[0.06]">
                  <div className="min-w-0">
                    {c.programCode && (
                      <div className="mb-1 flex items-center gap-2">
                        {c.programColor && <span className="h-2 w-2 rounded-full" style={{ background: c.programColor }} aria-hidden />}
                        <span className="text-[10px] uppercase tracking-[0.18em] text-muted">{c.programCode}</span>
                      </div>
                    )}
                    <p className="text-sm text-foreground">{c.title}</p>
                    {c.description && <p className="mt-1 text-xs text-muted line-clamp-2 text-pretty">{c.description}</p>}
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
      </div>
    </>
  );
}
