"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/fr";

type ProgramsDict = Dictionary["portail"]["programs"];

export type ProgramRow = {
  id: string;
  code: string;
  nameFr: string;
  nameEn: string;
  descriptionFr: string | null;
  descriptionEn: string | null;
  durationMonths: number | null;
  color: string;
  active: boolean;
  sortOrder: number;
};

const COLOR_PRESETS = ["#4fc3dc", "#6366f1", "#a855f7", "#ec4899", "#10b981", "#f97316", "#fbbf24", "#fb7185"];

export function ProgramsClient({
  locale,
  dict,
  rows,
}: {
  locale: Locale;
  dict: ProgramsDict;
  rows: ProgramRow[];
}) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggleActive(id: string, next: boolean) {
    startTransition(async () => {
      const supabase = getBrowserSupabase();
      const { error } = await supabase.from("programs").update({ active: next }).eq("id", id);
      if (!error) router.refresh();
    });
  }

  function remove(id: string) {
    if (!confirm(dict.deleteConfirm)) return;
    startTransition(async () => {
      const supabase = getBrowserSupabase();
      const { error } = await supabase.from("programs").delete().eq("id", id);
      if (!error) router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      <div className="mb-2 flex justify-end">
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="inline-flex h-9 items-center gap-2 rounded-full bg-brand px-4 text-xs font-medium text-[#031019] hover:shadow-[0_10px_30px_-10px_rgba(79,195,220,0.6)]"
        >
          <Plus size={13} />
          {dict.newCta}
        </button>
      </div>

      <AnimatePresence>
        {adding && (
          <ProgramForm
            mode="create"
            dict={dict}
            onClose={() => setAdding(false)}
            onSaved={() => {
              setAdding(false);
              router.refresh();
            }}
          />
        )}
      </AnimatePresence>

      {rows.length === 0 && !adding ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-16 text-center text-sm text-muted">
          {dict.empty}
        </div>
      ) : (
        <AnimatePresence initial={false}>
          {rows.map((r) =>
            editingId === r.id ? (
              <ProgramForm
                key={r.id}
                mode="edit"
                row={r}
                dict={dict}
                onClose={() => setEditingId(null)}
                onSaved={() => {
                  setEditingId(null);
                  router.refresh();
                }}
              />
            ) : (
              <motion.div
                key={r.id}
                layout
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="flex flex-wrap items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4"
              >
                <span
                  className="h-9 w-9 shrink-0 rounded-xl"
                  style={{ background: `linear-gradient(135deg, ${r.color}, ${r.color}80)` }}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
                      {r.code}
                    </span>
                    <span className="text-sm text-foreground">
                      {locale === "fr" ? r.nameFr : r.nameEn}
                    </span>
                    {r.durationMonths != null && (
                      <span className="text-xs text-muted">
                        · {r.durationMonths} {dict.colMonths}
                      </span>
                    )}
                  </div>
                  {(locale === "fr" ? r.descriptionFr : r.descriptionEn) && (
                    <p className="mt-1 text-sm text-muted text-pretty">
                      {locale === "fr" ? r.descriptionFr : r.descriptionEn}
                    </p>
                  )}
                </div>
                <label className="inline-flex shrink-0 cursor-pointer items-center gap-2 text-xs text-muted">
                  <input
                    type="checkbox"
                    checked={r.active}
                    disabled={pending}
                    onChange={(e) => toggleActive(r.id, e.target.checked)}
                    className="peer sr-only"
                  />
                  <span className="relative h-5 w-9 rounded-full bg-white/10 transition peer-checked:bg-brand">
                    <span className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-foreground transition peer-checked:translate-x-4" />
                  </span>
                  <span className="uppercase tracking-[0.18em]">{dict.colActive}</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setEditingId(r.id)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-muted hover:border-brand/40 hover:bg-brand/10 hover:text-foreground"
                  >
                    <Pencil size={11} />
                    {dict.editCta}
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(r.id)}
                    disabled={pending}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-muted hover:border-red-400/40 hover:bg-red-400/10 hover:text-red-200 disabled:opacity-50"
                  >
                    <Trash2 size={11} />
                    {dict.deleteCta}
                  </button>
                </div>
              </motion.div>
            ),
          )}
        </AnimatePresence>
      )}
    </div>
  );
}

