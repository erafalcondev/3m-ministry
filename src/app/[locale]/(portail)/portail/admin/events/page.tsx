import { type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getServerSupabase } from "@/lib/supabase/server";
import { requireRole, STAFF } from "@/lib/portail/access";
import { PageHeader } from "@/components/portail/PageHeader";
import { EventsClient, type EventRow } from "./EventsClient";

export default async function EventsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const me = await requireRole(locale, STAFF);
  const dict = getDictionary(locale as Locale);
  const supabase = await getServerSupabase();

  const [{ data: events }, { data: programs }, { data: cohorts }] = await Promise.all([
    supabase
      .from("events")
      .select("id,title,description,start_at,end_at,all_day,location,url,color,kind,program_id,cohort_id")
      .order("start_at"),
    supabase.from("programs").select("id,code,name_fr,name_en").order("sort_order"),
    supabase.from("cohorts").select("id,name").order("name"),
  ]);

  const rows: EventRow[] = (events ?? []).map((e) => ({
    id: e.id as string,
    title: e.title as string,
    description: e.description as string | null,
    startAt: e.start_at as string,
    endAt: e.end_at as string | null,
    allDay: e.all_day as boolean,
    location: e.location as string | null,
    url: e.url as string | null,
    color: e.color as string,
    kind: e.kind as EventRow["kind"],
    programId: e.program_id as string | null,
    cohortId: e.cohort_id as string | null,
  }));

  return (
    <>
      <PageHeader title={dict.portail.events.title} description={dict.portail.events.intro} />
      <div className="mt-6">
        <EventsClient
          locale={locale as Locale}
          dict={dict.portail.events}
          rows={rows}
          programs={(programs ?? []).map((p) => ({
            id: p.id as string,
            label: `${p.code as string} · ${(locale === "fr" ? p.name_fr : p.name_en) as string}`,
          }))}
          cohorts={(cohorts ?? []).map((c) => ({ id: c.id as string, label: c.name as string }))}
          canWrite={me.role === "admin" || me.role === "coordinator"}
        />
      </div>
    </>
  );
}
