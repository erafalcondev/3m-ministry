"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, LogIn, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Locale } from "@/i18n/config";
import type { UserRole } from "@/lib/supabase/types";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

type NavLabels = {
  home: string;
  vision: string;
  programs: string;
  philosophy: string;
  partner: string;
  contact: string;
  cta: string;
  login: string;
  portail: string;
  logout: string;
};

export function Navbar({
  locale,
  labels,
  authed = false,
  role = null,
}: {
  locale: Locale;
  labels: NavLabels;
  authed?: boolean;
  role?: UserRole | null;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const otherLocale: Locale = locale === "fr" ? "en" : "fr";
  const otherPath = pathname.replace(`/${locale}`, `/${otherLocale}`) || `/${otherLocale}`;

  const links = [
    { href: `/${locale}`, label: labels.home },
    { href: `/${locale}/vision`, label: labels.vision },
    { href: `/${locale}/philosophy`, label: labels.philosophy },
    { href: `/${locale}/programs`, label: labels.programs },
    { href: `/${locale}/partner`, label: labels.partner },
    { href: `/${locale}/contact`, label: labels.contact },
  ];

  const portailHref =
    role === "admin"
      ? `/${locale}/portail/admin`
      : role === "director"
        ? `/${locale}/portail/director`
        : role === "coordinator"
          ? `/${locale}/portail/coordinator`
          : role === "coach"
            ? `/${locale}/portail/coach`
            : `/${locale}/portail/etudiant`;

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-500",
        scrolled
          ? "border-b border-border/60 bg-background/85 backdrop-blur-xl"
          : "bg-transparent",
      )}
    >
      <div className="container-custom flex h-16 items-center justify-between md:h-20">
        <Link
          href={`/${locale}`}
          className="group flex items-center gap-3"
          aria-label="3M Ministry — Accueil"
        >
          <span className="relative h-9 w-9 md:h-10 md:w-10">
            <Image
              src="/3m-logo.png"
              alt="3M Ministry"
              fill
              sizes="40px"
              className="object-contain accent-logo transition-transform duration-700 group-hover:rotate-[12deg]"
              priority
            />
          </span>
          <span className="hidden text-sm font-medium tracking-wide text-foreground/90 sm:block">
            3M Ministry
            <span className="ml-2 hidden text-xs uppercase tracking-[0.18em] text-muted md:inline">
              · Multiply Movement
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "relative rounded-full px-3.5 py-2 text-sm transition-colors",
                  active
                    ? "text-foreground"
                    : "text-muted hover:text-foreground",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-full bg-white/5 ring-1 ring-white/10"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
                <span className="relative">{l.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <span className="hidden md:inline-flex">
            <ThemeToggle variant="icon" />
          </span>
          <Link
            href={otherPath}
            className="hidden h-9 items-center rounded-full border border-white/10 bg-white/5 px-3 text-xs font-medium uppercase tracking-[0.18em] text-muted transition hover:border-brand/50 hover:bg-brand/10 hover:text-foreground md:inline-flex"
            aria-label={`Switch to ${otherLocale.toUpperCase()}`}
          >
            {otherLocale.toUpperCase()}
          </Link>
          {authed ? (
            <Link
              href={portailHref}
              className="hidden h-9 items-center gap-2 rounded-full border border-brand/40 bg-brand/10 px-4 text-sm font-medium text-foreground transition hover:bg-brand/20 hover:border-brand/70 md:inline-flex"
            >
              <LayoutDashboard size={15} />
              {labels.portail}
            </Link>
          ) : (
            <Link
              href={`/${locale}/login`}
              className="hidden h-9 items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 text-sm font-medium text-foreground/90 transition hover:bg-white/10 hover:border-brand/40 hover:text-foreground md:inline-flex"
            >
              <LogIn size={15} />
              {labels.login}
            </Link>
          )}
          <Button
            href={`/${locale}/partner`}
            size="md"
            className="hidden md:inline-flex"
          >
            {labels.cta}
          </Button>
          <button
            type="button"
            className="rounded-full border border-white/10 bg-white/5 p-2.5 text-foreground md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="md:hidden"
          >
            <div className="container-custom border-t border-border/60 bg-background/95 pb-6 pt-4 backdrop-blur-xl">
              <div className="flex flex-col gap-1">
                {links.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className="rounded-2xl px-4 py-3 text-base text-foreground/90 transition hover:bg-white/5"
                  >
                    {l.label}
                  </Link>
                ))}
                {authed ? (
                  <Link
                    href={portailHref}
                    className="rounded-2xl px-4 py-3 text-base text-brand transition hover:bg-white/5"
                  >
                    {labels.portail}
                  </Link>
                ) : (
                  <Link
                    href={`/${locale}/login`}
                    className="rounded-2xl px-4 py-3 text-base text-foreground/90 transition hover:bg-white/5"
                  >
                    {labels.login}
                  </Link>
                )}
              </div>
              <div className="mt-4 flex items-center justify-between gap-3">
                <Link
                  href={otherPath}
                  className="inline-flex h-10 items-center rounded-full border border-white/10 bg-white/5 px-4 text-xs font-medium uppercase tracking-[0.18em] text-muted"
                >
                  {otherLocale.toUpperCase()}
                </Link>
                <Button href={`/${locale}/partner`} size="md">
                  {labels.cta}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
