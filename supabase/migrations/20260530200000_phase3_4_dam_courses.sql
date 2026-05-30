-- Phase 3/4 — DAM (Digital Asset Management) + Courses + Assignments.
-- Resources are the unit of academic content: a PDF, a link, a video.
-- Courses bundle resources + assignments + notes, and are accessible to
-- specific students or whole cohorts.

-- =====================================================================
-- 1. ENUMS
-- =====================================================================

create type public.resource_kind as enum ('link', 'file', 'video', 'audio', 'document', 'slides');
create type public.resource_visibility as enum ('public', 'students', 'staff');
create type public.course_status as enum ('draft', 'published', 'archived');

-- =====================================================================
-- 2. RESOURCES (DAM)
-- =====================================================================

create table public.resources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  kind public.resource_kind not null,
  url text,
  storage_path text,
  file_type text,
  size_bytes bigint,
  program_id uuid references public.programs (id) on delete set null,
  tags text[] not null default '{}',
  visibility public.resource_visibility not null default 'students',
  language text not null default 'fr',
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index resources_kind_idx on public.resources (kind);
create index resources_program_idx on public.resources (program_id);
create index resources_visibility_idx on public.resources (visibility);

-- =====================================================================
-- 3. COURSES + ACCESS
-- =====================================================================

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  program_id uuid references public.programs (id) on delete set null,
  instructor_id uuid references public.profiles (id) on delete set null,
  status public.course_status not null default 'draft',
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null
);

create index courses_status_idx on public.courses (status);
create index courses_program_idx on public.courses (program_id);

-- Resources attached to a course (ordered)
create table public.course_resources (
  course_id uuid not null references public.courses (id) on delete cascade,
  resource_id uuid not null references public.resources (id) on delete cascade,
  sort_order integer not null default 0,
  primary key (course_id, resource_id)
);

-- Notes on courses (visible to staff + instructor)
create table public.course_notes (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  author_id uuid references public.profiles (id) on delete set null,
  body text not null,
  created_at timestamptz not null default now()
);

create index course_notes_course_idx on public.course_notes (course_id);

-- Direct access (per student) — for ad-hoc personal assignment
create table public.course_students (
  course_id uuid not null references public.courses (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  added_at timestamptz not null default now(),
  added_by uuid references public.profiles (id) on delete set null,
  primary key (course_id, student_id)
);

create index course_students_student_idx on public.course_students (student_id);

-- Access via cohort — every member of the cohort gets the course
create table public.course_cohorts (
  course_id uuid not null references public.courses (id) on delete cascade,
  cohort_id uuid not null references public.cohorts (id) on delete cascade,
  added_at timestamptz not null default now(),
  added_by uuid references public.profiles (id) on delete set null,
  primary key (course_id, cohort_id)
);

create index course_cohorts_cohort_idx on public.course_cohorts (cohort_id);

-- =====================================================================
-- 4. ASSIGNMENTS
-- =====================================================================

create table public.assignments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  title text not null,
  instructions text,
  due_date date,
  resource_id uuid references public.resources (id) on delete set null,
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null
);

create index assignments_course_idx on public.assignments (course_id);
create index assignments_due_idx on public.assignments (due_date);

-- =====================================================================
-- 5. HELPER — student access to a course
-- =====================================================================

create or replace function public.has_course_access(course uuid, who uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.course_students where course_id = course and student_id = who
  ) or exists (
    select 1
    from public.course_cohorts cc
    join public.cohort_members cm on cm.cohort_id = cc.cohort_id
    where cc.course_id = course and cm.student_id = who
  );
$$;

grant execute on function public.has_course_access(uuid, uuid) to authenticated;

-- =====================================================================
-- 6. RLS POLICIES
-- =====================================================================

alter table public.resources enable row level security;
alter table public.courses enable row level security;
alter table public.course_resources enable row level security;
alter table public.course_notes enable row level security;
alter table public.course_students enable row level security;
alter table public.course_cohorts enable row level security;
alter table public.assignments enable row level security;

-- ---- resources ----

-- Public resources are visible to all approved users.
create policy "resources_public_read" on public.resources
  for select using (
    visibility = 'public' and exists (
      select 1 from public.profiles where id = auth.uid() and status = 'approved'
    )
  );

