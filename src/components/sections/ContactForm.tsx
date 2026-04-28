"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Send, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { Dictionary } from "@/i18n/dictionaries";

type Status = "idle" | "sending" | "success" | "error";

export function ContactForm({ dict }: { dict: Dictionary }) {
  const [status, setStatus] = useState<Status>("idle");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    const data = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
          phone: data.get("phone"),
          subject: data.get("subject"),
          message: data.get("message"),
        }),
      });
      if (!res.ok) throw new Error("Request failed");
      setStatus("success");
      e.currentTarget.reset();
    } catch {
      setStatus("error");
    }
  }

  const labelCls =
    "block text-xs font-medium uppercase tracking-[0.18em] text-muted";
  const inputCls =
    "w-full rounded-2xl border border-white/10 bg-surface/60 px-4 py-3 text-sm text-foreground placeholder:text-muted/60 backdrop-blur-md outline-none transition focus:border-brand/60 focus:bg-surface/80 focus:ring-2 focus:ring-brand/30";

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid gap-5 md:grid-cols-2">
        <label className="space-y-2">
          <span className={labelCls}>{dict.contact.fields.name}</span>
          <input required name="name" type="text" className={inputCls} />
        </label>
        <label className="space-y-2">
          <span className={labelCls}>{dict.contact.fields.email}</span>
          <input required name="email" type="email" className={inputCls} />
        </label>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <label className="space-y-2">
          <span className={labelCls}>{dict.contact.fields.phone}</span>
          <input name="phone" type="tel" className={inputCls} />
        </label>
        <label className="space-y-2">
          <span className={labelCls}>{dict.contact.fields.subject}</span>
          <input required name="subject" type="text" className={inputCls} />
        </label>
      </div>
      <label className="block space-y-2">
        <span className={labelCls}>{dict.contact.fields.message}</span>
        <textarea required name="message" rows={6} className={inputCls} />
      </label>

      <div className="flex flex-wrap items-center gap-4 pt-2">
        <Button as="button" type="submit" size="lg" disabled={status === "sending"}>
          {status === "sending" ? dict.contact.fields.sending : dict.contact.fields.submit}
          <Send className="size-4" />
        </Button>

        {status === "success" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-sm text-brand"
          >
            <CheckCircle2 size={16} />
            <span>{dict.contact.fields.success}</span>
          </motion.div>
        )}
        {status === "error" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-sm text-amber-400"
          >
            <AlertCircle size={16} />
            <span>{dict.contact.fields.error}</span>
          </motion.div>
        )}
      </div>
    </form>
  );
}
