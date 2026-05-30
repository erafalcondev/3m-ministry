import Link from "next/link";
import { Plus, Layers } from "lucide-react";
import { type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getServerSupabase } from "@/lib/supabase/server";
import { requireRole, STAFF } from "@/lib/portail/access";
import { PageHeader } from "@/components/portail/PageHeader";

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

export default async function CohortsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const me = await requireRole(locale, STAFF);
  const dict = getDictionary(locale as Locale);
  const supabase = await getServerSupabase();

  const { data: cohorts } = await supabase
    .from("cohorts")
    .select("id,name,start_date,end_date,rhythm_text,location,status,program_id")
    .order("start_date", { ascending: false });

  const { data: programs } = await supabase
    .from("programs")
    .select("id,code,name_fr,name_en,color");
  const programMap = Object.fromEntries(
    (programs ?? []).map((p) => [
      p.id as string,
      {
        code: p.code as string,
        name: (locale === "fr" ? p.name_fr : p.name_en) as string,
        color: p.color as string,
      },
    ]),
  );

  // Member counts
  const { data: members } = await supabase.from("cohort_members").select("cohort_id");
  const memberCount: Record<string, number> = {};
  for (const m of members ?? []) {
    const cid = m.cohort_id as string;
    memberCount[cid] = (memberCount[cid] ?? 0) + 1;
  }

  const canCreate = me.role === "admin" || me.role === "coordinator";

  return (
    <>
      <PageHeader
        title={dict.portail.cohorts.title}
        description={dict.portail.cohorts.intro}
        action={
          canCreate ? (
            <Link
              href={`/${locale}/portail/admin/cohorts/new`}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-brand px-4 text-sm font-medium text-[#031019] transition hover:shadow-[0_12px_30px_-10px_rgba(79,195,220,0.6)]"
            >
              <Plus size={15} />
              {dict.portail.cohorts.newCta}
            </Link>
          ) : undefined
        }
      />

      <div className="mt-6">
        {(cohorts ?? []).length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-16 text-center">
            <Layers size={36} className="text-muted/60" />
            <p className="mt-4 text-sm text-muted">{dict.portail.cohorts.empty}</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
            <ul className="divide-y divide-white/5">
              {(cohorts ?? []).map((c) => {
                const prog = programMap[c.program_id as string];
                return (
                  <li key={c.id as string}>
                    <Link
                      href={`/${locale}/portail/admin/cohorts/${c.id}`}
                      className="block transition hover:bg-white/[0.02]"
                    >
                      <div className="flex flex-wrap items-center gap-4 px-5 py-4">
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ background: prog?.color || "#4fc3dc" }}
                          aria-hidden
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-baseline gap-2">
                            <span className="text-sm text-foreground">{c.name as string}</span>
                            <span className="text-[11px] uppercase tracking-[0.18em] text-muted">
                              {prog?.code}
                            </span>
                          </div>
                          <p className="mt-0.5 text-xs text-muted">
                            {fmtDate(c.start_date as string, locale as Locale)} →{" "}
                            {fmtDate(c.end_date as string, locale as Locale)}
                            {c.rhythm_text ? ` · ${c.rhythm_text}` : ""}
                            {c.location ? ` · ${c.location}` : ""}
                          </p>
                        </div>
                        <span className="text-xs text-muted">
                          {memberCount[c.id as string] ?? 0} {dict.portail.cohorts.colMembers.toLowerCase()}
                        </span>
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] ${statusColor[c.status as string]}`}
                        >
                          {dict.portail.common.cohortStatus[c.status as keyof typeof dict.portail.common.cohortStatus]}
                        </span>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </>
  );
}
