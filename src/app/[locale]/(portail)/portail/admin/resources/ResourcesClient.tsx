"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  LinkIcon,
  FileText,
  Video,
  Headphones,
  FileBox,
  Presentation,
  Link as LinkLucide,
  Trash2,
  ExternalLink,
  Search,
  RotateCcw,
} from "lucide-react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/fr";

type DamDict = Dictionary["portail"]["dam"];

type Kind = "link" | "file" | "video" | "audio" | "document" | "slides";
type Visibility = "public" | "students" | "staff";

export type ResourceRow = {
  id: string;
  title: string;
  description: string | null;
  kind: Kind;
  url: string | null;
  storagePath: string | null;
  fileType: string | null;
  sizeBytes: number | null;
  programId: string | null;
  tags: string[];
  visibility: Visibility;
  language: string;
  createdAt: string;
};

type ProgramOption = { id: string; code: string; label: string; color: string };

const KIND_ICONS: Record<Kind, React.ReactNode> = {
  link: <LinkLucide size={15} />,
  file: <FileBox size={15} />,
  video: <Video size={15} />,
  audio: <Headphones size={15} />,
  document: <FileText size={15} />,
  slides: <Presentation size={15} />,
};

const KIND_OPTIONS: Kind[] = ["link", "file", "document", "video", "audio", "slides"];
const VISIBILITY_OPTIONS: Visibility[] = ["public", "students", "staff"];

function humanSize(bytes: number | null): string {
  if (!bytes) return "";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i += 1;
  }
  return `${n.toFixed(n >= 100 || i === 0 ? 0 : 1)} ${units[i]}`;
}

