"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Send } from "lucide-react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/fr";

type TicketsDict = Dictionary["portail"]["tickets"];

export function NewTicketForm({
  locale,
  dict,
  userId,
}: {
  locale: Locale;
  dict: TicketsDict;
  userId: string;
}) {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!subject || !body) return;
    setError(null);
    startTransition(async () => {
      const supabase = getBrowserSupabase();
      const { data: ticket, error: tErr } = await supabase
        .from("tickets")
        .insert({ student_id: userId, subject, status: "open" })
        .select("id")
        .single();
      if (tErr || !ticket) {
        setError(tErr?.message || "?");
        return;
      }
      const { error: mErr } = await supabase
        .from("ticket_messages")
        .insert({ ticket_id: ticket.id, author_id: userId, body });
      if (mErr) {
        setError(mErr.message);
        return;
      }
      router.replace(`/${locale}/portail/etudiant/questions/${ticket.id}`);
    });
  }

  return (
    <motion.form
      onSubmit={submit}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5 rounded-2xl border border-white/10 bg-white/[0.03] p-6"
    >
      <Field label={dict.subjectLabel}>
        <input
          type="text"
          required
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder={dict.subjectPlaceholder}
          className="h-11 w-full rounded-xl border border-white/10 bg-background/70 px-3 text-sm text-foreground focus:border-brand/60 focus:outline-none"
        />
      </Field>
      <Field label={dict.messageLabel}>
        <textarea
          rows={5}
          required
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={dict.messagePlaceholder}
          className="w-full rounded-xl border border-white/10 bg-background/70 px-3 py-2 text-sm text-foreground focus:border-brand/60 focus:outline-none"
        />
      </Field>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={pending || !subject || !body}
        className="inline-flex h-11 items-center gap-2 rounded-full bg-brand px-5 text-sm font-medium text-[#031019] transition hover:shadow-[0_12px_30px_-10px_rgba(79,195,220,0.6)] disabled:opacity-50"
      >
        <Send size={14} />
        {dict.sendCta}
      </button>
    </motion.form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs uppercase tracking-[0.18em] text-muted">{label}</span>
      {children}
    </label>
  );
}
