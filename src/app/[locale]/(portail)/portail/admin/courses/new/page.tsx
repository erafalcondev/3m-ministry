import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getServerSupabase } from "@/lib/supabase/server";
import { requireRole, ADMIN_ONLY } from "@/lib/portail/access";
import { CourseForm } from "./CourseForm";

export default async function NewCoursePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireRole(locale, ADMIN_ONLY);
  const dict = getDictionary(locale as Locale);
  const supabase = await getServerSupabase();

  const [{ data: programs }, { data: instructors }] = await Promise.all([
    supabase.from("programs").select("id,code,name_fr,name_en").eq("active", true).order("sort_order"),
    supabase
      .from("profiles")
      .select("id,email,full_name,role")
      .in("role", ["coach", "coordinator", "director", "admin"])
      .eq("status", "approved")
      .order("full_name"),
  ]);

  return (
    <>
      <Link
        href={`/${locale}/portail/admin/courses`}
        className="mb-5 inline-flex items-center gap-1.5 text-xs text-muted transition hover:text-foreground"
      >
        <ArrowLeft size={13} />
        {dict.portail.courses.backToCourses}
      </Link>
      <h1 className="font-display text-2xl text-foreground">{dict.portail.courses.newTitle}</h1>
      <div className="mt-8">
        <CourseForm
          locale={locale as Locale}
          dict={dict.portail.courses}
          programs={(programs ?? []).map((p) => ({
            id: p.id as string,
            label: `${p.code as string} · ${(locale === "fr" ? p.name_fr : p.name_en) as string}`,
          }))}
          instructors={(instructors ?? []).map((i) => ({
            id: i.id as string,
            label: `${(i.full_name as string | null) || (i.email as string)} · ${i.role}`,
          }))}
        />
      </div>
    </>
  );
}