-- 'students' visibility = any approved user (incl. staff).
create policy "resources_students_read" on public.resources
  for select using (
    visibility = 'students' and exists (
      select 1 from public.profiles where id = auth.uid() and status = 'approved'
    )
  );

-- 'staff' visibility = staff only.
create policy "resources_staff_read" on public.resources
  for select using (visibility = 'staff' and public.is_staff());

-- Only admin uploads / updates / deletes.
create policy "resources_admin_write" on public.resources
  for all using (public.is_admin()) with check (public.is_admin());

-- ---- courses ----

-- Staff sees all courses.
create policy "courses_staff_read" on public.courses
  for select using (public.is_staff());

-- Students see published courses they have access to.
create policy "courses_student_read" on public.courses
  for select using (
    status = 'published' and public.has_course_access(id)
  );

-- Coaches see courses if any of their students have access (or if the coach
-- is assigned to a member of an enrolled cohort). We keep this broad: any
-- approved coach can read all published courses (read-only).
create policy "courses_coach_read" on public.courses
  for select using (
    status = 'published' and exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'coach' and status = 'approved'
    )
  );

create policy "courses_admin_write" on public.courses
  for all using (public.is_admin()) with check (public.is_admin());

-- ---- course_resources (link table) ----

create policy "course_resources_read" on public.course_resources
  for select using (
    public.is_staff() or
    public.has_course_access(course_id) or
    exists (
      select 1 from public.profiles where id = auth.uid() and role = 'coach' and status = 'approved'
    )
  );

create policy "course_resources_admin_write" on public.course_resources
  for all using (public.is_admin()) with check (public.is_admin());

-- ---- course_notes ----

create policy "course_notes_staff_read" on public.course_notes
  for select using (public.is_staff());

create policy "course_notes_author_read" on public.course_notes
  for select using (author_id = auth.uid());

create policy "course_notes_staff_write" on public.course_notes
  for all using (public.is_staff()) with check (public.is_staff() and author_id = auth.uid());

-- ---- course_students ----

create policy "course_students_staff_read" on public.course_students
  for select using (public.is_staff());

create policy "course_students_self_read" on public.course_students
  for select using (student_id = auth.uid());

create policy "course_students_admin_write" on public.course_students
  for all using (public.is_admin() or public.is_coordinator())
  with check (public.is_admin() or public.is_coordinator());

-- ---- course_cohorts ----

create policy "course_cohorts_staff_read" on public.course_cohorts
  for select using (public.is_staff());

create policy "course_cohorts_member_read" on public.course_cohorts
  for select using (
    exists (
      select 1 from public.cohort_members
      where cohort_id = course_cohorts.cohort_id and student_id = auth.uid()
    )
  );

create policy "course_cohorts_admin_write" on public.course_cohorts
  for all using (public.is_admin() or public.is_coordinator())
  with check (public.is_admin() or public.is_coordinator());

-- ---- assignments ----

create policy "assignments_staff_read" on public.assignments
  for select using (public.is_staff());

create policy "assignments_student_read" on public.assignments
  for select using (public.has_course_access(course_id));

create policy "assignments_coach_read" on public.assignments
  for select using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'coach' and status = 'approved'
    )
  );

create policy "assignments_admin_write" on public.assignments
  for all using (public.is_admin()) with check (public.is_admin());

-- =====================================================================
-- 7. STORAGE BUCKET — `resources`
-- =====================================================================

insert into storage.buckets (id, name, public)
values ('resources', 'resources', false)
on conflict (id) do nothing;

-- Storage RLS: any approved user reads; only admin writes.
create policy "resources_bucket_read"
on storage.objects for select
using (
  bucket_id = 'resources'
  and exists (
    select 1 from public.profiles where id = auth.uid() and status = 'approved'
  )
);

create policy "resources_bucket_admin_write"
on storage.objects for insert
with check (bucket_id = 'resources' and public.is_admin());

create policy "resources_bucket_admin_update"
on storage.objects for update
using (bucket_id = 'resources' and public.is_admin())
with check (bucket_id = 'resources' and public.is_admin());

create policy "resources_bucket_admin_delete"
on storage.objects for delete
using (bucket_id = 'resources' and public.is_admin());
