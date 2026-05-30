"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Inbox, AlertCircle } from "lucide-react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/fr";

type AdminDict = Dictionary["portail"]["admin"];

type Row = {
  id: string;
  email: string;
  fullName: string | null;
  motivation: string | null;
  createdAt: string;
};

function fmtDate(iso: string, locale: Locale) {
  return new Date(iso).toLocaleDateString(locale === "fr" ? "fr-CA" : "en-CA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function ApprovalsClient({
  locale,
  dict,
  rows,
}: {
  locale: Locale;
  dict: AdminDict;
  rows: Row[];
}) {
  const router = useRouter();
  const [refusingId, setRefusingId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [errorByRow, setErrorByRow] = useState<Record<string, string | null>>({});

  async function approve(id: string) {
    setBusyId(id);
    setErrorByRow((m) => ({ ...m, [id]: null }));
    const supabase = getBrowserSupabase();
    const { error } = await supabase.rpc("approve_user", { target: id });
    setBusyId(null);
    if (error) {
      setErrorByRow((m) => ({ ...m, [id]: error.message || String(error) }));
      return;
    }
    router.refresh();
  }

  async function refuse(id: string) {
    setBusyId(id);
    setErrorByRow((m) => ({ ...m, [id]: null }));
    const supabase = getBrowserSupabase();
    const { error } = await supabase.rpc("refuse_user", {
      target: id,
      reason: reason.trim() || null,
    });
    setBusyId(null);
    if (error) {
      setErrorByRow((m) => ({ ...m, [id]: error.message || String(error) }));
      return;
    }
    setRefusingId(null);
    setReason("");
    router.refresh();
  }

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-16 text-center">
        <Inbox size={36} className="text-muted/60" />
        <p className="mt-4 text-sm text-muted">{dict.pendingEmpty}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <AnimatePresence initial={false}>
        {rows.map((r) => {
          const busy = busyId === r.id;
          const err = errorByRow[r.id];
          return (
            <motion.div
              key={r.id}
              layout
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.25 }}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{r.fullName || r.email}</p>
                  <p className="text-xs text-muted">{r.email}</p>
                  <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-muted/70">
                    {fmtDate(r.createdAt, locale)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => approve(r.id)}
                    disabled={busy}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-xs font-semibold text-[#031019] shadow-[0_8px_24px_-8px_rgba(79,195,220,0.5)] transition hover:shadow-[0_14px_36px_-8px_rgba(79,195,220,0.7)] hover:scale-[1.02] active:scale-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Check size={14} />
                    {busy ? "…" : dict.approve}
                  </button>
                  <button
                    type="button"
                    onClick={() => setRefusingId(refusingId === r.id ? null : r.id)}
                    disabled={busy}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-xs font-medium text-foreground/90 transition hover:border-red-400/50 hover:bg-red-400/10 hover:text-red-200 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <X size={14} />
                    {dict.refuse}
                  </button>
                </div>
              </div>

              {r.motivation && (
                <p className="mt-4 rounded-xl border border-white/5 bg-background/40 p-3 text-sm text-muted text-pretty">
                  {r.motivation}
                </p>
              )}

              {err && (
                <div className="mt-3 flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                  <AlertCircle size={14} className="mt-0.5 shrink-0" />
                  <span className="text-pretty">{err}</span>
                </div>
              )}

              <AnimatePresence>
                {refusingId === r.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 space-y-3 border-t border-white/5 pt-4">
                      <label className="block">
                        <span className="mb-1.5 block text-xs uppercase tracking-[0.18em] text-muted">
                          {dict.refuseReason}
                        </span>
                        <textarea
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          rows={2}
                          className="w-full rounded-xl border border-white/10 bg-background/60 px-3 py-2 text-sm text-foreground focus:border-brand/60 focus:outline-none focus:ring-2 focus:ring-brand/30"
                        />
                      </label>
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setRefusingId(null);
                            setReason("");
                          }}
                          className="rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs text-muted hover:text-foreground"
                        >
                          {dict.cancel}
                        </button>
                        <button
                          type="button"
                          onClick={() => refuse(r.id)}
                          disabled={busy}
                          className="rounded-full border border-red-400/30 bg-red-400/15 px-3.5 py-1.5 text-xs font-medium text-red-200 hover:bg-red-400/25 disabled:opacity-50"
                        >
                          {busy ? "…" : dict.confirm}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
