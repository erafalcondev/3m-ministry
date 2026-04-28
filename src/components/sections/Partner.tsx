"use client";

import { motion } from "framer-motion";
import { Banknote, Repeat, Users, Church } from "lucide-react";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";

const icons = [Banknote, Repeat, Users, Church];

export function Partner({
  locale,
  dict,
  showCta = true,
}: {
  locale: Locale;
  dict: Dictionary;
  showCta?: boolean;
}) {
  return (
    <section className="relative overflow-hidden bg-surface/40 py-24 md:py-32">
      <div className="absolute inset-0 -z-10 grid-bg opacity-50" />
      <div className="container-custom">
        <div className="mx-auto max-w-3xl text-center">
          <Reveal>
            <Eyebrow className="mx-auto justify-center">{dict.partner.eyebrow}</Eyebrow>
          </Reveal>
          <Reveal delay={0.05}>
            <h2 className="mt-5 font-display text-4xl leading-tight text-balance md:text-5xl">
              {dict.partner.title}
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-6 text-lg leading-relaxed text-foreground/75">{dict.partner.intro}</p>
          </Reveal>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-2">
          {dict.partner.items.map((p, i) => {
            const Icon = icons[i] ?? Users;
            return (
              <Reveal key={p.title} delay={0.05 + i * 0.06}>
                <motion.div
                  whileHover={{ y: -4 }}
                  transition={{ type: "spring", stiffness: 250, damping: 22 }}
                  className="group relative overflow-hidden rounded-3xl border border-border bg-background/70 p-7"
                >
                  <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-brand/10 blur-3xl transition-opacity duration-500 group-hover:bg-brand/20" />
                  <div className="relative flex items-start gap-5">
                    <div className="flex h-12 w-12 flex-none items-center justify-center rounded-2xl border border-brand/30 bg-brand/10 text-brand">
                      <Icon size={22} />
                    </div>
                    <div>
                      <h3 className="font-display text-2xl">{p.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-foreground/75">
                        {p.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              </Reveal>
            );
          })}
        </div>

        <Reveal delay={0.15}>
          <p className="mx-auto mt-12 max-w-3xl text-center text-base italic leading-relaxed text-muted">
            {dict.partner.closing}
          </p>
        </Reveal>

        {showCta && (
          <Reveal delay={0.2}>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Button href={`/${locale}/partner`} size="lg">
                {dict.cta.primary}
              </Button>
              <Button href={`/${locale}/contact`} variant="secondary" size="lg">
                {dict.cta.secondary}
              </Button>
            </div>
          </Reveal>
        )}
      </div>
    </section>
  );
}
