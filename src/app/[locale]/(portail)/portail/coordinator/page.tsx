import Link from "next/link";
import { ArrowRight, Layers, CalendarRange, Users, FileDown, Plus } from "lucide-react";
import { type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getServerSupabase } from "@/lib/supabase/server";
import { requireRole } from "@/lib/portail/access";
import { PageHeader } from "@/components/portail/PageHeader";
import { DashboardStats } from "@/components/portail/DashboardStats";
import { HighlightsCard } from "@/components/portail/HighlightsCard";
import { computeHighlights } from "@/lib/portail/highlights";

export default async function CoordinatorDashboard({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireRole(locale, ["coordinator", "admin"]);
  const dict = getDictionary(locale as Locale);
  const supabase = await getServerSupabase();
  const highlights = await computeHighlights(supabase, dict.portail.highlights);

  const [
    { count: students },
    { count: coaches },
    { count: cohortsActive },
    { count: cohortsPlanned },
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "student").eq("status", "approved"),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "coach").eq("status", "approved"),
    supabase.from("cohorts").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("cohorts").select("id", { count: "exact", head: true }).eq("status", "planned"),
  ]);

  return (
    <>
      <PageHeader
        title={dict.portail.coordinator.welcome}
        description={dict.portail.coordinator.intro}
        action={
          <Link
            href={`/${locale}/portail/admin/cohorts/new`}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-brand px-4 text-sm font-medium text-[#031019] transition hover:shadow-[0_12px_30px_-10px_rgba(79,195,220,0.6)]"
          >
            <Plus size={15} />
            {dict.portail.cohorts.newCta}
          </Link>
        }
      />

      <section className="mt-8">
        <HighlightsCard
          title={dict.portail.highlights.title}
          empty={dict.portail.highlights.empty}
          highlights={highlights}
        />
      </section>

      <section className="mt-10">
        <DashboardStats
          stats={[
            { label: dict.portail.common.roles.student + "s", value: students ?? 0 },
            { label: dict.portail.common.roles.coach + "s", value: coaches ?? 0 },
            { label: `${dict.portail.sidebar.links.cohorts} (act.)`, value: cohortsActive ?? 0 },
            { label: `${dict.portail.sidebar.links.cohorts} (à venir)`, value: cohortsPlanned ?? 0 },
          ]}
        />
      </section>

      <section className="mt-10 grid grid-cols-1 gap-3 md:grid-cols-2">
        <QuickLink
          href={`/${locale}/portail/admin/cohorts`}
          label={dict.portail.sidebar.links.cohorts}
          icon={<Layers size={18} />}
        />
        <QuickLink
          href={`/${locale}/portail/admin/timeline`}
          label={dict.portail.sidebar.links.timeline}
          icon={<CalendarRange size={18} />}
        />
        <QuickLink
          href={`/${locale}/portail/admin/users`}
          label={dict.portail.sidebar.links.users}
          icon={<Users size={18} />}
        />
        <QuickLink
          href={`/${locale}/portail/admin/exports`}
          label={dict.portail.sidebar.links.exports}
          icon={<FileDown size={18} />}
        />
      </section>
    </>
  );
}

function QuickLink({ href, label, icon }: { href: string; label: string; icon: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-brand/40 hover:bg-brand/[0.06]"
    >
      <span className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/15 text-brand">
          {icon}
        </span>
        <span className="text-sm text-foreground">{label}</span>
      </span>
      <ArrowRight size={16} className="text-muted transition group-hover:text-brand" />
    </Link>
  );
}
