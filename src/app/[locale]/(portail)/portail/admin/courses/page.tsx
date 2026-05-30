import Link from "next/link";
import { Plus, BookOpen } from "lucide-react";
import { type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getServerSupabase } from "@/lib/supabase/server";
import { requireRole, STAFF } from "@/lib/portail/access";
import { PageHeader } from "@/components/portail/PageHeader";

const STATUS_COLORS: Record<string, string> = {
  draft: "border-white/10 bg-white/5 text-muted",
  published: "border-brand/30 bg-brand/10 text-brand",
  archived: "border-amber-300/30 bg-amber-300/10 text-amber-200",
};

export default async function CoursesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const me = await requireRole(locale, STAFF);
  const dict = getDictionary(locale as Locale);
  const supabase = await getServerSupabase();

  const [{ data: courses }, { data: programs }, { data: cohorts }, { data: students }] = await Promise.all([
    supabase.from("courses").select("id,title,description,status,program_id,created_at").order("created_at", { ascending: false }),
    supabase.from("programs").select("id,code,name_fr,name_en,color"),
    supabase.from("course_cohorts").select("course_id"),
    supabase.from("course_students").select("course_id"),
  ]);

  const programMap = new Map(
    (programs ?? []).map((p) => [
      p.id as string,
      { code: p.code as string, name: locale === "fr" ? p.name_fr : p.name_en, color: p.color as string },
    ]),
  );

  const accessCount: Record<string, number> = {};
  for (const c of cohorts ?? []) {
    const cid = c.course_id as string;
    accessCount[cid] = (accessCount[cid] ?? 0) + 1;
  }
  for (const c of students ?? []) {
    const cid = c.course_id as string;
    accessCount[cid] = (accessCount[cid] ?? 0) + 1;
  }

  const canCreate = me.role === "admin";

  return (
    <>
      <PageHeader
        title={dict.portail.courses.title}
        description={dict.portail.courses.intro}
        action={
          canCreate ? (
            <Link
              href={`/${locale}/portail/admin/courses/new`}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-brand px-4 text-sm font-medium text-[#031019] transition hover:shadow-[0_12px_30px_-10px_rgba(79,195,220,0.6)]"
            >
              <Plus size={15} />
              {dict.portail.courses.newCta}
            </Link>
          ) : undefined
        }
      />

      <div className="mt-6">
        {(courses ?? []).length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-16 text-center">
            <BookOpen size={36} className="text-muted/60" />
            <p className="mt-4 text-sm text-muted">{dict.portail.courses.empty}</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {(courses ?? []).map((c) => {
              const prog = c.program_id ? programMap.get(c.program_id as string) : null;
              const acc = accessCount[c.id as string] ?? 0;
              return (
                <li key={c.id as string}>
                  <Link
                    href={`/${locale}/portail/admin/courses/${c.id}`}
                    className="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm transition hover:border-brand/40 hover:bg-brand/[0.06]"
                  >
                    {prog && (
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ background: prog.color }}
                        aria-hidden
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-foreground">{c.title as string}</p>
                      {c.description && <p className="text-xs text-muted line-clamp-1">{c.description as string}</p>}
                    </div>
                    {prog && (
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] uppercase tracking-[0.18em]"
                        style={{ background: `${prog.color}25`, color: prog.color }}
                      >
                        {prog.code}
                      </span>
                    )}
                    <span className="text-xs text-muted">{acc} {dict.portail.courses.colStudents.toLowerCase()}</span>
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] uppercase tracking-[0.18em] ${STATUS_COLORS[c.status as string]}`}
                    >
                      {dict.portail.courses[`status${(c.status as string).charAt(0).toUpperCase() + (c.status as string).slice(1)}` as keyof typeof dict.portail.courses] as string}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