function ProgramForm({
  mode,
  row,
  dict,
  onClose,
  onSaved,
}: {
  mode: "create" | "edit";
  row?: ProgramRow;
  dict: ProgramsDict;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [code, setCode] = useState(row?.code ?? "");
  const [nameFr, setNameFr] = useState(row?.nameFr ?? "");
  const [nameEn, setNameEn] = useState(row?.nameEn ?? "");
  const [descriptionFr, setDescriptionFr] = useState(row?.descriptionFr ?? "");
  const [descriptionEn, setDescriptionEn] = useState(row?.descriptionEn ?? "");
  const [durationMonths, setDurationMonths] = useState<string>(row?.durationMonths?.toString() ?? "");
  const [color, setColor] = useState(row?.color ?? COLOR_PRESETS[0]);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function save() {
    if (!code || !nameFr || !nameEn) return;
    setError(null);
    startTransition(async () => {
      const supabase = getBrowserSupabase();
      const payload = {
        code,
        name_fr: nameFr,
        name_en: nameEn,
        description_fr: descriptionFr || null,
        description_en: descriptionEn || null,
        duration_months: durationMonths ? Number(durationMonths) : null,
        color,
      };
      const { error: err } =
        mode === "create"
          ? await supabase.from("programs").insert({ ...payload, active: true })
          : await supabase.from("programs").update(payload).eq("id", row!.id);
      if (err) {
        setError(err.message);
        return;
      }
      onSaved();
    });
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      className="rounded-2xl border border-brand/30 bg-brand/[0.04] p-5"
    >
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Field label={dict.codeLabel}>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            className="h-11 w-full rounded-xl border border-white/10 bg-background/70 px-3 text-sm text-foreground focus:border-brand/60 focus:outline-none"
          />
        </Field>
        <Field label={dict.durationLabel}>
          <input
            type="number"
            value={durationMonths}
            onChange={(e) => setDurationMonths(e.target.value)}
            min={1}
            className="h-11 w-full rounded-xl border border-white/10 bg-background/70 px-3 text-sm text-foreground focus:border-brand/60 focus:outline-none"
          />
        </Field>
        <Field label={dict.colorLabel}>
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
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
        <Field label={dict.nameFrLabel}>
          <input
            type="text"
            value={nameFr}
            onChange={(e) => setNameFr(e.target.value)}
            className="h-11 w-full rounded-xl border border-white/10 bg-background/70 px-3 text-sm text-foreground focus:border-brand/60 focus:outline-none"
          />
        </Field>
        <Field label={dict.nameEnLabel}>
          <input
            type="text"
            value={nameEn}
            onChange={(e) => setNameEn(e.target.value)}
            className="h-11 w-full rounded-xl border border-white/10 bg-background/70 px-3 text-sm text-foreground focus:border-brand/60 focus:outline-none"
          />
        </Field>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
        <Field label={dict.descriptionFrLabel}>
          <textarea
            rows={2}
            value={descriptionFr}
            onChange={(e) => setDescriptionFr(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-background/70 px-3 py-2 text-sm text-foreground focus:border-brand/60 focus:outline-none"
          />
        </Field>
        <Field label={dict.descriptionEnLabel}>
          <textarea
            rows={2}
            value={descriptionEn}
            onChange={(e) => setDescriptionEn(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-background/70 px-3 py-2 text-sm text-foreground focus:border-brand/60 focus:outline-none"
          />
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
          disabled={pending || !code || !nameFr || !nameEn}
          className="inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-1.5 text-xs font-medium text-[#031019] hover:shadow-[0_10px_30px_-10px_rgba(79,195,220,0.6)] disabled:opacity-50"
        >
          <Check size={12} />
          {dict.saveCta}
        </button>
      </div>
    </motion.div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] uppercase tracking-[0.18em] text-muted">{label}</span>
      {children}
    </label>
  );
}
