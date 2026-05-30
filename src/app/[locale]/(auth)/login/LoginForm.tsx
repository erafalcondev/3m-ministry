"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { portailLanding, type UserRole } from "@/lib/supabase/types";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/fr";

type LoginDict = Dictionary["auth"]["login"];

export function LoginForm({
  locale,
  dict,
  from,
}: {
  locale: Locale;
  dict: LoginDict;
  from?: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const supabase = getBrowserSupabase();
      const { data, error: signInErr } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInErr || !data.user) {
        setError(dict.errorInvalid);
        return;
      }

      const { data: profile, error: profileErr } = await supabase
        .from("profiles")
        .select("role,status")
        .eq("id", data.user.id)
        .single();

      if (profileErr || !profile) {
        await supabase.auth.signOut();
        setError(dict.errorGeneric);
        return;
      }

      if (profile.status === "pending") {
        await supabase.auth.signOut();
        setError(dict.errorPending);
        return;
      }
      if (profile.status === "refused") {
        await supabase.auth.signOut();
        setError(dict.errorRefused);
        return;
      }

      const dest = from ? `/${from}` : portailLanding(locale, profile.role as UserRole);
      router.replace(dest);
      router.refresh();
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="relative rounded-3xl border border-white/10 bg-surface/70 p-8 shadow-[0_30px_120px_-40px_rgba(79,195,220,0.35)] backdrop-blur-xl md:p-10"
    >
      <div className="mb-7 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="font-display text-2xl text-foreground md:text-3xl"
        >
          {dict.title}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mt-2 text-sm text-muted text-pretty"
        >
          {dict.subtitle}
        </motion.p>
      </div>

      <form onSubmit={submit} className="space-y-5">
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
        <PasswordField
          label={dict.passwordLabel}
          value={password}
          onChange={setPassword}
          show={showPassword}
          onToggle={() => setShowPassword((v) => !v)}
          delay={0.26}
        />

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
          transition={{ delay: 0.32, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
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

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-8 text-center text-sm text-muted"
      >
        {dict.noAccount}{" "}
        <Link
          href={`/${locale}/register`}
          className="font-medium text-foreground underline-offset-4 transition hover:text-brand hover:underline"
        >
          {dict.register}
        </Link>
      </motion.div>
    </motion.div>
  );
}

function Field({
  label,
  name,
  type,
  autoComplete,
  required,
  value,
  onChange,
  delay,
}: {
  label: string;
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
    </motion.label>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  show,
  onToggle,
  delay,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
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
      <div className="relative">
        <input
          name="password"
          type={show ? "text" : "password"}
          autoComplete="current-password"
          required
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-12 w-full rounded-2xl border border-white/10 bg-background/60 px-4 pr-12 text-sm text-foreground transition focus:border-brand/60 focus:bg-background/80 focus:outline-none focus:ring-2 focus:ring-brand/30"
        />
        <button
          type="button"
          onClick={onToggle}
          aria-label="Toggle password visibility"
          className="absolute inset-y-0 right-3 my-auto flex h-8 w-8 items-center justify-center rounded-full text-muted transition hover:bg-white/5 hover:text-foreground"
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </motion.label>
  );
}
