"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Send, CheckCircle2, Archive, RotateCcw, MessageCircle, Lock } from "lucide-react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/fr";

type TicketsDict = Dictionary["portail"]["tickets"];

type TicketStatus = "open" | "in_progress" | "resolved" | "archived";

type Message = {
  id: string;
  authorId: string | null;
  authorName: string;
  authorRole: string;
  body: string;
  createdAt: string;
};

const STATUS_COLORS: Record<TicketStatus, string> = {
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
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function TicketThread({
  locale,
  dict,
  ticket,
  viewerId,
  viewerIsAdmin,
  messages,
}: {
  locale: Locale;
  dict: TicketsDict;
  ticket: {
    id: string;
    subject: string;
    status: TicketStatus;
    studentId: string;
    createdAt: string;
  };
  viewerId: string;
  viewerIsAdmin: boolean;
  messages: Message[];
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const canReply = ticket.status !== "archived";

  function reply() {
    if (!body.trim()) return;
    setError(null);
    startTransition(async () => {
      const supabase = getBrowserSupabase();
      const { error: err } = await supabase.from("ticket_messages").insert({
        ticket_id: ticket.id,
        author_id: viewerId,
        body: body.trim(),
      });
      if (err) {
        setError(err.message);
        return;
      }
      // Admin reply nudges status forward if it was open
      if (viewerIsAdmin && ticket.status === "open") {
        await supabase.from("tickets").update({ status: "in_progress" }).eq("id", ticket.id);
      }
      setBody("");
      router.refresh();
    });
  }

  function changeStatus(next: TicketStatus) {
    setError(null);
    startTransition(async () => {
      const supabase = getBrowserSupabase();
      const patch: { status: TicketStatus; resolved_at?: string | null; archived_at?: string | null } = {
        status: next,
      };
      if (next === "resolved") patch.resolved_at = new Date().toISOString();
      if (next === "archived") patch.archived_at = new Date().toISOString();
      if (next === "open" || next === "in_progress") {
        patch.archived_at = null;
        if (next === "open") patch.resolved_at = null;
      }
      const { error: err } = await supabase.from("tickets").update(patch).eq("id", ticket.id);
      if (err) {
        setError(err.message);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div>
      <header className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-display text-xl text-foreground md:text-2xl">{ticket.subject}</h1>
            <p className="mt-1 text-xs text-muted">{fmtEastern(ticket.createdAt, locale)}</p>
          </div>
          <span
            className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.18em] ${STATUS_COLORS[ticket.status]}`}
          >
            {dict.status[ticket.status]}
          </span>
        </div>

        {viewerIsAdmin && (
          <div className="mt-4 flex flex-wrap gap-2">
            {ticket.status !== "resolved" && ticket.status !== "archived" && (
              <button
                type="button"
                onClick={() => changeStatus("resolved")}
                disabled={pending}
                className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-[11px] font-medium text-emerald-200 hover:bg-emerald-400/20 disabled:opacity-50"
              >
                <CheckCircle2 size={11} />
                {dict.resolveCta}
              </button>
            )}
            {ticket.status === "resolved" && (
              <>
                <button
                  type="button"
                  onClick={() => changeStatus("open")}
                  disabled={pending}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-muted hover:text-foreground disabled:opacity-50"
                >
                  <RotateCcw size={11} />
                  {dict.reopenCta}
                </button>
                <button
                  type="button"
                  onClick={() => changeStatus("archived")}
                  disabled={pending}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-muted hover:text-foreground disabled:opacity-50"
                >
                  <Archive size={11} />
                  {dict.archiveCta}
                </button>
              </>
            )}
            {ticket.status === "archived" && (
              <button
                type="button"
                onClick={() => changeStatus("open")}
                disabled={pending}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-muted hover:text-foreground disabled:opacity-50"
              >
                <RotateCcw size={11} />
                {dict.unarchiveCta}
              </button>
            )}
          </div>
        )}
      </header>

      <section className="mt-6">
        {messages.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-10 text-center text-sm text-muted">
            <MessageCircle size={28} className="mx-auto text-muted/60" />
            <p className="mt-3">{dict.noMessages}</p>
          </div>
        ) : (
          <ul className="space-y-3">
            <AnimatePresence initial={false}>
              {messages.map((m) => {
                const isMine = m.authorId === viewerId;
                const isAdminMessage = m.authorRole === "admin" || m.authorRole === "coordinator" || m.authorRole === "director";
                return (
                  <motion.li
                    key={m.id}
                    layout
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl border p-4 ${
                        isMine
                          ? "border-brand/30 bg-brand/[0.08] text-foreground"
                          : isAdminMessage
                            ? "border-amber-300/20 bg-amber-300/[0.06] text-foreground"
                            : "border-white/10 bg-white/[0.03] text-foreground"
                      }`}
                    >
                      <div className="mb-1.5 flex flex-wrap items-baseline gap-2 text-[11px]">
                        <span className="text-muted">
                          {isMine ? dict.youLabel : isAdminMessage ? dict.adminLabel : m.authorName}
                        </span>
                        <span className="text-muted/70">·</span>
                        <span className="text-muted/70">{fmtEastern(m.createdAt, locale)}</span>
                      </div>
                      <p className="whitespace-pre-wrap text-sm">{m.body}</p>
                    </div>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
        )}
      </section>

      {canReply ? (
        <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <textarea
            rows={3}
            value={body}
            placeholder={dict.replyPlaceholder}
            onChange={(e) => setBody(e.target.value)}
            className="w-full resize-none rounded-xl border border-white/10 bg-background/70 px-3 py-2 text-sm text-foreground focus:border-brand/60 focus:outline-none"
          />
          {error && (
            <div className="mt-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-200">
              {error}
            </div>
          )}
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={reply}
              disabled={pending || !body.trim()}
              className="inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-1.5 text-xs font-medium text-[#031019] hover:shadow-[0_10px_30px_-10px_rgba(79,195,220,0.6)] disabled:opacity-50"
            >
              <Send size={12} />
              {dict.replyCta}
            </button>
          </div>
        </section>
      ) : (
        <section className="mt-6 flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-muted">
          <Lock size={14} />
          <span>{dict.status.archived}</span>
        </section>
      )}
    </div>
  );
}
