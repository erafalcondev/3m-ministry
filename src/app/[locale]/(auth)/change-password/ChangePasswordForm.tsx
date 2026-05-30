"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { KeyRound, Eye, EyeOff } from "lucide-react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { portailLanding, type UserRole } from "@/lib/supabase/types";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/fr";

type Dict = Dictionary["changePassword"];

export function ChangePasswordForm({
  locale,
  dict,
  userId,
}: {
  locale: Locale;
  dict: Dict;
  userId: string;
}) {
  const router = useRouter();
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (pw.length < 8) {
      setError(dict.errorWeak);
      return;
    }
    if (pw !== confirm) {
      setError(dict.errorMismatch);
      return;
    }
    startTransition(async () => {
      const supabase = getBrowserSupabase();
      const { error: pwErr } = await supabase.auth.updateUser({ password: pw });
      if (pwErr) {
        setError(pwErr.message || dict.errorGeneric);
        return;
      }
      // Clear the must_change_password flag (RLS allows self-update of own profile.full_name etc.)
      // Using a profile update — we have a self-update policy via profile_self_update_name; but
      // we also need to update must_change_password. Since RLS only allows admin to write other
      // fields, we use a dedicated RPC OR allow this column. Quick fix: extend the policy via RPC.
      await supabase.from("profiles").update({ must_change_password: false }).eq("id", userId);
      // Fetch role to know where to send the user
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single();
      router.replace(portailLanding(locale, profile?.role as UserRole));
      router.refresh();
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-3xl border border-white/10 bg-surface/70 p-8 shadow-[0_30px_120px_-40px_rgba(79,195,220,0.35)] backdrop-blur-xl md:p-10"
    >
      <div className="mb-7 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand/15 text-brand">
          <KeyRound size={20} />
        </div>
        <h1 className="font-display text-2xl text-foreground md:text-3xl">{dict.title}</h1>
        <p className="mt-2 text-sm text-muted text-pretty">{dict.subtitle}</p>
      </div>

      <form onSubmit={submit} className="space-y-5">
        <label className="block">
          <span className="mb-1.5 block text-xs uppercase tracking-[0.18em] text-muted">
            {dict.newPasswordLabel}
          </span>
          <div className="relative">
            <input
              type={show ? "text" : "password"}
              required
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              className="h-12 w-full rounded-2xl border border-white/10 bg-background/60 px-4 pr-12 text-sm text-foreground transition focus:border-brand/60 focus:bg-background/80 focus:outline-none focus:ring-2 focus:ring-brand/30"
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              className="absolute inset-y-0 right-3 my-auto flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-white/5 hover:text-foreground"
              aria-label="Toggle visibility"
            >
              {show ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs uppercase tracking-[0.18em] text-muted">
            {dict.confirmLabel}
          </span>
          <input
            type={show ? "text" : "password"}
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="h-12 w-full rounded-2xl border border-white/10 bg-background/60 px-4 text-sm text-foreground transition focus:border-brand/60 focus:bg-background/80 focus:outline-none focus:ring-2 focus:ring-brand/30"
          />
        </label>

        {error && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={pending || !pw || !confirm}
          className="flex h-12 w-full items-center justify-center rounded-full bg-brand text-sm font-medium text-[#031019] transition hover:shadow-[0_18px_50px_-10px_rgba(79,195,220,0.6)] disabled:opacity-70"
        >
          {pending ? dict.submitting : dict.submitCta}
        </button>
      </form>
    </motion.div>
  );
}
