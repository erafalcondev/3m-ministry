import { type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getServerSupabase } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/portail/PageHeader";
import { Users, ClipboardList } from "lucide-react";

export default async function CoachDashboard({
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
  if (profile?.role === "admin") redirect(`/${locale}/portail/admin`);
  if (profile?.role === "student") redirect(`/${locale}/portail/etudiant`);

  const { data: links } = await supabase
    .from("coach_student_links")
    .select("student_id")
    .eq("coach_id", user.id);

  const studentIds = (links ?? []).map((l) => l.student_id as string);
  let students: { id: string; label: string; email: string }[] = [];
  if (studentIds.length > 0) {
    const { data } = await supabase
      .from("profiles")
      .select("id,email,full_name")
      .in("id", studentIds);
    students = (data ?? []).map((s) => ({
      id: s.id as string,
      label: (s.full_name as string | null) || (s.email as string),
      email: s.email as string,
    }));
  }

  return (
    <>
      <PageHeader title={dict.portail.coach.welcome} />

      <section className="mt-8">
        <h2 className="flex items-center gap-2 font-display text-lg text-foreground">
          <Users size={18} className="text-brand" />
          {dict.portail.coach.myStudents.title}
        </h2>
        {students.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-12 text-center text-sm text-muted">
            {dict.portail.coach.myStudents.empty}
          </div>
        ) : (
          <ul className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-2">
            {students.map((s) => (
              <li
                key={s.id}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
              >
                <p className="text-sm text-foreground">{s.label}</p>
                <p className="text-xs text-muted">{s.email}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h2 className="flex items-center gap-2 font-display text-lg text-foreground">
          <ClipboardList size={18} className="text-brand" />
          {dict.portail.sidebar.links.log}
        </h2>
        <p className="mt-2 text-sm text-muted text-pretty">{dict.portail.coach.logIntro}</p>
        <span className="mt-4 inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-muted">
          {dict.portail.common.comingSoon}
        </span>
      </section>
    </>
  );
}
