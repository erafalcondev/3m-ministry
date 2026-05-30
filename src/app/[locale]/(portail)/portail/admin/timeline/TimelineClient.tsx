"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, List, LayoutGrid } from "lucide-react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/fr";

type TimelineDict = Dictionary["portail"]["timeline"];
type StatusLabels = Dictionary["portail"]["common"]["cohortStatus"];

type Program = { id: string; code: string; name: string; color: string };
type Cohort = {
  id: string;
  programId: string;
  name: string;
  startDate: string;
  endDate: string;
  status: "planned" | "active" | "completed" | "canceled";
};
export type TimelineEvent = {
  id: string;
  title: string;
  startAt: string;
  endAt: string | null;
  color: string;
  kind: string;
};

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

function diffMonths(start: Date, end: Date): number {
  return (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

const STATUS_OPTIONS = ["planned", "active", "completed", "canceled"] as const;

export function TimelineClient({
  locale,
  dict,
  statusLabels,
  programs,
  cohorts,
  events,
}: {
  locale: Locale;
  dict: TimelineDict;
  statusLabels: StatusLabels;
  programs: Program[];
  cohorts: Cohort[];
  events: TimelineEvent[];
}) {
  const [programFilter, setProgramFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [view, setView] = useState<"linear" | "month">("linear");
  const [monthCursor, setMonthCursor] = useState<Date>(new Date());

  const filtered = useMemo(
    () =>
      cohorts.filter((c) => {
        if (programFilter && c.programId !== programFilter) return false;
        if (statusFilter && c.status !== statusFilter) return false;
        return true;
      }),
    [cohorts, programFilter, statusFilter],
  );

  const range = useMemo(() => {
    if (filtered.length === 0) {
      const now = new Date();
      return { start: addMonths(startOfMonth(now), -2), end: addMonths(startOfMonth(now), 12) };
    }
    const starts = filtered.map((c) => new Date(c.startDate));
    const ends = filtered.map((c) => new Date(c.endDate));
    const minStart = startOfMonth(new Date(Math.min(...starts.map((d) => d.getTime()))));
    const maxEnd = endOfMonth(new Date(Math.max(...ends.map((d) => d.getTime()))));
    return { start: addMonths(minStart, -1), end: addMonths(maxEnd, 2) };
  }, [filtered]);

  const monthsCount = diffMonths(range.start, range.end) + 1;
  const months: Date[] = [];
  for (let i = 0; i < monthsCount; i += 1) months.push(addMonths(range.start, i));

  const colWidth = 80;
  const gridWidth = monthsCount * colWidth;

  const today = new Date();
  const todayOffset = Math.max(
    0,
    Math.min(
      gridWidth,
      ((today.getTime() - range.start.getTime()) / (range.end.getTime() - range.start.getTime())) * gridWidth,
    ),
  );

  const programMap = new Map(programs.map((p) => [p.id, p]));

  function barFor(c: Cohort): { left: number; width: number } {
    const start = new Date(c.startDate);
    const end = new Date(c.endDate);
    const span = range.end.getTime() - range.start.getTime();
    const left = ((start.getTime() - range.start.getTime()) / span) * gridWidth;
    const width = Math.max(20, ((end.getTime() - start.getTime()) / span) * gridWidth);
    return { left, width };
  }

  return (
    <div>
      {/* Filters + view toggle */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <select
          value={programFilter}
          onChange={(e) => setProgramFilter(e.target.value)}
          className="h-9 rounded-full border border-white/10 bg-background/70 px-4 text-xs text-foreground focus:border-brand/60 focus:outline-none"
        >
          <option value="">{dict.filterAll}</option>
          {programs.map((p) => (
            <option key={p.id} value={p.id}>
              {p.code}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 rounded-full border border-white/10 bg-background/70 px-4 text-xs text-foreground focus:border-brand/60 focus:outline-none"
        >
          <option value="">{dict.filterStatus}</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {statusLabels[s]}
            </option>
          ))}
        </select>
        <div className="ml-auto inline-flex rounded-full border border-white/10 bg-background/40 p-0.5 text-[11px]">
          <button
            type="button"
            onClick={() => setView("linear")}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 transition ${
              view === "linear" ? "bg-brand text-[#031019] font-medium" : "text-muted hover:text-foreground"
            }`}
          >
            <List size={11} />
            {dict.viewLinear}
          </button>
          <button
            type="button"
            onClick={() => setView("month")}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 transition ${
              view === "month" ? "bg-brand text-[#031019] font-medium" : "text-muted hover:text-foreground"
            }`}
          >
            <LayoutGrid size={11} />
            {dict.viewMonth}
          </button>
        </div>
      </div>

      {view === "month" ? (
        <MonthGrid
          locale={locale}
          dict={dict}
          cursor={monthCursor}
          setCursor={setMonthCursor}
          cohorts={filtered}
          events={events}
          programs={programs}
        />
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-16 text-center text-sm text-muted">
          {dict.empty}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.03]">
          <div className="relative" style={{ width: gridWidth + 240 }}>
            {/* Header months row */}
            <div className="sticky top-0 z-10 flex border-b border-white/5 bg-background/60 backdrop-blur-xl">
              <div className="w-60 shrink-0 px-4 py-2 text-[10px] uppercase tracking-[0.18em] text-muted">
                {dict.colHeader}
              </div>
              <div className="relative" style={{ width: gridWidth }}>
                <div className="flex">
                  {months.map((m, i) => {
                    const showYear =
                      i === 0 || (i > 0 && months[i - 1].getFullYear() !== m.getFullYear());
                    return (
                      <div
                        key={`${m.getTime()}`}
                        className="border-l border-white/5 px-2 py-2 text-[10px] uppercase tracking-[0.14em] text-muted/80"
                        style={{ width: colWidth }}
                      >
                        {dict.months[m.getMonth()]}
                        {showYear && (
                          <span className="ml-1 text-[9px] text-muted/60">{m.getFullYear()}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Today vertical line */}
            <div
              className="pointer-events-none absolute top-0 z-20 h-full border-l border-amber-300/60"
              style={{ left: 240 + todayOffset }}
            >
              <span className="absolute -top-px ml-1 rounded-full bg-amber-300/20 px-1.5 py-0.5 text-[9px] uppercase tracking-[0.18em] text-amber-200">
                {dict.today}
              </span>
            </div>

            {/* Rows */}
            <ul className="relative">
              {filtered.map((c, idx) => {
                const prog = programMap.get(c.programId);
                const { left, width } = barFor(c);
                return (
                  <motion.li
                    key={c.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.02, duration: 0.25 }}
                    className="flex border-b border-white/[0.04] last:border-b-0"
                  >
                    <div className="w-60 shrink-0 px-4 py-3">
                      <p className="truncate text-sm text-foreground">{c.name}</p>
                      <p className="text-[10px] uppercase tracking-[0.14em] text-muted">
                        {prog?.code}
                      </p>
                    </div>
                    <div className="relative h-12" style={{ width: gridWidth }}>
                      {months.map((m) => (
                        <div
                          key={m.getTime()}
                          className="absolute top-0 h-full border-l border-white/[0.04]"
                          style={{ left: ((m.getTime() - range.start.getTime()) / (range.end.getTime() - range.start.getTime())) * gridWidth }}
                        />
                      ))}
                      <Link
                        href={`/${locale}/portail/admin/cohorts/${c.id}`}
                        className="group absolute top-1/2 flex h-7 -translate-y-1/2 items-center overflow-hidden rounded-full pl-2 pr-3 text-[11px] font-medium transition hover:brightness-110"
                        style={{
                          left,
                          width,
                          background: `linear-gradient(90deg, ${prog?.color || "#4fc3dc"}, ${prog?.color || "#4fc3dc"}80)`,
                          color: "#031019",
                          opacity: c.status === "canceled" ? 0.4 : 1,
                        }}
                        title={c.name}
                      >
                        <span className="truncate">{c.name}</span>
                      </Link>
                    </div>
                  </motion.li>
                );
              })}

              {/* Events row — with labels */}
              {events.length > 0 && (
                <li className="flex border-t border-white/10">
                  <div className="w-60 shrink-0 px-4 py-3">
                    <p className="text-sm text-foreground">{dict.eventsLane}</p>
                    <p className="text-[10px] uppercase tracking-[0.14em] text-muted">
                      {events.length}
                    </p>
                  </div>
                  <div className="relative min-h-16 py-2" style={{ width: gridWidth }}>
                    {months.map((m) => (
                      <div
                        key={m.getTime()}
                        className="absolute top-0 h-full border-l border-white/[0.04]"
                        style={{
                          left:
                            ((m.getTime() - range.start.getTime()) /
                              (range.end.getTime() - range.start.getTime())) *
                            gridWidth,
                        }}
                      />
                    ))}
                    {events.map((e, i) => {
                      const start = new Date(e.startAt);
                      const end = e.endAt ? new Date(e.endAt) : start;
                      const span = range.end.getTime() - range.start.getTime();
                      const left = ((start.getTime() - range.start.getTime()) / span) * gridWidth;
                      const w = Math.max(
                        60,
                        ((end.getTime() - start.getTime()) / span) * gridWidth,
                      );
                      if (left < 0 || left > gridWidth) return null;
                      // Stagger vertically to avoid overlap on dense periods
                      const lane = i % 3;
                      const top = 6 + lane * 18;
                      return (
                        <span
                          key={e.id}
                          title={`${e.title} — ${start.toLocaleDateString(locale === "fr" ? "fr-CA" : "en-CA")}`}
                          className="absolute flex items-center gap-1 truncate rounded-full px-2 py-0.5 text-[10px] font-medium"
                          style={{
                            left,
                            maxWidth: w,
                            top,
                            background: `${e.color}25`,
                            color: e.color,
                            border: `1px solid ${e.color}55`,
                          }}
                        >
                          <span
                            className="h-1.5 w-1.5 shrink-0 rounded-full"
                            style={{ background: e.color }}
                          />
                          <span className="truncate">{e.title}</span>
                        </span>
                      );
                    })}
                  </div>
                </li>
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

function MonthGrid({
  locale,
  dict,
  cursor,
  setCursor,
  cohorts,
  events,
  programs,
}: {
  locale: Locale;
  dict: TimelineDict;
  cursor: Date;
  setCursor: (d: Date) => void;
  cohorts: Cohort[];
  events: TimelineEvent[];
  programs: Program[];
}) {
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const firstWeekDay = (first.getDay() + (locale === "fr" ? 6 : 0)) % 7;
  const daysInMonth = last.getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < firstWeekDay; i += 1) cells.push(null);
  for (let d = 1; d <= daysInMonth; d += 1) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);

  const monthName = first.toLocaleDateString(locale === "fr" ? "fr-CA" : "en-CA", {
    month: "long",
    year: "numeric",
  });

  const weekdayLabels =
    locale === "fr" ? ["L", "M", "M", "J", "V", "S", "D"] : ["S", "M", "T", "W", "T", "F", "S"];

  const programMap = new Map(programs.map((p) => [p.id, p]));

  function cohortsCovering(day: Date): Cohort[] {
    return cohorts.filter((c) => {
      const s = new Date(c.startDate);
      const e = new Date(c.endDate);
      const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate());
      const dayEnd = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 23, 59, 59);
      return s <= dayEnd && e >= dayStart;
    });
  }

  function eventsOn(day: Date): TimelineEvent[] {
    return events.filter((e) => {
      const s = new Date(e.startAt);
      return sameDay(s, day);
    });
  }

  const today = new Date();

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-display text-base text-foreground capitalize">{monthName}</h3>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setCursor(new Date(year, month - 1, 1))}
            aria-label={dict.prevMonth}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-muted hover:text-foreground"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            type="button"
            onClick={() => setCursor(new Date())}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-muted hover:text-foreground"
          >
            {dict.todayCta}
          </button>
          <button
            type="button"
            onClick={() => setCursor(new Date(year, month + 1, 1))}
            aria-label={dict.nextMonth}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-muted hover:text-foreground"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[10px] uppercase tracking-[0.18em] text-muted/70">
        {weekdayLabels.map((w, i) => (
          <span key={i} className="py-1">
            {w}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (!d) {
            return <div key={i} className="min-h-24 rounded-lg bg-transparent" />;
          }
          const isToday = sameDay(d, today);
          const cohortList = cohortsCovering(d);
          const evList = eventsOn(d);
          return (
            <div
              key={i}
              className={`relative flex min-h-24 flex-col gap-0.5 rounded-lg border border-white/5 p-1.5 ${
                isToday ? "ring-2 ring-brand/50" : ""
              }`}
            >
              <span
                className={`text-[11px] font-medium ${
                  isToday ? "text-brand" : "text-foreground/80"
                }`}
              >
                {d.getDate()}
              </span>
              <div className="flex flex-1 flex-col gap-0.5 overflow-hidden">
                {cohortList.slice(0, 2).map((c) => {
                  const prog = programMap.get(c.programId);
                  const color = prog?.color || "#4fc3dc";
                  return (
                    <Link
                      key={c.id}
                      href={`/${locale}/portail/admin/cohorts/${c.id}`}
                      title={c.name}
                      className="block truncate rounded-md px-1 py-0.5 text-[9px] font-medium transition hover:brightness-110"
                      style={{
                        background: color,
                        color: "#031019",
                        opacity: c.status === "canceled" ? 0.4 : 1,
                      }}
                    >
                      {c.name}
                    </Link>
                  );
                })}
                {cohortList.length > 2 && (
                  <span className="text-[9px] text-muted">+{cohortList.length - 2}</span>
                )}
                {evList.slice(0, 2).map((e) => (
                  <span
                    key={e.id}
                    title={e.title}
                    className="flex items-center gap-1 truncate rounded-md px-1 py-0.5 text-[9px]"
                    style={{
                      background: `${e.color}25`,
                      color: e.color,
                      border: `1px solid ${e.color}55`,
                    }}
                  >
                    <span
                      className="h-1 w-1 shrink-0 rounded-full"
                      style={{ background: e.color }}
                    />
                    <span className="truncate">{e.title}</span>
                  </span>
                ))}
                {evList.length > 2 && (
                  <span className="text-[9px] text-muted">+{evList.length - 2}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
