import { type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getServerSupabase } from "@/lib/supabase/server";
import { requireRole, STAFF } from "@/lib/portail/access";
import { PageHeader } from "@/components/portail/PageHeader";
import { ResourcesClient, type ResourceRow } from "./ResourcesClient";

export default async function ResourcesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const me = await requireRole(locale, STAFF);
  const dict = getDictionary(locale as Locale);
  const supabase = await getServerSupabase();

  const [{ data: resources }, { data: programs }] = await Promise.all([
    supabase
      .from("resources")
      .select("id,title,description,kind,url,storage_path,file_type,size_bytes,program_id,tags,visibility,language,created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("programs")
      .select("id,code,name_fr,name_en,color")
      .order("sort_order"),
  ]);

  const programOptions = (programs ?? []).map((p) => ({
    id: p.id as string,
    code: p.code as string,
    label: (locale === "fr" ? p.name_fr : p.name_en) as string,
    color: p.color as string,
  }));

  const rows: ResourceRow[] = (resources ?? []).map((r) => ({
    id: r.id as string,
    title: r.title as string,
    description: r.description as string | null,
    kind: r.kind as ResourceRow["kind"],
    url: r.url as string | null,
    storagePath: r.storage_path as string | null,
    fileType: r.file_type as string | null,
    sizeBytes: r.size_bytes as number | null,
    programId: r.program_id as string | null,
    tags: (r.tags as string[] | null) ?? [],
    visibility: r.visibility as ResourceRow["visibility"],
    language: r.language as string,
    createdAt: r.created_at as string,
  }));

  return (
    <>
      <PageHeader title={dict.portail.dam.title} description={dict.portail.dam.intro} />
      <div className="mt-6">
        <ResourcesClient
          locale={locale as Locale}
          dict={dict.portail.dam}
          rows={rows}
          programs={programOptions}
          canWrite={me.role === "admin"}
        />
      </div>
    </>
  );
}
