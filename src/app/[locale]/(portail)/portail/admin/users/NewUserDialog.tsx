"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Copy, RefreshCcw } from "lucide-react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/fr";

type AdminDict = Dictionary["portail"]["admin"];
type RoleLabels = Dictionary["portail"]["common"]["roles"];

type Role = "student" | "coach" | "coordinator" | "director" | "admin";

function generatePassword(): string {
  const alphabet =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let out = "";
  const arr = new Uint8Array(12);
  if (typeof window !== "undefined" && window.crypto) {
    window.crypto.getRandomValues(arr);
    for (let i = 0; i < arr.length; i += 1) {
      out += alphabet[arr[i] % alphabet.length];
    }
  } else {
    for (let i = 0; i < 12; i += 1) {
      out += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
  }
  // Force at least one special + one digit for variety
  return out + "!";
}

export function NewUserDialog({
  open,
  onClose,
  dict,
  roleLabels,
}: {
  open: boolean;
  onClose: () => void;
  locale: Locale;
  dict: AdminDict;
  roleLabels: RoleLabels;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<Role>("student");
  const [password, setPassword] = useState(() => generatePassword());
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  function reset() {
    setEmail("");
    setFullName("");
    setRole("student");
    setPassword(generatePassword());
    setError(null);
    setSuccess(false);
    setCopied(false);
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email || !password) return;
    if (password.length < 8) {
      setError(dict.newUserPasswordHint);
      return;
    }
    startTransition(async () => {
      const res = await fetch("/api/admin/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, fullName, role, password }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "error");
        return;
      }
      setSuccess(true);
      router.refresh();
    });
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-xl"
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl border border-white/10 bg-surface/95 p-6 shadow-[0_30px_120px_-40px_rgba(0,0,0,0.7)]"
          >
            <div className="mb-5 flex items-start justify-between">
              <h2 className="font-display text-xl text-foreground">{dict.newUserTitle}</h2>
              <button
                type="button"
                onClick={() => {
                  reset();
                  onClose();
                }}
                className="rounded-full p-1 text-muted hover:bg-white/5 hover:text-foreground"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            {success ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-sm text-emerald-200">
                  {dict.newUserSuccess}
                </div>
                <div className="rounded-xl border border-white/10 bg-background/50 p-4">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-muted">{dict.newUserEmail}</p>
                  <p className="text-sm text-foreground">{email}</p>
                  <p className="mt-3 text-[10px] uppercase tracking-[0.18em] text-muted">{dict.newUserPassword}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <code className="flex-1 rounded-lg bg-white/5 px-3 py-2 font-mono text-sm text-foreground">{password}</code>
                    <button
                      type="button"
                      onClick={copy}
                      className="inline-flex h-9 items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 text-xs text-muted hover:border-brand/40 hover:text-foreground"
                    >
                      {copied ? <Check size={12} /> : <Copy size={12} />}
                      {copied ? dict.copied : dict.newUserCopyPwd}
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    reset();
                    onClose();
                  }}
                  className="w-full rounded-full bg-brand py-2 text-sm font-medium text-[#031019] hover:shadow-[0_10px_30px_-10px_rgba(79,195,220,0.6)]"
                >
                  OK
                </button>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-4">
                <Field label={dict.newUserName}>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="h-11 w-full rounded-xl border border-white/10 bg-background/70 px-3 text-sm text-foreground focus:border-brand/60 focus:outline-none"
                  />
                </Field>
                <Field label={dict.newUserEmail}>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11 w-full rounded-xl border border-white/10 bg-background/70 px-3 text-sm text-foreground focus:border-brand/60 focus:outline-none"
                  />
                </Field>
                <Field label={dict.newUserRole}>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as Role)}
                    className="h-11 w-full rounded-xl border border-white/10 bg-background/70 px-3 text-sm text-foreground focus:border-brand/60 focus:outline-none"
                  >
                    {(["student", "coach", "coordinator", "director", "admin"] as Role[]).map((r) => (
                      <option key={r} value={r}>
                        {roleLabels[r]}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label={dict.newUserPassword}>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-11 flex-1 rounded-xl border border-white/10 bg-background/70 px-3 font-mono text-sm text-foreground focus:border-brand/60 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setPassword(generatePassword())}
                      className="inline-flex h-11 items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 text-xs text-muted hover:border-brand/40 hover:text-foreground"
                    >
                      <RefreshCcw size={12} />
                      {dict.newUserGenerate}
                    </button>
                  </div>
                  <p className="mt-1.5 text-[11px] text-muted/70">{dict.newUserPasswordHint}</p>
                </Field>

                {error && (
                  <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={pending || !email || !password}
                  className="w-full rounded-full bg-brand py-2.5 text-sm font-medium text-[#031019] transition hover:shadow-[0_10px_30px_-10px_rgba(79,195,220,0.6)] disabled:opacity-50"
                >
                  {pending ? dict.newUserCreating : dict.newUserCreateCta}
                </button>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
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
