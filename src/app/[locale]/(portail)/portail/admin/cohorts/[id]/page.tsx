import Link from "next/link";
import { ArrowLeft, MapPin, Calendar, Clock } from "lucide-react";
import { notFound } from "next/navigation";
import { type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getServerSupabase } from "@/lib/supabase/server";
import { requireRole, STAFF } from "@/lib/portail/access";
import { CohortMembersClient } from "./CohortMembersClient";
import { CohortMilestonesClient } from "./CohortMilestonesClient";
import { CohortSessionsClient } from "./CohortSessionsClient";

function fmtDate(iso: string, locale: Locale) {
  return new Date(iso).toLocaleDateString(locale === "fr" ? "fr-CA" : "en-CA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const statusColor: Record<string, string> = {
  planned: "border-amber-400/30 bg-amber-400/10 text-amber-200",
  active: "border-brand/30 bg-brand/10 text-brand",
  completed: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  canceled: "border-red-400/30 bg-red-400/10 text-red-200",
};

export default async function CohortDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const me = await requireRole(locale, STAFF);
  const dict = getDictionary(locale as Locale);
  const supabase = await getServerSupabase();

  const { data: cohort } = await supabase
    .from("cohorts")
    .select("id,program_id,name,start_date,end_date,rhythm_text,location,status,notes")
    .eq("id", id)
    .single();
  if (!cohort) notFound();

  const { data: program } = await supabase
    .from("programs")
    .select("code,name_fr,name_en,color")
    .eq("id", cohort.program_id as string)
    .single();

  const { data: memberLinks } = await supabase
    .from("cohort_members")
    .select("student_id,joined_at,status")
    .eq("cohort_id", id)
    .order("joined_at", { ascending: false });

  const studentIds = (memberLinks ?? []).map((m) => m.student_id as string);
  let students: { id: string; label: string; email: string; status: string; joinedAt: string }[] = [];
  if (studentIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id,email,full_name")
      .in("id", studentIds);
    const map = new Map(
      (profiles ?? []).map((p) => [
        p.id as string,
        { name: (p.full_name as string | null) || (p.email as string), email: p.email as string },
      ]),
    );
    students = (memberLinks ?? []).map((m) => {
      const sid = m.student_id as string;
      const info = map.get(sid);
      return {
        id: sid,
        label: info?.name || sid.slice(0, 6),
        email: info?.email || "",
        status: m.status as string,
        joinedAt: m.joined_at as string,
      };
    });
  }

  // Eligible = any approved contact not already in this cohort.
  // (The doc explicitly counts coaches and team leaders as embedded in the
  // cohort culture, not just students — so we don't filter by role.)
  const { data: allContacts } = await supabase
    .from("profiles")
    .select("id,email,full_name,role")
    .eq("status", "approved")
    .order("full_name");
  const memberSet = new Set(studentIds);
  const eligible = (allContacts ?? [])
    .filter((s) => !memberSet.has(s.id as string))
    .map((s) => ({
      id: s.id as string,
      label: (s.full_name as string | null) || (s.email as string),
      email: s.email as string,
      role: s.role as string,
    }));

  const { data: milestones } = await supabase
    .from("cohort_milestones")
    .select("id,date,title,kind,notes")
    .eq("cohort_id", id)
    .order("date");

  // Sessions + attendance for this cohort
  const { data: sessions } = await supabase
    .from("cohort_sessions")
    .select("id,date,start_time,end_time,location,agenda,status")
    .eq("cohort_id", id)
    .order("date", { ascending: false });
  const sessionIds = (sessions ?? []).map((s) => s.id as string);
  let attendance: { sessionId: string; studentId: string; status: "present" | "absent" | "excused" | "online" }[] = [];
  if (sessionIds.length > 0) {
    const { data: attRows } = await supabase
      .from("session_attendance")
      .select("session_id,student_id,status")
      .in("session_id", sessionIds);
    attendance = (attRows ?? []).map((a) => ({
      sessionId: a.session_id as string,
      studentId: a.student_id as string,
      status: a.status as "present" | "absent" | "excused" | "online",
    }));
  }

  const canWrite = me.role === "admin" || me.role === "coordinator";

  return (
    <>
      <Link
        href={`/${locale}/portail/admin/cohorts`}
        className="mb-5 inline-flex items-center gap-1.5 text-xs text-muted transition hover:text-foreground"
      >
        <ArrowLeft size={13} />
        {dict.portail.cohorts.backToCohorts}
      </Link>

      <header className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span
                className="h-3 w-3 rounded-full"
                style={{ background: program?.color || "#4fc3dc" }}
                aria-hidden
              />
              <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
                {program?.code}
              </span>
            </div>
            <h1 className="mt-2 font-display text-2xl text-foreground md:text-[28px]">
              {cohort.name as string}
            </h1>
            <p className="mt-1 text-sm text-muted">
              {(locale === "fr" ? program?.name_fr : program?.name_en) as string}
            </p>
          </div>
          <span
            className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.18em] ${statusColor[cohort.status as string]}`}
          >
            {dict.portail.common.cohortStatus[cohort.status as keyof typeof dict.portail.common.cohortStatus]}
          </span>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 text-sm text-muted sm:grid-cols-3">
          <span className="inline-flex items-center gap-2">
            <Calendar size={14} className="text-brand/80" />
            {fmtDate(cohort.start_date as string, locale as Locale)} → {fmtDate(cohort.end_date as string, locale as Locale)}
          </span>
          {cohort.rhythm_text && (
            <span className="inline-flex items-center gap-2">
              <Clock size={14} className="text-brand/80" />
              {cohort.rhythm_text as string}
            </span>
          )}
          {cohort.location && (
            <span className="inline-flex items-center gap-2">
              <MapPin size={14} className="text-brand/80" />
              {cohort.location as string}
            </span>
          )}
        </div>
      </header>

      <section className="mt-10">
        <h2 className="mb-3 font-display text-lg text-foreground">
          {dict.portail.cohorts.detailMembers}
        </h2>
        <CohortMembersClient
          cohortId={cohort.id as string}
          locale={locale as Locale}
          students={students}
          eligible={eligible}
          dict={dict.portail.cohorts}
          canWrite={canWrite}
        />
      </section>

      {/* Sessions (Phase 2B) */}
      <section className="mt-10">
        <h2 className="mb-1 font-display text-lg text-foreground">
          {dict.portail.sessions.title}
        </h2>
        <p className="mb-3 max-w-2xl text-sm text-muted text-pretty">{dict.portail.sessions.intro}</p>
        <CohortSessionsClient
          cohortId={cohort.id as string}
          locale={locale as Locale}
          dict={dict.portail.sessions}
          sessions={(sessions ?? []).map((s) => ({
            id: s.id as string,
            date: s.date as string,
            startTime: s.start_time as string | null,
            endTime: s.end_time as string | null,
            location: s.location as string | null,
            agenda: s.agenda as string | null,
            status: s.status as "planned" | "completed" | "canceled",
          }))}
          members={students.map((s) => ({ id: s.id, name: s.label }))}
          attendance={attendance}
          canWrite={canWrite}
        />
      </section>

      <section className="mt-10">
        <h2 className="mb-3 font-display text-lg text-foreground">
          {dict.portail.cohorts.detailMilestones}
        </h2>
        <CohortMilestonesClient
          cohortId={cohort.id as string}
          locale={locale as Locale}
          dict={dict.portail.cohorts}
          kindLabels={dict.portail.common.milestoneKind}
          rows={(milestones ?? []).map((m) => ({
            id: m.id as string,
            date: m.date as string,
            title: m.title as string,
            kind: m.kind as "start" | "end" | "session" | "evaluation" | "custom",
            notes: m.notes as string | null,
          }))}
          canWrite={canWrite}
        />
      </section>
    </>
  );
}
