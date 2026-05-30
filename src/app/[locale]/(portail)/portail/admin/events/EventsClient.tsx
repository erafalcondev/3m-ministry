"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Trash2, MapPin, ExternalLink, CalendarPlus, Filter } from "lucide-react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/fr";

type EventsDict = Dictionary["portail"]["events"];
export type EventKind = "session" | "evaluation" | "retreat" | "meeting" | "social" | "deadline" | "other";

export type EventRow = {
  id: string;
  title: string;
  description: string | null;
  startAt: string;
  endAt: string | null;
  allDay: boolean;
  location: string | null;
  url: string | null;
  color: string;
  kind: EventKind;
  programId: string | null;
  cohortId: string | null;
};

const KINDS: EventKind[] = ["session", "evaluation", "retreat", "meeting", "social", "deadline", "other"];
const COLOR_PRESETS = ["#4fc3dc", "#a78bfa", "#34d399", "#f59e0b", "#fb7185", "#f472b6", "#60a5fa"];

function fmtDateTime(iso: string, locale: Locale, allDay: boolean): string {
  const d = new Date(iso);
  if (allDay) {
    return d.toLocaleDateString(locale === "fr" ? "fr-CA" : "en-CA", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }
  return d.toLocaleString(locale === "fr" ? "fr-CA" : "en-CA", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function EventsClient({
  locale,
  dict,
  rows,
  programs,
  cohorts,
  canWrite,
}: {
  locale: Locale;
  dict: EventsDict;
  rows: EventRow[];
  programs: { id: string; label: string }[];
  cohorts: { id: string; label: string }[];
  canWrite: boolean;
}) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [filterKind, setFilterKind] = useState<string>("");
  const [timeFilter, setTimeFilter] = useState<"upcoming" | "past" | "all">("upcoming");
  const [pending, startTransition] = useTransition();

  const now = new Date();
  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        if (filterKind && r.kind !== filterKind) return false;
        const start = new Date(r.startAt);
        if (timeFilter === "upcoming" && start < now) return false;
        if (timeFilter === "past" && start >= now) return false;
        return true;
      }),
    [rows, filterKind, timeFilter, now],
  );

  function remove(id: string) {
    startTransition(async () => {
      const supabase = getBrowserSupabase();
      const { error } = await supabase.from("events").delete().eq("id", id);
      if (!error) router.refresh();
    });
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Filter size={14} className="text-muted" />
        <select
          value={filterKind}
          onChange={(e) => setFilterKind(e.target.value)}
          className="h-9 rounded-full border border-white/10 bg-background/70 px-4 text-xs text-foreground focus:border-brand/60 focus:outline-none"
        >
          <option value="">{dict.filterKind}</option>
          {KINDS.map((k) => (
            <option key={k} value={k}>
              {dict.kinds[k]}
            </option>
          ))}
        </select>
        <div className="inline-flex rounded-full border border-white/10 bg-background/40 p-0.5 text-[11px]">
          {(["upcoming", "all", "past"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTimeFilter(t)}
              className={`rounded-full px-3 py-1 transition ${
                timeFilter === t ? "bg-brand text-[#031019] font-medium" : "text-muted hover:text-foreground"
              }`}
            >
              {t === "upcoming" ? dict.filterUpcoming : t === "past" ? dict.filterPast : dict.filterAll}
            </button>
          ))}
        </div>
        {canWrite && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="ml-auto inline-flex h-9 items-center gap-2 rounded-full bg-brand px-4 text-xs font-medium text-[#031019] hover:shadow-[0_10px_30px_-10px_rgba(79,195,220,0.6)]"
          >
            <Plus size={13} />
            {dict.newCta}
          </button>
        )}
      </div>

      <AnimatePresence>
        {adding && (
          <EventForm
            dict={dict}
            programs={programs}
            cohorts={cohorts}
            onClose={() => setAdding(false)}
            onSaved={() => {
              setAdding(false);
              router.refresh();
            }}
          />
        )}
      </AnimatePresence>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-16 text-center text-sm text-muted">
          {dict.empty}
        </div>
      ) : (
        <ul className="space-y-2">
          <AnimatePresence initial={false}>
            {filtered.map((e) => (
              <motion.li
                key={e.id}
                layout
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                style={{ borderLeftWidth: 4, borderLeftColor: e.color }}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] uppercase tracking-[0.18em]"
                        style={{ background: `${e.color}25`, color: e.color }}
                      >
                        {dict.kinds[e.kind]}
                      </span>
                      <h3 className="text-sm text-foreground">{e.title}</h3>
                    </div>
                    {e.description && <p className="mt-1 text-xs text-muted text-pretty">{e.description}</p>}
                    <p className="mt-2 text-xs text-muted">
                      {fmtDateTime(e.startAt, locale, e.allDay)}
                      {e.endAt && ` → ${fmtDateTime(e.endAt, locale, e.allDay)}`}
                    </p>
                    {(e.location || e.url) && (
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted">
                        {e.location && (
                          <span className="inline-flex items-center gap-1.5">
                            <MapPin size={11} />
                            {e.location}
                          </span>
                        )}
                        {e.url && (
                          <a
                            href={e.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-brand hover:underline"
                          >
                            <ExternalLink size={11} />
                            {e.url.replace(/^https?:\/\//, "").slice(0, 40)}
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={`/api/events/${e.id}/ics?locale=${locale}`}
                      className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-muted transition hover:border-brand/40 hover:bg-brand/10 hover:text-foreground"
                      download
                    >
                      <CalendarPlus size={11} />
                      {dict.addToCalendar}
                    </a>
                    {canWrite && (
                      <button
                        type="button"
                        onClick={() => remove(e.id)}
                        disabled={pending}
                        className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-muted hover:border-red-400/40 hover:bg-red-400/10 hover:text-red-200 disabled:opacity-50"
                      >
                        <Trash2 size={11} />
                        {dict.deleteCta}
                      </button>
                    )}
                  </div>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}

function EventForm({
  dict,
  programs,
  cohorts,
  onClose,
  onSaved,
}: {
  dict: EventsDict;
  programs: { id: string; label: string }[];
  cohorts: { id: string; label: string }[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [allDay, setAllDay] = useState(false);
  const [location, setLocation] = useState("");
  const [url, setUrl] = useState("");
  const [color, setColor] = useState(COLOR_PRESETS[0]);
  const [kind, setKind] = useState<EventKind>("other");
  const [programId, setProgramId] = useState("");
  const [cohortId, setCohortId] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function save() {
    if (!title || !start) return;
    setError(null);
    startTransition(async () => {
      const supabase = getBrowserSupabase();
      const { error: err } = await supabase.from("events").insert({
        title,
        description: description || null,
        start_at: new Date(start).toISOString(),
        end_at: end ? new Date(end).toISOString() : null,
        all_day: allDay,
        location: location || null,
        url: url || null,
        color,
        kind,
        program_id: programId || null,
        cohort_id: cohortId || null,
      });
      if (err) {
        setError(err.message);
        return;
      }
      onSaved();
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      className="mb-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5"
    >
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Field label={dict.titleLabel}>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="h-11 w-full rounded-xl border border-white/10 bg-background/70 px-3 text-sm text-foreground focus:border-brand/60 focus:outline-none"
          />
        </Field>
        <Field label={dict.kindLabel}>
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as EventKind)}
            className="h-11 w-full rounded-xl border border-white/10 bg-background/70 px-3 text-sm text-foreground focus:border-brand/60 focus:outline-none"
          >
            {KINDS.map((k) => (
              <option key={k} value={k}>
                {dict.kinds[k]}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label={dict.descriptionLabel} className="mt-3">
        <textarea
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-background/70 px-3 py-2 text-sm text-foreground focus:border-brand/60 focus:outline-none"
        />
      </Field>

      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
        <Field label={dict.startLabel}>
          <input
            type="datetime-local"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="h-11 w-full rounded-xl border border-white/10 bg-background/70 px-3 text-sm text-foreground focus:border-brand/60 focus:outline-none"
          />
        </Field>
        <Field label={dict.endLabel}>
          <input
            type="datetime-local"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="h-11 w-full rounded-xl border border-white/10 bg-background/70 px-3 text-sm text-foreground focus:border-brand/60 focus:outline-none"
          />
        </Field>
      </div>

      <label className="mt-3 inline-flex items-center gap-2 text-xs text-muted">
        <input
          type="checkbox"
          checked={allDay}
          onChange={(e) => setAllDay(e.target.checked)}
          className="h-4 w-4 rounded border-white/10 bg-background"
        />
        {dict.allDayLabel}
      </label>

      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
        <Field label={dict.locationLabel}>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="h-11 w-full rounded-xl border border-white/10 bg-background/70 px-3 text-sm text-foreground focus:border-brand/60 focus:outline-none"
          />
        </Field>
        <Field label={dict.urlLabel}>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://"
            className="h-11 w-full rounded-xl border border-white/10 bg-background/70 px-3 text-sm text-foreground focus:border-brand/60 focus:outline-none"
          />
        </Field>
      </div>

      <Field label={dict.colorLabel} className="mt-3">
        <div className="flex items-center gap-2">
          {COLOR_PRESETS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={`h-7 w-7 rounded-full transition hover:scale-110 ${
                color === c ? "ring-2 ring-foreground/40" : ""
              }`}
              style={{ background: c }}
              aria-label={c}
            />
          ))}
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-7 w-9 cursor-pointer rounded-md border border-white/10 bg-background"
          />
        </div>
      </Field>

      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
        <Field label={dict.programLabel}>
          <select
            value={programId}
            onChange={(e) => setProgramId(e.target.value)}
            className="h-11 w-full rounded-xl border border-white/10 bg-background/70 px-3 text-sm text-foreground focus:border-brand/60 focus:outline-none"
          >
            <option value="">—</option>
            {programs.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label={dict.cohortLabel}>
          <select
            value={cohortId}
            onChange={(e) => setCohortId(e.target.value)}
            className="h-11 w-full rounded-xl border border-white/10 bg-background/70 px-3 text-sm text-foreground focus:border-brand/60 focus:outline-none"
          >
            <option value="">—</option>
            {cohorts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {error && (
        <div className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs text-muted hover:text-foreground"
        >
          <X size={12} />
          {dict.cancelCta}
        </button>
        <button
          type="button"
          onClick={save}
          disabled={pending || !title || !start}
          className="inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-1.5 text-xs font-medium text-[#031019] hover:shadow-[0_10px_30px_-10px_rgba(79,195,220,0.6)] disabled:opacity-50"
        >
          <Plus size={12} />
          {pending ? dict.saving : dict.saveCta}
        </button>
      </div>
    </motion.div>
  );
}

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`block ${className ?? ""}`}>
      <span className="mb-1.5 block text-[10px] uppercase tracking-[0.18em] text-muted">{label}</span>
      {children}
    </label>
  );
}
