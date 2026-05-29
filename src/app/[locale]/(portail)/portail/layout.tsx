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
    .select("id,email,full_name,role,status")
    .eq("id", user.id)
    .single();

  if (!profile) redirect(`/${locale}/login`);

  const status = profile.status as UserStatus;
  if (status !== "approved") {
    await supabase.auth.signOut();
    redirect(`/${locale}/login`);
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
      }}
    >
      {children}
    </PortailShell>
  );
}
