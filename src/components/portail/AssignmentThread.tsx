"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Paperclip, Send, Trash2, FileText, Download } from "lucide-react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/fr";

type AsgDict = Dictionary["portail"]["assignment"];

export type ThreadAuthor = {
  id: string;
  name: string;
  avatarUrl: string | null;
  role: string;
};

export type ThreadMessage = {
  id: string;
  authorId: string;
  body: string | null;
  attachmentUrl: string | null;
  attachmentName: string | null;
  createdAt: string;
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function fmtRelative(iso: string, locale: Locale): string {
  return new Date(iso).toLocaleString(locale === "fr" ? "fr-CA" : "en-CA", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AssignmentThread({
  locale,
  dict,
  assignmentId,
  currentUserId,
  authors,
  messages,
}: {
  locale: Locale;
  dict: AsgDict;
  assignmentId: string;
  currentUserId: string;
  authors: Record<string, ThreadAuthor>;
  messages: ThreadMessage[];
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [body, setBody] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function send() {
    if (!body.trim() && !file) return;
    setError(null);
    startTransition(async () => {
      const supabase = getBrowserSupabase();
      let attachmentUrl: string | null = null;
      let attachmentName: string | null = null;
      if (file) {
        const safe = file.name.replace(/[^a-z0-9.\-_]+/gi, "_");
        const path = `${currentUserId}/${assignmentId}/${Date.now()}-${safe}`;
        const { error: upErr } = await supabase.storage
          .from("assignments")
          .upload(path, file, { upsert: false });
        if (upErr) {
          setError(upErr.message || dict.uploadError);
          return;
        }
        const { data: pub } = supabase.storage.from("assignments").getPublicUrl(path);
        attachmentUrl = pub?.publicUrl ?? null;
        attachmentName = file.name;
      }
      const { error: insErr } = await supabase.from("assignment_comments").insert({
        assignment_id: assignmentId,
        author_id: currentUserId,
        body: body.trim() || null,
        attachment_url: attachmentUrl,
        attachment_name: attachmentName,
      });
      if (insErr) {
        setError(insErr.message);
        return;
      }
      setBody("");
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
      router.refresh();
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      const supabase = getBrowserSupabase();
      const { error: delErr } = await supabase
        .from("assignment_comments")
        .delete()
        .eq("id", id);
      if (!delErr) router.refresh();
    });
  }

  return (
    <div>
      <h2 className="font-display text-lg text-foreground">{dict.conversationTitle}</h2>
      <p className="mt-1 max-w-2xl text-sm text-muted text-pretty">{dict.conversationIntro}</p>

      <ul className="mt-5 space-y-3">
        {messages.length === 0 ? (
          <li className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-5 py-10 text-center text-sm text-muted">
            {dict.conversationEmpty}
          </li>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((m) => {
              const author = authors[m.authorId];
              const isMine = m.authorId === currentUserId;
              return (
                <motion.li
                  key={m.id}
                  layout
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: isMine ? 12 : -12 }}
                  className="flex gap-3"
                >
                  <span className="relative flex h-9 w-9 shrink-0 overflow-hidden rounded-full border border-white/10 bg-brand text-xs font-medium text-[#031019]">
                    {author?.avatarUrl ? (
                      <Image
                        src={author.avatarUrl}
                        alt={author.name}
                        fill
                        sizes="36px"
                        className="object-cover"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center">
                        {initials(author?.name || dict.anonymous)}
                      </span>
                    )}
                  </span>
                  <div className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="text-sm text-foreground">{author?.name || dict.anonymous}</p>
                      <span className="text-[11px] text-muted">{fmtRelative(m.createdAt, locale)}</span>
                    </div>
                    {m.body && <p className="mt-1 text-sm text-foreground/90 text-pretty whitespace-pre-wrap">{m.body}</p>}
                    {m.attachmentUrl && (
                      <a
                        href={m.attachmentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-foreground transition hover:border-brand/40 hover:bg-brand/10"
                        download
                      >
                        <FileText size={14} className="text-brand" />
                        <span className="max-w-[16rem] truncate">{m.attachmentName || "file"}</span>
                        <Download size={11} className="text-muted" />
                      </a>
                    )}
                    {isMine && (
                      <button
                        type="button"
                        onClick={() => remove(m.id)}
                        disabled={pending}
                        className="mt-2 inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.18em] text-muted/70 transition hover:text-red-300 disabled:opacity-40"
                      >
                        <Trash2 size={10} />
                        {dict.deleteCta}
                      </button>
                    )}
                  </div>
                </motion.li>
              );
            })}
          </AnimatePresence>
        )}
      </ul>

      <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
        <textarea
          rows={3}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={dict.composerPlaceholder}
          className="w-full resize-none rounded-xl border border-white/10 bg-background/70 px-3 py-2 text-sm text-foreground focus:border-brand/60 focus:outline-none"
        />
        {file && (
          <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-muted">
            <FileText size={11} />
            {file.name}
            <button
              type="button"
              onClick={() => {
                setFile(null);
                if (fileRef.current) fileRef.current.value = "";
              }}
              className="ml-1 text-muted hover:text-foreground"
              aria-label="remove file"
            >
              ×
            </button>
          </div>
        )}
        {error && (
          <p className="mt-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">{error}</p>
        )}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <label className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-muted cursor-pointer transition hover:border-brand/40 hover:text-foreground">
            <Paperclip size={11} />
            {dict.attachCta}
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>
          <button
            type="button"
            onClick={send}
            disabled={pending || (!body.trim() && !file)}
            className="inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-1.5 text-xs font-medium text-[#031019] transition hover:shadow-[0_12px_30px_-10px_var(--brand-glow)] disabled:opacity-50"
          >
            <Send size={12} />
            {pending ? dict.sending : dict.sendCta}
          </button>
        </div>
      </div>
    </div>
  );
}
