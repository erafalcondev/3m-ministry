import { redirect } from "next/navigation";
import { getServerSupabase } from "@/lib/supabase/server";

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login`);

  const { data: profile } = await supabase
    .from("profiles")
    .select("role,status")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin" || profile?.status !== "approved") {
    redirect(`/${locale}/portail/${profile?.role === "coach" ? "coach" : "etudiant"}`);
  }

  return <>{children}</>;
}
