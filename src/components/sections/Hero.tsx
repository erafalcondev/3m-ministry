"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";

export function Hero({
  locale,
  dict,
}: {
  locale: Locale;
  dict: Dictionary;
}) {
  const reduce = useReducedMotion();

  return (
    <section className="relative isolate overflow-hidden pt-28 pb-24 md:pt-40 md:pb-32">
      <div className="absolute inset-0 -z-10 gradient-radial" />
      <div className="absolute inset-0 -z-10 grid-bg" />
      <div
        className="absolute -top-40 right-[-10%] -z-10 h-[520px] w-[520px] rounded-full opacity-40 blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(79,195,220,0.5), transparent 60%)" }}
      />
      <div
        className="absolute bottom-[-20%] left-[-10%] -z-10 h-[460px] w-[460px] rounded-full opacity-30 blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(251,191,102,0.45), transparent 60%)" }}
      />
      <div className="noise" />

      <div className="container-custom relative">
        <div className="grid items-center gap-16 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              <Eyebrow>{dict.hero.eyebrow}</Eyebrow>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.85, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="mt-6 font-display text-[2.5rem] leading-[1.05] text-balance md:text-6xl lg:text-[4.25rem]"
            >
              {dict.hero.title.split(" ").map((w, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.6,
                    delay: 0.1 + i * 0.04,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="inline-block"
                >
                  {w}&nbsp;
                </motion.span>
              ))}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="mt-7 max-w-2xl text-lg leading-relaxed text-foreground/80 text-pretty md:text-xl"
            >
              {dict.hero.subtitle}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="mt-10 flex flex-wrap items-center gap-3"
            >
              <Button href={`/${locale}/programs`} size="lg">
                {dict.hero.primaryCta}
                <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
              </Button>
              <Button href={`/${locale}/vision`} variant="secondary" size="lg">
                {dict.hero.secondaryCta}
                <ArrowUpRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Button>
            </motion.div>

            <motion.figure
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.7 }}
              className="mt-12 max-w-xl border-l-2 border-brand/50 pl-5"
            >
              <blockquote className="font-display text-base italic leading-relaxed text-foreground/85 md:text-lg">
                {dict.hero.verse}
              </blockquote>
              <figcaption className="mt-2 text-xs uppercase tracking-[0.22em] text-muted">
                — {dict.hero.verseRef}
              </figcaption>
            </motion.figure>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
            className="relative mx-auto aspect-square w-full max-w-[440px]"
          >
            <motion.div
              animate={
                reduce
                  ? undefined
                  : { rotate: 360 }
              }
              transition={{ duration: 60, ease: "linear", repeat: Infinity }}
              className="absolute inset-0"
            >
              <div
                className="absolute inset-4 rounded-full border border-brand/30"
                style={{ boxShadow: "0 0 60px 0 rgba(79,195,220,0.25)" }}
              />
              <div className="absolute inset-12 rounded-full border border-brand/20" />
              <div className="absolute inset-20 rounded-full border border-brand/10" />
            </motion.div>

            <motion.div
              animate={reduce ? undefined : { y: [0, -10, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="relative flex h-full w-full items-center justify-center"
            >
              <div className="absolute inset-10 rounded-full bg-brand/10 blur-3xl" />
              <Image
                src="/3m-logo.png"
                alt="3M Ministry"
                width={420}
                height={420}
                priority
                className="relative drop-shadow-[0_30px_60px_rgba(79,195,220,0.4)]"
              />
            </motion.div>

            <span className="pulse-ring absolute left-1/2 top-1/2 -z-10 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand" />
          </motion.div>
        </div>
      </div>

      <div className="container-custom mt-20 grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-border bg-border/40 md:grid-cols-4">
        {dict.stats.items.map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, delay: i * 0.05 }}
            className="bg-surface/80 px-6 py-7 backdrop-blur-md md:py-10"
          >
            <div className="font-display text-4xl text-brand md:text-5xl">{s.value}</div>
            <div className="mt-2 text-sm leading-snug text-muted">{s.label}</div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
