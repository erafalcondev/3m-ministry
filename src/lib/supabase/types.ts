export type UserRole = "student" | "coach" | "admin";
export type UserStatus = "pending" | "approved" | "refused";

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

export type CoachStudentLink = {
  coach_id: string;
  student_id: string;
  assigned_at: string;
  assigned_by: string | null;
};
