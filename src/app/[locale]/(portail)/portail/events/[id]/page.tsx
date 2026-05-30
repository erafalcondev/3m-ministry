import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Calendar, Clock, MapPin, ExternalLink, CalendarPlus, Layers, Tag } from "lucide-react";
import { type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getServerSupabase } from "@/lib/supabase/server";

function fmtDateTime(iso: string, locale: Locale, allDay: boolean) {
  const d = new Date(iso);
  if (allDay) {
    return d.toLocaleDateString(locale === "fr" ? "fr-CA" : "en-CA", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }
  return d.toLocaleString(locale === "fr" ? "fr-CA" : "en-CA", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function EventPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const dict = getDictionary(locale as Locale);
  const supabase = await getServerSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login`);

  const { data: ev } = await supabase
    .from("events")
    .select("id,title,description,start_at,end_at,all_day,location,url,color,kind,program_id,cohort_id")
    .eq("id", id)
    .single();
  if (!ev) notFound();

  let programInfo: { code: string; name: string; color: string } | null = null;
  if (ev.program_id) {
    const { data: p } = await supabase
      .from("programs")
      .select("code,name_fr,name_en,color")
      .eq("id", ev.program_id as string)
      .single();
    if (p) {
      programInfo = {
        code: p.code as string,
        name: (locale === "fr" ? p.name_fr : p.name_en) as string,
        color: p.color as string,
      };
    }
  }
  let cohortInfo: { id: string; name: string } | null = null;
  if (ev.cohort_id) {
    const { data: c } = await supabase
      .from("cohorts")
      .select("id,name")
      .eq("id", ev.cohort_id as string)
      .single();
    if (c) cohortInfo = { id: c.id as string, name: c.name as string };
  }

  const color = (ev.color as string) || "#4fc3dc";
  const kind = ev.kind as keyof typeof dict.portail.events.kinds;

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href={`/${locale}/portail/admin/events`}
        className="mb-5 inline-flex items-center gap-1.5 text-xs text-muted transition hover:text-foreground"
      >
        <ArrowLeft size={13} />
        {dict.portail.events.title}
      </Link>

      <header
        className="rounded-3xl border border-white/10 bg-white/[0.03] p-6"
        style={{ borderLeftWidth: 6, borderLeftColor: color }}
      >
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.18em]"
          style={{ background: `${color}25`, color }}
        >
          <Tag size={11} />
          {dict.portail.events.kinds[kind]}
        </span>
        <h1 className="mt-3 font-display text-2xl text-foreground md:text-[28px]">{ev.title as string}</h1>
        {ev.description && (
          <p className="mt-2 text-sm text-muted text-pretty whitespace-pre-wrap">
            {ev.description as string}
          </p>
        )}

        <dl className="mt-5 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <Info icon={<Calendar size={14} className="text-brand/80" />}>
            {fmtDateTime(ev.start_at as string, locale as Locale, ev.all_day as boolean)}
          </Info>
          {ev.end_at && (
            <Info icon={<Clock size={14} className="text-brand/80" />}>
              → {fmtDateTime(ev.end_at as string, locale as Locale, ev.all_day as boolean)}
            </Info>
          )}
          {ev.location && (
            <Info icon={<MapPin size={14} className="text-brand/80" />}>{ev.location as string}</Info>
          )}
          {programInfo && (
            <Info icon={<Layers size={14} className="text-brand/80" />}>
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ background: programInfo.color }} aria-hidden />
                {programInfo.code} · {programInfo.name}
              </span>
            </Info>
          )}
          {cohortInfo && (
            <Info icon={<Layers size={14} className="text-brand/80" />}>
              <Link
                href={`/${locale}/portail/admin/cohorts/${cohortInfo.id}`}
                className="transition hover:text-brand"
              >
                {cohortInfo.name}
              </Link>
            </Info>
          )}
        </dl>

        <div className="mt-6 flex flex-wrap gap-2">
          <a
            href={`/api/events/${id}/ics?locale=${locale}`}
            download
            className="inline-flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-xs font-medium text-[#031019] transition hover:shadow-[0_12px_30px_-10px_var(--brand-glow)]"
          >
            <CalendarPlus size={13} />
            {dict.portail.events.addToCalendar}
          </a>
          {ev.url && (
            <a
              href={ev.url as string}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-foreground transition hover:border-brand/40 hover:bg-brand/10"
            >
              <ExternalLink size={13} />
              {(ev.url as string).replace(/^https?:\/\//, "").slice(0, 50)}
            </a>
          )}
        </div>
      </header>
    </div>
  );
}

function Info({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 text-muted">
      <span className="mt-0.5">{icon}</span>
      <span className="text-foreground/90">{children}</span>
    </div>
  );
}
