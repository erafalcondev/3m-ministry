"use client";

import { motion } from "framer-motion";
import { Sparkles, GraduationCap, Send } from "lucide-react";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal } from "@/components/ui/Reveal";
import type { Dictionary } from "@/i18n/dictionaries";

const icons = [Sparkles, GraduationCap, Send];

export function Vision({ dict }: { dict: Dictionary }) {
  return (
    <section className="relative overflow-hidden py-24 md:py-32">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[1px] bg-gradient-to-r from-transparent via-brand/40 to-transparent"
      />
      <div className="container-custom">
        <div className="mx-auto max-w-3xl text-center">
          <Reveal>
            <Eyebrow className="mx-auto justify-center">
              {dict.vision.eyebrow}
            </Eyebrow>
          </Reveal>
          <Reveal delay={0.05}>
            <h2 className="mt-5 font-display text-4xl leading-tight text-balance md:text-6xl">
              {dict.vision.title}
            </h2>
          </Reveal>
          <Reveal delay={0.12}>
            <p className="mt-6 text-lg leading-relaxed text-foreground/75 text-pretty md:text-xl">
              {dict.vision.intro}
            </p>
          </Reveal>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {dict.vision.pillars.map((p, i) => {
            const Icon = icons[i] ?? Sparkles;
            return (
              <Reveal key={p.title} delay={0.05 + i * 0.1}>
                <motion.div
                  whileHover={{ y: -6 }}
                  transition={{ type: "spring", stiffness: 250, damping: 22 }}
                  className="group relative h-full overflow-hidden rounded-3xl border border-border bg-surface/60 p-8 backdrop-blur-md"
                >
                  <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                    <div
                      className="absolute -top-20 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full blur-3xl"
                      style={{ background: "rgba(79,195,220,0.18)" }}
                    />
                  </div>
                  <div className="relative">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-brand/30 bg-brand/10 text-brand">
                      <Icon size={22} />
                    </div>
                    <h3 className="mt-6 font-display text-2xl">{p.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-foreground/75">
                      {p.description}
                    </p>
                  </div>
                  <div className="absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-brand/30 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                </motion.div>
              </Reveal>
            );
          })}
        </div>

        <Reveal delay={0.2}>
          <p className="mx-auto mt-14 max-w-3xl text-center text-base italic leading-relaxed text-muted md:text-lg">
            {dict.vision.closing}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
