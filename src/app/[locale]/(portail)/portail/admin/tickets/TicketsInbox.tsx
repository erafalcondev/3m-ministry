"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Clock, MessageCircle } from "lucide-react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/fr";

type TicketsDict = Dictionary["portail"]["tickets"];

export type TicketRow = {
  id: string;
  subject: string;
  status: "open" | "in_progress" | "resolved" | "archived";
  createdAt: string;
  studentId: string;
  studentName: string;
};

const STATUS_COLORS: Record<TicketRow["status"], string> = {
  open: "border-brand/30 bg-brand/10 text-brand",
  in_progress: "border-amber-400/30 bg-amber-400/10 text-amber-200",
  resolved: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  archived: "border-white/10 bg-white/5 text-muted",
};

function fmtEastern(iso: string, locale: Locale): string {
  return new Date(iso).toLocaleString(locale === "fr" ? "fr-CA" : "en-CA", {
    timeZone: "America/Toronto",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function TicketsInbox({
  locale,
  dict,
  rows,
}: {
  locale: Locale;
  dict: TicketsDict;
  rows: TicketRow[];
}) {
  const [filter, setFilter] = useState<"all" | "open" | "resolved" | "archived">("open");

  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        if (filter === "all") return true;
        if (filter === "open") return r.status === "open" || r.status === "in_progress";
        if (filter === "resolved") return r.status === "resolved";
        if (filter === "archived") return r.status === "archived";
        return true;
      }),
    [rows, filter],
  );

  return (
    <div>
      <div className="mb-4 inline-flex rounded-full border border-white/10 bg-background/40 p-0.5 text-[11px]">
        {(["open", "resolved", "archived", "all"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1 transition ${
              filter === f ? "bg-brand text-[#031019] font-medium" : "text-muted hover:text-foreground"
            }`}
          >
            {f === "open"
              ? dict.filterOpen
              : f === "resolved"
                ? dict.filterResolved
                : f === "archived"
                  ? dict.filterArchived
                  : dict.filterAll}
          </button>
        ))}
        <span className="ml-2 mr-3 inline-flex items-center text-[11px] text-muted">{filtered.length}</span>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-16 text-center">
          <MessageCircle size={36} className="text-muted/60" />
          <p className="mt-4 text-sm text-muted">{dict.empty}</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((t) => (
            <li key={t.id}>
              <Link
                href={`/${locale}/portail/admin/tickets/${t.id}`}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 text-sm transition hover:border-brand/40 hover:bg-brand/[0.06]"
              >
                <div className="min-w-0">
                  <p className="text-foreground">{t.subject}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    {t.studentName} ·{" "}
                    <span className="inline-flex items-center gap-1">
                      <Clock size={10} />
                      {fmtEastern(t.createdAt, locale)}
                    </span>
                  </p>
                </div>
                <span
                  className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] uppercase tracking-[0.18em] ${STATUS_COLORS[t.status]}`}
                >
                  {dict.status[t.status]}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
