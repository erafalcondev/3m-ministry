import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getServerSupabase } from "@/lib/supabase/server";
import { PageHeader } from "@/components/portail/PageHeader";
import { StudentTicketsList, type StudentTicketRow } from "./StudentTicketsList";

export default async function StudentTicketsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const dict = getDictionary(locale as Locale);
  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login`);

  const { data: tickets } = await supabase
    .from("tickets")
    .select("id,subject,status,created_at,category")
    .eq("student_id", user.id)
    .order("created_at", { ascending: false });

  const rows: StudentTicketRow[] = (tickets ?? []).map((t) => ({
    id: t.id as string,
    subject: t.subject as string,
    status: t.status as StudentTicketRow["status"],
    createdAt: t.created_at as string,
    category: t.category as string,
  }));

  return (
    <>
      <PageHeader
        title={dict.portail.tickets.title}
        description={dict.portail.tickets.studentIntro}
        action={
          <Link
            href={`/${locale}/portail/etudiant/questions/new`}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-brand px-4 text-sm font-medium text-[#031019] transition hover:shadow-[0_12px_30px_-10px_rgba(79,195,220,0.6)]"
          >
            <Plus size={15} />
            {dict.portail.tickets.newCta}
          </Link>
        }
      />
      <div className="mt-6">
        <StudentTicketsList locale={locale as Locale} dict={dict.portail.tickets} rows={rows} />
      </div>
    </>
  );
}
