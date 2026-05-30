import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getServerSupabase } from "@/lib/supabase/server";

/**
 * Real impersonation: an admin clicks "Log in as X" and gets a fresh magic
 * link signed for X. Opening the link signs them in as X for real.
 *
 * Security:
 * - Caller must be an authenticated admin (verified via getServerSupabase()).
 * - Magic links are single-use and expire in ~1h.
 * - Every impersonation gets an audit_log entry (impersonated user id + actor).
 *
 * To return to the admin account: sign out and sign back in normally.
 */
export async function POST(req: NextRequest) {
  const target = req.nextUrl.searchParams.get("target");
  const locale = req.nextUrl.searchParams.get("locale") || "fr";
  if (!target) return NextResponse.json({ error: "missing_target" }, { status: 400 });

  // 1. Verify the caller is an admin via cookie-bound client.
  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { data: meProfile } = await supabase
    .from("profiles")
    .select("role,status")
    .eq("id", user.id)
    .single();
  if (meProfile?.role !== "admin" || meProfile?.status !== "approved") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  // 2. Look up the target's email.
  const { data: targetProfile } = await supabase
    .from("profiles")
    .select("email,status")
    .eq("id", target)
    .single();
  if (!targetProfile) return NextResponse.json({ error: "target_not_found" }, { status: 404 });
  if (targetProfile.status !== "approved") {
    return NextResponse.json({ error: "target_not_approved" }, { status: 400 });
  }

  // 3. Generate the magic link via the service-role client (server-only key).
  const sr = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!sr || !url) {
    return NextResponse.json({ error: "server_misconfigured" }, { status: 500 });
  }
  const admin = createClient(url, sr, { auth: { autoRefreshToken: false, persistSession: false } });
  const origin = req.nextUrl.origin;
  const redirectTo = `${origin}/${locale}`;
  const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: targetProfile.email as string,
    options: { redirectTo },
  });
  if (linkErr || !linkData?.properties?.action_link) {
    return NextResponse.json({ error: linkErr?.message || "link_generation_failed" }, { status: 500 });
  }

  // 4. Audit log
  await admin.from("audit_log").insert({
    actor_id: user.id,
    action: "admin.impersonate",
    target_type: "profile",
    target_id: target,
    metadata: { target_email: targetProfile.email },
  });

  return NextResponse.json({ url: linkData.properties.action_link });
}
