"use client";

import { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from "recharts";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/fr";

type AnalyticsDict = Dictionary["portail"]["analytics"];

type Period = 7 | 30 | 90 | 365;

export function AnalyticsCharts({
  locale,
  dict,
  registrations,
  profiles,
  members,
  cohorts,
  programs,
  completedAssignmentsByStudent,
}: {
  locale: Locale;
  dict: AnalyticsDict;
  registrations: { date: string; status: string }[];
  profiles: { id: string; role: string; status: string }[];
  members: { studentId: string; cohortId: string }[];
  cohorts: { id: string; name: string; programId: string | null; status: string }[];
  programs: { id: string; code: string; color: string }[];
  completedAssignmentsByStudent: Record<string, number>;
}) {
  const [period, setPeriod] = useState<Period>(30);

  // Registrations chart (daily bucket over the selected period)
  const registrationData = useMemo(() => {
    const since = Date.now() - period * 24 * 60 * 60 * 1000;
    const buckets = new Map<string, number>();
    for (let i = 0; i <= period; i += 1) {
      const d = new Date(since + i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      buckets.set(key, 0);
    }
    for (const r of registrations) {
      const t = new Date(r.date).getTime();
      if (t < since) continue;
      const key = new Date(t).toISOString().slice(0, 10);
      if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }
    return Array.from(buckets.entries()).map(([date, count]) => ({
      date: new Date(date).toLocaleDateString(locale === "fr" ? "fr-CA" : "en-CA", {
        month: "short",
        day: "2-digit",
      }),
      count,
    }));
  }, [registrations, period, locale]);

  // Students per program
  const programDist = useMemo(() => {
    const cohortToProgram = new Map(cohorts.map((c) => [c.id, c.programId]));
    const studentToPrograms = new Map<string, Set<string>>();
    for (const m of members) {
      const pid = cohortToProgram.get(m.cohortId);
      if (!pid) continue;
      const set = studentToPrograms.get(m.studentId) ?? new Set<string>();
      set.add(pid);
      studentToPrograms.set(m.studentId, set);
    }
    const counts = new Map<string, number>();
    for (const programs of studentToPrograms.values()) {
      for (const pid of programs) {
        counts.set(pid, (counts.get(pid) ?? 0) + 1);
      }
    }
    return programs
      .map((p) => ({
        code: p.code,
        color: p.color,
        students: counts.get(p.id) ?? 0,
      }))
      .filter((d) => d.students > 0)
      .sort((a, b) => b.students - a.students);
  }, [members, cohorts, programs]);

  // Status breakdown (pie)
  const statusDist = useMemo(() => {
    const counts: Record<string, number> = { approved: 0, pending: 0, refused: 0 };
    for (const p of profiles) counts[p.status] = (counts[p.status] ?? 0) + 1;
    return [
      { name: "approved", value: counts.approved, color: "#10b981" },
      { name: "pending", value: counts.pending, color: "#f59e0b" },
      { name: "refused", value: counts.refused, color: "#ef4444" },
    ].filter((d) => d.value > 0);
  }, [profiles]);

  // Completion by cohort
  const completionByCohort = useMemo(() => {
    const cohortStudents = new Map<string, string[]>();
    for (const m of members) {
      const arr = cohortStudents.get(m.cohortId) ?? [];
      arr.push(m.studentId);
      cohortStudents.set(m.cohortId, arr);
    }
    const out: { name: string; completed: number }[] = [];
    for (const [cohortId, studentIds] of cohortStudents) {
      const c = cohorts.find((x) => x.id === cohortId);
      if (!c) continue;
      const total = studentIds.reduce(
        (acc, sid) => acc + (completedAssignmentsByStudent[sid] ?? 0),
        0,
      );
      out.push({ name: c.name.slice(0, 18), completed: total });
    }
    return out.sort((a, b) => b.completed - a.completed).slice(0, 8);
  }, [members, cohorts, completedAssignmentsByStudent]);

  const periodLabel: Record<Period, string> = {
    7: dict.period7,
    30: dict.period30,
    90: dict.period90,
    365: dict.period365,
  };

  return (
    <div className="mt-8">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="text-xs uppercase tracking-[0.18em] text-muted">
          {dict.filterPeriod}
        </span>
        <div className="inline-flex rounded-full border border-white/10 bg-background/40 p-0.5 text-[11px]">
          {([7, 30, 90, 365] as Period[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={`rounded-full px-3 py-1 transition ${
                period === p ? "bg-brand text-[#031019] font-medium" : "text-muted hover:text-foreground"
              }`}
            >
              {periodLabel[p]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <ChartCard title={dict.chartRegistrations}>
          {registrationData.length === 0 ? (
            <Empty text={dict.noData} />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={registrationData}>
                <defs>
                  <linearGradient id="regGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--brand)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="var(--brand)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="date" stroke="#93a4bf" fontSize={10} tickLine={false} />
                <YAxis stroke="#93a4bf" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "rgba(10, 20, 38, 0.95)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="var(--brand)"
                  strokeWidth={2}
                  fill="url(#regGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title={dict.chartStatusDist}>
          {statusDist.length === 0 ? (
            <Empty text={dict.noData} />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={statusDist}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                >
                  {statusDist.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "rgba(10, 20, 38, 0.95)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title={dict.chartProgramDist}>
          {programDist.length === 0 ? (
            <Empty text={dict.noData} />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={programDist}>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="code" stroke="#93a4bf" fontSize={10} tickLine={false} />
                <YAxis stroke="#93a4bf" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "rgba(10, 20, 38, 0.95)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="students" radius={[6, 6, 0, 0]}>
                  {programDist.map((d) => (
                    <Cell key={d.code} fill={d.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title={dict.chartCompletionByCohort}>
          {completionByCohort.length === 0 ? (
            <Empty text={dict.noData} />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={completionByCohort} layout="vertical">
                <CartesianGrid stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" stroke="#93a4bf" fontSize={10} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="#93a4bf"
                  fontSize={10}
                  tickLine={false}
                  width={120}
                />
                <Tooltip
                  contentStyle={{
                    background: "rgba(10, 20, 38, 0.95)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="completed" fill="var(--brand)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <h3 className="mb-3 text-xs uppercase tracking-[0.18em] text-muted">{title}</h3>
      {children}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="flex h-[180px] items-center justify-center text-xs text-muted">{text}</div>
  );
}
