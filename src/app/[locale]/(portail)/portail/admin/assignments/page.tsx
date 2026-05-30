import { type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getServerSupabase } from "@/lib/supabase/server";
import { requireRole, ADMIN_ONLY } from "@/lib/portail/access";
import { PageHeader } from "@/components/portail/PageHeader";
import { AssignmentsClient, type SimpleProfile } from "./AssignmentsClient";

export default async function AssignmentsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireRole(locale, ADMIN_ONLY);
  const dict = getDictionary(locale as Locale);
  const supabase = await getServerSupabase();

  const [coachesRes, studentsRes, linksRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("id,email,full_name")
      .eq("role", "coach")
      .eq("status", "approved")
      .order("full_name"),
    supabase
      .from("profiles")
      .select("id,email,full_name")
      .eq("role", "student")
      .eq("status", "approved")
      .order("full_name"),
    supabase
      .from("coach_student_links")
      .select("coach_id,student_id,relationship_type,assigned_at"),
  ]);

  const coaches: SimpleProfile[] = (coachesRes.data ?? []).map((c) => ({
    id: c.id as string,
    label: (c.full_name as string | null) || (c.email as string),
  }));
  const students: SimpleProfile[] = (studentsRes.data ?? []).map((s) => ({
    id: s.id as string,
    label: (s.full_name as string | null) || (s.email as string),
  }));
  const links = (linksRes.data ?? []).map((l) => ({
    coachId: l.coach_id as string,
    studentId: l.student_id as string,
    relationshipType: l.relationship_type as "academic" | "ministry_mentor" | "team_leader",
    assignedAt: l.assigned_at as string,
  }));

  return (
    <>
      <PageHeader
        title={dict.portail.admin.assignTitle}
        description={dict.portail.admin.assignIntro}
      />
      <div className="mt-6">
        <AssignmentsClient
          locale={locale as Locale}
          dict={dict.portail.admin}
          relationshipLabels={dict.portail.common.relationship}
          coaches={coaches}
          students={students}
          links={links}
        />
      </div>
    </>
  );
}
