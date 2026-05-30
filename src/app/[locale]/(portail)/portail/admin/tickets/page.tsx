import { type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getServerSupabase } from "@/lib/supabase/server";
import { requireRole, ADMIN_ONLY } from "@/lib/portail/access";
import { PageHeader } from "@/components/portail/PageHeader";
import { TicketsInbox, type TicketRow } from "./TicketsInbox";

export default async function AdminTicketsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireRole(locale, ADMIN_ONLY);
  const dict = getDictionary(locale as Locale);
  const supabase = await getServerSupabase();

  const { data: tickets } = await supabase
    .from("tickets")
    .select("id,subject,status,created_at,student_id")
    .order("created_at", { ascending: false });

  const studentIds = Array.from(
    new Set((tickets ?? []).map((t) => t.student_id as string)),
  );
  let studentMap = new Map<string, string>();
  if (studentIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id,email,full_name")
      .in("id", studentIds);
    studentMap = new Map(
      (profiles ?? []).map((p) => [
        p.id as string,
        (p.full_name as string | null) || (p.email as string),
      ]),
    );
  }

  const rows: TicketRow[] = (tickets ?? []).map((t) => ({
    id: t.id as string,
    subject: t.subject as string,
    status: t.status as TicketRow["status"],
    createdAt: t.created_at as string,
    studentId: t.student_id as string,
    studentName: studentMap.get(t.student_id as string) ?? "—",
  }));

  return (
    <>
      <PageHeader title={dict.portail.tickets.title} description={dict.portail.tickets.adminIntro} />
      <div className="mt-6">
        <TicketsInbox locale={locale as Locale} dict={dict.portail.tickets} rows={rows} />
      </div>
    </>
  );
}
