"use client";

import { motion } from "framer-motion";
import { Compass, Shield, Sparkles, Check } from "lucide-react";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";

const icons = [Shield, Compass, Sparkles];

export function Programs({
  locale,
  dict,
  compact,
}: {
  locale: Locale;
  dict: Dictionary;
  compact?: boolean;
}) {
  return (
    <section className="relative py-24 md:py-32">
      <div className="container-custom">
        <div className="mx-auto max-w-3xl text-center">
          <Reveal>
            <Eyebrow className="mx-auto justify-center">
              {dict.programs.eyebrow}
            </Eyebrow>
          </Reveal>
          <Reveal delay={0.05}>
            <h2 className="mt-5 font-display text-4xl leading-tight text-balance md:text-5xl">
              {dict.programs.title}
            </h2>
          </Reveal>
          {!compact && (
            <Reveal delay={0.1}>
              <p className="mt-6 text-lg leading-relaxed text-foreground/75 text-pretty">
                {dict.programs.intro}
              </p>
            </Reveal>
          )}
        </div>

        <div className="mt-16 space-y-5">
          {dict.programs.items.map((p, i) => {
            const Icon = icons[i] ?? Shield;
            return (
              <Reveal key={p.code} delay={0.05 + i * 0.08}>
                <motion.div
                  whileHover={{ y: -3 }}
                  transition={{ type: "spring", stiffness: 250, damping: 22 }}
                  className="group relative overflow-hidden rounded-3xl border border-border bg-surface/60 p-8 backdrop-blur-md md:p-10"
                >
                  <div className="absolute right-[-60px] top-[-60px] h-56 w-56 rounded-full bg-brand/10 blur-3xl transition-opacity duration-500 group-hover:bg-brand/20" />
                  <div className="grid gap-8 md:grid-cols-[auto_1fr_auto] md:items-start">
                    <div className="relative">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-brand/30 bg-brand/10 text-brand">
                        <Icon size={28} />
                      </div>
                      <div className="mt-4 text-[10px] font-semibold uppercase tracking-[0.3em] text-brand">
                        {p.code}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-display text-3xl leading-tight md:text-4xl">
                        {p.name}
                      </h3>
                      <p className="mt-1 text-sm uppercase tracking-[0.22em] text-muted">
                        {p.subtitle}
                      </p>
                      <ul className="mt-6 grid gap-3 md:grid-cols-2">
                        {p.bullets.map((b) => (
                          <li
                            key={b}
                            className="flex items-start gap-3 text-sm leading-relaxed text-foreground/85"
                          >
                            <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-brand/15 text-brand">
                              <Check size={12} strokeWidth={3} />
                            </span>
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex flex-row gap-6 text-right md:flex-col md:gap-4">
                      <div>
                        <div className="text-xs uppercase tracking-[0.18em] text-muted">
                          {locale === "fr" ? "Durée" : "Duration"}
                        </div>
                        <div className="mt-1 font-display text-lg text-foreground">
                          {p.duration}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs uppercase tracking-[0.18em] text-muted">
                          {locale === "fr" ? "Investissement" : "Investment"}
                        </div>
                        <div className="mt-1 font-display text-lg text-brand">
                          {p.cost}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </Reveal>
            );
          })}
        </div>

        {compact && (
          <Reveal delay={0.2}>
            <div className="mt-12 flex justify-center">
              <Button href={`/${locale}/programs`} variant="secondary" size="lg">
                {locale === "fr"
                  ? "Voir tous les programmes"
                  : "View all programs"}
              </Button>
            </div>
          </Reveal>
        )}
      </div>
    </section>
  );
}
