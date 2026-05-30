import { type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getServerSupabase } from "@/lib/supabase/server";
import { requireRole, ADMIN_ONLY } from "@/lib/portail/access";
import { PageHeader } from "@/components/portail/PageHeader";
import { ProgramsTable } from "./ProgramsTable";

export default async function ProgramsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireRole(locale, ADMIN_ONLY);
  const dict = getDictionary(locale as Locale);
  const supabase = await getServerSupabase();

  const { data } = await supabase
    .from("programs")
    .select("id,code,name_fr,name_en,description_fr,description_en,duration_months,color,active,sort_order")
    .order("sort_order");

  return (
    <>
      <PageHeader title={dict.portail.programs.title} description={dict.portail.programs.intro} />
      <div className="mt-6">
        <ProgramsTable
          locale={locale as Locale}
          dict={dict.portail.programs}
          rows={(data ?? []).map((p) => ({
            id: p.id as string,
            code: p.code as string,
            name: (locale === "fr" ? p.name_fr : p.name_en) as string,
            description: (locale === "fr" ? p.description_fr : p.description_en) as string | null,
            durationMonths: p.duration_months as number | null,
            color: p.color as string,
            active: p.active as boolean,
          }))}
        />
      </div>
    </>
  );
}
