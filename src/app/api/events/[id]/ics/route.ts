import { NextResponse, type NextRequest } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";

function toUTC(iso: string, allDay: boolean): string {
  const d = new Date(iso);
  if (allDay) {
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    return `${y}${m}${day}`;
  }
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  const ss = String(d.getUTCSeconds()).padStart(2, "0");
  return `${y}${m}${day}T${hh}${mm}${ss}Z`;
}

function escape(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const supabase = await getServerSupabase();
  const { data: ev } = await supabase
    .from("events")
    .select("id,title,description,start_at,end_at,all_day,location,url")
    .eq("id", id)
    .single();
  if (!ev) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const start = ev.start_at as string;
  const end = (ev.end_at as string | null) ?? start;
  const allDay = ev.all_day as boolean;

  const dtType = allDay ? "VALUE=DATE:" : "";
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//3M Ministry//Portail//FR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${id}@3mministry.com`,
    `DTSTAMP:${toUTC(new Date().toISOString(), false)}`,
    `DTSTART;${dtType}${toUTC(start, allDay)}`,
    `DTEND;${dtType}${toUTC(end, allDay)}`,
    `SUMMARY:${escape(ev.title as string)}`,
  ];
  if (ev.description) lines.push(`DESCRIPTION:${escape(ev.description as string)}`);
  if (ev.location) lines.push(`LOCATION:${escape(ev.location as string)}`);
  if (ev.url) lines.push(`URL:${ev.url as string}`);
  lines.push("END:VEVENT", "END:VCALENDAR");

  return new NextResponse(lines.join("\r\n"), {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="event-${id}.ics"`,
      "Cache-Control": "private, no-store",
    },
  });
}
