"use client";

import { motion, useReducedMotion, useInView, animate } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal } from "@/components/ui/Reveal";
import type { Dictionary } from "@/i18n/dictionaries";

function StatCount({ value }: { value: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [display, setDisplay] = useState(value);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!inView || reduce) return;
    const num = parseInt(value.replace(/\D/g, ""), 10);
    if (Number.isNaN(num)) return;
    const prefix = value.startsWith("<") ? "<" : "";
    const suffix = value.endsWith("+") ? "+" : "";
    const controls = animate(0, num, {
      duration: 1.6,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(`${prefix}${Math.round(v)}${suffix}`),
    });
    return () => controls.stop();
  }, [inView, reduce, value]);

  return <span ref={ref}>{display}</span>;
}

export function Fruits({ dict }: { dict: Dictionary }) {
  return (
    <section className="relative overflow-hidden py-24 md:py-32">
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-50"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(79,195,220,0.12) 0%, transparent 60%)",
        }}
      />
      <div className="container-custom">
        <div className="mx-auto max-w-3xl text-center">
          <Reveal>
            <Eyebrow className="mx-auto justify-center">
              {dict.fruits.eyebrow}
            </Eyebrow>
          </Reveal>
          <Reveal delay={0.05}>
            <h2 className="mt-5 font-display text-4xl leading-tight text-balance md:text-5xl">
              {dict.fruits.title}
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-6 text-lg leading-relaxed text-foreground/80 text-pretty">
              {dict.fruits.intro}
            </p>
          </Reveal>
        </div>

        <div className="mt-14 grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-border bg-border/40 lg:grid-cols-4">
          {dict.fruits.items.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: i * 0.06 }}
              className="bg-surface/80 px-6 py-10 text-center"
            >
              <div className="font-display text-5xl text-brand md:text-6xl">
                <StatCount value={s.value} />
              </div>
              <div className="mt-3 text-sm leading-snug text-muted">
                {s.label}
              </div>
            </motion.div>
          ))}
        </div>

        <Reveal delay={0.15}>
          <p className="mx-auto mt-14 max-w-3xl text-center text-base leading-relaxed text-foreground/75 text-pretty md:text-lg">
            {dict.fruits.closing}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
