"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { getBrowserSupabase } from "@/lib/supabase/client";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/fr";

type AdminDict = Dictionary["portail"]["admin"];
type RoleLabels = Dictionary["portail"]["common"]["roles"];

type Role = "student" | "coach" | "coordinator" | "director" | "admin";

type Row = {
  id: string;
  email: string;
  fullName: string | null;
  role: Role;
  status: "pending" | "approved" | "refused";
  createdAt: string;
  cohorts: string[];
};

function fmtDate(iso: string, locale: Locale) {
  return new Date(iso).toLocaleDateString(locale === "fr" ? "fr-CA" : "en-CA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const statusColor: Record<Row["status"], string> = {
  pending: "border-amber-400/30 bg-amber-400/10 text-amber-200",
  approved: "border-brand/30 bg-brand/10 text-brand",
  refused: "border-red-400/30 bg-red-400/10 text-red-200",
};

const ROLE_OPTIONS: Role[] = ["student", "coach", "coordinator", "director", "admin"];

export function UsersTable({
  locale,
  dict,
  roleLabels,
  canEditRoles,
  rows,
}: {
  locale: Locale;
  dict: AdminDict;
  roleLabels: RoleLabels;
  canEditRoles: boolean;
  rows: Row[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function setRole(id: string, role: Role) {
    startTransition(async () => {
      const supabase = getBrowserSupabase();
      const { error } = await supabase.rpc("set_user_role", { target: id, new_role: role });
      if (!error) router.refresh();
    });
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-16 text-center text-sm text-muted">
        {dict.usersEmpty}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]"
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead>
            <tr className="border-b border-white/5 text-[10px] uppercase tracking-[0.18em] text-muted">
              <th className="px-5 py-3 font-medium">{dict.colName}</th>
              <th className="px-5 py-3 font-medium">{dict.colEmail}</th>
              <th className="px-5 py-3 font-medium">{dict.colStatus}</th>
              <th className="px-5 py-3 font-medium">{dict.colCohort}</th>
              <th className="px-5 py-3 font-medium">{dict.colCreated}</th>
              <th className="px-5 py-3 font-medium">{dict.colRole}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.id}
                className="border-b border-white/[0.04] transition hover:bg-white/[0.02]"
              >
                <td className="px-5 py-4">
                  <Link
                    href={`/${locale}/portail/admin/contacts/${r.id}`}
                    className="text-foreground transition hover:text-brand"
                  >
                    {r.fullName || "—"}
                  </Link>
                </td>
                <td className="px-5 py-4">
                  <Link
                    href={`/${locale}/portail/admin/contacts/${r.id}`}
                    className="text-muted transition hover:text-foreground"
                  >
                    {r.email}
                  </Link>
                </td>
                <td className="px-5 py-4">
                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] ${statusColor[r.status]}`}
                  >
                    {dict.status[r.status]}
                  </span>
                </td>
                <td className="px-5 py-4 text-muted">
                  {r.cohorts.length === 0 ? "—" : r.cohorts.join(", ")}
                </td>
                <td className="px-5 py-4 text-muted">{fmtDate(r.createdAt, locale)}</td>
                <td className="px-5 py-4">
                  {canEditRoles ? (
                    <select
                      value={r.role}
                      disabled={pending || r.status !== "approved"}
                      onChange={(e) => setRole(r.id, e.target.value as Role)}
                      className="rounded-full border border-white/10 bg-background/70 px-3 py-1 text-xs text-foreground focus:border-brand/60 focus:outline-none disabled:opacity-50"
                    >
                      {ROLE_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {roleLabels[opt]}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-xs text-muted">{roleLabels[r.role]}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
