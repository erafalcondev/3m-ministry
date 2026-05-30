-- Phase 2A — Programs, cohorts, typed coach relationships.
-- Reflects the CBTE / SEMBEQ Immersion model described in the strategic plan:
-- programs (EXPLORE / EQUIP / ESTABLISH / MALB / MDiv specializations) → cohorts
-- (with start/end + rhythm + campus) → members. Coaches relate to students through
-- a typed relationship (academic / ministry_mentor / team_leader).

-- =====================================================================
-- 1. ENUMS
-- =====================================================================

create type public.cohort_status as enum ('planned', 'active', 'completed', 'canceled');
create type public.cohort_member_status as enum ('active', 'withdrawn', 'completed');
create type public.milestone_kind as enum ('start', 'end', 'session', 'evaluation', 'custom');
create type public.relationship_type as enum ('academic', 'ministry_mentor', 'team_leader');

-- =====================================================================
-- 2. PROGRAMS — the academic frame
-- =====================================================================

create table public.programs (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name_fr text not null,
  name_en text not null,
  description_fr text,
  description_en text,
  duration_months integer,
  color text not null default '#4fc3dc',
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index programs_active_idx on public.programs (active);

-- Seed the 8 programs from the strategic plan.
insert into public.programs (code, name_fr, name_en, description_fr, description_en, duration_months, color, sort_order) values
  ('EXPLORE',           'Explore',                  'Explore',                  'Discernement d''appel — porte d''entrée vers les stages suivants.',                              'Call discernment — gateway to subsequent programs.',                                12,  '#fbbf66', 10),
  ('EQUIP',             'Equip',                    'Equip',                    'Stage de 4 ans pour pasteurs principaux et implanteurs d''Églises.',                              '4-year track for senior pastors and church planters.',                                48,  '#4fc3dc', 20),
  ('ESTABLISH',         'Establish',                'Establish',                'Leaders spécialisés et de soutien — 2 à 4 ans.',                                                   'Specialized and supporting leaders — 2 to 4 years.',                                  36,  '#7dd3fc', 30),
  ('MALB',              'MALB',                     'MALB',                     'Master of Arts in Leadership & Bible — parcours CBTE de 2 ans, 12 compétences.',                  'Master of Arts in Leadership & Bible — CBTE program over 2 years, 12 competencies.',  24,  '#a78bfa', 40),
  ('MDIV-PLANTING',     'MDiv · Implantation',      'MDiv · Church planting',   'Spécialisation Maîtrise en théologie — implantation d''Églises.',                                 'Master of Divinity specialization — church planting.',                                36,  '#f472b6', 50),
  ('MDIV-CHAPLAINCY',   'MDiv · Aumônerie',         'MDiv · Chaplaincy',        'Spécialisation Maîtrise en théologie — aumônerie.',                                                'Master of Divinity specialization — chaplaincy.',                                     36,  '#f59e0b', 60),
  ('MDIV-PREACHING',    'MDiv · Prédication',       'MDiv · Preaching',         'Spécialisation Maîtrise en théologie — prédication et enseignement.',                              'Master of Divinity specialization — preaching and teaching.',                         36,  '#34d399', 70),
  ('MDIV-COUNSELING',   'MDiv · Counseling',        'MDiv · Counseling',        'Spécialisation Maîtrise en théologie — counseling pastoral.',                                      'Master of Divinity specialization — pastoral counseling.',                            36,  '#60a5fa', 80);

-- =====================================================================
-- 3. COHORTS
-- =====================================================================

create table public.cohorts (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs (id) on delete restrict,
  name text not null,
  start_date date not null,
  end_date date not null,
  rhythm_text text,
  location text,
  status public.cohort_status not null default 'planned',
  notes text,
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null,
  check (end_date >= start_date)
);

create index cohorts_program_idx on public.cohorts (program_id);
create index cohorts_status_idx on public.cohorts (status);
create index cohorts_start_idx on public.cohorts (start_date);

create table public.cohort_members (
  cohort_id uuid not null references public.cohorts (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  status public.cohort_member_status not null default 'active',
  added_by uuid references public.profiles (id) on delete set null,
  primary key (cohort_id, student_id)
);

create index cohort_members_student_idx on public.cohort_members (student_id);

create table public.cohort_milestones (
  id uuid primary key default gen_random_uuid(),
  cohort_id uuid not null references public.cohorts (id) on delete cascade,
  date date not null,
  title text not null,
  kind public.milestone_kind not null default 'custom',
  notes text,
  created_at timestamptz not null default now()
);

create index cohort_milestones_cohort_idx on public.cohort_milestones (cohort_id);
create index cohort_milestones_date_idx on public.cohort_milestones (date);

-- =====================================================================
-- 4. TYPED COACH ↔ STUDENT RELATIONSHIP
-- =====================================================================

alter table public.coach_student_links add column relationship_type public.relationship_type;
-- Backfill existing rows: treat them as academic relationships.
update public.coach_student_links set relationship_type = 'academic' where relationship_type is null;
alter table public.coach_student_links alter column relationship_type set not null;

-- Switch the primary key so a coach can serve the same student in multiple capacities
-- (e.g. someone could be academic coach + team leader for the same person).
alter table public.coach_student_links drop constraint coach_student_links_pkey;
alter table public.coach_student_links add primary key (coach_id, student_id, relationship_type);

-- =====================================================================
-- 5. NEW HELPER FUNCTIONS — extend the role-check surface
-- =====================================================================

create or replace function public.is_director()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select role = 'director' and status = 'approved' from public.profiles where id = auth.uid()),
    false
  );
