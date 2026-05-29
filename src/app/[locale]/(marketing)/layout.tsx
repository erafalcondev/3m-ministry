import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getServerSupabase } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/supabase/types";

export default async function MarketingLayout({
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
  let role: UserRole | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role,status")
      .eq("id", user.id)
      .single();
    if (profile?.status === "approved") {
      role = profile.role as UserRole;
    }
  }

  return (
    <>
      <Navbar
        locale={locale as Locale}
        labels={dict.nav}
        authed={Boolean(user && role)}
        role={role}
      />
      <main className="relative">{children}</main>
      <Footer locale={locale as Locale} dict={dict} />
    </>
  );
}
