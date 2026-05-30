import { Sparkles } from "lucide-react";

export type Highlight = { kind: "info" | "warn" | "ok"; text: string };

export function HighlightsCard({
  title,
  empty,
  highlights,
}: {
  title: string;
  empty: string;
  highlights: Highlight[];
}) {
  return (
    <>
      <h2 className="mb-3 flex items-center gap-2 font-display text-lg text-foreground">
        <Sparkles size={18} className="text-brand" />
        {title}
      </h2>
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-2">
        {highlights.length === 0 ? (
          <p className="px-3 py-4 text-sm text-muted">{empty}</p>
        ) : (
          <ul className="divide-y divide-white/5">
            {highlights.map((h, i) => (
              <li key={i} className="flex items-center gap-3 px-3 py-2.5 text-sm">
                <span
                  className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                    h.kind === "warn"
                      ? "bg-amber-300"
                      : h.kind === "ok"
                        ? "bg-emerald-300"
                        : "bg-brand"
                  }`}
                />
                <span className="text-foreground/90">{h.text}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
