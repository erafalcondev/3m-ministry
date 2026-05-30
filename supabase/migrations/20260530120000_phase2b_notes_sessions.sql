-- Phase 2B — Contact notes (CRM-style) + Cohort sessions + Attendance.
-- These tables let coordinators run the weekly cohort night and let
-- staff/coaches keep a running log of observations about people.

-- =====================================================================
-- 1. ENUMS
-- =====================================================================

create type public.note_visibility as enum ('team', 'private');
create type public.session_status as enum ('planned', 'completed', 'canceled');
create type public.attendance_status as enum ('present', 'absent', 'excused', 'online');

-- =====================================================================
-- 2. CONTACT NOTES — CRM-style observations attached to a profile
-- =====================================================================

create table public.contact_notes (
  id uuid primary key default gen_random_uuid(),
  target_id uuid not null references public.profiles (id) on delete cascade,
  author_id uuid references public.profiles (id) on delete set null,
  body text not null,
  visibility public.note_visibility not null default 'team',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index contact_notes_target_idx on public.contact_notes (target_id);
create index contact_notes_author_idx on public.contact_notes (author_id);
create index contact_notes_created_idx on public.contact_notes (created_at desc);

-- =====================================================================
-- 3. COHORT SESSIONS — the weekly 3h rhythm from the strategic plan
-- =====================================================================

create table public.cohort_sessions (
  id uuid primary key default gen_random_uuid(),
  cohort_id uuid not null references public.cohorts (id) on delete cascade,
  date date not null,
  start_time time,
  end_time time,
  location text,
  agenda text,
  notes text,
  status public.session_status not null default 'planned',
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null
);

create index cohort_sessions_cohort_idx on public.cohort_sessions (cohort_id);
create index cohort_sessions_date_idx on public.cohort_sessions (date);

create table public.session_attendance (
  session_id uuid not null references public.cohort_sessions (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  status public.attendance_status not null default 'present',
  notes text,
  recorded_at timestamptz not null default now(),
  recorded_by uuid references public.profiles (id) on delete set null,
  primary key (session_id, student_id)
);

create index session_attendance_student_idx on public.session_attendance (student_id);

-- =====================================================================
-- 4. RLS POLICIES
-- =====================================================================

alter table public.contact_notes enable row level security;
alter table public.cohort_sessions enable row level security;
alter table public.session_attendance enable row level security;

-- ---- contact_notes ----

-- Team-visible notes: any staff (admin/director/coordinator) can read;
-- any coach assigned to the target can read.
create policy "contact_notes_team_read" on public.contact_notes
  for select using (
    visibility = 'team' and (
      public.is_staff() or
      exists (
        select 1 from public.coach_student_links
        where coach_id = auth.uid() and student_id = contact_notes.target_id
      )
    )
  );

-- Private notes: only the author sees them.
create policy "contact_notes_private_read" on public.contact_notes
  for select using (visibility = 'private' and author_id = auth.uid());

-- Insert: anyone who can SEE the target can leave a note on them.
-- We mirror the visibility rules conservatively (staff or assigned coach).
create policy "contact_notes_insert" on public.contact_notes
  for insert with check (
    author_id = auth.uid() and (
      public.is_staff() or
      exists (
        select 1 from public.coach_student_links
        where coach_id = auth.uid() and student_id = contact_notes.target_id
      )
    )
  );

-- Update / delete: only the author (or admin).
create policy "contact_notes_author_update" on public.contact_notes
  for update using (author_id = auth.uid()) with check (author_id = auth.uid());

create policy "contact_notes_author_delete" on public.contact_notes
  for delete using (author_id = auth.uid() or public.is_admin());

-- ---- cohort_sessions ----

create policy "cohort_sessions_staff_read" on public.cohort_sessions
  for select using (public.is_staff());

create policy "cohort_sessions_member_read" on public.cohort_sessions
  for select using (
    exists (
      select 1 from public.cohort_members
      where cohort_id = cohort_sessions.cohort_id and student_id = auth.uid()
    )
  );

create policy "cohort_sessions_coach_read" on public.cohort_sessions
  for select using (
    exists (
      select 1
      from public.cohort_members cm
      join public.coach_student_links csl on csl.student_id = cm.student_id
      where cm.cohort_id = cohort_sessions.cohort_id and csl.coach_id = auth.uid()
    )
  );

create policy "cohort_sessions_admin_coord_write" on public.cohort_sessions
  for all using (public.is_admin() or public.is_coordinator())
  with check (public.is_admin() or public.is_coordinator());

-- ---- session_attendance ----

create policy "session_attendance_staff_read" on public.session_attendance
  for select using (public.is_staff());

create policy "session_attendance_self_read" on public.session_attendance
  for select using (student_id = auth.uid());

create policy "session_attendance_coach_read" on public.session_attendance
  for select using (
    exists (
      select 1 from public.coach_student_links
      where coach_id = auth.uid() and student_id = session_attendance.student_id
    )
  );

create policy "session_attendance_admin_coord_write" on public.session_attendance
  for all using (public.is_admin() or public.is_coordinator())
  with check (public.is_admin() or public.is_coordinator());

-- =====================================================================
-- 5. TRIGGERS — touch updated_at on contact_notes
-- =====================================================================

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger contact_notes_touch
  before update on public.contact_notes
  for each row execute function public.touch_updated_at();
