import { redirect } from "next/navigation";
import { type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getServerSupabase } from "@/lib/supabase/server";
import { PageHeader } from "@/components/portail/PageHeader";
import { ProfileForm } from "./ProfileForm";

export default async function ProfilePage({
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
    .select("id,email,full_name,phone,bio,avatar_url,role_title,location,role")
    .eq("id", user.id)
    .single();
  if (!profile) redirect(`/${locale}/login`);

  return (
    <>
      <PageHeader title={dict.portail.profile.title} description={dict.portail.profile.intro} />
      <div className="mt-6">
        <ProfileForm
          locale={locale as Locale}
          dict={dict.portail.profile}
          initial={{
            id: profile.id as string,
            email: profile.email as string,
            fullName: (profile.full_name as string | null) ?? "",
            phone: (profile.phone as string | null) ?? "",
            bio: (profile.bio as string | null) ?? "",
            avatarUrl: (profile.avatar_url as string | null) ?? "",
            roleTitle: (profile.role_title as string | null) ?? "",
            location: (profile.location as string | null) ?? "",
            role: profile.role as string,
          }}
        />
      </div>
    </>
  );
}
