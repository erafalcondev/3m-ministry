import { redirect } from "next/navigation";
import { Layers, Calendar, MapPin, Clock } from "lucide-react";
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

function initials(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export default async function StudentCohortPage({
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

  if (myCohortIds.length === 0) {
    return (
      <>
        <PageHeader title={dict.portail.studentPages.myCohortTitle} />
        <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-16 text-center">
          <Layers size={36} className="text-muted/60" />
          <p className="mt-4 text-sm text-muted text-pretty">{dict.portail.studentPages.cohortEmpty}</p>
        </div>
      </>
    );
  }

  const [{ data: cohorts }, { data: programs }, { data: allMembers }] = await Promise.all([
    supabase
      .from("cohorts")
      .select("id,name,start_date,end_date,rhythm_text,location,program_id,status")
      .in("id", myCohortIds),
    supabase.from("programs").select("id,code,name_fr,name_en,color"),
    supabase.from("cohort_members").select("cohort_id,student_id").in("cohort_id", myCohortIds),
  ]);

  const programMap = new Map(
    (programs ?? []).map((p) => [
      p.id as string,
      {
        code: p.code as string,
        name: (locale === "fr" ? p.name_fr : p.name_en) as string,
        color: p.color as string,
      },
    ]),
  );

  // Resolve peer profile names
  const peerIds = Array.from(
    new Set((allMembers ?? []).map((m) => m.student_id as string).filter((sid) => sid !== user.id)),
  );
  let peerMap = new Map<string, { name: string; email: string }>();
  if (peerIds.length > 0) {
    const { data: profiles } = await supabase.from("profiles").select("id,email,full_name").in("id", peerIds);
    peerMap = new Map(
      (profiles ?? []).map((p) => [
        p.id as string,
        {
          name: (p.full_name as string | null) || (p.email as string),
          email: p.email as string,
        },
      ]),
    );
  }

  const membersByCohort = new Map<string, string[]>();
  for (const link of allMembers ?? []) {
    const cid = link.cohort_id as string;
    const sid = link.student_id as string;
    if (sid === user.id) continue;
    const arr = membersByCohort.get(cid) ?? [];
    arr.push(sid);
    membersByCohort.set(cid, arr);
  }

  return (
    <>
      <PageHeader title={dict.portail.studentPages.myCohortTitle} />
      <div className="mt-6 space-y-6">
        {(cohorts ?? []).map((c) => {
          const prog = c.program_id ? programMap.get(c.program_id as string) : null;
          const peers = membersByCohort.get(c.id as string) ?? [];
          return (
            <section key={c.id as string} className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <header>
                {prog && (
                  <div className="mb-2 flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: prog.color }} aria-hidden />
                    <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">{prog.code}</span>
                    <span className="text-[11px] text-muted">· {prog.name}</span>
                  </div>
                )}
                <h2 className="font-display text-xl text-foreground md:text-2xl">{c.name as string}</h2>
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted">
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar size={11} />
                    {fmtDate(c.start_date as string, locale as Locale)} → {fmtDate(c.end_date as string, locale as Locale)}
                  </span>
                  {c.rhythm_text && (
                    <span className="inline-flex items-center gap-1.5">
                      <Clock size={11} />
                      {c.rhythm_text as string}
                    </span>
                  )}
                  {c.location && (
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin size={11} />
                      {c.location as string}
                    </span>
                  )}
                </div>
              </header>

              <div className="mt-6">
                <p className="mb-3 text-[10px] uppercase tracking-[0.22em] text-muted/70">
                  {dict.portail.studentPages.cohortMembers}
                </p>
                {peers.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-4 text-xs text-muted">
                    {dict.portail.studentPages.noOtherMembers}
                  </p>
                ) : (
                  <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
                    {peers.map((sid) => {
                      const p = peerMap.get(sid);
                      if (!p) return null;
                      return (
                        <li
                          key={sid}
                          className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm"
                        >
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand/15 text-[10px] font-medium text-brand">
                            {initials(p.name)}
                          </span>
                          <span className="min-w-0 flex-1">
                            <p className="truncate text-foreground">{p.name}</p>
                            <p className="truncate text-xs text-muted">{p.email}</p>
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
