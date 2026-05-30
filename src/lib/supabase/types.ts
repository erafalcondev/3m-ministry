export type UserRole = "student" | "coach" | "coordinator" | "director" | "admin";
export type UserStatus = "pending" | "approved" | "refused";
export type RelationshipType = "academic" | "ministry_mentor" | "team_leader";
export type CohortStatus = "planned" | "active" | "completed" | "canceled";
export type CohortMemberStatus = "active" | "withdrawn" | "completed";
export type MilestoneKind = "start" | "end" | "session" | "evaluation" | "custom";

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  status: UserStatus;
  motivation: string | null;
  created_at: string;
  approved_at: string | null;
  approved_by: string | null;
  refused_at: string | null;
  refused_by: string | null;
  refused_reason: string | null;
};

export type Program = {
  id: string;
  code: string;
  name_fr: string;
  name_en: string;
  description_fr: string | null;
  description_en: string | null;
  duration_months: number | null;
  color: string;
  sort_order: number;
  active: boolean;
  created_at: string;
};

export type Cohort = {
  id: string;
  program_id: string;
  name: string;
  start_date: string;
  end_date: string;
  rhythm_text: string | null;
  location: string | null;
  status: CohortStatus;
  notes: string | null;
  created_at: string;
  created_by: string | null;
};

export type CohortMember = {
  cohort_id: string;
  student_id: string;
  joined_at: string;
  status: CohortMemberStatus;
  added_by: string | null;
};

export type CohortMilestone = {
  id: string;
  cohort_id: string;
  date: string;
  title: string;
  kind: MilestoneKind;
  notes: string | null;
  created_at: string;
};

export type CoachStudentLink = {
  coach_id: string;
  student_id: string;
  relationship_type: RelationshipType;
  assigned_at: string;
  assigned_by: string | null;
};

export const STAFF_ROLES: UserRole[] = ["admin", "director", "coordinator"];

export function portailLanding(locale: string, role: UserRole | null | undefined): string {
  if (role === "admin") return `/${locale}/portail/admin`;
  if (role === "director") return `/${locale}/portail/director`;
  if (role === "coordinator") return `/${locale}/portail/coordinator`;
  if (role === "coach") return `/${locale}/portail/coach`;
  return `/${locale}/portail/etudiant`;
}
