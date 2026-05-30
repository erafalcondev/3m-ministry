import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getServerSupabase } from "@/lib/supabase/server";
import { requireRole, ADMIN_OR_COORD } from "@/lib/portail/access";
import { CohortForm } from "./CohortForm";

export default async function NewCohortPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireRole(locale, ADMIN_OR_COORD);
  const dict = getDictionary(locale as Locale);
  const supabase = await getServerSupabase();

  const { data: programs } = await supabase
    .from("programs")
    .select("id,code,name_fr,name_en,color,duration_months")
    .eq("active", true)
    .order("sort_order");

  return (
    <>
      <Link
        href={`/${locale}/portail/admin/cohorts`}
        className="mb-5 inline-flex items-center gap-1.5 text-xs text-muted transition hover:text-foreground"
      >
        <ArrowLeft size={13} />
        {dict.portail.cohorts.backToCohorts}
      </Link>
      <h1 className="font-display text-2xl text-foreground">{dict.portail.cohorts.newTitle}</h1>
      <div className="mt-8">
        <CohortForm
          locale={locale as Locale}
          dict={dict.portail.cohorts}
          statusLabels={dict.portail.common.cohortStatus}
          programs={(programs ?? []).map((p) => ({
            id: p.id as string,
            label: `${p.code as string} · ${(locale === "fr" ? p.name_fr : p.name_en) as string}`,
            durationMonths: p.duration_months as number | null,
            color: p.color as string,
          }))}
        />
      </div>
    </>
  );
}
