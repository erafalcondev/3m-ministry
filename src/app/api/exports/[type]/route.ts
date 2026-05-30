import { NextResponse, type NextRequest } from "next/server";
import * as XLSX from "xlsx";
import { getServerSupabase } from "@/lib/supabase/server";

type Locale = "fr" | "en";

function pickLocale(req: NextRequest): Locale {
  const l = req.nextUrl.searchParams.get("locale");
  return l === "en" ? "en" : "fr";
}

function fmt(iso: string | null | undefined, locale: Locale): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString(locale === "fr" ? "fr-CA" : "en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function workbookResponse(rows: Record<string, unknown>[], sheetName: string, filename: string) {
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31) || "Sheet1");
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
  return new NextResponse(new Uint8Array(buf), {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ type: string }> },
) {
  const { type } = await ctx.params;
  const locale = pickLocale(req);
  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role,status")
    .eq("id", user.id)
    .single();
  if (
    !profile ||
    profile.status !== "approved" ||
    !["admin", "director", "coordinator"].includes(profile.role as string)
  ) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const today = new Date().toISOString().slice(0, 10);

  switch (type) {
    case "users": {
      const { data } = await supabase
        .from("profiles")
        .select("email,full_name,role,status,created_at,approved_at,motivation")
        .order("created_at", { ascending: false });
      const rows = (data ?? []).map((p) => ({
        Nom: p.full_name ?? "",
        Courriel: p.email,
        Rôle: p.role,
        Statut: p.status,
        Inscrit: fmt(p.created_at as string, locale),
        Approuvé: fmt(p.approved_at as string | null, locale),
        Motivation: p.motivation ?? "",
      }));
      return workbookResponse(rows, "Utilisateurs", `utilisateurs-${today}.xlsx`);
    }

    case "cohorts": {
      const [{ data: cohorts }, { data: programs }, { data: members }] = await Promise.all([
        supabase
          .from("cohorts")
          .select("id,name,program_id,start_date,end_date,rhythm_text,location,status")
          .order("start_date", { ascending: false }),
        supabase.from("programs").select("id,code,name_fr,name_en"),
        supabase.from("cohort_members").select("cohort_id"),
      ]);
      const programMap = new Map(
        (programs ?? []).map((p) => [
          p.id as string,
          { code: p.code as string, name: locale === "fr" ? p.name_fr : p.name_en },
        ]),
      );
      const memberCount: Record<string, number> = {};
      for (const m of members ?? []) {
        const cid = m.cohort_id as string;
        memberCount[cid] = (memberCount[cid] ?? 0) + 1;
      }
      const rows = (cohorts ?? []).map((c) => {
        const p = programMap.get(c.program_id as string);
        return {
          Nom: c.name,
          Programme: p ? `${p.code} · ${p.name}` : "",
          Début: fmt(c.start_date as string, locale),
          Fin: fmt(c.end_date as string, locale),
          Rythme: c.rhythm_text ?? "",
          Lieu: c.location ?? "",
          Statut: c.status,
          Membres: memberCount[c.id as string] ?? 0,
        };
      });
      return workbookResponse(rows, "Cohortes", `cohortes-${today}.xlsx`);
    }

    case "cohort_members": {
      const [{ data: members }, { data: cohorts }, { data: profiles }] = await Promise.all([
        supabase.from("cohort_members").select("cohort_id,student_id,joined_at,status"),
        supabase.from("cohorts").select("id,name"),
        supabase.from("profiles").select("id,email,full_name"),
      ]);
      const cohortName = new Map((cohorts ?? []).map((c) => [c.id as string, c.name as string]));
      const studentMap = new Map(
        (profiles ?? []).map((p) => [
          p.id as string,
          { name: (p.full_name as string | null) || (p.email as string), email: p.email as string },
        ]),
      );
      const rows = (members ?? []).map((m) => {
        const s = studentMap.get(m.student_id as string);
        return {
          Cohorte: cohortName.get(m.cohort_id as string) ?? "",
          Étudiant: s?.name ?? "",
          Courriel: s?.email ?? "",
          Ajouté: fmt(m.joined_at as string, locale),
          Statut: m.status,
        };
      });
      return workbookResponse(rows, "Membres de cohorte", `cohorte-membres-${today}.xlsx`);
    }

    case "assignments": {
      const [{ data: links }, { data: profiles }] = await Promise.all([
        supabase
          .from("coach_student_links")
          .select("coach_id,student_id,relationship_type,assigned_at"),
        supabase.from("profiles").select("id,email,full_name"),
      ]);
      const profileMap = new Map(
        (profiles ?? []).map((p) => [
          p.id as string,
          { name: (p.full_name as string | null) || (p.email as string), email: p.email as string },
        ]),
      );
      const labels =
        locale === "fr"
          ? { academic: "Coach académique", ministry_mentor: "Mentor en ministère", team_leader: "Leader d'équipe" }
          : { academic: "Academic coach", ministry_mentor: "Ministry mentor", team_leader: "Team leader" };
      const rows = (links ?? []).map((l) => {
        const c = profileMap.get(l.coach_id as string);
        const s = profileMap.get(l.student_id as string);
        return {
          Type: labels[l.relationship_type as keyof typeof labels] ?? l.relationship_type,
          Coach: c?.name ?? "",
          "Coach (courriel)": c?.email ?? "",
          Étudiant: s?.name ?? "",
          "Étudiant (courriel)": s?.email ?? "",
          Assigné: fmt(l.assigned_at as string, locale),
        };
      });
      return workbookResponse(rows, "Assignations", `assignations-${today}.xlsx`);
    }

    default:
      return NextResponse.json({ error: "unknown export type" }, { status: 400 });
  }
}
