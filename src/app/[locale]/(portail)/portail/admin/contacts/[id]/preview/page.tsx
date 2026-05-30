import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BookOpen, ClipboardList, FolderOpen, Clock, Layers, ExternalLink, Eye } from "lucide-react";
import { type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getServerSupabase } from "@/lib/supabase/server";
import { requireRole, ADMIN_ONLY } from "@/lib/portail/access";

function fmtDate(iso: string | null, locale: Locale): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString(locale === "fr" ? "fr-CA" : "en-CA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/**
 * Admin-only preview of what a given student sees on their /portail/etudiant
 * dashboard. We render the same blocks with the same data sources, scoped to
 * the chosen student's id rather than auth.uid().
 *
 * This is a "look like" preview, not an impersonation: the admin's session
 * stays admin, and RLS happens at the DB on the admin's behalf — which is
 * fine because admins can read everything anyway.
 */
export default async function ContactPreviewPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  await requireRole(locale, ADMIN_ONLY);
  const dict = getDictionary(locale as Locale);
  const supabase = await getServerSupabase();

  const { data: student } = await supabase
    .from("profiles")
    .select("id,email,full_name,role,status")
    .eq("id", id)
    .single();
  if (!student) notFound();

  // Reproduce the queries from the student dashboard, but for this id.
  const { data: cohortLinks } = await supabase
    .from("cohort_members")
    .select("cohort_id")
    .eq("student_id", id);
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

  const { data: directCourses } = await supabase
    .from("course_students")
    .select("course_id")
    .eq("student_id", id);
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
  let resources: { id: string; title: string; kind: string; url: string | null }[] = [];

  if (courseIds.length > 0) {
    const [{ data: courseRows }, { data: programsRows }, { data: asgRows }, { data: crRows }] = await Promise.all([
      supabase.from("courses").select("id,title,description,external_url,program_id").in("id", courseIds).eq("status", "published"),
      supabase.from("programs").select("id,code,color"),
      supabase.from("assignments").select("id,title,external_url,instructions,due_date,course_id").in("course_id", courseIds).order("due_date").limit(8),
      supabase.from("course_resources").select("course_id,resource_id").in("course_id", courseIds),
    ]);
    const programMap = new Map(
      (programsRows ?? []).map((p) => [p.id as string, { code: p.code as string, color: p.color as string }]),
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
        .select("id,title,kind,url")
        .in("id", resourceIds);
      resources = (resRows ?? []).map((r) => ({
        id: r.id as string,
        title: r.title as string,
        kind: r.kind as string,
        url: r.url as string | null,
      }));
    }
  }

  const displayName = (student.full_name as string | null) || (student.email as string);

  return (
    <>
      {/* Preview banner */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand/30 bg-brand/10 px-5 py-3 text-sm text-brand">
        <span className="inline-flex items-center gap-2">
          <Eye size={14} />
          {dict.portail.contact.previewBadge} — <strong className="font-medium">{displayName}</strong>
        </span>
        <Link
          href={`/${locale}/portail/admin/contacts/${id}`}
          className="inline-flex items-center gap-1.5 rounded-full border border-brand/40 bg-brand/15 px-3 py-1 text-xs font-medium hover:bg-brand/25"
        >
          <ArrowLeft size={11} />
          {dict.portail.contact.previewBack}
        </Link>
      </div>

      <h1 className="font-display text-2xl text-foreground md:text-[28px]">
        {dict.portail.student.welcome}
      </h1>

      <section className="mt-8 grid grid-cols-1 gap-3 md:grid-cols-3">
        <StatCard label={dict.portail.sidebar.links.courses} value={courses.length} icon={<BookOpen size={18} />} />
        <StatCard label={dict.portail.sidebar.links.assignments} value={assignments.length} icon={<ClipboardList size={18} />} />
        <StatCard label={dict.portail.sidebar.links.resources} value={resources.length} icon={<FolderOpen size={18} />} />
      </section>

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
                  ) : null}
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

      <section className="mt-10">
        <h2 className="mb-3 font-display text-lg text-foreground">{dict.portail.student.assignments.title}</h2>
        {assignments.length === 0 ? (
          <EmptyCard text={dict.portail.student.assignments.body} />
        ) : (
          <ul className="space-y-2">
            {assignments.map((a) => (
              <li key={a.id} className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-foreground">{a.title}</p>
                    <p className="text-xs text-muted">{a.courseTitle}</p>
                    {a.instructions && <p className="mt-1 text-xs text-muted line-clamp-2 text-pretty">{a.instructions}</p>}
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

      {myCohorts.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 flex items-center gap-2 font-display text-lg text-foreground">
            <Layers size={18} className="text-brand" />
            {dict.portail.sidebar.links.cohorts}
          </h2>
          <ul className="flex flex-wrap gap-2">
            {myCohorts.map((c) => (
              <li key={c.id} className="rounded-full border border-white/10 bg-brand/10 px-3 py-1 text-xs text-brand">
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
