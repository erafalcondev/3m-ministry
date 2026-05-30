import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, Calendar, BookOpen, ClipboardList, Clock, Eye, Lock, CheckCircle2 } from "lucide-react";
import { type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getServerSupabase } from "@/lib/supabase/server";
import { requireRole, STAFF } from "@/lib/portail/access";
import { ContactNotesClient } from "./ContactNotesClient";
import { CompletionToggle } from "./CompletionToggle";

function fmtDate(iso: string, locale: Locale) {
  return new Date(iso).toLocaleDateString(locale === "fr" ? "fr-CA" : "en-CA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function initials(name: string | null, email: string): string {
  const src = (name && name.trim()) || email;
  const parts = src.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return src.slice(0, 2).toUpperCase();
}

const STATUS_STYLE: Record<string, string> = {
  pending: "border-amber-400/30 bg-amber-400/10 text-amber-200",
  approved: "border-brand/30 bg-brand/10 text-brand",
  refused: "border-red-400/30 bg-red-400/10 text-red-200",
};

const RELATIONSHIP_COLORS: Record<string, string> = {
  academic: "border-brand/30 bg-brand/10 text-brand",
  ministry_mentor: "border-amber-400/30 bg-amber-400/10 text-amber-200",
  team_leader: "border-purple-400/30 bg-purple-400/10 text-purple-200",
};

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const me = await requireRole(locale, STAFF);
  const dict = getDictionary(locale as Locale);
  const supabase = await getServerSupabase();

  const { data: contact } = await supabase
    .from("profiles")
    .select("id,email,full_name,role,status,motivation,created_at,approved_at")
    .eq("id", id)
    .single();
  if (!contact) notFound();

  // Cohorts membership
  const { data: cohortLinks } = await supabase
    .from("cohort_members")
    .select("cohort_id,status,joined_at")
    .eq("student_id", id);
  let cohorts: { id: string; name: string; status: string; joinedAt: string }[] = [];
  if ((cohortLinks ?? []).length > 0) {
    const cohortIds = (cohortLinks ?? []).map((c) => c.cohort_id as string);
    const { data: cohortRows } = await supabase
      .from("cohorts")
      .select("id,name")
      .in("id", cohortIds);
    const nameMap = new Map((cohortRows ?? []).map((c) => [c.id as string, c.name as string]));
    cohorts = (cohortLinks ?? []).map((c) => ({
      id: c.cohort_id as string,
      name: nameMap.get(c.cohort_id as string) ?? "—",
      status: c.status as string,
      joinedAt: c.joined_at as string,
    }));
  }

  // Coaches assigned to this person (when they are a student)
  const { data: coachLinks } = await supabase
    .from("coach_student_links")
    .select("coach_id,relationship_type,assigned_at")
    .eq("student_id", id);
  // Students this person coaches (when they are a coach)
  const { data: studentLinks } = await supabase
    .from("coach_student_links")
    .select("student_id,relationship_type,assigned_at")
    .eq("coach_id", id);

  const peerIds = Array.from(
    new Set([
      ...((coachLinks ?? []).map((l) => l.coach_id as string)),
      ...((studentLinks ?? []).map((l) => l.student_id as string)),
    ]),
  );
  let peerMap = new Map<string, { name: string; email: string }>();
  if (peerIds.length > 0) {
    const { data: peers } = await supabase
      .from("profiles")
      .select("id,email,full_name")
      .in("id", peerIds);
    peerMap = new Map(
      (peers ?? []).map((p) => [
        p.id as string,
        {
          name: (p.full_name as string | null) || (p.email as string),
          email: p.email as string,
        },
      ]),
    );
  }

  // Courses this person has access to (direct or via cohort)
  const myCohortIds = (cohortLinks ?? []).map((c) => c.cohort_id as string);
  const { data: directCourses } = await supabase
    .from("course_students")
    .select("course_id")
    .eq("student_id", id);
  let viaCohortCourseIds: string[] = [];
  if (myCohortIds.length > 0) {
    const { data: viaCohort } = await supabase
      .from("course_cohorts")
      .select("course_id")
      .in("cohort_id", myCohortIds);
    viaCohortCourseIds = (viaCohort ?? []).map((c) => c.course_id as string);
  }
  const accessibleCourseIds = Array.from(
    new Set([
      ...((directCourses ?? []).map((c) => c.course_id as string)),
      ...viaCohortCourseIds,
    ]),
  );

  let enrolledCourses: { id: string; title: string; status: string; programCode: string | null; programColor: string | null }[] = [];
  let upcomingHomework: { id: string; title: string; courseTitle: string; dueDate: string | null }[] = [];
  if (accessibleCourseIds.length > 0) {
    const [{ data: courseRows }, { data: progRows }, { data: asgRows }] = await Promise.all([
      supabase.from("courses").select("id,title,status,program_id").in("id", accessibleCourseIds),
      supabase.from("programs").select("id,code,color"),
      supabase
        .from("assignments")
        .select("id,title,due_date,course_id")
        .in("course_id", accessibleCourseIds)
        .order("due_date", { ascending: true })
        .limit(20),
    ]);
    const progMap = new Map(
      (progRows ?? []).map((p) => [
        p.id as string,
        { code: p.code as string, color: p.color as string },
      ]),
    );
    enrolledCourses = (courseRows ?? []).map((c) => {
      const prog = c.program_id ? progMap.get(c.program_id as string) : null;
      return {
        id: c.id as string,
        title: c.title as string,
        status: c.status as string,
        programCode: prog?.code ?? null,
        programColor: prog?.color ?? null,
      };
    });
    const courseTitleMap = new Map(
      (courseRows ?? []).map((c) => [c.id as string, c.title as string]),
    );
    upcomingHomework = (asgRows ?? []).map((a) => ({
      id: a.id as string,
      title: a.title as string,
      courseTitle: courseTitleMap.get(a.course_id as string) ?? "—",
      dueDate: a.due_date as string | null,
    }));
  }

  // Cohort peers (everyone in the same cohort as this person, minus the person themself)
  let cohortPeers: { cohortName: string; members: { id: string; name: string; email: string }[] }[] = [];
  if (myCohortIds.length > 0) {
    const { data: peerLinks } = await supabase
      .from("cohort_members")
      .select("cohort_id,student_id")
      .in("cohort_id", myCohortIds);
    const peerIdsForCohorts = Array.from(
      new Set((peerLinks ?? []).map((p) => p.student_id as string).filter((sid) => sid !== id)),
    );
    if (peerIdsForCohorts.length > 0) {
      const { data: peerProfiles } = await supabase
        .from("profiles")
        .select("id,email,full_name")
        .in("id", peerIdsForCohorts);
      const peerNameMap = new Map(
        (peerProfiles ?? []).map((p) => [
          p.id as string,
          {
            name: (p.full_name as string | null) || (p.email as string),
            email: p.email as string,
          },
        ]),
      );
      const cohortNameMap = new Map(
        cohorts.map((c) => [c.id, c.name]),
      );
      const byCohort = new Map<string, { id: string; name: string; email: string }[]>();
      for (const link of peerLinks ?? []) {
        const cid = link.cohort_id as string;
        const sid = link.student_id as string;
        if (sid === id) continue;
        const info = peerNameMap.get(sid);
        if (!info) continue;
        const arr = byCohort.get(cid) ?? [];
        arr.push({ id: sid, name: info.name, email: info.email });
        byCohort.set(cid, arr);
      }
      cohortPeers = Array.from(byCohort.entries()).map(([cid, members]) => ({
        cohortName: cohortNameMap.get(cid) ?? "—",
        members,
      }));
    } else {
      cohortPeers = cohorts.map((c) => ({ cohortName: c.name, members: [] }));
    }
  }

  // Completion state for this student
  const [{ data: courseCompletions }, { data: asgCompletions }] = await Promise.all([
    supabase
      .from("student_course_completion")
      .select("course_id,completed_at")
      .eq("student_id", id),
    supabase
      .from("student_assignment_completion")
      .select("assignment_id,completed_at")
      .eq("student_id", id),
  ]);
  const completedCourseIds = new Set((courseCompletions ?? []).map((c) => c.course_id as string));
  const completedAsgIds = new Set((asgCompletions ?? []).map((a) => a.assignment_id as string));
  const courseCompletedAt = new Map(
    (courseCompletions ?? []).map((c) => [c.course_id as string, c.completed_at as string]),
  );
  const asgCompletedAt = new Map(
    (asgCompletions ?? []).map((a) => [a.assignment_id as string, a.completed_at as string]),
  );

  const allAssignmentsForStudent = upcomingHomework; // already scoped to accessible courses
  const totalCount = enrolledCourses.length + allAssignmentsForStudent.length;
  const doneCount = completedCourseIds.size + completedAsgIds.size;
  const completionPct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  const activeCourses = enrolledCourses.filter((c) => !completedCourseIds.has(c.id));
  const completedCourses = enrolledCourses.filter((c) => completedCourseIds.has(c.id));
  const activeAssignments = allAssignmentsForStudent.filter((a) => !completedAsgIds.has(a.id));
  const completedAssignments = allAssignmentsForStudent.filter((a) => completedAsgIds.has(a.id));

  // Notes the current user is allowed to see (RLS filters automatically).
  const { data: notes } = await supabase
    .from("contact_notes")
    .select("id,author_id,body,visibility,created_at,updated_at")
    .eq("target_id", id)
    .order("created_at", { ascending: false });
  const authorIds = Array.from(
    new Set((notes ?? []).map((n) => n.author_id as string | null).filter(Boolean) as string[]),
  );
  let authorMap = new Map<string, { name: string; email: string }>();
  if (authorIds.length > 0) {
    const { data: authors } = await supabase
      .from("profiles")
      .select("id,email,full_name")
      .in("id", authorIds);
    authorMap = new Map(
      (authors ?? []).map((p) => [
        p.id as string,
        { name: (p.full_name as string | null) || (p.email as string), email: p.email as string },
      ]),
    );
  }

  return (
    <>
      <Link
        href={`/${locale}/portail/admin/users`}
        className="mb-5 inline-flex items-center gap-1.5 text-xs text-muted transition hover:text-foreground"
      >
        <ArrowLeft size={13} />
        {dict.portail.contact.backToUsers}
      </Link>

      {/* Hero card */}
      <header className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
        <div className="flex flex-wrap items-start gap-5">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-brand text-base font-medium text-[#031019]">
            {initials(contact.full_name as string | null, contact.email as string)}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-2">
              <h1 className="font-display text-2xl text-foreground md:text-[28px]">
                {(contact.full_name as string | null) || (contact.email as string)}
              </h1>
              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[11px] uppercase tracking-[0.18em] text-muted">
                {dict.portail.common.roles[contact.role as keyof typeof dict.portail.common.roles]}
              </span>
            </div>
            <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-muted">
              <Mail size={13} />
              {contact.email as string}
            </p>
            <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-muted">
              <Calendar size={11} />
              {dict.portail.contact.registeredOn} {fmtDate(contact.created_at as string, locale as Locale)}
            </p>
            {contact.motivation && (
              <p className="mt-3 rounded-xl border border-white/5 bg-background/40 p-3 text-sm text-muted text-pretty">
                {contact.motivation as string}
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            <span
              className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.18em] ${STATUS_STYLE[contact.status as string] ?? ""}`}
            >
              {contact.status as string}
            </span>
            {me.role === "admin" && contact.role === "student" && contact.status === "approved" && (
              <Link
                href={`/${locale}/portail/admin/contacts/${id}/preview`}
                className="inline-flex items-center gap-1.5 rounded-full border border-brand/40 bg-brand/10 px-3 py-1 text-[11px] font-medium text-brand transition hover:bg-brand/20"
              >
                <Eye size={11} />
                {dict.portail.contact.previewCta}
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* At-a-glance stats */}
      <section className="mt-6 grid grid-cols-2 gap-2 md:grid-cols-4">
        <Stat
          icon={<BookOpen size={15} />}
          label={dict.portail.contact.coursesTitle}
          value={enrolledCourses.length}
        />
        <Stat
          icon={<ClipboardList size={15} />}
          label={dict.portail.contact.homeworkTitle}
          value={upcomingHomework.length}
        />
        <Stat
          icon={<Clock size={15} />}
          label={dict.portail.contact.upcomingTitle}
          value={upcomingHomework.filter((h) => h.dueDate && new Date(h.dueDate) > new Date()).length}
        />
        <Stat
          icon={<Calendar size={15} />}
          label={dict.portail.contact.cohortsTitle}
          value={cohorts.length}
        />
      </section>

      {/* Cohorts */}
      <section className="mt-8">
        <h2 className="mb-3 font-display text-lg text-foreground">{dict.portail.contact.cohortsTitle}</h2>
        {cohorts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-6 text-center text-sm text-muted">
            {dict.portail.contact.cohortsEmpty}
          </div>
        ) : (
          <ul className="space-y-2">
            {cohorts.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/${locale}/portail/admin/cohorts/${c.id}`}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm transition hover:border-brand/40 hover:bg-brand/[0.06]"
                >
                  <span className="text-foreground">{c.name}</span>
                  <span className="text-xs text-muted">{fmtDate(c.joinedAt, locale as Locale)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Completion progress */}
      {totalCount > 0 && contact.role === "student" && (
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
          <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-muted">
            {dict.portail.contact.completionLabel}
          </p>
        </section>
      )}

      {/* Enrolled courses (active) */}
      {activeCourses.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 flex items-center gap-2 font-display text-lg text-foreground">
            <BookOpen size={18} className="text-brand" />
            {dict.portail.contact.coursesTitle}
          </h2>
          <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {activeCourses.map((c) => (
              <li key={c.id} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm">
                <Link
                  href={`/${locale}/portail/admin/courses/${c.id}`}
                  className="flex flex-1 items-center gap-3 min-w-0 transition hover:text-brand"
                >
                  {c.programColor && (
                    <span className="h-2 w-2 rounded-full" style={{ background: c.programColor }} aria-hidden />
                  )}
                  <span className="min-w-0 flex-1 truncate text-foreground">{c.title}</span>
                  {c.programCode && (
                    <span className="text-[10px] uppercase tracking-[0.18em] text-muted">{c.programCode}</span>
                  )}
                </Link>
                {me.role === "admin" && contact.role === "student" && (
                  <CompletionToggle
                    studentId={id}
                    table="student_course_completion"
                    idColumn="course_id"
                    refId={c.id}
                    completed={false}
                    labelMark={dict.portail.contact.markCompleteCourse}
                    labelUndo={dict.portail.contact.undoCompleteCourse}
                  />
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Active homework */}
      {activeAssignments.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 flex items-center gap-2 font-display text-lg text-foreground">
            <ClipboardList size={18} className="text-brand" />
            {dict.portail.contact.upcomingTitle}
          </h2>
          <ul className="space-y-2">
            {activeAssignments.slice(0, 12).map((h) => (
              <li
                key={h.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-foreground">{h.title}</p>
                  <p className="text-xs text-muted">{h.courseTitle}</p>
                </div>
                {h.dueDate && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-muted">
                    <Clock size={11} />
                    {fmtDate(h.dueDate, locale as Locale)}
                  </span>
                )}
                {me.role === "admin" && contact.role === "student" && (
                  <CompletionToggle
                    studentId={id}
                    table="student_assignment_completion"
                    idColumn="assignment_id"
                    refId={h.id}
                    completed={false}
                    labelMark={dict.portail.contact.markCompleteAssignment}
                    labelUndo={dict.portail.contact.undoCompleteAssignment}
                  />
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Completed sections */}
      {completedCourses.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 flex items-center gap-2 font-display text-lg text-foreground">
            <CheckCircle2 size={18} className="text-emerald-300" />
            {dict.portail.contact.completedCoursesTitle}
          </h2>
          <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {completedCourses.map((c) => {
              const at = courseCompletedAt.get(c.id);
              return (
                <li
                  key={c.id}
                  className="flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.04] px-4 py-3 text-sm"
                >
                  <Link
                    href={`/${locale}/portail/admin/courses/${c.id}`}
                    className="flex flex-1 items-center gap-3 min-w-0"
                  >
                    <CheckCircle2 size={14} className="text-emerald-300" />
                    <span className="min-w-0 flex-1 truncate text-foreground line-through decoration-muted/30">
                      {c.title}
                    </span>
                    {at && (
                      <span className="text-[10px] text-muted">
                        {dict.portail.contact.completedOn} {fmtDate(at, locale as Locale)}
                      </span>
                    )}
                  </Link>
                  {me.role === "admin" && (
                    <CompletionToggle
                      studentId={id}
                      table="student_course_completion"
                      idColumn="course_id"
                      refId={c.id}
                      completed={true}
                      labelMark={dict.portail.contact.markCompleteCourse}
                      labelUndo={dict.portail.contact.undoCompleteCourse}
                    />
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {completedAssignments.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 flex items-center gap-2 font-display text-lg text-foreground">
            <CheckCircle2 size={18} className="text-emerald-300" />
            {dict.portail.contact.completedHomeworkTitle}
          </h2>
          <ul className="space-y-2">
            {completedAssignments.map((h) => {
              const at = asgCompletedAt.get(h.id);
              return (
                <li
                  key={h.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.04] px-4 py-3 text-sm"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-foreground line-through decoration-muted/30">{h.title}</p>
                    <p className="text-xs text-muted">{h.courseTitle}</p>
                  </div>
                  {at && (
                    <span className="text-[10px] text-muted">
                      {dict.portail.contact.completedOn} {fmtDate(at, locale as Locale)}
                    </span>
                  )}
                  {me.role === "admin" && (
                    <CompletionToggle
                      studentId={id}
                      table="student_assignment_completion"
                      idColumn="assignment_id"
                      refId={h.id}
                      completed={true}
                      labelMark={dict.portail.contact.markCompleteAssignment}
                      labelUndo={dict.portail.contact.undoCompleteAssignment}
                    />
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Cohort peers */}
      {cohortPeers.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 font-display text-lg text-foreground">
            {dict.portail.contact.cohortMembersTitle}
          </h2>
          {cohortPeers.map((cp) => (
            <div key={cp.cohortName} className="mb-4">
              <p className="mb-2 text-[10px] uppercase tracking-[0.22em] text-muted/70">{cp.cohortName}</p>
              {cp.members.length === 0 ? (
                <p className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-3 text-xs text-muted">
                  {dict.portail.contact.cohortMembersEmpty}
                </p>
              ) : (
                <ul className="flex flex-wrap gap-2">
                  {cp.members.map((m) => (
                    <li key={m.id}>
                      <Link
                        href={`/${locale}/portail/admin/contacts/${m.id}`}
                        className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-foreground transition hover:border-brand/40 hover:bg-brand/[0.06]"
                      >
                        {m.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </section>
      )}

      {/* Coaches assigned (when student) */}
      {(coachLinks ?? []).length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 font-display text-lg text-foreground">{dict.portail.contact.coachesTitle}</h2>
          <ul className="space-y-2">
            {(coachLinks ?? []).map((l) => {
              const p = peerMap.get(l.coach_id as string);
              return (
                <li
                  key={`${l.coach_id}/${l.relationship_type}`}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm"
                >
                  <Link
                    href={`/${locale}/portail/admin/contacts/${l.coach_id}`}
                    className="text-foreground transition hover:text-brand"
                  >
                    {p?.name ?? "—"}
                  </Link>
                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] uppercase tracking-[0.18em] ${RELATIONSHIP_COLORS[l.relationship_type as string] ?? ""}`}
                  >
                    {dict.portail.common.relationship[l.relationship_type as keyof typeof dict.portail.common.relationship]}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Students coached (when coach) */}
      {(studentLinks ?? []).length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 font-display text-lg text-foreground">{dict.portail.contact.studentsTitle}</h2>
          <ul className="space-y-2">
            {(studentLinks ?? []).map((l) => {
              const p = peerMap.get(l.student_id as string);
              return (
                <li
                  key={`${l.student_id}/${l.relationship_type}`}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm"
                >
                  <Link
                    href={`/${locale}/portail/admin/contacts/${l.student_id}`}
                    className="text-foreground transition hover:text-brand"
                  >
                    {p?.name ?? "—"}
                  </Link>
                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] uppercase tracking-[0.18em] ${RELATIONSHIP_COLORS[l.relationship_type as string] ?? ""}`}
                  >
                    {dict.portail.common.relationship[l.relationship_type as keyof typeof dict.portail.common.relationship]}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Notes (CRM-style) — clearly marked as admin-only */}
      <section className="mt-10">
        <div className="mb-3 flex flex-wrap items-baseline gap-3">
          <h2 className="font-display text-lg text-foreground">{dict.portail.contact.notesTitle}</h2>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/30 bg-amber-300/10 px-2.5 py-0.5 text-[10px] uppercase tracking-[0.18em] text-amber-200">
            <Lock size={10} />
            {dict.portail.contact.adminNotesBadge}
          </span>
        </div>
        <p className="mb-3 text-xs text-muted/70">{dict.portail.contact.adminNotesHint}</p>
        <ContactNotesClient
          targetId={id}
          currentUserId={me.id}
          dict={dict.portail.contact}
          locale={locale as Locale}
          notes={(notes ?? []).map((n) => ({
            id: n.id as string,
            authorId: n.author_id as string | null,
            authorName: n.author_id ? authorMap.get(n.author_id as string)?.name ?? "—" : "—",
            body: n.body as string,
            visibility: n.visibility as "team" | "private",
            createdAt: n.created_at as string,
          }))}
        />
      </section>
    </>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-center justify-between">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand/15 text-brand">{icon}</span>
        <span className="font-display text-xl text-foreground">{value}</span>
      </div>
      <p className="mt-2 text-[10px] uppercase tracking-[0.18em] text-muted">{label}</p>
    </div>
  );
}
