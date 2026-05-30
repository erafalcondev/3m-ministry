import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getServerSupabase } from "@/lib/supabase/server";

type CreateUserBody = {
  email?: string;
  fullName?: string;
  role?: "student" | "coach" | "coordinator" | "director" | "admin";
  password?: string;
};

export async function POST(req: NextRequest) {
  // 1. Verify caller is an approved admin
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

  // 2. Parse + validate input
  let body: CreateUserBody;
  try {
    body = (await req.json()) as CreateUserBody;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const { email, fullName, role, password } = body;
  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }
  if (!password || password.length < 8) {
    return NextResponse.json({ error: "password_too_short" }, { status: 400 });
  }
  const allowedRoles = ["student", "coach", "coordinator", "director", "admin"];
  if (!role || !allowedRoles.includes(role)) {
    return NextResponse.json({ error: "invalid_role" }, { status: 400 });
  }

  // 3. Service-role client
  const sr = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!sr || !url) return NextResponse.json({ error: "server_misconfigured" }, { status: 500 });
  const admin = createClient(url, sr, { auth: { autoRefreshToken: false, persistSession: false } });

  // 4. Create the auth user (already email-confirmed so they can sign in)
  const { data: created, error: cuErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName ?? "" },
  });
  if (cuErr || !created.user) {
    return NextResponse.json({ error: cuErr?.message ?? "create_user_failed" }, { status: 500 });
  }

  // 5. Promote the profile row to approved + selected role + force pw change
  //    The handle_new_user trigger already created a pending profile row.
  const { error: upErr } = await admin
    .from("profiles")
    .update({
      full_name: fullName ?? null,
      role,
      status: "approved",
      approved_at: new Date().toISOString(),
      approved_by: user.id,
      must_change_password: true,
    })
    .eq("id", created.user.id);
  if (upErr) {
    return NextResponse.json({ error: upErr.message }, { status: 500 });
  }

  // 6. Audit log
  await admin.from("audit_log").insert({
    actor_id: user.id,
    action: "user.create_manual",
    target_type: "profile",
    target_id: created.user.id,
    metadata: { email, role, must_change_password: true },
  });

  return NextResponse.json({ id: created.user.id, email });
}
