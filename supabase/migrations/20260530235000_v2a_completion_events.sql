-- Vague 2A — Completion tracking + Events.
-- Admin viewing a student can flip a course or assignment to "completed"
-- for THAT student; the student's dashboard then surfaces the running
-- completion percentage and a dedicated "Completed" section.
-- Events are a separate timeline of dated happenings (cohort retreats,
-- evaluations, social moments…) the admin schedules and everyone — or a
-- targeted cohort — sees.

-- =====================================================================
-- 1. COMPLETION TABLES
-- =====================================================================

create table public.student_course_completion (
  student_id uuid not null references public.profiles (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  completed_at timestamptz not null default now(),
  completed_by uuid references public.profiles (id) on delete set null,
  primary key (student_id, course_id)
);

create index student_course_completion_student_idx on public.student_course_completion (student_id);

create table public.student_assignment_completion (
  student_id uuid not null references public.profiles (id) on delete cascade,
  assignment_id uuid not null references public.assignments (id) on delete cascade,
  completed_at timestamptz not null default now(),
  completed_by uuid references public.profiles (id) on delete set null,
  primary key (student_id, assignment_id)
);

create index student_assignment_completion_student_idx on public.student_assignment_completion (student_id);

-- =====================================================================
-- 2. EVENTS TABLE
-- =====================================================================

create type public.event_kind as enum (
  'session',
  'evaluation',
  'retreat',
  'meeting',
  'social',
  'deadline',
  'other'
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  start_at timestamptz not null,
  end_at timestamptz,
  all_day boolean not null default false,
  location text,
  url text,
  color text not null default '#4fc3dc',
  kind public.event_kind not null default 'other',
  program_id uuid references public.programs (id) on delete set null,
  cohort_id uuid references public.cohorts (id) on delete set null,
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null,
  check (end_at is null or end_at >= start_at)
);

create index events_start_idx on public.events (start_at);
create index events_program_idx on public.events (program_id);
create index events_cohort_idx on public.events (cohort_id);

-- =====================================================================
-- 3. RLS
-- =====================================================================

alter table public.student_course_completion enable row level security;
alter table public.student_assignment_completion enable row level security;
alter table public.events enable row level security;

-- ---- student_course_completion ----
create policy "scc_staff_read" on public.student_course_completion
  for select using (public.is_staff());
create policy "scc_self_read" on public.student_course_completion
  for select using (student_id = auth.uid());
create policy "scc_coach_read" on public.student_course_completion
  for select using (
    exists (
      select 1 from public.coach_student_links
      where coach_id = auth.uid() and student_id = student_course_completion.student_id
    )
  );
create policy "scc_admin_coord_write" on public.student_course_completion
  for all using (public.is_admin() or public.is_coordinator())
  with check (public.is_admin() or public.is_coordinator());

-- ---- student_assignment_completion ----
create policy "sac_staff_read" on public.student_assignment_completion
  for select using (public.is_staff());
create policy "sac_self_read" on public.student_assignment_completion
  for select using (student_id = auth.uid());
create policy "sac_coach_read" on public.student_assignment_completion
  for select using (
    exists (
      select 1 from public.coach_student_links
      where coach_id = auth.uid() and student_id = student_assignment_completion.student_id
    )
  );
create policy "sac_admin_coord_write" on public.student_assignment_completion
  for all using (public.is_admin() or public.is_coordinator())
  with check (public.is_admin() or public.is_coordinator());

-- ---- events ----
-- Events with no cohort are visible to every approved user.
-- Events targeted at a cohort are visible to staff + cohort members.
create policy "events_staff_read" on public.events
  for select using (public.is_staff());
create policy "events_global_read" on public.events
  for select using (
    cohort_id is null and exists (
      select 1 from public.profiles where id = auth.uid() and status = 'approved'
    )
  );
create policy "events_cohort_read" on public.events
  for select using (
    cohort_id is not null and exists (
      select 1 from public.cohort_members
      where cohort_id = events.cohort_id and student_id = auth.uid()
    )
  );
create policy "events_admin_write" on public.events
  for all using (public.is_admin() or public.is_coordinator())
  with check (public.is_admin() or public.is_coordinator());
