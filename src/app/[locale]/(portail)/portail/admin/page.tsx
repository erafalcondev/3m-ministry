import Link from "next/link";
import {
  ClipboardCheck,
  UserCog,
  Link2,
  Activity,
  ArrowRight,
  Layers,
  CalendarRange,
  GraduationCap,
  FileDown,
} from "lucide-react";
import { type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getServerSupabase } from "@/lib/supabase/server";
import { requireRole, ADMIN_ONLY } from "@/lib/portail/access";
import { PageHeader } from "@/components/portail/PageHeader";
import { DashboardStats } from "@/components/portail/DashboardStats";
import { HighlightsCard } from "@/components/portail/HighlightsCard";
import { computeHighlights } from "@/lib/portail/highlights";

export default async function AdminDashboard({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const me = await requireRole(locale, ADMIN_ONLY);
  const dict = getDictionary(locale as Locale);
  const supabase = await getServerSupabase();
  const firstName = ((me.fullName || me.email) ?? "")
    .split(/\s+/)[0]
    .replace(/[<>@.]/g, "");

  const [
    { count: pendingCount },
    { count: totalUsers },
    { count: coaches },
    { count: students },
    { count: coordinators },
    { count: directors },
    { count: cohortsActive },
    { count: cohortsPlanned },
    { count: programs },
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("status", "approved"),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "coach").eq("status", "approved"),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "student").eq("status", "approved"),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "coordinator").eq("status", "approved"),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "director").eq("status", "approved"),
    supabase.from("cohorts").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("cohorts").select("id", { count: "exact", head: true }).eq("status", "planned"),
    supabase.from("programs").select("id", { count: "exact", head: true }).eq("active", true),
  ]);

  const highlights = await computeHighlights(supabase, dict.portail.highlights);

  const stats = [
    { label: dict.portail.sidebar.links.approvals, value: pendingCount ?? 0, accent: (pendingCount ?? 0) > 0 },
    { label: dict.portail.sidebar.links.users, value: totalUsers ?? 0 },
    { label: dict.portail.common.roles.student + "s", value: students ?? 0 },
    { label: dict.portail.common.roles.coach + "s", value: coaches ?? 0 },
    { label: dict.portail.common.roles.coordinator + "s", value: coordinators ?? 0 },
    { label: dict.portail.common.roles.director + "s", value: directors ?? 0 },
    { label: `${dict.portail.sidebar.links.cohorts} (${dict.portail.common.shortActive})`, value: cohortsActive ?? 0 },
    { label: `${dict.portail.sidebar.links.cohorts} (${dict.portail.common.shortUpcoming})`, value: cohortsPlanned ?? 0 },
    { label: dict.portail.sidebar.links.programs, value: programs ?? 0 },
  ];

  const quickLinks = [
    {
      href: `/${locale}/portail/admin/approvals`,
      title: dict.portail.sidebar.links.approvals,
      icon: <ClipboardCheck size={18} />,
    },
    {
      href: `/${locale}/portail/admin/users`,
      title: dict.portail.sidebar.links.users,
      icon: <UserCog size={18} />,
    },
    {
      href: `/${locale}/portail/admin/programs`,
      title: dict.portail.sidebar.links.programs,
      icon: <GraduationCap size={18} />,
    },
    {
      href: `/${locale}/portail/admin/cohorts`,
      title: dict.portail.sidebar.links.cohorts,
      icon: <Layers size={18} />,
    },
    {
      href: `/${locale}/portail/admin/timeline`,
      title: dict.portail.sidebar.links.timeline,
      icon: <CalendarRange size={18} />,
    },
    {
      href: `/${locale}/portail/admin/assignments`,
      title: dict.portail.sidebar.links.assignments_admin,
      icon: <Link2 size={18} />,
    },
    {
      href: `/${locale}/portail/admin/exports`,
      title: dict.portail.sidebar.links.exports,
      icon: <FileDown size={18} />,
    },
    {
      href: `/${locale}/portail/admin/audit`,
      title: dict.portail.sidebar.links.audit,
      icon: <Activity size={18} />,
    },
  ];

  return (
    <>
      <PageHeader
        title={
          <>
            <span className="wave-emoji">👋</span> {dict.portail.greetings.wave} {firstName}
          </>
        }
        description={dict.portail.admin.welcome}
      />

      {/* Highlights */}
      <section className="mt-8">
        <HighlightsCard
          title={dict.portail.highlights.title}
          empty={dict.portail.highlights.empty}
          highlights={highlights}
        />
      </section>

      {/* Stats grid */}
      <section className="mt-10">
        <h2 className="mb-3 font-display text-lg text-foreground">{dict.portail.common.stats}</h2>
        <DashboardStats stats={stats} />
      </section>

      {/* Quick links */}
      <section className="mt-10">
        <h2 className="mb-3 font-display text-lg text-foreground">{dict.portail.common.quickLinks}</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {quickLinks.map((q) => (
            <Link
              key={q.href}
              href={q.href}
              className="group flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-brand/40 hover:bg-brand/[0.06]"
            >
              <span className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/15 text-brand">
                  {q.icon}
                </span>
                <span className="text-sm text-foreground">{q.title}</span>
              </span>
              <ArrowRight size={16} className="text-muted transition group-hover:text-brand" />
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
