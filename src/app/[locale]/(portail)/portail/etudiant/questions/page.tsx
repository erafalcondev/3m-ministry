import Link from "next/link";
import { redirect } from "next/navigation";
import { MessageCircle, Plus, Clock } from "lucide-react";
import { type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getServerSupabase } from "@/lib/supabase/server";
import { portailLanding, type UserRole } from "@/lib/supabase/types";
import { PageHeader } from "@/components/portail/PageHeader";

function fmtEastern(iso: string, locale: Locale): string {
  return new Date(iso).toLocaleString(locale === "fr" ? "fr-CA" : "en-CA", {
    timeZone: "America/Toronto",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const STATUS_COLORS: Record<string, string> = {
  open: "border-brand/30 bg-brand/10 text-brand",
  in_progress: "border-amber-400/30 bg-amber-400/10 text-amber-200",
  resolved: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  archived: "border-white/10 bg-white/5 text-muted",
};

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

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role && profile.role !== "student") {
    redirect(portailLanding(locale, profile.role as UserRole));
  }

  const { data: tickets } = await supabase
    .from("tickets")
    .select("id,subject,status,created_at")
    .eq("student_id", user.id)
    .order("created_at", { ascending: false });

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
        {(tickets ?? []).length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-16 text-center">
            <MessageCircle size={36} className="text-muted/60" />
            <p className="mt-4 text-sm text-muted">{dict.portail.tickets.empty}</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {(tickets ?? []).map((t) => (
              <li key={t.id as string}>
                <Link
                  href={`/${locale}/portail/etudiant/questions/${t.id}`}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 text-sm transition hover:border-brand/40 hover:bg-brand/[0.06]"
                >
                  <div className="min-w-0">
                    <p className="text-foreground">{t.subject as string}</p>
                    <p className="mt-0.5 inline-flex items-center gap-1.5 text-xs text-muted">
                      <Clock size={11} />
                      {fmtEastern(t.created_at as string, locale as Locale)}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] uppercase tracking-[0.18em] ${STATUS_COLORS[t.status as string]}`}
                  >
                    {dict.portail.tickets.status[t.status as keyof typeof dict.portail.tickets.status]}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
