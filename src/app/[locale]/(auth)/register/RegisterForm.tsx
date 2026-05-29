"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/fr";

type RegisterDict = Dictionary["auth"]["register"];

export function RegisterForm({ locale, dict }: { locale: Locale; dict: RegisterDict }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [motivation, setMotivation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError(dict.errorWeakPassword);
      return;
    }

    startTransition(async () => {
      const supabase = getBrowserSupabase();
      const { error: signUpErr } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            motivation: motivation.trim(),
          },
        },
      });

      if (signUpErr) {
        const msg = signUpErr.message.toLowerCase();
        if (msg.includes("already") || msg.includes("registered")) {
          setError(dict.errorEmailUsed);
        } else if (msg.includes("password")) {
          setError(dict.errorWeakPassword);
        } else {
          setError(dict.errorGeneric);
        }
        return;
      }

      // Sign the user out immediately — they need approval before they can use the portal.
      await supabase.auth.signOut();
      setDone(true);
    });
  }

  if (done) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="rounded-3xl border border-brand/30 bg-surface/70 p-10 text-center shadow-[0_30px_120px_-40px_rgba(79,195,220,0.4)] backdrop-blur-xl"
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand/20 text-brand">
          <CheckCircle2 size={28} />
        </div>
        <h1 className="mt-5 font-display text-2xl text-foreground">{dict.successTitle}</h1>
        <p className="mt-2 text-sm text-muted text-pretty">{dict.successBody}</p>
        <Link
          href={`/${locale}/login`}
          className="mt-7 inline-flex h-11 items-center rounded-full border border-white/15 bg-white/5 px-5 text-sm text-foreground transition hover:bg-white/10 hover:border-brand/40"
        >
          {dict.login}
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="relative rounded-3xl border border-white/10 bg-surface/70 p-8 shadow-[0_30px_120px_-40px_rgba(79,195,220,0.35)] backdrop-blur-xl md:p-10"
    >
      <div className="mb-7 text-center">
        <h1 className="font-display text-2xl text-foreground md:text-3xl">{dict.title}</h1>
        <p className="mt-2 text-sm text-muted text-pretty">{dict.subtitle}</p>
      </div>

      <form onSubmit={submit} className="space-y-5">
        <Field
          label={dict.nameLabel}
          name="full_name"
          type="text"
          autoComplete="name"
          required
          value={fullName}
          onChange={setFullName}
          delay={0.16}
        />
        <Field
          label={dict.emailLabel}
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={setEmail}
          delay={0.2}
        />
        <Field
          label={dict.passwordLabel}
          hint={dict.passwordHint}
          name="password"
          type="password"
          autoComplete="new-password"
          required
          value={password}
          onChange={setPassword}
          delay={0.24}
        />

        <motion.label
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="block"
        >
          <span className="mb-1.5 block text-xs uppercase tracking-[0.18em] text-muted">
            {dict.motivationLabel}
          </span>
          <textarea
            name="motivation"
            rows={3}
            placeholder={dict.motivationPlaceholder}
            value={motivation}
            onChange={(e) => setMotivation(e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-background/60 px-4 py-3 text-sm text-foreground transition focus:border-brand/60 focus:bg-background/80 focus:outline-none focus:ring-2 focus:ring-brand/30"
          />
        </motion.label>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
          >
            {error}
          </motion.div>
        )}

        <motion.button
          type="submit"
          disabled={pending}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.34, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="group relative flex h-12 w-full items-center justify-center overflow-hidden rounded-full bg-brand text-sm font-medium text-[#031019] transition hover:shadow-[0_18px_50px_-10px_rgba(79,195,220,0.6)] disabled:opacity-70"
        >
          {pending && (
            <motion.span
              className="absolute inset-y-0 left-0 bg-white/40"
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ duration: 1.4, ease: "easeInOut", repeat: Infinity }}
            />
          )}
          <span className="relative">{pending ? dict.submitting : dict.submit}</span>
        </motion.button>
      </form>

      <div className="mt-7 text-center text-sm text-muted">
        {dict.haveAccount}{" "}
        <Link
          href={`/${locale}/login`}
          className="font-medium text-foreground underline-offset-4 transition hover:text-brand hover:underline"
        >
          {dict.login}
        </Link>
      </div>
    </motion.div>
  );
}

function Field({
  label,
  hint,
  name,
  type,
  autoComplete,
  required,
  value,
  onChange,
  delay,
}: {
  label: string;
  hint?: string;
  name: string;
  type: string;
  autoComplete?: string;
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
  delay: number;
}) {
  return (
    <motion.label
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="block"
    >
      <span className="mb-1.5 block text-xs uppercase tracking-[0.18em] text-muted">{label}</span>
      <input
        name={name}
        type={type}
        autoComplete={autoComplete}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 w-full rounded-2xl border border-white/10 bg-background/60 px-4 text-sm text-foreground transition focus:border-brand/60 focus:bg-background/80 focus:outline-none focus:ring-2 focus:ring-brand/30"
      />
      {hint && <span className="mt-1 block text-xs text-muted/70">{hint}</span>}
    </motion.label>
  );
}
