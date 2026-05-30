import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getServerSupabase } from "@/lib/supabase/server";
import { TicketThread } from "@/components/portail/TicketThread";

export default async function StudentTicketPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const dict = getDictionary(locale as Locale);
  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login`);

  const { data: ticket } = await supabase
    .from("tickets")
    .select("id,student_id,subject,status,created_at,resolved_at,archived_at")
    .eq("id", id)
    .single();
  if (!ticket) notFound();
  if (ticket.student_id !== user.id) notFound();

  const { data: messages } = await supabase
    .from("ticket_messages")
    .select("id,author_id,body,created_at")
    .eq("ticket_id", id)
    .order("created_at");

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

  return (
    <>
      <Link
        href={`/${locale}/portail/etudiant/questions`}
        className="mb-5 inline-flex items-center gap-1.5 text-xs text-muted transition hover:text-foreground"
      >
        <ArrowLeft size={13} />
        {dict.portail.tickets.backToList}
      </Link>
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
        viewerId={user.id}
        viewerIsAdmin={false}
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
