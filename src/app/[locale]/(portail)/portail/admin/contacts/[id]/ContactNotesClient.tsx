"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Trash2, Lock, Users, MessageSquare } from "lucide-react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/fr";

type ContactDict = Dictionary["portail"]["contact"];

type Note = {
  id: string;
  authorId: string | null;
  authorName: string;
  body: string;
  visibility: "team" | "private";
  createdAt: string;
};

function fmtRelative(iso: string, locale: Locale): string {
  const now = Date.now();
  const t = new Date(iso).getTime();
  const diffMin = Math.round((now - t) / 60000);
  if (diffMin < 1) return locale === "fr" ? "À l'instant" : "Just now";
  if (diffMin < 60) return locale === "fr" ? `il y a ${diffMin} min` : `${diffMin} min ago`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return locale === "fr" ? `il y a ${diffH} h` : `${diffH} h ago`;
  return new Date(iso).toLocaleDateString(locale === "fr" ? "fr-CA" : "en-CA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ContactNotesClient({
  targetId,
  currentUserId,
  dict,
  locale,
  notes,
}: {
  targetId: string;
  currentUserId: string;
  dict: ContactDict;
  locale: Locale;
  notes: Note[];
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [visibility, setVisibility] = useState<"team" | "private">("team");
  const [pending, startTransition] = useTransition();

  function publish() {
    if (!body.trim()) return;
    startTransition(async () => {
      const supabase = getBrowserSupabase();
      const { error } = await supabase.from("contact_notes").insert({
        target_id: targetId,
        author_id: currentUserId,
        body: body.trim(),
        visibility,
      });
      if (!error) {
        setBody("");
        router.refresh();
      }
    });
  }

  function remove(id: string) {
    if (!confirm(dict.noteDeleteConfirm)) return;
    startTransition(async () => {
      const supabase = getBrowserSupabase();
      const { error } = await supabase.from("contact_notes").delete().eq("id", id);
      if (!error) router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      {/* Composer */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
      >
        <textarea
          rows={3}
          value={body}
          placeholder={dict.newNotePlaceholder}
          onChange={(e) => setBody(e.target.value)}
          className="w-full resize-none rounded-xl border border-white/10 bg-background/70 px-3 py-2 text-sm text-foreground focus:border-brand/60 focus:outline-none focus:ring-2 focus:ring-brand/30"
        />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div
            role="group"
            aria-label={dict.noteVisibility}
            className="flex items-center rounded-full border border-white/10 bg-background/40 p-0.5 text-[11px]"
          >
            <button
              type="button"
              onClick={() => setVisibility("team")}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 transition ${
                visibility === "team"
                  ? "bg-brand text-[#031019] font-medium"
                  : "text-muted hover:text-foreground"
              }`}
            >
              <Users size={11} />
              {dict.visibilityTeam}
            </button>
            <button
              type="button"
              onClick={() => setVisibility("private")}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 transition ${
                visibility === "private"
                  ? "bg-amber-300 text-[#1a0f00] font-medium"
                  : "text-muted hover:text-foreground"
              }`}
            >
              <Lock size={11} />
              {dict.visibilityPrivate}
            </button>
          </div>
          <button
            type="button"
            onClick={publish}
            disabled={pending || !body.trim()}
            className="inline-flex h-9 items-center gap-2 rounded-full bg-brand px-4 text-xs font-medium text-[#031019] transition hover:shadow-[0_10px_30px_-10px_rgba(79,195,220,0.6)] disabled:opacity-50"
          >
            <Send size={13} />
            {pending ? dict.notePublishing : dict.notePublishCta}
          </button>
        </div>
        <p className="mt-2 text-[11px] text-muted/70">
          {visibility === "team" ? dict.visibilityTeamHint : dict.visibilityPrivateHint}
        </p>
      </motion.div>

      {/* Notes timeline */}
      {notes.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-12 text-center">
          <MessageSquare size={32} className="text-muted/50" />
          <p className="mt-3 text-sm text-muted">{dict.notesEmpty}</p>
        </div>
      ) : (
        <ul className="space-y-3">
          <AnimatePresence initial={false}>
            {notes.map((n) => (
              <motion.li
                key={n.id}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-foreground">
                      {n.authorId === currentUserId ? dict.authorYou : n.authorName}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] ${
                        n.visibility === "private"
                          ? "border-amber-300/30 bg-amber-300/10 text-amber-200"
                          : "border-brand/30 bg-brand/10 text-brand"
                      }`}
                    >
                      {n.visibility === "private" ? <Lock size={9} /> : <Users size={9} />}
                      {n.visibility === "private" ? dict.visibilityPrivate : dict.visibilityTeam}
                    </span>
                  </div>
                  <span className="text-[11px] text-muted/70">{fmtRelative(n.createdAt, locale)}</span>
                </div>
                <p className="mt-2.5 whitespace-pre-wrap text-sm text-foreground/90 text-pretty">{n.body}</p>
                {n.authorId === currentUserId && (
                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      onClick={() => remove(n.id)}
                      disabled={pending}
                      className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-muted transition hover:border-red-400/40 hover:bg-red-400/10 hover:text-red-200 disabled:opacity-50"
                    >
                      <Trash2 size={11} />
                      {dict.noteDeleteCta}
                    </button>
                  </div>
                )}
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}
