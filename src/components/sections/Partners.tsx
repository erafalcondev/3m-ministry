import { Reveal } from "@/components/ui/Reveal";
import type { Dictionary } from "@/i18n/dictionaries";

export function Partners({ dict }: { dict: Dictionary }) {
  return (
    <section className="border-y border-border/60 bg-surface/30 py-12">
      <div className="container-custom">
        <Reveal>
          <div className="flex flex-col items-center gap-6 text-center md:flex-row md:justify-center md:gap-10">
            <span className="text-xs font-medium uppercase tracking-[0.22em] text-muted">
              {dict.partners.title}
            </span>
            <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
              {dict.partners.items.map((p) => (
                <span
                  key={p}
                  className="font-display text-xl text-foreground/85"
                >
                  {p}
                </span>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
