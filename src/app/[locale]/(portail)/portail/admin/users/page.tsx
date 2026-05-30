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

  const [{ data }, { data: members }, { data: cohorts }, { data: programs }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id,email,full_name,role,status,created_at")
      .order("created_at", { ascending: false }),
    supabase.from("cohort_members").select("student_id,cohort_id"),
    supabase.from("cohorts").select("id,name,program_id"),
    supabase.from("programs").select("id,code,name_fr,name_en").order("sort_order"),
  ]);

  const cohortNameMap = new Map((cohorts ?? []).map((c) => [c.id as string, c.name as string]));
  const cohortProgramMap = new Map(
    (cohorts ?? []).map((c) => [c.id as string, c.program_id as string | null]),
  );

  const memberCohorts = new Map<string, string[]>();
  const memberPrograms = new Map<string, Set<string>>();
  for (const m of members ?? []) {
    const sid = m.student_id as string;
    const cid = m.cohort_id as string;
    const cohortName = cohortNameMap.get(cid);
    const programId = cohortProgramMap.get(cid);
    if (cohortName) {
      const arr = memberCohorts.get(sid) ?? [];
      arr.push(cohortName);
      memberCohorts.set(sid, arr);
    }
    if (programId) {
      const set = memberPrograms.get(sid) ?? new Set<string>();
      set.add(programId);
      memberPrograms.set(sid, set);
    }
  }

  const programOptions = (programs ?? []).map((p) => ({
    id: p.id as string,
    label: `${p.code as string} · ${(locale === "fr" ? p.name_fr : p.name_en) as string}`,
  }));

  return (
    <>
      <PageHeader title={dict.portail.admin.usersTitle} />
      <div className="mt-6">
        <UsersTable
          locale={locale as Locale}
          dict={dict.portail.admin}
          roleLabels={dict.portail.common.roles}
          canEditRoles={me.role === "admin"}
          canImpersonate={me.role === "admin"}
          programs={programOptions}
          rows={(data ?? []).map((r) => ({
            id: r.id as string,
            email: r.email as string,
            fullName: r.full_name as string | null,
            role: r.role as "student" | "coach" | "coordinator" | "director" | "admin",
            status: r.status as "pending" | "approved" | "refused",
            createdAt: r.created_at as string,
            cohorts: memberCohorts.get(r.id as string) ?? [],
            programIds: Array.from(memberPrograms.get(r.id as string) ?? []),
          }))}
        />
      </div>
    </>
  );
}