$$;

create or replace function public.is_coordinator()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select role = 'coordinator' and status = 'approved' from public.profiles where id = auth.uid()),
    false
  );
$$;

-- Convenience: staff = any non-student approved role with operational access.
create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select role in ('admin', 'director', 'coordinator') and status = 'approved' from public.profiles where id = auth.uid()),
    false
  );
$$;

-- =====================================================================
-- 6. RLS POLICIES
-- =====================================================================

alter table public.programs enable row level security;
alter table public.cohorts enable row level security;
alter table public.cohort_members enable row level security;
alter table public.cohort_milestones enable row level security;

-- Programs: every approved user reads, only admin writes.
create policy "programs_read_authenticated" on public.programs
  for select using (auth.uid() is not null);
create policy "programs_admin_write" on public.programs
  for all using (public.is_admin()) with check (public.is_admin());

-- Cohorts: staff reads everything; members + their coaches read their own cohorts;
-- admin + coordinator can write.
create policy "cohorts_staff_read" on public.cohorts
  for select using (public.is_staff());
create policy "cohorts_member_read" on public.cohorts
  for select using (
    exists (
      select 1 from public.cohort_members
      where cohort_id = cohorts.id and student_id = auth.uid()
    )
  );
create policy "cohorts_coach_read" on public.cohorts
  for select using (
    exists (
      select 1
      from public.cohort_members cm
      join public.coach_student_links csl on csl.student_id = cm.student_id
      where cm.cohort_id = cohorts.id and csl.coach_id = auth.uid()
    )
  );
create policy "cohorts_admin_coord_write" on public.cohorts
  for all using (public.is_admin() or public.is_coordinator())
  with check (public.is_admin() or public.is_coordinator());

-- Cohort members: same access pattern as cohorts.
create policy "cohort_members_staff_read" on public.cohort_members
  for select using (public.is_staff());
create policy "cohort_members_self_read" on public.cohort_members
  for select using (student_id = auth.uid());
create policy "cohort_members_coach_read" on public.cohort_members
  for select using (
    exists (
      select 1 from public.coach_student_links
      where coach_id = auth.uid() and student_id = cohort_members.student_id
    )
  );
