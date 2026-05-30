import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, Calendar } from "lucide-react";
import { type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getServerSupabase } from "@/lib/supabase/server";
import { requireRole, STAFF } from "@/lib/portail/access";
import { ContactNotesClient } from "./ContactNotesClient";

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
          <span
            className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.18em] ${STATUS_STYLE[contact.status as string] ?? ""}`}
          >
            {contact.status as string}
          </span>
        </div>
      </header>

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

      {/* Notes (CRM-style) */}
      <section className="mt-10">
        <h2 className="mb-3 font-display text-lg text-foreground">{dict.portail.contact.notesTitle}</h2>
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
