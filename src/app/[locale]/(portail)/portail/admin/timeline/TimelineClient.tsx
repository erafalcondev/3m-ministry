"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
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
    // pad 1 month each side
    return { start: addMonths(minStart, -1), end: addMonths(maxEnd, 2) };
  }, [filtered]);

  const monthsCount = diffMonths(range.start, range.end) + 1;
  const months: Date[] = [];
  for (let i = 0; i < monthsCount; i += 1) months.push(addMonths(range.start, i));

  const colWidth = 80; // px per month
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
      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-2">
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
      </div>

      {filtered.length === 0 ? (
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
                      {/* Month gridlines */}
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

              {/* Events row */}
              {events.length > 0 && (
                <li className="flex border-t border-white/10">
                  <div className="w-60 shrink-0 px-4 py-3">
                    <p className="text-sm text-foreground">Événements</p>
                    <p className="text-[10px] uppercase tracking-[0.14em] text-muted">
                      {events.length} item(s)
                    </p>
                  </div>
                  <div className="relative h-12" style={{ width: gridWidth }}>
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
                    {events.map((e) => {
                      const start = new Date(e.startAt);
                      const end = e.endAt ? new Date(e.endAt) : start;
                      const span = range.end.getTime() - range.start.getTime();
                      const left = ((start.getTime() - range.start.getTime()) / span) * gridWidth;
                      const w = Math.max(
                        8,
                        ((end.getTime() - start.getTime()) / span) * gridWidth,
                      );
                      if (left < 0 || left > gridWidth) return null;
                      return (
                        <span
                          key={e.id}
                          title={`${e.title} — ${start.toLocaleDateString(locale === "fr" ? "fr-CA" : "en-CA")}`}
                          className="absolute top-1/2 -translate-y-1/2 rounded-full"
                          style={{
                            left,
                            width: w,
                            height: 8,
                            background: e.color,
                          }}
                        />
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
