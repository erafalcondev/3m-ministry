import { redirect } from "next/navigation";
import { getServerSupabase } from "@/lib/supabase/server";
import { portailLanding, type UserRole } from "@/lib/supabase/types";

export type AccessUser = {
  id: string;
  email: string;
  fullName: string | null;
  role: UserRole;
};

/**
 * Loads the authenticated profile and redirects if it is not in `allowed`.
 * Returns the resolved profile for use in the page.
 */
export async function requireRole(
  locale: string,
  allowed: UserRole[],
): Promise<AccessUser> {
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

  if (!profile || profile.status !== "approved") {
    redirect(`/${locale}/login`);
  }

  if (!allowed.includes(profile.role as UserRole)) {
    redirect(portailLanding(locale, profile.role as UserRole));
  }

  return {
    id: profile.id as string,
    email: profile.email as string,
    fullName: profile.full_name as string | null,
    role: profile.role as UserRole,
  };
}

export const ADMIN_ONLY: UserRole[] = ["admin"];
export const STAFF: UserRole[] = ["admin", "director", "coordinator"];
export const ADMIN_OR_COORD: UserRole[] = ["admin", "coordinator"];
