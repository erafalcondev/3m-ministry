-- Round 3A — Admin-created users with forced password change,
--             plus extended ticket model (open to all roles).

-- =====================================================================
-- 1. PROFILES: force password change on first login
-- =====================================================================

alter table public.profiles
  add column if not exists must_change_password boolean not null default false;

-- =====================================================================
-- 2. TICKETS: extend with category + optional course / assignment links
-- =====================================================================

create type public.ticket_category as enum (
  'personal',
  'technical',
  'coaching',
  'assignment',
  'course',
  'other'
);

alter table public.tickets add column if not exists category public.ticket_category not null default 'other';
alter table public.tickets add column if not exists course_id uuid references public.courses (id) on delete set null;
alter table public.tickets add column if not exists assignment_id uuid references public.assignments (id) on delete set null;

create index if not exists tickets_category_idx on public.tickets (category);
create index if not exists tickets_course_idx on public.tickets (course_id);

-- =====================================================================
-- 3. TICKETS RLS: open to any approved user, not just students
-- =====================================================================

drop policy if exists "tickets_student_read" on public.tickets;
drop policy if exists "tickets_student_insert" on public.tickets;
drop policy if exists "tickets_student_update" on public.tickets;

-- Own tickets are visible to their author regardless of role.
create policy "tickets_own_read" on public.tickets
  for select using (student_id = auth.uid());

-- Any approved user can create tickets where they are the author.
create policy "tickets_any_user_insert" on public.tickets
  for insert with check (
    student_id = auth.uid() and exists (
      select 1 from public.profiles where id = auth.uid() and status = 'approved'
    )
  );

-- Authors can update their own ticket (e.g. archive).
create policy "tickets_own_update" on public.tickets
  for update using (student_id = auth.uid()) with check (student_id = auth.uid());