create policy "cohort_members_admin_coord_write" on public.cohort_members
  for all using (public.is_admin() or public.is_coordinator())
  with check (public.is_admin() or public.is_coordinator());

-- Milestones: visible to whoever can see the cohort; admin + coordinator write.
create policy "cohort_milestones_read_via_cohort" on public.cohort_milestones
  for select using (
    public.is_staff() or
    exists (
      select 1 from public.cohort_members
      where cohort_id = cohort_milestones.cohort_id and student_id = auth.uid()
    ) or
    exists (
      select 1
      from public.cohort_members cm
      join public.coach_student_links csl on csl.student_id = cm.student_id
      where cm.cohort_id = cohort_milestones.cohort_id and csl.coach_id = auth.uid()
    )
  );
create policy "cohort_milestones_admin_coord_write" on public.cohort_milestones
  for all using (public.is_admin() or public.is_coordinator())
  with check (public.is_admin() or public.is_coordinator());

-- =====================================================================
-- 7. UPDATED RPCs — assignments now take a relationship_type
-- =====================================================================

drop function if exists public.assign_coach(uuid, uuid);
drop function if exists public.unassign_coach(uuid, uuid);

create or replace function public.assign_coach(coach uuid, student uuid, rel public.relationship_type)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;

  insert into public.coach_student_links (coach_id, student_id, relationship_type, assigned_by)
  values (coach, student, rel, auth.uid())
  on conflict do nothing;

  insert into public.audit_log (actor_id, action, target_type, target_id, metadata)
  values (
    auth.uid(),
    'coach.assign',
    'link',
    coach::text || '/' || student::text || '/' || rel::text,
    jsonb_build_object('coach', coach, 'student', student, 'type', rel)
  );
end;
$$;

create or replace function public.unassign_coach(coach uuid, student uuid, rel public.relationship_type)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;

  delete from public.coach_student_links
   where coach_id = coach and student_id = student and relationship_type = rel;

  insert into public.audit_log (actor_id, action, target_type, target_id, metadata)
  values (
    auth.uid(),
    'coach.unassign',
    'link',
    coach::text || '/' || student::text || '/' || rel::text,
    jsonb_build_object('coach', coach, 'student', student, 'type', rel)
  );
end;
$$;

grant execute on function public.assign_coach(uuid, uuid, public.relationship_type) to authenticated;
grant execute on function public.unassign_coach(uuid, uuid, public.relationship_type) to authenticated;
grant execute on function public.is_director() to authenticated;
grant execute on function public.is_coordinator() to authenticated;
grant execute on function public.is_staff() to authenticated;

-- =====================================================================
-- 8. COHORT RPCs — single source of truth for cohort membership
-- =====================================================================

create or replace function public.add_cohort_member(cohort uuid, student uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not (public.is_admin() or public.is_coordinator()) then
    raise exception 'forbidden';
  end if;

  insert into public.cohort_members (cohort_id, student_id, added_by)
  values (cohort, student, auth.uid())
  on conflict do nothing;

  insert into public.audit_log (actor_id, action, target_type, target_id, metadata)
  values (
    auth.uid(),
    'cohort.add_member',
    'cohort_member',
    cohort::text || '/' || student::text,
    jsonb_build_object('cohort', cohort, 'student', student)
  );
end;
$$;

create or replace function public.remove_cohort_member(cohort uuid, student uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not (public.is_admin() or public.is_coordinator()) then
    raise exception 'forbidden';
  end if;

  delete from public.cohort_members
   where cohort_id = cohort and student_id = student;

  insert into public.audit_log (actor_id, action, target_type, target_id, metadata)
  values (
    auth.uid(),
    'cohort.remove_member',
    'cohort_member',
    cohort::text || '/' || student::text,
    jsonb_build_object('cohort', cohort, 'student', student)
  );
end;
$$;

grant execute on function public.add_cohort_member(uuid, uuid) to authenticated;
grant execute on function public.remove_cohort_member(uuid, uuid) to authenticated;
