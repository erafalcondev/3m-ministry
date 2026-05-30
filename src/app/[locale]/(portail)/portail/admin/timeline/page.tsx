import { type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getServerSupabase } from "@/lib/supabase/server";
import { requireRole, STAFF } from "@/lib/portail/access";
import { PageHeader } from "@/components/portail/PageHeader";
import { TimelineClient } from "./TimelineClient";

export default async function TimelinePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireRole(locale, STAFF);
  const dict = getDictionary(locale as Locale);
  const supabase = await getServerSupabase();

  const [{ data: programs }, { data: cohorts }, { data: events }] = await Promise.all([
    supabase.from("programs").select("id,code,name_fr,name_en,color").order("sort_order"),
    supabase
      .from("cohorts")
      .select("id,program_id,name,start_date,end_date,status")
      .order("start_date"),
    supabase
      .from("events")
      .select("id,title,start_at,end_at,color,kind")
      .order("start_at"),
  ]);

  return (
    <>
      <PageHeader
        title={dict.portail.timeline.title}
        description={dict.portail.timeline.intro}
      />
      <div className="mt-6">
        <TimelineClient
          locale={locale as Locale}
          dict={dict.portail.timeline}
          statusLabels={dict.portail.common.cohortStatus}
          programs={(programs ?? []).map((p) => ({
            id: p.id as string,
            code: p.code as string,
            name: (locale === "fr" ? p.name_fr : p.name_en) as string,
            color: p.color as string,
          }))}
          cohorts={(cohorts ?? []).map((c) => ({
            id: c.id as string,
            programId: c.program_id as string,
            name: c.name as string,
            startDate: c.start_date as string,
            endDate: c.end_date as string,
            status: c.status as "planned" | "active" | "completed" | "canceled",
          }))}
          events={(events ?? []).map((e) => ({
            id: e.id as string,
            title: e.title as string,
            startAt: e.start_at as string,
            endAt: e.end_at as string | null,
            color: e.color as string,
            kind: e.kind as string,
          }))}
        />
      </div>
    </>
  );
}
