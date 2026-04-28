import { cn } from "@/lib/utils";

export function Eyebrow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.22em] text-brand",
        className,
      )}
    >
      <span className="h-px w-8 bg-brand/60" />
      <span>{children}</span>
    </div>
  );
}
