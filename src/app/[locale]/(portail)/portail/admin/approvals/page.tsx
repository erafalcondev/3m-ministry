import { type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getServerSupabase } from "@/lib/supabase/server";
import { PageHeader } from "@/components/portail/PageHeader";
import { ApprovalsClient } from "./ApprovalsClient";

export default async function ApprovalsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const dict = getDictionary(locale as Locale);
  const supabase = await getServerSupabase();

  const { data } = await supabase
    .from("profiles")
    .select("id,email,full_name,motivation,created_at")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  return (
    <>
      <PageHeader title={dict.portail.admin.pendingTitle} />
      <div className="mt-6">
        <ApprovalsClient
          locale={locale as Locale}
          dict={dict.portail.admin}
          rows={(data ?? []).map((r) => ({
            id: r.id as string,
            email: r.email as string,
            fullName: r.full_name as string | null,
            motivation: r.motivation as string | null,
            createdAt: r.created_at as string,
          }))}
        />
      </div>
    </>
  );
}
