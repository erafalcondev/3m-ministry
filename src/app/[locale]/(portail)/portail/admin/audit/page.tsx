import { type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getServerSupabase } from "@/lib/supabase/server";
import { PageHeader } from "@/components/portail/PageHeader";

type AuditRow = {
  id: number;
  actor_id: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

function fmt(iso: string, locale: Locale) {
  return new Date(iso).toLocaleString(locale === "fr" ? "fr-CA" : "en-CA", {
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
  const dict = getDictionary(locale as Locale);
  const supabase = await getServerSupabase();

  const { data } = await supabase
    .from("audit_log")
    .select("id,actor_id,action,target_type,target_id,metadata,created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  const rows = (data ?? []) as AuditRow[];

  // Pull actor names in one extra query
  const actorIds = Array.from(new Set(rows.map((r) => r.actor_id).filter(Boolean))) as string[];
  let actorMap: Record<string, string> = {};
  if (actorIds.length > 0) {
    const { data: actors } = await supabase
      .from("profiles")
      .select("id,email,full_name")
      .in("id", actorIds);
    actorMap = Object.fromEntries(
      (actors ?? []).map((a) => [a.id as string, (a.full_name as string | null) || (a.email as string)]),
    );
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
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-sm">
                <div className="min-w-0">
                  <span className="font-mono text-xs text-brand">{r.action}</span>
                  <span className="ml-3 text-muted">
                    {r.actor_id ? actorMap[r.actor_id] || r.actor_id.slice(0, 8) : "—"}
                  </span>
                  {r.metadata && Object.keys(r.metadata).length > 0 && (
                    <span className="ml-3 truncate font-mono text-[11px] text-muted/70">
                      {JSON.stringify(r.metadata)}
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-muted/70">{fmt(r.created_at, locale as Locale)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
