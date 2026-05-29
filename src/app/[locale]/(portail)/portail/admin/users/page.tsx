import { type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getServerSupabase } from "@/lib/supabase/server";
import { PageHeader } from "@/components/portail/PageHeader";
import { UsersTable } from "./UsersTable";

export default async function UsersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const dict = getDictionary(locale as Locale);
  const supabase = await getServerSupabase();

  const { data } = await supabase
    .from("profiles")
    .select("id,email,full_name,role,status,created_at")
    .order("created_at", { ascending: false });

  return (
    <>
      <PageHeader title={dict.portail.admin.usersTitle} />
      <div className="mt-6">
        <UsersTable
          locale={locale as Locale}
          dict={dict.portail.admin}
          roleLabels={dict.portail.common.roles}
          rows={(data ?? []).map((r) => ({
            id: r.id as string,
            email: r.email as string,
            fullName: r.full_name as string | null,
            role: r.role as "student" | "coach" | "admin",
            status: r.status as "pending" | "approved" | "refused",
            createdAt: r.created_at as string,
          }))}
        />
      </div>
    </>
  );
}
