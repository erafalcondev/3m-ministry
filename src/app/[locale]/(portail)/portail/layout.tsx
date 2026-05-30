import { redirect } from "next/navigation";
import { type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getServerSupabase } from "@/lib/supabase/server";
import type { UserRole, UserStatus } from "@/lib/supabase/types";
import { PortailShell } from "@/components/portail/PortailShell";

export default async function PortailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
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
    .select("id,email,full_name,role,status,must_change_password,avatar_url")
    .eq("id", user.id)
    .single();

  if (!profile) redirect(`/${locale}/login`);

  const status = profile.status as UserStatus;
  if (status !== "approved") {
    await supabase.auth.signOut();
    redirect(`/${locale}/login`);
  }
  if (profile.must_change_password) {
    redirect(`/${locale}/change-password`);
  }

  // Notification badge on admin Questions: count of non-archived tickets.
  let openTicketsCount = 0;
  if (profile.role === "admin") {
    const { count } = await supabase
      .from("tickets")
      .select("id", { count: "exact", head: true })
      .in("status", ["open", "in_progress"]);
    openTicketsCount = count ?? 0;
  }

  return (
    <PortailShell
      locale={locale as Locale}
      dict={dict.portail}
      user={{
        id: profile.id as string,
        email: profile.email as string,
        fullName: profile.full_name as string | null,
        role: profile.role as UserRole,
        avatarUrl: profile.avatar_url as string | null,
      }}
      openTicketsCount={openTicketsCount}
    >
      {children}
    </PortailShell>
  );
}
