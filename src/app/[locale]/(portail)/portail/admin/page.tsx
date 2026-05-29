import Link from "next/link";
import { ClipboardCheck, UserCog, Link2, Activity, ArrowRight } from "lucide-react";
import { type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getServerSupabase } from "@/lib/supabase/server";
import { PageHeader } from "@/components/portail/PageHeader";

export default async function AdminDashboard({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const dict = getDictionary(locale as Locale);
  const supabase = await getServerSupabase();

  const [{ count: pendingCount }, { count: totalUsers }, { count: coaches }, { count: students }] =
    await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "coach").eq("status", "approved"),
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "student").eq("status", "approved"),
    ]);

  const stats = [
    { label: dict.portail.sidebar.links.approvals, value: pendingCount ?? 0, accent: (pendingCount ?? 0) > 0 },
    { label: dict.portail.sidebar.links.users, value: totalUsers ?? 0 },
    { label: dict.portail.common.roles.coach + "s", value: coaches ?? 0 },
    { label: dict.portail.common.roles.student + "s", value: students ?? 0 },
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
      href: `/${locale}/portail/admin/assignments`,
      title: dict.portail.sidebar.links.assignments_admin,
      icon: <Link2 size={18} />,
    },
    {
      href: `/${locale}/portail/admin/audit`,
      title: dict.portail.sidebar.links.audit,
      icon: <Activity size={18} />,
    },
  ];

  return (
    <>
      <PageHeader title={dict.portail.admin.welcome} />

      <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
          >
            <p className="text-xs uppercase tracking-[0.18em] text-muted">{s.label}</p>
            <p className={`mt-2 font-display text-3xl ${s.accent ? "text-brand" : "text-foreground"}`}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-10 grid grid-cols-1 gap-3 md:grid-cols-2">
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
    </>
  );
}
