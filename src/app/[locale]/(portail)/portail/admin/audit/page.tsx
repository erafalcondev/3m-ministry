import { type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getServerSupabase } from "@/lib/supabase/server";
import { requireRole, ADMIN_ONLY } from "@/lib/portail/access";
import { PageHeader } from "@/components/portail/PageHeader";

const ACTION_ICONS: Record<string, string> = {
  "user.approve": "✓",
  "user.refuse": "✗",
  "user.role_change": "↻",
  "coach.assign": "↔",
  "coach.unassign": "↮",
  "cohort.add_member": "+",
  "cohort.remove_member": "−",
  "admin.impersonate": "👁",
};

type AuditRow = {
  id: number;
  actor_id: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

// All times are rendered in America/Toronto so they match the church's
// Eastern Standard schedule.
function fmtEastern(iso: string, locale: Locale): string {
  return new Date(iso).toLocaleString(locale === "fr" ? "fr-CA" : "en-CA", {
    timeZone: "America/Toronto",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AuditPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireRole(locale, ADMIN_ONLY);
  const dict = getDictionary(locale as Locale);
  const supabase = await getServerSupabase();

  const { data } = await supabase
    .from("audit_log")
    .select("id,actor_id,action,target_type,target_id,metadata,created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  const rows = (data ?? []) as AuditRow[];

  // Collect every referenced profile id so we can resolve them in one query.
  const ids = new Set<string>();
  for (const r of rows) {
    if (r.actor_id) ids.add(r.actor_id);
    if (r.target_type === "profile" && r.target_id) ids.add(r.target_id);
    if (r.metadata) {
      const meta = r.metadata as Record<string, unknown>;
      for (const key of ["coach", "student", "target"]) {
        const v = meta[key];
        if (typeof v === "string" && v.length >= 32) ids.add(v);
      }
    }
  }
  let nameMap = new Map<string, string>();
  if (ids.size > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id,email,full_name")
      .in("id", Array.from(ids));
    nameMap = new Map(
      (profiles ?? []).map((p) => [
        p.id as string,
        (p.full_name as string | null) || (p.email as string),
      ]),
    );
  }

  // Cohort names (for cohort.* actions)
  const cohortIds = new Set<string>();
  for (const r of rows) {
    if (r.metadata && typeof r.metadata.cohort === "string") cohortIds.add(r.metadata.cohort as string);
  }
  let cohortMap = new Map<string, string>();
  if (cohortIds.size > 0) {
    const { data: cohorts } = await supabase
      .from("cohorts")
      .select("id,name")
      .in("id", Array.from(cohortIds));
    cohortMap = new Map((cohorts ?? []).map((c) => [c.id as string, c.name as string]));
  }

  function describe(r: AuditRow): React.ReactNode {
    const m = dict.portail.auditMessages;
    const actor = r.actor_id ? nameMap.get(r.actor_id) ?? m.anonymous : m.anonymous;
    const meta = (r.metadata ?? {}) as Record<string, unknown>;
    const targetName =
      r.target_type === "profile" && r.target_id ? nameMap.get(r.target_id) : null;

    switch (r.action) {
      case "user.approve":
        return (
          <>
            <strong className="text-foreground">{actor}</strong> {m.userApprove}{" "}
            <strong className="text-foreground">{targetName ?? "—"}</strong>
          </>
        );
      case "user.refuse":
        return (
          <>
            <strong className="text-foreground">{actor}</strong> {m.userRefuse}{" "}
            <strong className="text-foreground">{targetName ?? "—"}</strong>
            {typeof meta.reason === "string" && meta.reason ? ` — ${meta.reason}` : ""}
          </>
        );
      case "user.role_change":
        return (
          <>
            <strong className="text-foreground">{actor}</strong> {m.userRoleChange}{" "}
            <strong className="text-foreground">{targetName ?? "—"}</strong>{" "}
            {m.becameRole}
            <strong className="text-foreground">{String(meta.from)}</strong> →{" "}
            <strong className="text-foreground">{String(meta.to)}</strong>
          </>
        );
      case "coach.assign": {
        const coach = nameMap.get(meta.coach as string) ?? "—";
        const student = nameMap.get(meta.student as string) ?? "—";
        const type = (meta.type as string | undefined) ?? "";
        return (
          <>
            <strong className="text-foreground">{actor}</strong> {m.coachAssign}{" "}
            <strong className="text-foreground">{coach}</strong> {m.asCoach}{" "}
            {m.to} <strong className="text-foreground">{student}</strong>
            {type ? ` (${type})` : ""}
          </>
        );
      }
      case "coach.unassign": {
        const coach = nameMap.get(meta.coach as string) ?? "—";
        const student = nameMap.get(meta.student as string) ?? "—";
        return (
          <>
            <strong className="text-foreground">{actor}</strong> {m.coachUnassign}{" "}
            <strong className="text-foreground">{coach}</strong> {m.from}{" "}
            <strong className="text-foreground">{student}</strong>
          </>
        );
      }
      case "cohort.add_member": {
        const student = nameMap.get(meta.student as string) ?? "—";
        const cohort = cohortMap.get(meta.cohort as string) ?? "—";
        return (
          <>
            <strong className="text-foreground">{actor}</strong> {m.cohortAddMember}{" "}
            <strong className="text-foreground">{cohort}</strong>:{" "}
            <strong className="text-foreground">{student}</strong>
          </>
        );
      }
      case "cohort.remove_member": {
        const student = nameMap.get(meta.student as string) ?? "—";
        const cohort = cohortMap.get(meta.cohort as string) ?? "—";
        return (
          <>
            <strong className="text-foreground">{actor}</strong> {m.cohortRemoveMember}{" "}
            <strong className="text-foreground">{cohort}</strong>:{" "}
            <strong className="text-foreground">{student}</strong>
          </>
        );
      }
      case "admin.impersonate": {
        const targetEmail = (meta.target_email as string) ?? "";
        return (
          <>
            <strong className="text-foreground">{actor}</strong> {m.adminImpersonate}{" "}
            <strong className="text-foreground">{targetName ?? targetEmail ?? "—"}</strong>
          </>
        );
      }
      default:
        return (
          <>
            <strong className="text-foreground">{actor}</strong> {m.defaultAction}{" "}
            <span className="font-mono text-xs text-muted">{r.action}</span>
          </>
        );
    }
  }

  return (
    <>
      <PageHeader title={dict.portail.sidebar.links.audit} />
      <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
        {rows.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-muted">
            {dict.portail.common.empty}
          </div>
        ) : (
          <ul className="divide-y divide-white/5">
            {rows.map((r) => (
              <li key={r.id} className="flex flex-wrap items-start justify-between gap-3 px-5 py-3 text-sm">
                <div className="flex items-start gap-3 min-w-0">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand/15 text-brand text-[11px]">
                    {ACTION_ICONS[r.action] ?? "•"}
                  </span>
                  <span className="text-foreground/90 text-pretty">{describe(r)}</span>
                </div>
                <span className="text-[11px] text-muted/70 whitespace-nowrap">
                  {fmtEastern(r.created_at, locale as Locale)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
