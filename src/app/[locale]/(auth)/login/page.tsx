import { redirect } from "next/navigation";
import { type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getServerSupabase } from "@/lib/supabase/server";
import { LoginForm } from "./LoginForm";

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { locale } = await params;
  const { from } = await searchParams;
  const dict = getDictionary(locale as Locale);

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const supabase = await getServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role,status")
        .eq("id", user.id)
        .single();
      if (profile?.status === "approved") {
        const dest =
          profile.role === "admin"
            ? `/${locale}/portail/admin`
            : profile.role === "coach"
              ? `/${locale}/portail/coach`
              : `/${locale}/portail/etudiant`;
        redirect(dest);
      }
    }
  }

  return <LoginForm locale={locale as Locale} dict={dict.auth.login} from={from} />;
}
