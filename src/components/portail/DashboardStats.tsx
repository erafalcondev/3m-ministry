export function DashboardStats({
  stats,
}: {
  stats: { label: string; value: number | string; accent?: boolean }[];
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-3">
      {stats.map((s) => (
        <div key={s.label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted">{s.label}</p>
          <p className={`mt-1 font-display text-2xl ${s.accent ? "text-brand" : "text-foreground"}`}>
            {s.value}
          </p>
        </div>
      ))}
    </div>
  );
}
