"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo } from "react";
import { locales } from "@/i18n/config";
import {
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  FolderOpen,
  Users,
  ClipboardCheck,
  UserCog,
  Link2,
  Activity,
  ArrowLeft,
  LogOut,
  Menu,
  X,
  GraduationCap,
  Layers,
  CalendarRange,
  FileDown,
  Heart,
  Library,
  Calendar as CalendarIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { AccentPicker } from "@/components/theme/AccentPicker";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/fr";
import type { UserRole } from "@/lib/supabase/types";

type PortailDict = Dictionary["portail"];

type LinkDef = { href: string; label: string; icon: React.ReactNode };

function getNavSections(
  locale: Locale,
  role: UserRole,
  dict: PortailDict,
): { title: string; links: LinkDef[] }[] {
  const base = `/${locale}/portail`;
  if (role === "admin") {
    return [
      {
        title: dict.sidebar.sections.admin,
        links: [
          { href: `${base}/admin`, label: dict.sidebar.links.dashboard, icon: <LayoutDashboard size={16} /> },
          { href: `${base}/admin/approvals`, label: dict.sidebar.links.approvals, icon: <ClipboardCheck size={16} /> },
          { href: `${base}/admin/users`, label: dict.sidebar.links.users, icon: <UserCog size={16} /> },
          { href: `${base}/admin/programs`, label: dict.sidebar.links.programs, icon: <GraduationCap size={16} /> },
          { href: `${base}/admin/cohorts`, label: dict.sidebar.links.cohorts, icon: <Layers size={16} /> },
          { href: `${base}/admin/courses`, label: dict.sidebar.links.courses, icon: <BookOpen size={16} /> },
          { href: `${base}/admin/resources`, label: dict.sidebar.links.dam, icon: <Library size={16} /> },
          { href: `${base}/admin/events`, label: dict.sidebar.links.events, icon: <CalendarIcon size={16} /> },
          { href: `${base}/admin/timeline`, label: dict.sidebar.links.timeline, icon: <CalendarRange size={16} /> },
          { href: `${base}/admin/exports`, label: dict.sidebar.links.exports, icon: <FileDown size={16} /> },
          { href: `${base}/admin/audit`, label: dict.sidebar.links.audit, icon: <Activity size={16} /> },
        ],
      },
    ];
  }
  if (role === "director") {
    return [
      {
        title: dict.sidebar.sections.director,
        links: [
          { href: `${base}/director`, label: dict.sidebar.links.dashboard, icon: <LayoutDashboard size={16} /> },
          { href: `${base}/director/pulse`, label: dict.sidebar.links.pulse, icon: <Heart size={16} /> },
          { href: `${base}/admin/cohorts`, label: dict.sidebar.links.cohorts, icon: <Layers size={16} /> },
          { href: `${base}/admin/timeline`, label: dict.sidebar.links.timeline, icon: <CalendarRange size={16} /> },
          { href: `${base}/admin/exports`, label: dict.sidebar.links.exports, icon: <FileDown size={16} /> },
        ],
      },
    ];
  }
  if (role === "coordinator") {
    return [
      {
        title: dict.sidebar.sections.coordinator,
        links: [
          { href: `${base}/coordinator`, label: dict.sidebar.links.dashboard, icon: <LayoutDashboard size={16} /> },
          { href: `${base}/admin/cohorts`, label: dict.sidebar.links.cohorts, icon: <Layers size={16} /> },
          { href: `${base}/admin/timeline`, label: dict.sidebar.links.timeline, icon: <CalendarRange size={16} /> },
          { href: `${base}/admin/users`, label: dict.sidebar.links.users, icon: <Users size={16} /> },
          { href: `${base}/admin/exports`, label: dict.sidebar.links.exports, icon: <FileDown size={16} /> },
        ],
      },
    ];
  }
  if (role === "coach") {
    return [
      {
        title: dict.sidebar.sections.coach,
        links: [
          { href: `${base}/coach`, label: dict.sidebar.links.dashboard, icon: <LayoutDashboard size={16} /> },
          { href: `${base}/coach/students`, label: dict.sidebar.links.students, icon: <Users size={16} /> },
          { href: `${base}/coach/log`, label: dict.sidebar.links.log, icon: <ClipboardList size={16} /> },
        ],
      },
    ];
  }
  return [
    {
      title: dict.sidebar.sections.student,
      links: [
        { href: `${base}/etudiant`, label: dict.sidebar.links.dashboard, icon: <LayoutDashboard size={16} /> },
        { href: `${base}/etudiant/cours`, label: dict.sidebar.links.courses, icon: <BookOpen size={16} /> },
        { href: `${base}/etudiant/devoirs`, label: dict.sidebar.links.assignments, icon: <ClipboardList size={16} /> },
        { href: `${base}/etudiant/ressources`, label: dict.sidebar.links.resources, icon: <FolderOpen size={16} /> },
      ],
    },
  ];
}

function landingPath(locale: Locale, role: UserRole): string {
  if (role === "admin") return `/${locale}/portail/admin`;
  if (role === "director") return `/${locale}/portail/director`;
  if (role === "coordinator") return `/${locale}/portail/coordinator`;
  if (role === "coach") return `/${locale}/portail/coach`;
  return `/${locale}/portail/etudiant`;
}

function initials(name: string | null, email: string): string {
  const src = (name && name.trim()) || email;
  const parts = src.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return src.slice(0, 2).toUpperCase();
}

export function PortailShell({
  locale,
  dict,
  user,
  children,
}: {
  locale: Locale;
  dict: PortailDict;
  user: { id: string; email: string; fullName: string | null; role: UserRole };
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const sections = getNavSections(locale, user.role, dict);

  const otherLocale: Locale = locale === "fr" ? "en" : "fr";
  const otherLocalePath = useMemo(() => {
    if (!pathname) return `/${otherLocale}`;
    // Replace the leading /<locale> segment with the other locale.
    const swapped = pathname.replace(
      new RegExp(`^/(${locales.join("|")})(?=/|$)`),
      `/${otherLocale}`,
    );
    return swapped || `/${otherLocale}`;
  }, [pathname, otherLocale]);

  async function signOut() {
    const supabase = getBrowserSupabase();
    await supabase.auth.signOut();
    router.replace(`/${locale}`);
    router.refresh();
  }

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <div className="absolute inset-x-0 top-0 h-[420px] gradient-radial opacity-60" />

      {/* Mobile top bar */}
      <header className="relative z-20 flex items-center justify-between border-b border-border/60 bg-background/80 px-4 py-3 backdrop-blur-xl md:hidden">
        <Link href={landingPath(locale, user.role)} className="flex items-center gap-2">
          <Image src="/3m-logo.png" alt="3M" width={26} height={26} className="object-contain accent-logo" />
          <span className="font-display text-sm">{dict.sidebar.brand}</span>
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          className="rounded-full border border-white/10 bg-white/5 p-2 text-foreground"
          aria-label="Menu"
        >
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </header>

      <div className="relative z-10 mx-auto flex max-w-[1500px]">
        {/* Sidebar (desktop) */}
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border/60 bg-background/60 px-5 py-7 backdrop-blur-xl md:flex">
          <Link
            href={landingPath(locale, user.role)}
            className="flex items-center gap-2.5"
          >
            <Image src="/3m-logo.png" alt="3M" width={30} height={30} className="object-contain accent-logo" />
            <span className="font-display text-base tracking-tight">{dict.sidebar.brand}</span>
          </Link>

          <nav className="mt-9 flex-1 space-y-7">
            {sections.map((sec) => (
              <div key={sec.title}>
                <p className="px-2 text-[10px] font-medium uppercase tracking-[0.22em] text-muted/70">
                  {sec.title}
                </p>
                <ul className="mt-3 space-y-0.5">
                  {sec.links.map((link) => {
                    const active = pathname === link.href;
                    return (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          className={cn(
                            "group relative flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition",
                            active
                              ? "bg-brand/10 text-foreground"
                              : "text-muted hover:bg-white/5 hover:text-foreground",
                          )}
                        >
                          {active && (
                            <motion.span
                              layoutId="portail-active"
                              className="absolute inset-y-1.5 left-0 w-0.5 rounded-r-full bg-brand"
                              transition={{ type: "spring", stiffness: 340, damping: 30 }}
                            />
                          )}
                          <span className={cn("transition", active ? "text-brand" : "text-muted/80 group-hover:text-foreground")}>
                            {link.icon}
                          </span>
                          <span>{link.label}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>

          <UserCard
            user={user}
            dict={dict}
            locale={locale}
            otherLocale={otherLocale}
            otherLocalePath={otherLocalePath}
            onSignOut={signOut}
          />
        </aside>

        {/* Mobile drawer */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-background/80 backdrop-blur-xl md:hidden"
              onClick={() => setMobileOpen(false)}
            >
              <motion.aside
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
                transition={{ type: "spring", stiffness: 360, damping: 34 }}
                className="flex h-full w-72 flex-col border-r border-border/60 bg-background px-5 py-7"
                onClick={(e) => e.stopPropagation()}
              >
                <Link
                  href={landingPath(locale, user.role)}
                  className="flex items-center gap-2.5"
                >
                  <Image src="/3m-logo.png" alt="3M" width={30} height={30} className="object-contain accent-logo" />
                  <span className="font-display text-base tracking-tight">{dict.sidebar.brand}</span>
                </Link>
                <nav className="mt-8 flex-1 space-y-7">
                  {sections.map((sec) => (
                    <div key={sec.title}>
                      <p className="px-2 text-[10px] font-medium uppercase tracking-[0.22em] text-muted/70">
                        {sec.title}
                      </p>
                      <ul className="mt-3 space-y-0.5">
                        {sec.links.map((link) => {
                          const active = pathname === link.href;
                          return (
                            <li key={link.href}>
                              <Link
                                href={link.href}
                                className={cn(
                                  "flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition",
                                  active
                                    ? "bg-brand/10 text-foreground"
                                    : "text-muted hover:bg-white/5 hover:text-foreground",
                                )}
                              >
                                {link.icon}
                                <span>{link.label}</span>
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ))}
                </nav>
                <UserCard
            user={user}
            dict={dict}
            locale={locale}
            otherLocale={otherLocale}
            otherLocalePath={otherLocalePath}
            onSignOut={signOut}
          />
              </motion.aside>
            </motion.div>
          )}
        </AnimatePresence>

        <main className="relative min-h-screen flex-1 px-5 py-8 md:px-10 md:py-12">
          <div className="mx-auto max-w-5xl">{children}</div>
        </main>
      </div>
    </div>
  );
}

function UserCard({
  user,
  dict,
  locale,
  otherLocale,
  otherLocalePath,
  onSignOut,
}: {
  user: { id: string; email: string; fullName: string | null; role: UserRole };
  dict: PortailDict;
  locale: Locale;
  otherLocale: Locale;
  otherLocalePath: string;
  onSignOut: () => void;
}) {
  return (
    <div className="mt-7 space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-xs font-medium text-[#031019]">
          {initials(user.fullName, user.email)}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm text-foreground">{user.fullName || user.email}</p>
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted">
            {dict.common.roles[user.role]}
          </p>
        </div>
      </div>

      {/* Theme + Accent + Language toggles */}
      <div className="flex items-center justify-between gap-2">
        <ThemeToggle variant="pill" />
        <AccentPicker />
      </div>
      <div
        className="flex items-center rounded-full border border-white/10 bg-background/40 p-0.5 text-[10px] uppercase tracking-[0.18em]"
        role="group"
        aria-label="Language"
      >
        <Link
          href={locale === "fr" ? "#" : otherLocalePath}
          aria-pressed={locale === "fr"}
          className={`flex-1 rounded-full px-3 py-1 text-center transition ${
            locale === "fr"
              ? "bg-brand text-[#031019] font-medium"
              : "text-muted hover:text-foreground"
          }`}
        >
          FR
        </Link>
        <Link
          href={locale === "en" ? "#" : otherLocalePath}
          aria-pressed={locale === "en"}
          className={`flex-1 rounded-full px-3 py-1 text-center transition ${
            locale === "en"
              ? "bg-brand text-[#031019] font-medium"
              : "text-muted hover:text-foreground"
          }`}
        >
          EN
        </Link>
      </div>

      <div className="flex items-center justify-between gap-2">
        <Link
          href={`/${locale}`}
          className="inline-flex items-center gap-1.5 text-xs text-muted transition hover:text-foreground"
        >
          <ArrowLeft size={13} />
          {dict.sidebar.backToSite}
        </Link>
        <button
          type="button"
          onClick={onSignOut}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-muted transition hover:border-red-400/30 hover:bg-red-400/10 hover:text-red-200"
        >
          <LogOut size={12} />
          {dict.sidebar.logout}
        </button>
      </div>
    </div>
  );
}
