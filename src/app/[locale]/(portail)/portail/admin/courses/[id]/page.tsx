import Link from "next/link";
import { ArrowLeft, Calendar, Users as UsersIcon, ExternalLink } from "lucide-react";
import { notFound } from "next/navigation";
import { type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getServerSupabase } from "@/lib/supabase/server";
import { requireRole, ADMIN_ONLY } from "@/lib/portail/access";
import { CourseDetailClient } from "./CourseDetailClient";
import { CourseEditClient } from "./CourseEditClient";

const STATUS_COLORS: Record<string, string> = {
  draft: "border-white/10 bg-white/5 text-muted",
  published: "border-brand/30 bg-brand/10 text-brand",
  archived: "border-amber-300/30 bg-amber-300/10 text-amber-200",
};

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const me = await requireRole(locale, ADMIN_ONLY);
  const dict = getDictionary(locale as Locale);
  const supabase = await getServerSupabase();

  const { data: course } = await supabase
    .from("courses")
    .select("id,title,description,external_url,status,program_id,instructor_id,created_at")
    .eq("id", id)
    .single();
  if (!course) notFound();

  const [
    { data: program },
    { data: instructor },
    { data: courseRes },
    { data: allResources },
    { data: assignments },
    { data: notes },
    { data: courseStudents },
    { data: courseCohorts },
    { data: allStudents },
    { data: allCohorts },
  ] = await Promise.all([
    course.program_id
      ? supabase.from("programs").select("code,name_fr,name_en,color").eq("id", course.program_id as string).single()
      : Promise.resolve({ data: null }),
    course.instructor_id
      ? supabase.from("profiles").select("email,full_name").eq("id", course.instructor_id as string).single()
      : Promise.resolve({ data: null }),
    supabase.from("course_resources").select("resource_id,sort_order").eq("course_id", id).order("sort_order"),
    supabase.from("resources").select("id,title,kind,language").order("title"),
    supabase.from("assignments").select("id,title,instructions,external_url,due_date,resource_id,created_at").eq("course_id", id).order("due_date"),
    supabase.from("course_notes").select("id,author_id,body,created_at").eq("course_id", id).order("created_at", { ascending: false }),
    supabase.from("course_students").select("student_id").eq("course_id", id),
    supabase.from("course_cohorts").select("cohort_id").eq("course_id", id),
    supabase.from("profiles").select("id,email,full_name,role").eq("status", "approved").order("full_name"),
    supabase.from("cohorts").select("id,name").order("name"),
  ]);

  const resourceMap = new Map(
    (allResources ?? []).map((r) => [
      r.id as string,
      { title: r.title as string, kind: r.kind as string, language: r.language as string },
    ]),
  );
  const attachedResources = (courseRes ?? []).map((cr) => {
    const r = resourceMap.get(cr.resource_id as string);
    return {
      id: cr.resource_id as string,
      title: r?.title ?? "—",
      kind: r?.kind ?? "link",
      language: r?.language ?? "fr",
    };
  });
  const attachedIds = new Set(attachedResources.map((r) => r.id));
  const availableResources = (allResources ?? [])
    .filter((r) => !attachedIds.has(r.id as string))
    .map((r) => ({
      id: r.id as string,
      label: r.title as string,
      secondary: `${r.kind} · ${r.language?.toString().toUpperCase()}`,
    }));

  const memberStudentIds = new Set((courseStudents ?? []).map((s) => s.student_id as string));
  const memberCohortIds = new Set((courseCohorts ?? []).map((c) => c.cohort_id as string));

  const profileMap = new Map(
    (allStudents ?? []).map((s) => [
      s.id as string,
      (s.full_name as string | null) || (s.email as string),
    ]),
  );
  const cohortNameMap = new Map((allCohorts ?? []).map((c) => [c.id as string, c.name as string]));

  const studentRows = Array.from(memberStudentIds).map((sid) => ({
    id: sid,
    name: profileMap.get(sid) ?? "—",
  }));
  const cohortRows = Array.from(memberCohortIds).map((cid) => ({
    id: cid,
    name: cohortNameMap.get(cid) ?? "—",
  }));

  const eligibleStudents = (allStudents ?? [])
    .filter((s) => !memberStudentIds.has(s.id as string))
    .map((s) => ({
      id: s.id as string,
      label: (s.full_name as string | null) || (s.email as string),
      secondary: `${s.email as string} · ${s.role as string}`,
    }));
  const eligibleCohorts = (allCohorts ?? [])
    .filter((c) => !memberCohortIds.has(c.id as string))
    .map((c) => ({ id: c.id as string, label: c.name as string }));

  // Programs + instructors for the inline course-edit form
  const { data: programOptionsRaw } = await supabase
    .from("programs")
    .select("id,code,name_fr,name_en")
    .eq("active", true)
    .order("sort_order");
  const programOptions = (programOptionsRaw ?? []).map((p) => ({
    id: p.id as string,
    label: `${p.code as string} · ${(locale === "fr" ? p.name_fr : p.name_en) as string}`,
  }));
  const { data: instructorOptionsRaw } = await supabase
    .from("profiles")
    .select("id,email,full_name,role")
    .in("role", ["coach", "coordinator", "director", "admin"])
    .eq("status", "approved")
    .order("full_name");
  const instructorOptions = (instructorOptionsRaw ?? []).map((p) => ({
    id: p.id as string,
    label: `${(p.full_name as string | null) || (p.email as string)} · ${p.role as string}`,
  }));

  // Notes authors
  const authorIds = Array.from(new Set((notes ?? []).map((n) => n.author_id as string | null).filter(Boolean) as string[]));
  let authorNameMap = new Map<string, string>();
  if (authorIds.length > 0) {
    const { data: authors } = await supabase.from("profiles").select("id,email,full_name").in("id", authorIds);
    authorNameMap = new Map(
      (authors ?? []).map((a) => [
        a.id as string,
        (a.full_name as string | null) || (a.email as string),
      ]),
    );
  }

  return (
    <>
      <Link
        href={`/${locale}/portail/admin/courses`}
        className="mb-5 inline-flex items-center gap-1.5 text-xs text-muted transition hover:text-foreground"
      >
        <ArrowLeft size={13} />
        {dict.portail.courses.backToCourses}
      </Link>

      <header className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            {program && (
              <div className="mb-2 flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: program.color as string }}
                  aria-hidden
                />
                <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
                  {program.code as string}
                </span>
                <span className="text-[11px] text-muted">
                  · {(locale === "fr" ? program.name_fr : program.name_en) as string}
                </span>
              </div>
            )}
            <h1 className="font-display text-2xl text-foreground md:text-[28px]">{course.title as string}</h1>
            {course.description && (
              <p className="mt-2 max-w-2xl text-sm text-muted text-pretty">{course.description as string}</p>
            )}
            {course.external_url && (
              <a
                href={course.external_url as string}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-brand/15 px-3 py-1.5 text-xs font-medium text-brand transition hover:bg-brand/25"
              >
                <ExternalLink size={12} />
                {dict.portail.courses.openExternal}
              </a>
            )}
            <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted">
              {instructor && (
                <span className="inline-flex items-center gap-1.5">
                  <UsersIcon size={11} />
                  {(instructor.full_name as string | null) || (instructor.email as string)}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5">
                <Calendar size={11} />
                {new Date(course.created_at as string).toLocaleDateString(locale === "fr" ? "fr-CA" : "en-CA", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
          <span
            className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.18em] ${STATUS_COLORS[course.status as string]}`}
          >
            {dict.portail.courses[`status${(course.status as string).charAt(0).toUpperCase() + (course.status as string).slice(1)}` as keyof typeof dict.portail.courses] as string}
          </span>
        </div>

        <CourseEditClient
          course={{
            id: course.id as string,
            title: course.title as string,
            description: course.description as string | null,
            externalUrl: course.external_url as string | null,
            programId: course.program_id as string | null,
            instructorId: course.instructor_id as string | null,
            status: course.status as "draft" | "published" | "archived",
          }}
          dict={dict.portail.courses}
          programs={programOptions}
          instructors={instructorOptions}
          locale={locale}
        />
      </header>

      <CourseDetailClient
        courseId={id}
        currentUserId={me.id}
        locale={locale as Locale}
        dict={dict.portail.courses}
        resources={attachedResources}
        availableResources={availableResources}
        assignments={(assignments ?? []).map((a) => ({
          id: a.id as string,
          title: a.title as string,
          instructions: a.instructions as string | null,
          externalUrl: a.external_url as string | null,
          dueDate: a.due_date as string | null,
          resourceId: a.resource_id as string | null,
        }))}
        attachedCohorts={cohortRows}
        attachedStudents={studentRows}
        eligibleCohorts={eligibleCohorts}
        eligibleStudents={eligibleStudents}
        notes={(notes ?? []).map((n) => ({
          id: n.id as string,
          authorId: n.author_id as string | null,
          authorName: n.author_id ? authorNameMap.get(n.author_id as string) ?? "—" : "—",
          body: n.body as string,
          createdAt: n.created_at as string,
        }))}
      />
    </>
  );
}
