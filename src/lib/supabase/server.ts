import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function getServerSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookies) {
          try {
            for (const c of cookies) {
              cookieStore.set(c.name, c.value, c.options);
            }
          } catch {
            // setAll is called from server components in some paths
            // where mutating cookies is disallowed — Supabase's auth
            // helper expects us to swallow that case silently.
          }
        },
      },
    },
  );
}
