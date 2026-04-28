import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal } from "@/components/ui/Reveal";
import type { Dictionary } from "@/i18n/dictionaries";

export function Challenge({ dict }: { dict: Dictionary }) {
  return (
    <section className="relative py-24 md:py-32">
      <div className="container-custom">
        <div className="grid gap-14 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <Reveal>
            <Eyebrow>{dict.challenge.eyebrow}</Eyebrow>
            <h2 className="mt-5 font-display text-4xl leading-tight text-balance md:text-5xl">
              {dict.challenge.title}
            </h2>
          </Reveal>
          <div className="space-y-6">
            {dict.challenge.body.map((p, i) => (
              <Reveal key={i} delay={0.05 + i * 0.08}>
                <p className="text-lg leading-relaxed text-foreground/80 text-pretty">
                  {p}
                </p>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
