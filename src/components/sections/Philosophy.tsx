"use client";

import { motion } from "framer-motion";
import { Brain, Hand, Heart } from "lucide-react";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal } from "@/components/ui/Reveal";
import type { Dictionary } from "@/i18n/dictionaries";

const icons = [Brain, Hand, Heart];

export function Philosophy({ dict }: { dict: Dictionary }) {
  return (
    <section className="relative overflow-hidden bg-surface/40 py-24 md:py-32">
      <div className="absolute inset-0 -z-10 grid-bg opacity-60" />
      <div className="container-custom">
        <div className="mx-auto max-w-3xl text-center">
          <Reveal>
            <Eyebrow className="mx-auto justify-center">
              {dict.philosophy.eyebrow}
            </Eyebrow>
          </Reveal>
          <Reveal delay={0.05}>
            <h2 className="mt-5 font-display text-4xl leading-tight text-balance md:text-5xl">
              {dict.philosophy.title}
            </h2>
          </Reveal>
          <Reveal delay={0.12}>
            <p className="mt-6 text-lg leading-relaxed text-foreground/75 text-pretty">
              {dict.philosophy.intro}
            </p>
          </Reveal>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {dict.philosophy.items.map((it, i) => {
            const Icon = icons[i] ?? Brain;
            return (
              <Reveal key={it.title} delay={0.05 + i * 0.08}>
                <motion.div
                  whileHover={{ y: -6, scale: 1.01 }}
                  transition={{ type: "spring", stiffness: 250, damping: 22 }}
                  className="group relative h-full overflow-hidden rounded-3xl border border-border bg-background/70 p-8"
                >
                  <div className="absolute -inset-px -z-10 rounded-3xl bg-gradient-to-br from-brand/30 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                  <div className="flex items-center justify-between">
                    <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl gradient-brand text-[#031019] shadow-[0_15px_45px_-12px_rgba(79,195,220,0.45)]">
                      <Icon size={26} strokeWidth={2} />
                    </div>
                    <span className="font-display text-5xl text-brand/30">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <h3 className="mt-8 font-display text-3xl">{it.title}</h3>
                  <div className="mt-1 text-xs uppercase tracking-[0.22em] text-muted">
                    {it.subtitle}
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-foreground/75">
                    {it.description}
                  </p>
                </motion.div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
