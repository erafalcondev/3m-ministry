import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getServerSupabase } from "@/lib/supabase/server";
import { portailLanding, type UserRole } from "@/lib/supabase/types";
import { NewTicketForm } from "./NewTicketForm";

export default async function NewTicketPage({
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
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role && profile.role !== "student") {
    redirect(portailLanding(locale, profile.role as UserRole));
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
      <h1 className="font-display text-2xl text-foreground">{dict.portail.tickets.newCta}</h1>
      <div className="mt-8">
        <NewTicketForm locale={locale as Locale} dict={dict.portail.tickets} userId={user.id} />
      </div>
    </>
  );
}
