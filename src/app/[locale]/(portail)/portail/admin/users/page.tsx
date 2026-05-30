import { type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getServerSupabase } from "@/lib/supabase/server";
import { requireRole, STAFF } from "@/lib/portail/access";
import { PageHeader } from "@/components/portail/PageHeader";
import { UsersTable } from "./UsersTable";

export default async function UsersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const me = await requireRole(locale, STAFF);
  const dict = getDictionary(locale as Locale);
  const supabase = await getServerSupabase();

  const [{ data }, { data: members }, { data: cohorts }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id,email,full_name,role,status,created_at")
      .order("created_at", { ascending: false }),
    supabase.from("cohort_members").select("student_id,cohort_id"),
    supabase.from("cohorts").select("id,name"),
  ]);

  const cohortName = new Map((cohorts ?? []).map((c) => [c.id as string, c.name as string]));
  const memberCohorts = new Map<string, string[]>();
  for (const m of members ?? []) {
    const sid = m.student_id as string;
    const cid = m.cohort_id as string;
    const arr = memberCohorts.get(sid) ?? [];
    const n = cohortName.get(cid);
    if (n) arr.push(n);
    memberCohorts.set(sid, arr);
  }

  return (
    <>
      <PageHeader title={dict.portail.admin.usersTitle} />
      <div className="mt-6">
        <UsersTable
          locale={locale as Locale}
          dict={dict.portail.admin}
          roleLabels={dict.portail.common.roles}
          canEditRoles={me.role === "admin"}
          rows={(data ?? []).map((r) => ({
            id: r.id as string,
            email: r.email as string,
            fullName: r.full_name as string | null,
            role: r.role as "student" | "coach" | "coordinator" | "director" | "admin",
            status: r.status as "pending" | "approved" | "refused",
            createdAt: r.created_at as string,
            cohorts: memberCohorts.get(r.id as string) ?? [],
          }))}
        />
      </div>
    </>
  );
}
