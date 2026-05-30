import { Download } from "lucide-react";
import { type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { requireRole, STAFF } from "@/lib/portail/access";
import { PageHeader } from "@/components/portail/PageHeader";

export default async function ExportsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireRole(locale, STAFF);
  const dict = getDictionary(locale as Locale);

  const items = [
    { id: "users", ...dict.portail.exports.users },
    { id: "cohorts", ...dict.portail.exports.cohorts },
    { id: "cohort_members", ...dict.portail.exports.cohortMembers },
    { id: "assignments", ...dict.portail.exports.assignments },
  ];

  return (
    <>
      <PageHeader title={dict.portail.exports.title} description={dict.portail.exports.intro} />

      <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
        {items.map((item) => (
          <a
            key={item.id}
            href={`/api/exports/${item.id}?locale=${locale}`}
            className="group flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-brand/40 hover:bg-brand/[0.06]"
          >
            <div>
              <h2 className="font-display text-base text-foreground">{item.title}</h2>
              <p className="mt-1 text-sm text-muted text-pretty">{item.description}</p>
            </div>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/15 text-brand transition group-hover:bg-brand group-hover:text-[#031019]">
              <Download size={16} />
            </span>
          </a>
        ))}
      </div>
    </>
  );
}
