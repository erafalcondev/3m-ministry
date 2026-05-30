import { type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getServerSupabase } from "@/lib/supabase/server";
import { requireRole, ADMIN_ONLY } from "@/lib/portail/access";
import { PageHeader } from "@/components/portail/PageHeader";
import { ProgramsClient, type ProgramRow } from "./ProgramsClient";

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

  const rows: ProgramRow[] = (data ?? []).map((p) => ({
    id: p.id as string,
    code: p.code as string,
    nameFr: p.name_fr as string,
    nameEn: p.name_en as string,
    descriptionFr: p.description_fr as string | null,
    descriptionEn: p.description_en as string | null,
    durationMonths: p.duration_months as number | null,
    color: p.color as string,
    active: p.active as boolean,
    sortOrder: p.sort_order as number,
  }));

  return (
    <>
      <PageHeader title={dict.portail.programs.title} description={dict.portail.programs.intro} />
      <div className="mt-6">
        <ProgramsClient locale={locale as Locale} dict={dict.portail.programs} rows={rows} />
      </div>
    </>
  );
}
