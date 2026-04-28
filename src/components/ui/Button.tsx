import Link from "next/link";
import { cn } from "@/lib/utils";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost";
type Size = "md" | "lg";

const base =
  "group inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-300 will-change-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const variants: Record<Variant, string> = {
  primary:
    "gradient-brand text-[#031019] hover:shadow-[0_18px_50px_-10px_rgba(79,195,220,0.55)] hover:-translate-y-0.5 active:translate-y-0",
  secondary:
    "bg-white/5 text-foreground border border-white/10 backdrop-blur-md hover:bg-white/10 hover:-translate-y-0.5",
  ghost:
    "text-foreground hover:bg-white/5",
};

const sizes: Record<Size, string> = {
  md: "px-5 py-2.5 text-sm",
  lg: "px-7 py-3.5 text-base",
};

type Common = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
};

type AsLink = Common & ComponentProps<typeof Link> & { as?: "link" };
type AsButton = Common & ComponentProps<"button"> & { as: "button" };

export function Button(props: AsLink | AsButton) {
  const {
    variant = "primary",
    size = "md",
    className,
    children,
    ...rest
  } = props;
  const styles = cn(base, variants[variant], sizes[size], className);

  if (props.as === "button") {
    const buttonProps = rest as ComponentProps<"button">;
    return (
      <button {...buttonProps} className={styles}>
        {children}
      </button>
    );
  }
  const linkProps = rest as ComponentProps<typeof Link>;
  return (
    <Link {...linkProps} className={styles}>
      {children}
    </Link>
  );
}
