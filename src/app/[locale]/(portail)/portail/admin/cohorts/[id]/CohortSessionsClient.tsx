"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, CalendarPlus, Clock, MapPin, Trash2, ChevronDown } from "lucide-react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { DatePicker } from "@/components/ui/DatePicker";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/fr";

type SessionsDict = Dictionary["portail"]["sessions"];

type AttendanceStatus = "present" | "absent" | "excused" | "online";

type Session = {
  id: string;
  date: string;
  startTime: string | null;
  endTime: string | null;
  location: string | null;
  agenda: string | null;
  status: "planned" | "completed" | "canceled";
};

type Member = { id: string; name: string };

type AttendanceRow = {
  sessionId: string;
  studentId: string;
  status: AttendanceStatus;
};

const STATUS_COLORS: Record<AttendanceStatus, string> = {
  present: "bg-brand text-[#031019]",
  absent: "bg-red-400/80 text-[#1a0000]",
  excused: "bg-amber-300/80 text-[#1a0f00]",
  online: "bg-purple-400/80 text-[#0a0014]",
};

function fmtDate(iso: string, locale: Locale) {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const d = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(iso);
  return d.toLocaleDateString(locale === "fr" ? "fr-CA" : "en-CA", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function CohortSessionsClient({
  cohortId,
  locale,
  dict,
  sessions,
  members,
  attendance,
  canWrite,
}: {
  cohortId: string;
  locale: Locale;
  dict: SessionsDict;
  sessions: Session[];
  members: Member[];
  attendance: AttendanceRow[];
  canWrite: boolean;
}) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("19:00");
  const [endTime, setEndTime] = useState("22:00");
  const [location, setLocation] = useState("La Cité Mascouche");
  const [agenda, setAgenda] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const attendanceMap = new Map<string, AttendanceStatus>();
  for (const a of attendance) {
    attendanceMap.set(`${a.sessionId}/${a.studentId}`, a.status);
  }

  function createSession() {
    if (!date) return;
    startTransition(async () => {
      const supabase = getBrowserSupabase();
      const { error } = await supabase.from("cohort_sessions").insert({
        cohort_id: cohortId,
        date,
        start_time: startTime || null,
        end_time: endTime || null,
        location: location || null,
        agenda: agenda || null,
      });
      if (!error) {
        setAdding(false);
        setDate("");
        setAgenda("");
        router.refresh();
      }
    });
  }

  function deleteSession(id: string) {
    startTransition(async () => {
      const supabase = getBrowserSupabase();
      const { error } = await supabase.from("cohort_sessions").delete().eq("id", id);
      if (!error) router.refresh();
    });
  }

  function setAttendance(sessionId: string, studentId: string, status: AttendanceStatus) {
    startTransition(async () => {
      const supabase = getBrowserSupabase();
      const { error } = await supabase
        .from("session_attendance")
        .upsert(
          { session_id: sessionId, student_id: studentId, status, recorded_at: new Date().toISOString() },
          { onConflict: "session_id,student_id" },
        );
      if (!error) router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {canWrite && (
        <>
          {!adding ? (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-muted transition hover:border-brand/40 hover:bg-brand/10 hover:text-foreground"
            >
              <CalendarPlus size={14} />
              {dict.addCta}
            </button>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
            >
              <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_140px_140px_1fr]">
                <Field label={dict.dateLabel}>
                  <DatePicker locale={locale} value={date} onChange={setDate} required />
                </Field>
                <Field label={dict.startLabel}>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="h-11 w-full rounded-xl border border-white/10 bg-background/70 px-3 text-sm text-foreground focus:border-brand/60 focus:outline-none focus:ring-2 focus:ring-brand/30"
                  />
                </Field>
                <Field label={dict.endLabel}>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="h-11 w-full rounded-xl border border-white/10 bg-background/70 px-3 text-sm text-foreground focus:border-brand/60 focus:outline-none focus:ring-2 focus:ring-brand/30"
                  />
                </Field>
                <Field label={dict.locationLabel}>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="h-11 w-full rounded-xl border border-white/10 bg-background/70 px-3 text-sm text-foreground focus:border-brand/60 focus:outline-none focus:ring-2 focus:ring-brand/30"
                  />
                </Field>
              </div>
              <Field label={dict.agendaLabel}>
                <textarea
                  rows={3}
                  placeholder={dict.agendaPlaceholder}
                  value={agenda}
                  onChange={(e) => setAgenda(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-background/70 px-3 py-2 text-sm text-foreground focus:border-brand/60 focus:outline-none focus:ring-2 focus:ring-brand/30"
                />
              </Field>
              <div className="mt-3 flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAdding(false)}
                  className="rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs text-muted hover:text-foreground"
                >
                  {dict.cancelCta}
                </button>
                <button
                  type="button"
                  onClick={createSession}
                  disabled={pending || !date}
                  className="inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-1.5 text-xs font-medium text-[#031019] hover:shadow-[0_10px_30px_-10px_rgba(79,195,220,0.6)] disabled:opacity-50"
                >
                  <Plus size={13} />
                  {pending ? dict.saving : dict.saveCta}
                </button>
              </div>
            </motion.div>
          )}
        </>
      )}

      {sessions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-10 text-center text-sm text-muted">
          {dict.empty}
        </div>
      ) : (
        <ul className="space-y-2">
          <AnimatePresence initial={false}>
            {sessions.map((s) => (
              <motion.li
                key={s.id}
                layout
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]"
              >
                <button
                  type="button"
                  onClick={() => setExpanded((id) => (id === s.id ? null : s.id))}
                  className="flex w-full flex-wrap items-center justify-between gap-3 px-5 py-3 text-left text-sm transition hover:bg-white/[0.02]"
                  aria-expanded={expanded === s.id}
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-foreground">{fmtDate(s.date, locale)}</span>
                    {s.startTime && (
                      <span className="inline-flex items-center gap-1 text-xs text-muted">
                        <Clock size={11} />
                        {s.startTime.slice(0, 5)}
                        {s.endTime ? `–${s.endTime.slice(0, 5)}` : ""}
                      </span>
                    )}
                    {s.location && (
                      <span className="inline-flex items-center gap-1 text-xs text-muted">
                        <MapPin size={11} />
                        {s.location}
                      </span>
                    )}
                  </div>
                  <ChevronDown
                    size={14}
                    className={`text-muted transition ${expanded === s.id ? "rotate-180" : ""}`}
                  />
                </button>

                <AnimatePresence>
                  {expanded === s.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden border-t border-white/5"
                    >
                      <div className="space-y-4 p-5">
                        {s.agenda && (
                          <pre className="whitespace-pre-wrap rounded-xl border border-white/5 bg-background/40 p-3 font-sans text-sm text-muted text-pretty">
                            {s.agenda}
                          </pre>
                        )}

                        <div>
                          <p className="mb-2 text-xs uppercase tracking-[0.18em] text-muted">
                            {dict.attendanceTitle}
                          </p>
                          {members.length === 0 ? (
                            <p className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-4 text-center text-xs text-muted">
                              {dict.attendanceEmpty}
                            </p>
                          ) : (
                            <ul className="space-y-1.5">
                              {members.map((m) => {
                                const current = attendanceMap.get(`${s.id}/${m.id}`);
                                return (
                                  <li
                                    key={m.id}
                                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/5 bg-background/30 px-3 py-2 text-sm"
                                  >
                                    <span className="text-foreground">{m.name}</span>
                                    {canWrite ? (
                                      <div className="flex items-center gap-1">
                                        {(["present", "online", "excused", "absent"] as AttendanceStatus[]).map((opt) => (
                                          <button
                                            key={opt}
                                            type="button"
                                            onClick={() => setAttendance(s.id, m.id, opt)}
                                            disabled={pending}
                                            className={`rounded-full px-2.5 py-0.5 text-[10px] uppercase tracking-[0.18em] transition ${
                                              current === opt
                                                ? STATUS_COLORS[opt]
                                                : "border border-white/10 bg-white/5 text-muted hover:text-foreground"
                                            }`}
                                          >
                                            {opt === "present"
                                              ? dict.markPresent
                                              : opt === "absent"
                                                ? dict.markAbsent
                                                : opt === "excused"
                                                  ? dict.markExcused
                                                  : dict.markOnline}
                                          </button>
                                        ))}
                                      </div>
                                    ) : (
                                      <span className="text-xs text-muted">
                                        {current ? current : "—"}
                                      </span>
                                    )}
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </div>

                        {canWrite && (
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={() => deleteSession(s.id)}
                              disabled={pending}
                              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-muted hover:border-red-400/40 hover:bg-red-400/10 hover:text-red-200 disabled:opacity-50"
                            >
                              <Trash2 size={11} />
                              {dict.deleteSession}
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 mt-3 block text-[10px] uppercase tracking-[0.18em] text-muted">{label}</span>
      {children}
    </label>
  );
}
