import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Clock, ExternalLink, FileText } from "lucide-react";
import { type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getServerSupabase } from "@/lib/supabase/server";
import { AssignmentThread, type ThreadAuthor, type ThreadMessage } from "@/components/portail/AssignmentThread";

function fmtDate(iso: string, locale: Locale) {
  return new Date(iso).toLocaleDateString(locale === "fr" ? "fr-CA" : "en-CA", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default async function AssignmentPage({
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

  // RLS filters this for us — if the user has no access, the row is gone.
  const { data: asg } = await supabase
    .from("assignments")
    .select("id,title,instructions,external_url,due_date,course_id,resource_id")
    .eq("id", id)
    .single();
  if (!asg) notFound();

  const { data: course } = await supabase
    .from("courses")
    .select("id,title")
    .eq("id", asg.course_id as string)
    .single();

  let attachment: { title: string; url: string | null } | null = null;
  if (asg.resource_id) {
    const { data: res } = await supabase
      .from("resources")
      .select("title,storage_path,external_url")
      .eq("id", asg.resource_id as string)
      .single();
    if (res) {
      let url: string | null = (res.external_url as string | null) || null;
      if (!url && res.storage_path) {
        const { data: pub } = supabase.storage
          .from("resources")
          .getPublicUrl(res.storage_path as string);
        url = pub?.publicUrl ?? null;
      }
      attachment = { title: res.title as string, url };
    }
  }

  const { data: comments } = await supabase
    .from("assignment_comments")
    .select("id,author_id,body,attachment_url,attachment_name,created_at")
    .eq("assignment_id", id)
    .order("created_at", { ascending: true });

  const authorIds = Array.from(
    new Set((comments ?? []).map((c) => c.author_id as string)),
  );
  authorIds.push(user.id);
  const authorMap: Record<string, ThreadAuthor> = {};
  if (authorIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id,email,full_name,avatar_url,role")
      .in("id", authorIds);
    for (const p of profiles ?? []) {
      const pid = p.id as string;
      authorMap[pid] = {
        id: pid,
        name: (p.full_name as string | null) || (p.email as string),
        avatarUrl: (p.avatar_url as string | null) ?? null,
        role: p.role as string,
      };
    }
  }

  const messages: ThreadMessage[] = (comments ?? []).map((c) => ({
    id: c.id as string,
    authorId: c.author_id as string,
    body: c.body as string | null,
    attachmentUrl: c.attachment_url as string | null,
    attachmentName: c.attachment_name as string | null,
    createdAt: c.created_at as string,
  }));

  const backHref = course
    ? `/${locale}/portail/admin/courses/${course.id as string}`
    : `/${locale}/portail/etudiant/devoirs`;

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href={backHref}
        className="mb-5 inline-flex items-center gap-1.5 text-xs text-muted transition hover:text-foreground"
      >
        <ArrowLeft size={13} />
        {course ? `${dict.portail.assignment.backToCourse} · ${course.title as string}` : dict.portail.assignment.backToCourse}
      </Link>

      <header className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
        <p className="text-[11px] uppercase tracking-[0.18em] text-muted">
          {dict.portail.assignment.detailsTitle}
        </p>
        <h1 className="mt-1 font-display text-2xl text-foreground md:text-[28px]">
          {asg.title as string}
        </h1>
        {course && (
          <p className="mt-1 text-sm text-muted">{course.title as string}</p>
        )}
        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1">
            <Clock size={11} />
            {asg.due_date
              ? `${dict.portail.assignment.due} · ${fmtDate(asg.due_date as string, locale as Locale)}`
              : dict.portail.assignment.noDue}
          </span>
          {asg.external_url && (
            <a
              href={asg.external_url as string}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full bg-brand/15 px-3 py-1 text-brand transition hover:bg-brand/25"
            >
              <ExternalLink size={11} />
              {dict.portail.assignment.openLink}
            </a>
          )}
        </div>
        {asg.instructions && (
          <p className="mt-4 whitespace-pre-wrap text-sm text-foreground/90 text-pretty">
            {asg.instructions as string}
          </p>
        )}
      </header>

      <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <h2 className="font-display text-base text-foreground">
          {dict.portail.assignment.attachmentsTitle}
        </h2>
        {attachment ? (
          <a
            href={attachment.url ?? "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-foreground transition hover:border-brand/40 hover:bg-brand/10"
          >
            <FileText size={14} className="text-brand" />
            {attachment.title}
          </a>
        ) : (
          <p className="mt-2 text-sm text-muted">{dict.portail.assignment.noAttachments}</p>
        )}
      </section>

      <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <AssignmentThread
          locale={locale as Locale}
          dict={dict.portail.assignment}
          assignmentId={id}
          currentUserId={user.id}
          authors={authorMap}
          messages={messages}
        />
      </section>
    </div>
  );
}