function fmtDate(iso: string, locale: Locale) {
  return new Date(iso).toLocaleDateString(locale === "fr" ? "fr-CA" : "en-CA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function ResourcesClient({
  locale,
  dict,
  rows,
  programs,
  canWrite,
}: {
  locale: Locale;
  dict: DamDict;
  rows: ResourceRow[];
  programs: ProgramOption[];
  canWrite: boolean;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [filterKind, setFilterKind] = useState<string>("");
  const [filterProgram, setFilterProgram] = useState<string>("");
  const [filterLang, setFilterLang] = useState<string>("");
  const [filterVis, setFilterVis] = useState<string>("");
  const [mode, setMode] = useState<"none" | "upload" | "link">("none");
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (q) {
        const hay = `${r.title} ${r.description ?? ""} ${r.tags.join(" ")}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filterKind && r.kind !== filterKind) return false;
      if (filterProgram && r.programId !== filterProgram) return false;
      if (filterLang && r.language !== filterLang) return false;
      if (filterVis && r.visibility !== filterVis) return false;
      return true;
    });
  }, [rows, query, filterKind, filterProgram, filterLang, filterVis]);

  function clearAll() {
    setQuery("");
    setFilterKind("");
    setFilterProgram("");
    setFilterLang("");
    setFilterVis("");
  }

  function remove(id: string, storagePath: string | null) {
    if (!confirm("?")) return;
    startTransition(async () => {
      const supabase = getBrowserSupabase();
      if (storagePath) {
        await supabase.storage.from("resources").remove([storagePath]);
      }
      const { error } = await supabase.from("resources").delete().eq("id", id);
      if (!error) router.refresh();
    });
  }

  const programMap = new Map(programs.map((p) => [p.id, p]));
  const anyFilterActive = Boolean(query || filterKind || filterProgram || filterLang || filterVis);

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-[260px_1fr]">
      {/* Left sidebar — search + filters */}
      <aside className="space-y-5 md:sticky md:top-6 md:self-start">
        <div className="relative">
          <Search
            size={14}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={dict.searchPlaceholder}
            className="h-10 w-full rounded-full border border-white/10 bg-white/5 pl-9 pr-4 text-sm text-foreground placeholder:text-muted/70 focus:border-brand/60 focus:outline-none focus:ring-2 focus:ring-brand/30"
          />
        </div>

        <FilterGroup
          title={dict.typeSection}
          options={[
            { value: "", label: dict.filterKind },
            ...KIND_OPTIONS.map((k) => ({
              value: k,
              label: dict[`kind${k.charAt(0).toUpperCase() + k.slice(1)}` as keyof DamDict] as string,
            })),
          ]}
          selected={filterKind}
          onChange={setFilterKind}
        />

        <FilterGroup
          title={dict.programSection}
          options={[
            { value: "", label: dict.filterProgram },
            ...programs.map((p) => ({ value: p.id, label: p.code })),
          ]}
          selected={filterProgram}
          onChange={setFilterProgram}
        />

        <FilterGroup
          title={dict.languageSection}
          options={[
            { value: "", label: dict.filterLanguage },
            { value: "fr", label: "FR" },
            { value: "en", label: "EN" },
          ]}
          selected={filterLang}
          onChange={setFilterLang}
        />

        <FilterGroup
          title={dict.visibilitySection}
          options={[
            { value: "", label: "—" },
            ...VISIBILITY_OPTIONS.map((v) => ({
              value: v,
              label:
                v === "public"
                  ? dict.visibilityPublic
                  : v === "students"
                    ? dict.visibilityStudents
                    : dict.visibilityStaff,
            })),
          ]}
          selected={filterVis}
          onChange={setFilterVis}
        />

        {anyFilterActive && (
          <button
            type="button"
            onClick={clearAll}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-muted hover:text-foreground"
          >
            <RotateCcw size={11} />
            {dict.clearFilters}
          </button>
        )}
      </aside>

      {/* Right main — actions + grid */}
      <div>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs text-muted">
            {filtered.length} {dict.results}
          </span>
          {canWrite && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setMode("link")}
                className="inline-flex h-9 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 text-xs text-muted transition hover:border-brand/40 hover:bg-brand/10 hover:text-foreground"
              >
                <LinkIcon size={13} />
                {dict.addLinkCta}
              </button>
              <button
                type="button"
                onClick={() => setMode("upload")}
                className="inline-flex h-9 items-center gap-2 rounded-full bg-brand px-4 text-xs font-medium text-[#031019] hover:shadow-[0_10px_30px_-10px_rgba(79,195,220,0.6)]"
              >
                <Upload size={13} />
                {dict.uploadCta}
              </button>
            </div>
          )}
        </div>

        <AnimatePresence>
          {mode !== "none" && (
            <ResourceForm
              mode={mode}
              dict={dict}
              programs={programs}
              onClose={() => setMode("none")}
              onSaved={() => {
                setMode("none");
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
          <ul className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence initial={false}>
              {filtered.map((r) => {
                const prog = r.programId ? programMap.get(r.programId) : null;
                return (
                  <motion.li
                    key={r.id}
                    layout
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand/15 text-brand">
                        {KIND_ICONS[r.kind]}
                      </span>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm text-foreground">{r.title}</h3>
                        <div className="mt-1 flex flex-wrap items-baseline gap-2">
                          {prog && (
                            <span
                              className="rounded-full px-2 py-0.5 text-[10px] uppercase tracking-[0.18em]"
                              style={{ background: `${prog.color}25`, color: prog.color }}
                            >
                              {prog.code}
                            </span>
                          )}
                          <span className="text-[10px] uppercase tracking-[0.18em] text-muted">
                            {r.language.toUpperCase()}
                          </span>
                        </div>
                        {r.description && (
                          <p className="mt-2 text-xs text-muted line-clamp-2 text-pretty">{r.description}</p>
                        )}
                        <p className="mt-2 text-[10px] text-muted/70">
                          {fmtDate(r.createdAt, locale)}
                          {r.fileType && ` · ${r.fileType}`}
                          {r.sizeBytes && ` · ${humanSize(r.sizeBytes)}`}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      {r.kind === "link" && r.url ? (
                        <a
                          href={r.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-full bg-brand/15 px-3 py-1 text-xs text-brand transition hover:bg-brand/25"
                        >
                          <ExternalLink size={12} />
                          {dict.openLink}
                        </a>
                      ) : r.storagePath ? (
                        <DownloadButton path={r.storagePath} label={dict.download} />
                      ) : null}
                      {canWrite && (
                        <button
                          type="button"
                          onClick={() => remove(r.id, r.storagePath)}
                          disabled={pending}
                          className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-muted hover:border-red-400/40 hover:bg-red-400/10 hover:text-red-200 disabled:opacity-50"
                        >
                          <Trash2 size={11} />
                          {dict.deleteCta}
                        </button>
                      )}
                    </div>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
        )}
      </div>
    </div>
  );
}

function FilterGroup({
  title,
  options,
  selected,
  onChange,
}: {
  title: string;
  options: { value: string; label: string }[];
  selected: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <p className="mb-2 px-1 text-[10px] uppercase tracking-[0.22em] text-muted/70">{title}</p>
      <ul className="space-y-0.5">
        {options.map((o) => {
          const active = o.value === selected;
          return (
            <li key={o.value || "__all__"}>
              <button
                type="button"
                onClick={() => onChange(o.value)}
                className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition ${
                  active
                    ? "bg-brand/15 text-brand font-medium"
                    : "text-muted hover:bg-white/5 hover:text-foreground"
                }`}
              >
                <span>{o.label}</span>
                {active && <span className="text-[10px]">●</span>}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function DownloadButton({ path, label }: { path: string; label: string }) {
  const [busy, setBusy] = useState(false);
  async function go() {
    setBusy(true);
    const supabase = getBrowserSupabase();
    const { data } = await supabase.storage.from("resources").createSignedUrl(path, 60);
    setBusy(false);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  }
  return (
    <button
      type="button"
      onClick={go}
      disabled={busy}
      className="inline-flex items-center gap-1.5 rounded-full bg-brand/15 px-3 py-1 text-xs text-brand transition hover:bg-brand/25 disabled:opacity-50"
    >
      <ExternalLink size={12} />
      {label}
    </button>
  );
}

function ResourceForm({
  mode,
  dict,
  programs,
  onClose,
  onSaved,
}: {
  mode: "upload" | "link";
  dict: DamDict;
  programs: ProgramOption[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [kind] = useState<Kind>(mode === "link" ? "link" : "document");
  const [programId, setProgramId] = useState<string>("");
  const [visibility, setVisibility] = useState<Visibility>("students");
  const [language, setLanguage] = useState<string>("fr");
  const [tags, setTags] = useState<string>("");
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);

  function submit() {
    if (!title) return;
    if (mode === "link" && !url) return;
    if (mode === "upload" && !file) return;

    startTransition(async () => {
      setBusy(true);
      const supabase = getBrowserSupabase();
      let storagePath: string | null = null;
      let fileType: string | null = null;
      let sizeBytes: number | null = null;
      let resolvedKind = kind;

      if (mode === "upload" && file) {
        const ext = file.name.split(".").pop() || "bin";
        const path = `${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("resources").upload(path, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type || undefined,
        });
        if (upErr) {
          alert(upErr.message);
          setBusy(false);
          return;
        }
        storagePath = path;
        fileType = file.type || ext;
        sizeBytes = file.size;
        if (file.type.startsWith("video/")) resolvedKind = "video";
        else if (file.type.startsWith("audio/")) resolvedKind = "audio";
        else if (file.type === "application/pdf") resolvedKind = "document";
        else if (file.type.includes("presentation")) resolvedKind = "slides";
        else resolvedKind = "file";
      }

      const { error } = await supabase.from("resources").insert({
        title,
        description: description || null,
        kind: resolvedKind,
        url: mode === "link" ? url : null,
        storage_path: storagePath,
        file_type: fileType,
        size_bytes: sizeBytes,
        program_id: programId || null,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        visibility,
        language,
      });
      setBusy(false);
      if (!error) onSaved();
      else alert(error.message);
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      className="mb-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5"
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label={dict.titleLabel}>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="h-11 w-full rounded-xl border border-white/10 bg-background/70 px-3 text-sm text-foreground focus:border-brand/60 focus:outline-none"
          />
        </Field>
        <Field label={dict.programLabel}>
          <select
            value={programId}
            onChange={(e) => setProgramId(e.target.value)}
            className="h-11 w-full rounded-xl border border-white/10 bg-background/70 px-3 text-sm text-foreground focus:border-brand/60 focus:outline-none"
          >
            <option value="">—</option>
            {programs.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} · {p.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label={dict.descriptionLabel} className="mt-4">
        <textarea
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-background/70 px-3 py-2 text-sm text-foreground focus:border-brand/60 focus:outline-none"
        />
      </Field>

      {mode === "link" ? (
        <Field label={dict.urlLabel} className="mt-4">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://"
            className="h-11 w-full rounded-xl border border-white/10 bg-background/70 px-3 text-sm text-foreground focus:border-brand/60 focus:outline-none"
          />
        </Field>
      ) : (
        <Field label={dict.fileLabel} className="mt-4">
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-muted file:mr-3 file:h-9 file:rounded-full file:border-0 file:bg-brand file:px-4 file:text-xs file:font-medium file:text-[#031019] hover:file:bg-brand/90"
          />
        </Field>
      )}

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
        <Field label={dict.visibility}>
          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as Visibility)}
            className="h-11 w-full rounded-xl border border-white/10 bg-background/70 px-3 text-sm text-foreground focus:border-brand/60 focus:outline-none"
          >
            <option value="public">{dict.visibilityPublic}</option>
            <option value="students">{dict.visibilityStudents}</option>
            <option value="staff">{dict.visibilityStaff}</option>
          </select>
        </Field>
        <Field label={dict.languageLabel}>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="h-11 w-full rounded-xl border border-white/10 bg-background/70 px-3 text-sm text-foreground focus:border-brand/60 focus:outline-none"
          >
            <option value="fr">Français</option>
            <option value="en">English</option>
          </select>
        </Field>
        <Field label={dict.tagsLabel}>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="tag1, tag2"
            className="h-11 w-full rounded-xl border border-white/10 bg-background/70 px-3 text-sm text-foreground focus:border-brand/60 focus:outline-none"
          />
        </Field>
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-muted hover:text-foreground"
        >
          {dict.cancelCta}
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={pending || busy || !title || (mode === "link" && !url) || (mode === "upload" && !file)}
          className="inline-flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-xs font-medium text-[#031019] hover:shadow-[0_10px_30px_-10px_rgba(79,195,220,0.6)] disabled:opacity-50"
        >
          {busy ? dict.uploadingFile : pending ? dict.saving : dict.saveCta}
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
