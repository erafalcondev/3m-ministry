import Image from "next/image";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";

export function CTA({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  return (
    <section className="relative overflow-hidden py-24 md:py-32">
      <div className="container-custom">
        <div className="relative overflow-hidden rounded-[2.5rem] border border-brand/30 bg-gradient-to-br from-surface-2 via-surface to-background px-6 py-20 text-center md:px-16 md:py-28">
          <div
            className="absolute -top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full opacity-40 blur-3xl"
            style={{
              background:
                "radial-gradient(circle, rgba(79,195,220,0.5), transparent 70%)",
            }}
          />
          <div className="absolute inset-0 grid-bg opacity-40" />
          <div className="absolute right-10 top-10 hidden md:block">
            <Image
              src="/3m-logo.png"
              alt=""
              width={120}
              height={120}
              aria-hidden
              className="opacity-30"
            />
          </div>

          <div className="relative mx-auto max-w-3xl">
            <Reveal>
              <Eyebrow className="mx-auto justify-center">{dict.cta.eyebrow}</Eyebrow>
            </Reveal>
            <Reveal delay={0.05}>
              <h2 className="mt-5 font-display text-4xl leading-tight text-balance md:text-6xl">
                {dict.cta.title}
              </h2>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="mt-6 text-lg leading-relaxed text-foreground/85 text-pretty">
                {dict.cta.body}
              </p>
            </Reveal>
            <Reveal delay={0.15}>
              <p className="mt-6 font-display text-xl italic leading-relaxed text-brand">
                {dict.cta.closing}
              </p>
            </Reveal>
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
          </div>
        </div>
      </div>
    </section>
  );
}
