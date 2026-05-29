export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-white/5 pb-6 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 className="font-display text-2xl text-foreground md:text-[28px]">{title}</h1>
        {description && (
          <p className="mt-2 max-w-2xl text-sm text-muted text-pretty">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
