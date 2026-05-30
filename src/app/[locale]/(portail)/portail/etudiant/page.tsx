import { redirect } from "next/navigation";
import { type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getServerSupabase } from "@/lib/supabase/server";
import { portailLanding, type UserRole } from "@/lib/supabase/types";
import { PageHeader } from "@/components/portail/PageHeader";
import { BookOpen, ClipboardList, FolderOpen } from "lucide-react";

export default async function StudentDashboard({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const dict = getDictionary(locale as Locale);
  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login`);

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role && profile.role !== "student") {
    redirect(portailLanding(locale, profile.role as UserRole));
  }

  const cards = [
    {
      icon: <BookOpen size={20} className="text-brand" />,
      title: dict.portail.student.courses.title,
      body: dict.portail.student.courses.body,
    },
    {
      icon: <ClipboardList size={20} className="text-brand" />,
      title: dict.portail.student.assignments.title,
      body: dict.portail.student.assignments.body,
    },
    {
      icon: <FolderOpen size={20} className="text-brand" />,
      title: dict.portail.student.resources.title,
      body: dict.portail.student.resources.body,
    },
  ];

  return (
    <>
      <PageHeader title={dict.portail.student.welcome} />
      <div className="mt-8 grid grid-cols-1 gap-3 md:grid-cols-3">
        {cards.map((c) => (
          <div
            key={c.title}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-6"
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-brand/15">
              {c.icon}
            </div>
            <h2 className="font-display text-base text-foreground">{c.title}</h2>
            <p className="mt-1.5 text-sm text-muted text-pretty">{c.body}</p>
            <span className="mt-4 inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[10px] uppercase tracking-[0.18em] text-muted">
              {dict.portail.common.comingSoon}
            </span>
          </div>
        ))}
      </div>
    </>
  );
}
