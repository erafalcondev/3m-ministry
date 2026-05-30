import { redirect } from "next/navigation";
import { type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getServerSupabase } from "@/lib/supabase/server";
import { PageHeader } from "@/components/portail/PageHeader";
import { ContactsDirectory, type DirectoryContact } from "./ContactsDirectory";

export default async function ContactsDirectoryPage({
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

  const { data } = await supabase
    .from("profiles")
    .select("id,email,full_name,role,avatar_url,phone,role_title,location,bio")
    .eq("status", "approved")
    .order("full_name");

  const contacts: DirectoryContact[] = (data ?? []).map((p) => ({
    id: p.id as string,
    email: p.email as string,
    fullName: (p.full_name as string | null) ?? "",
    role: p.role as DirectoryContact["role"],
    avatarUrl: (p.avatar_url as string | null) ?? "",
    phone: (p.phone as string | null) ?? "",
    roleTitle: (p.role_title as string | null) ?? "",
    location: (p.location as string | null) ?? "",
    bio: (p.bio as string | null) ?? "",
  }));

  return (
    <>
      <PageHeader title={dict.portail.contacts.title} description={dict.portail.contacts.intro} />
      <div className="mt-6">
        <ContactsDirectory
          locale={locale as Locale}
          dict={dict.portail.contacts}
          roleLabels={dict.portail.common.roles}
          contacts={contacts}
        />
      </div>
    </>
  );
}
