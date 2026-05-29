#!/usr/bin/env node
// Seeds the bootstrap admin account into Supabase.
// Reads SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY from .env.local.
// Idempotent: if the user exists, we just promote them to admin/approved.

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ADMIN_EMAIL = "r.popescu@egliselacite.ca";
const ADMIN_PASSWORD = "Kekcngek23y!";
const ADMIN_NAME = "Radu Popescu";

function loadEnv() {
  try {
    const raw = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?(.*?)"?\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    }
  } catch {
    // env may be set externally
  }
}

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function findUserByEmail(email) {
  let page = 1;
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const match = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (match) return match;
    if (data.users.length < 200) return null;
    page += 1;
  }
}

async function main() {
  console.log("→ Looking up existing user…");
  let user = await findUserByEmail(ADMIN_EMAIL);

  if (!user) {
    console.log("→ Creating auth user…");
    const { data, error } = await supabase.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: ADMIN_NAME },
    });
    if (error) throw error;
    user = data.user;
    console.log("  ✓ Created", user.id);
  } else {
    console.log("  ✓ Found", user.id);
  }

  console.log("→ Promoting profile to approved admin…");
  const { error: upErr } = await supabase
    .from("profiles")
    .upsert(
      {
        id: user.id,
        email: ADMIN_EMAIL,
        full_name: ADMIN_NAME,
        role: "admin",
        status: "approved",
        approved_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    );
  if (upErr) throw upErr;
  console.log("  ✓ Profile is admin / approved");

  console.log("\n✅ Admin seed complete.");
  console.log(`   Email:    ${ADMIN_EMAIL}`);
  console.log(`   Password: ${ADMIN_PASSWORD}`);
}

main().catch((err) => {
  console.error("\n❌ Seed failed:", err.message ?? err);
  process.exit(1);
});
