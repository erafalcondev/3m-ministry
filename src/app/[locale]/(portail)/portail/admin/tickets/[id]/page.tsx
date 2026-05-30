import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getServerSupabase } from "@/lib/supabase/server";
import { requireRole, ADMIN_ONLY } from "@/lib/portail/access";
import { TicketThread } from "@/components/portail/TicketThread";

export default async function AdminTicketPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const me = await requireRole(locale, ADMIN_ONLY);
  const dict = getDictionary(locale as Locale);
  const supabase = await getServerSupabase();

  const { data: ticket } = await supabase
    .from("tickets")
    .select("id,student_id,subject,status,created_at,resolved_at,archived_at")
    .eq("id", id)
    .single();
  if (!ticket) notFound();

  const [{ data: messages }, { data: student }] = await Promise.all([
    supabase
      .from("ticket_messages")
      .select("id,author_id,body,created_at")
      .eq("ticket_id", id)
      .order("created_at"),
    supabase
      .from("profiles")
      .select("email,full_name")
      .eq("id", ticket.student_id as string)
      .single(),
  ]);

  const authorIds = Array.from(
    new Set((messages ?? []).map((m) => m.author_id as string | null).filter(Boolean) as string[]),
  );
  let authorMap = new Map<string, { name: string; role: string }>();
  if (authorIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id,email,full_name,role")
      .in("id", authorIds);
    authorMap = new Map(
      (profiles ?? []).map((p) => [
        p.id as string,
        {
          name: (p.full_name as string | null) || (p.email as string),
          role: p.role as string,
        },
      ]),
    );
  }

  const studentName = (student?.full_name as string | null) || (student?.email as string) || "—";

  return (
    <>
      <Link
        href={`/${locale}/portail/admin/tickets`}
        className="mb-5 inline-flex items-center gap-1.5 text-xs text-muted transition hover:text-foreground"
      >
        <ArrowLeft size={13} />
        {dict.portail.tickets.backToList}
      </Link>
      <p className="mb-3 text-xs text-muted">
        <Link
          href={`/${locale}/portail/admin/contacts/${ticket.student_id as string}`}
          className="hover:text-brand"
        >
          {studentName}
        </Link>
      </p>
      <TicketThread
        locale={locale as Locale}
        dict={dict.portail.tickets}
        ticket={{
          id: ticket.id as string,
          subject: ticket.subject as string,
          status: ticket.status as "open" | "in_progress" | "resolved" | "archived",
          studentId: ticket.student_id as string,
          createdAt: ticket.created_at as string,
        }}
        viewerId={me.id}
        viewerIsAdmin={true}
        messages={(messages ?? []).map((m) => ({
          id: m.id as string,
          authorId: m.author_id as string | null,
          authorName: m.author_id ? authorMap.get(m.author_id as string)?.name ?? "—" : "—",
          authorRole: m.author_id ? authorMap.get(m.author_id as string)?.role ?? "?" : "?",
          body: m.body as string,
          createdAt: m.created_at as string,
        }))}
      />
    </>
  );
}
