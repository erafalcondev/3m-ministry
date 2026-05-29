import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function updateSession(request: NextRequest, response: NextResponse) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookies) {
          for (const c of cookies) {
            request.cookies.set(c.name, c.value);
            response.cookies.set(c.name, c.value, c.options);
          }
        },
      },
    },
  );

  const { data } = await supabase.auth.getUser();
  return { supabase, user: data.user };
}
