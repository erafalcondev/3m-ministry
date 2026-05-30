import Link from "next/link";
import { ArrowRight, Heart, Layers, CalendarRange, FileDown } from "lucide-react";
import { type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getServerSupabase } from "@/lib/supabase/server";
import { requireRole } from "@/lib/portail/access";
import { PageHeader } from "@/components/portail/PageHeader";
import { DashboardStats } from "@/components/portail/DashboardStats";
import { HighlightsCard } from "@/components/portail/HighlightsCard";
import { computeHighlights } from "@/lib/portail/highlights";

export default async function DirectorDashboard({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireRole(locale, ["director", "admin"]);
  const dict = getDictionary(locale as Locale);
  const supabase = await getServerSupabase();
  const highlights = await computeHighlights(supabase, dict.portail.highlights);

  const [
    { count: totalApproved },
    { count: students },
    { count: coaches },
    { count: cohortsActive },
    { count: cohortsPlanned },
    { count: programs },
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("status", "approved"),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "student").eq("status", "approved"),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "coach").eq("status", "approved"),
    supabase.from("cohorts").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("cohorts").select("id", { count: "exact", head: true }).eq("status", "planned"),
    supabase.from("programs").select("id", { count: "exact", head: true }).eq("active", true),
  ]);

  return (
    <>
      <PageHeader
        title={dict.portail.director.welcome}
        action={
          <span className="inline-flex items-center gap-1.5 rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-brand">
            <Heart size={11} />
            {dict.portail.director.readOnlyBadge}
          </span>
        }
      />

      <section className="mt-8">
        <HighlightsCard title={dict.portail.highlights.title} empty={dict.portail.highlights.empty} highlights={highlights} />
      </section>

      <section className="mt-10">
        <DashboardStats
          stats={[
            { label: dict.portail.common.roles.student + "s", value: students ?? 0 },
            { label: dict.portail.common.roles.coach + "s", value: coaches ?? 0 },
            { label: `${dict.portail.sidebar.links.cohorts} (${dict.portail.common.shortActive})`, value: cohortsActive ?? 0 },
            { label: `${dict.portail.sidebar.links.cohorts} (${dict.portail.common.shortUpcoming})`, value: cohortsPlanned ?? 0 },
            { label: dict.portail.sidebar.links.programs, value: programs ?? 0 },
            { label: dict.portail.sidebar.links.users, value: totalApproved ?? 0 },
          ]}
        />
      </section>

      <section className="mt-10 grid grid-cols-1 gap-3 md:grid-cols-3">
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
