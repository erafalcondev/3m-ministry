"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Trash2, FileText, Send, Layers, ExternalLink, Pencil, Check, MessageSquare } from "lucide-react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { SearchPicker } from "@/components/ui/SearchPicker";
import { DatePicker } from "@/components/ui/DatePicker";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/fr";

type CoursesDict = Dictionary["portail"]["courses"];

type Resource = { id: string; title: string; kind: string; language: string };
type AvailableResource = { id: string; label: string; secondary: string };
type Assignment = {
  id: string;
  title: string;
  instructions: string | null;
  externalUrl: string | null;
  dueDate: string | null;
  resourceId: string | null;
};
type Note = { id: string; authorId: string | null; authorName: string; body: string; createdAt: string };
type AccessRow = { id: string; name: string };

function fmtDate(iso: string, locale: Locale) {
  return new Date(iso).toLocaleDateString(locale === "fr" ? "fr-CA" : "en-CA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function CourseDetailClient({
  courseId,
  currentUserId,
  locale,
  dict,
  resources,
  availableResources,
  assignments,
  attachedCohorts,
  attachedStudents,
  eligibleCohorts,
  eligibleStudents,
  notes,
}: {
  courseId: string;
  currentUserId: string;
  locale: Locale;
  dict: CoursesDict;
  resources: Resource[];
  availableResources: AvailableResource[];
  assignments: Assignment[];
  attachedCohorts: AccessRow[];
  attachedStudents: AccessRow[];
  eligibleCohorts: { id: string; label: string }[];
  eligibleStudents: AvailableResource[];
  notes: Note[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  // Add resource
  const [resAddOpen, setResAddOpen] = useState(false);
  const [resPick, setResPick] = useState("");

  // Add assignment
  const [asgOpen, setAsgOpen] = useState(false);
  const [asgTitle, setAsgTitle] = useState("");
  const [asgLink, setAsgLink] = useState("");
  const [asgInstr, setAsgInstr] = useState("");
  const [asgDue, setAsgDue] = useState("");

  // Add cohort access
  const [cohortAddOpen, setCohortAddOpen] = useState(false);
  const [cohortPick, setCohortPick] = useState("");

  // Add student access
  const [studentAddOpen, setStudentAddOpen] = useState(false);
  const [studentPick, setStudentPick] = useState("");

  // Assignment editing
  const [editingAsgId, setEditingAsgId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editLink, setEditLink] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editDue, setEditDue] = useState("");

  // Notes composer
  const [noteBody, setNoteBody] = useState("");

  function attachResource() {
    if (!resPick) return;
    startTransition(async () => {
      const supabase = getBrowserSupabase();
      const { error } = await supabase.from("course_resources").insert({ course_id: courseId, resource_id: resPick });
      if (!error) {
        setResAddOpen(false);
        setResPick("");
        router.refresh();
      }
    });
  }
  function detachResource(rid: string) {
    startTransition(async () => {
      const supabase = getBrowserSupabase();
      const { error } = await supabase.from("course_resources").delete().eq("course_id", courseId).eq("resource_id", rid);
      if (!error) router.refresh();
    });
  }

  function addAssignment() {
    if (!asgTitle) return;
    startTransition(async () => {
      const supabase = getBrowserSupabase();
      const { error } = await supabase.from("assignments").insert({
        course_id: courseId,
        title: asgTitle,
        external_url: asgLink || null,
        instructions: asgInstr || null,
        due_date: asgDue || null,
      });
      if (!error) {
        setAsgOpen(false);
        setAsgTitle("");
        setAsgLink("");
        setAsgInstr("");
        setAsgDue("");
        router.refresh();
      }
    });
  }
  function deleteAssignment(id: string) {
    startTransition(async () => {
      const supabase = getBrowserSupabase();
      const { error } = await supabase.from("assignments").delete().eq("id", id);
      if (!error) router.refresh();
    });
  }

  function startEditAssignment(a: Assignment) {
    setEditingAsgId(a.id);
    setEditTitle(a.title);
    setEditLink(a.externalUrl ?? "");
    setEditNotes(a.instructions ?? "");
    setEditDue(a.dueDate ?? "");
  }

  function saveEditAssignment(id: string) {
    if (!editTitle) return;
    startTransition(async () => {
      const supabase = getBrowserSupabase();
      const { error } = await supabase
        .from("assignments")
        .update({
          title: editTitle,
          external_url: editLink || null,
          instructions: editNotes || null,
          due_date: editDue || null,
        })
        .eq("id", id);
      if (!error) {
        setEditingAsgId(null);
        router.refresh();
      }
    });
  }

  function addCohort() {
    if (!cohortPick) return;
    startTransition(async () => {
      const supabase = getBrowserSupabase();
      const { error } = await supabase.from("course_cohorts").insert({ course_id: courseId, cohort_id: cohortPick });
      if (!error) {
        setCohortAddOpen(false);
        setCohortPick("");
        router.refresh();
      }
    });
  }
  function removeCohort(cid: string) {
    startTransition(async () => {
      const supabase = getBrowserSupabase();
      const { error } = await supabase.from("course_cohorts").delete().eq("course_id", courseId).eq("cohort_id", cid);
      if (!error) router.refresh();
    });
  }

  function addStudent() {
    if (!studentPick) return;
    startTransition(async () => {
      const supabase = getBrowserSupabase();
      const { error } = await supabase.from("course_students").insert({ course_id: courseId, student_id: studentPick });
      if (!error) {
        setStudentAddOpen(false);
        setStudentPick("");
        router.refresh();
      }
    });
  }
  function removeStudent(sid: string) {
    startTransition(async () => {
      const supabase = getBrowserSupabase();
      const { error } = await supabase.from("course_students").delete().eq("course_id", courseId).eq("student_id", sid);
      if (!error) router.refresh();
    });
  }

  function publishNote() {
    if (!noteBody.trim()) return;
    startTransition(async () => {
      const supabase = getBrowserSupabase();
      const { error } = await supabase.from("course_notes").insert({
        course_id: courseId,
        author_id: currentUserId,
        body: noteBody.trim(),
      });
      if (!error) {
        setNoteBody("");
        router.refresh();
      }
    });
  }
  function deleteNote(id: string) {
    startTransition(async () => {
      const supabase = getBrowserSupabase();
      const { error } = await supabase.from("course_notes").delete().eq("id", id);
      if (!error) router.refresh();
    });
  }

  return (
    <>
      {/* Resources */}
      <section className="mt-10">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg text-foreground">{dict.detailResources}</h2>
          {!resAddOpen ? (
            <button
              type="button"
              onClick={() => setResAddOpen(true)}
              disabled={availableResources.length === 0}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs text-muted transition hover:border-brand/40 hover:bg-brand/10 hover:text-foreground disabled:opacity-50"
            >
              <Plus size={13} />
              {dict.detailAddResource}
            </button>
          ) : null}
        </div>

        <AnimatePresence>
          {resAddOpen && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="mb-3 flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3"
            >
              <div className="flex-1 min-w-[240px]">
                <SearchPicker options={availableResources} value={resPick} onChange={setResPick} placeholder="—" />
              </div>
              <button
                type="button"
                onClick={attachResource}
                disabled={pending || !resPick}
                className="inline-flex h-11 items-center gap-1.5 rounded-full bg-brand px-4 text-xs font-medium text-[#031019] disabled:opacity-50"
              >
                <Plus size={13} />
                {dict.detailAddResource}
              </button>
              <button
                type="button"
                onClick={() => setResAddOpen(false)}
                className="rounded-full p-1 text-muted hover:bg-white/5 hover:text-foreground"
              >
                <X size={15} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {resources.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-8 text-center text-sm text-muted">
            {dict.detailResourcesEmpty}
          </p>
        ) : (
          <ul className="space-y-2">
            {resources.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm"
              >
                <span className="flex items-center gap-2.5 min-w-0">
                  <FileText size={14} className="shrink-0 text-brand/80" />
                  <span className="truncate text-foreground">{r.title}</span>
                  <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-muted">
                    {r.kind}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => detachResource(r.id)}
                  disabled={pending}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-muted hover:border-red-400/40 hover:bg-red-400/10 hover:text-red-200 disabled:opacity-50"
                >
                  <Trash2 size={11} />
                  {dict.detailRemoveResource}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Assignments */}
      <section className="mt-10">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg text-foreground">{dict.detailAssignments}</h2>
          {!asgOpen ? (
            <button
              type="button"
              onClick={() => setAsgOpen(true)}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs text-muted transition hover:border-brand/40 hover:bg-brand/10 hover:text-foreground"
            >
              <Plus size={13} />
              {dict.detailAddAssignment}
            </button>
          ) : null}
        </div>

        <AnimatePresence>
          {asgOpen && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="mb-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4"
            >
              <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_200px]">
                <Field label={dict.assignmentTitle}>
                  <input
                    type="text"
                    value={asgTitle}
                    onChange={(e) => setAsgTitle(e.target.value)}
                    className="h-11 w-full rounded-xl border border-white/10 bg-background/70 px-3 text-sm text-foreground focus:border-brand/60 focus:outline-none"
                  />
                </Field>
                <Field label={dict.assignmentDueDate}>
                  <DatePicker locale={locale} value={asgDue} onChange={setAsgDue} />
                </Field>
              </div>
              <Field label={dict.assignmentLink} className="mt-3">
                <input
                  type="url"
                  value={asgLink}
                  onChange={(e) => setAsgLink(e.target.value)}
                  placeholder={dict.assignmentLinkPlaceholder}
                  className="h-11 w-full rounded-xl border border-white/10 bg-background/70 px-3 text-sm text-foreground focus:border-brand/60 focus:outline-none"
                />
              </Field>
              <Field label={dict.assignmentNotes} className="mt-3">
                <textarea
                  rows={3}
                  value={asgInstr}
                  onChange={(e) => setAsgInstr(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-background/70 px-3 py-2 text-sm text-foreground focus:border-brand/60 focus:outline-none"
                />
              </Field>
              <div className="mt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAsgOpen(false)}
                  className="rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs text-muted hover:text-foreground"
                >
                  {dict.backToCourses}
                </button>
                <button
                  type="button"
                  onClick={addAssignment}
                  disabled={pending || !asgTitle}
                  className="inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-1.5 text-xs font-medium text-[#031019] disabled:opacity-50"
                >
                  <Plus size={13} />
                  {dict.assignmentSaveCta}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {assignments.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-8 text-center text-sm text-muted">
            {dict.detailAssignmentsEmpty}
          </p>
        ) : (
          <ul className="space-y-2">
            {assignments.map((a) =>
              editingAsgId === a.id ? (
                <li key={a.id} className="rounded-xl border border-brand/30 bg-brand/[0.04] p-4">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_200px]">
                    <Field label={dict.assignmentTitle}>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="h-10 w-full rounded-xl border border-white/10 bg-background/70 px-3 text-sm text-foreground focus:border-brand/60 focus:outline-none"
                      />
                    </Field>
                    <Field label={dict.assignmentDueDate}>
                      <DatePicker locale={locale} value={editDue} onChange={setEditDue} />
                    </Field>
                  </div>
                  <Field label={dict.assignmentLink} className="mt-3">
                    <input
                      type="url"
                      value={editLink}
                      onChange={(e) => setEditLink(e.target.value)}
                      placeholder={dict.assignmentLinkPlaceholder}
                      className="h-10 w-full rounded-xl border border-white/10 bg-background/70 px-3 text-sm text-foreground focus:border-brand/60 focus:outline-none"
                    />
                  </Field>
                  <Field label={dict.assignmentNotes} className="mt-3">
                    <textarea
                      rows={3}
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-background/70 px-3 py-2 text-sm text-foreground focus:border-brand/60 focus:outline-none"
                    />
                  </Field>
                  <div className="mt-3 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingAsgId(null)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-muted hover:text-foreground"
                    >
                      <X size={11} />
                      {dict.cancelEdit}
                    </button>
                    <button
                      type="button"
                      onClick={() => saveEditAssignment(a.id)}
                      disabled={pending || !editTitle}
                      className="inline-flex items-center gap-1.5 rounded-full bg-brand px-3.5 py-1 text-[11px] font-medium text-[#031019] hover:shadow-[0_10px_30px_-10px_rgba(79,195,220,0.6)] disabled:opacity-50"
                    >
                      <Check size={11} />
                      {dict.saveChanges}
                    </button>
                  </div>
                </li>
              ) : (
                <li key={a.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-foreground">{a.title}</p>
                      {a.externalUrl && (
                        <a
                          href={a.externalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-brand/15 px-2.5 py-0.5 text-[11px] text-brand transition hover:bg-brand/25"
                        >
                          <ExternalLink size={10} />
                          {a.externalUrl.replace(/^https?:\/\//, "").slice(0, 40)}
                          {a.externalUrl.length > 47 ? "…" : ""}
                        </a>
                      )}
                      {a.instructions && <p className="mt-1.5 text-xs text-muted text-pretty">{a.instructions}</p>}
                      {a.dueDate && (
                        <p className="mt-1 text-[11px] text-muted/70">
                          ⏰ {fmtDate(a.dueDate, locale)}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Link
                        href={`/${locale}/portail/assignments/${a.id}`}
                        className="inline-flex items-center gap-1.5 rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-[11px] text-brand transition hover:bg-brand/20"
                      >
                        <MessageSquare size={11} />
                        {dict.openAssignment ?? "Ouvrir"}
                      </Link>
                      <button
                        type="button"
                        onClick={() => startEditAssignment(a)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-muted hover:border-brand/40 hover:bg-brand/10 hover:text-foreground"
                      >
                        <Pencil size={11} />
                        {dict.editAssignment}
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteAssignment(a.id)}
                        disabled={pending}
                        className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-muted hover:border-red-400/40 hover:bg-red-400/10 hover:text-red-200 disabled:opacity-50"
                      >
                        <Trash2 size={11} />
                        {dict.detailDeleteAssignment}
                      </button>
                    </div>
                  </div>
                </li>
              ),
            )}
          </ul>
        )}
      </section>

      {/* Access */}
      <section className="mt-10">
        <h2 className="font-display text-lg text-foreground">{dict.detailAccess}</h2>
        <p className="mt-1 text-sm text-muted text-pretty">{dict.detailAccessIntro}</p>

        <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-medium text-foreground">{dict.detailCohortAccess}</h3>
              {!cohortAddOpen ? (
                <button
                  type="button"
                  onClick={() => setCohortAddOpen(true)}
                  disabled={eligibleCohorts.length === 0}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-muted hover:border-brand/40 hover:text-foreground disabled:opacity-50"
                >
                  <Plus size={11} />
                  {dict.detailAddCohort}
                </button>
              ) : null}
            </div>
            <AnimatePresence>
              {cohortAddOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="mb-3 flex items-center gap-2"
                >
                  <SearchPicker
                    options={eligibleCohorts}
                    value={cohortPick}
                    onChange={setCohortPick}
                    placeholder="—"
                    className="flex-1"
                  />
                  <button
                    type="button"
                    onClick={addCohort}
                    disabled={pending || !cohortPick}
                    className="inline-flex h-11 items-center rounded-full bg-brand px-3 text-xs font-medium text-[#031019] disabled:opacity-50"
                  >
                    <Plus size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setCohortAddOpen(false)}
                    className="rounded-full p-1 text-muted hover:bg-white/5 hover:text-foreground"
                  >
                    <X size={15} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
            <ul className="space-y-1.5">
              {attachedCohorts.length === 0 ? (
                <li className="text-xs text-muted">—</li>
              ) : (
                attachedCohorts.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center justify-between rounded-lg border border-white/5 bg-background/40 px-3 py-1.5 text-sm"
                  >
                    <Layers size={12} className="text-brand/80" />
                    <span className="ml-2 mr-auto truncate text-foreground">{c.name}</span>
                    <button
                      type="button"
                      onClick={() => removeCohort(c.id)}
                      className="rounded-full p-1 text-muted hover:bg-red-400/10 hover:text-red-200"
                      aria-label={dict.detailRemoveAccess}
                    >
                      <X size={12} />
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-medium text-foreground">{dict.detailStudentAccess}</h3>
              {!studentAddOpen ? (
                <button
                  type="button"
                  onClick={() => setStudentAddOpen(true)}
                  disabled={eligibleStudents.length === 0}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-muted hover:border-brand/40 hover:text-foreground disabled:opacity-50"
                >
                  <Plus size={11} />
                  {dict.detailAddStudent}
                </button>
              ) : null}
            </div>
            <AnimatePresence>
              {studentAddOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="mb-3 flex items-center gap-2"
                >
                  <SearchPicker
                    options={eligibleStudents}
                    value={studentPick}
                    onChange={setStudentPick}
                    placeholder="—"
                    className="flex-1"
                  />
                  <button
                    type="button"
                    onClick={addStudent}
                    disabled={pending || !studentPick}
                    className="inline-flex h-11 items-center rounded-full bg-brand px-3 text-xs font-medium text-[#031019] disabled:opacity-50"
                  >
                    <Plus size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setStudentAddOpen(false)}
                    className="rounded-full p-1 text-muted hover:bg-white/5 hover:text-foreground"
                  >
                    <X size={15} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
            <ul className="space-y-1.5">
              {attachedStudents.length === 0 ? (
                <li className="text-xs text-muted">—</li>
              ) : (
                attachedStudents.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center justify-between rounded-lg border border-white/5 bg-background/40 px-3 py-1.5 text-sm"
                  >
                    <span className="truncate text-foreground">{s.name}</span>
                    <button
                      type="button"
                      onClick={() => removeStudent(s.id)}
                      className="rounded-full p-1 text-muted hover:bg-red-400/10 hover:text-red-200"
                      aria-label={dict.detailRemoveAccess}
                    >
                      <X size={12} />
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </section>

      {/* Notes */}
      <section className="mt-10">
        <h2 className="mb-3 font-display text-lg text-foreground">{dict.detailNotes}</h2>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <textarea
            rows={2}
            value={noteBody}
            placeholder={dict.noteComposerPlaceholder}
            onChange={(e) => setNoteBody(e.target.value)}
            className="w-full resize-none rounded-xl border border-white/10 bg-background/70 px-3 py-2 text-sm text-foreground focus:border-brand/60 focus:outline-none"
          />
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={publishNote}
              disabled={pending || !noteBody.trim()}
              className="inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-1.5 text-xs font-medium text-[#031019] disabled:opacity-50"
            >
              <Send size={12} />
              {dict.noteSendCta}
            </button>
          </div>
        </div>
        {notes.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-8 text-center text-sm text-muted">
            {dict.detailNotesEmpty}
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {notes.map((n) => (
              <li key={n.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-sm text-foreground">{n.authorName}</span>
                  <span className="text-[11px] text-muted/70">{fmtDate(n.createdAt, locale)}</span>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm text-foreground/90">{n.body}</p>
                {n.authorId === currentUserId && (
                  <div className="mt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => deleteNote(n.id)}
                      disabled={pending}
                      className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-muted hover:border-red-400/40 hover:bg-red-400/10 hover:text-red-200 disabled:opacity-50"
                    >
                      <Trash2 size={11} />
                      {dict.noteDeleteCta}
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
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
