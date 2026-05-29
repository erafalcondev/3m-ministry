-- 3M Ministry Portail — Phase 1
-- Profiles, roles, approval workflow, coach-student links, audit log.
-- All access gated by RLS policies. Security lives in the DB, not the app.

-- =====================================================================
-- 1. ENUMS
-- =====================================================================

create type public.user_role as enum ('student', 'coach', 'admin');
create type public.user_status as enum ('pending', 'approved', 'refused');

-- =====================================================================
-- 2. PROFILES — one row per auth.users entry, joined by id
-- =====================================================================

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  full_name text,
  role public.user_role not null default 'student',
  status public.user_status not null default 'pending',
  motivation text,
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  approved_by uuid references public.profiles (id) on delete set null,
  refused_at timestamptz,
  refused_by uuid references public.profiles (id) on delete set null,
  refused_reason text
);

create index profiles_status_idx on public.profiles (status);
create index profiles_role_idx on public.profiles (role);

-- =====================================================================
-- 3. COACH ↔ STUDENT LINKS — many-to-many
-- =====================================================================

create table public.coach_student_links (
  coach_id uuid not null references public.profiles (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  assigned_at timestamptz not null default now(),
  assigned_by uuid references public.profiles (id) on delete set null,
  primary key (coach_id, student_id)
);

create index coach_student_links_coach_idx on public.coach_student_links (coach_id);
create index coach_student_links_student_idx on public.coach_student_links (student_id);

-- =====================================================================
-- 4. AUDIT LOG — admin-visible trail of sensitive actions
-- =====================================================================

create table public.audit_log (
  id bigserial primary key,
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null,
  target_type text,
  target_id text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index audit_log_actor_idx on public.audit_log (actor_id);
create index audit_log_created_idx on public.audit_log (created_at desc);

-- =====================================================================
-- 5. HELPERS — security-definer functions for use inside RLS policies.
--    Marked SECURITY DEFINER so they bypass RLS when reading profiles
--    (otherwise checking "am I an admin?" would itself be gated by RLS
--    and recurse).
-- =====================================================================

create or replace function public.current_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.current_status()
returns public.user_status
language sql
stable
security definer
set search_path = public
as $$
  select status from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select role = 'admin' and status = 'approved' from public.profiles where id = auth.uid()),
    false
  );
$$;

create or replace function public.is_coach_of(student uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.coach_student_links
    where coach_id = auth.uid() and student_id = student
  );
$$;

-- =====================================================================
-- 6. AUTO-CREATE PROFILE ON SIGNUP
-- =====================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, motivation)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'motivation'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =====================================================================
-- 7. RLS POLICIES
-- =====================================================================

alter table public.profiles enable row level security;
alter table public.coach_student_links enable row level security;
alter table public.audit_log enable row level security;

-- profiles: self-read always; coaches read their assigned students;
-- admins read everyone. Direct writes restricted to admins (status/role
-- changes); a self-update path for full_name only is allowed.

create policy "profiles_self_read" on public.profiles
  for select using (id = auth.uid());

create policy "profiles_admin_read" on public.profiles
  for select using (public.is_admin());

create policy "profiles_coach_read_students" on public.profiles
  for select using (public.is_coach_of(id));

create policy "profiles_self_update_name" on public.profiles
  for update using (id = auth.uid())
  with check (id = auth.uid());

create policy "profiles_admin_update" on public.profiles
  for update using (public.is_admin())
  with check (public.is_admin());

create policy "profiles_admin_delete" on public.profiles
  for delete using (public.is_admin());

-- coach_student_links: visible to involved coach + student + any admin.
-- Writes are admin-only.

create policy "coach_student_links_self_visible" on public.coach_student_links
  for select using (coach_id = auth.uid() or student_id = auth.uid());

create policy "coach_student_links_admin_read" on public.coach_student_links
  for select using (public.is_admin());

create policy "coach_student_links_admin_write" on public.coach_student_links
  for all using (public.is_admin()) with check (public.is_admin());

-- audit_log: admins read; inserts done via security-definer RPCs only,
-- so no insert policy is exposed to clients.

create policy "audit_log_admin_read" on public.audit_log
  for select using (public.is_admin());

-- =====================================================================
-- 8. ADMIN RPCS — single source of truth for sensitive ops, with audit
-- =====================================================================

create or replace function public.approve_user(target uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;

  update public.profiles
     set status = 'approved',
         approved_at = now(),
         approved_by = auth.uid(),
         refused_at = null,
         refused_by = null,
         refused_reason = null
   where id = target;

  insert into public.audit_log (actor_id, action, target_type, target_id)
  values (auth.uid(), 'user.approve', 'profile', target::text);
end;
$$;

create or replace function public.refuse_user(target uuid, reason text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;

  update public.profiles
     set status = 'refused',
         refused_at = now(),
         refused_by = auth.uid(),
         refused_reason = reason,
         approved_at = null,
         approved_by = null
   where id = target;

  insert into public.audit_log (actor_id, action, target_type, target_id, metadata)
  values (auth.uid(), 'user.refuse', 'profile', target::text, jsonb_build_object('reason', reason));
end;
$$;

create or replace function public.set_user_role(target uuid, new_role public.user_role)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  old_role public.user_role;
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;

  select role into old_role from public.profiles where id = target;

  update public.profiles set role = new_role where id = target;

  insert into public.audit_log (actor_id, action, target_type, target_id, metadata)
  values (
    auth.uid(),
    'user.role_change',
    'profile',
    target::text,
    jsonb_build_object('from', old_role, 'to', new_role)
  );
end;
$$;

create or replace function public.assign_coach(coach uuid, student uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;

  insert into public.coach_student_links (coach_id, student_id, assigned_by)
  values (coach, student, auth.uid())
  on conflict do nothing;

  insert into public.audit_log (actor_id, action, target_type, target_id, metadata)
  values (
    auth.uid(),
    'coach.assign',
    'link',
    coach::text || '/' || student::text,
    jsonb_build_object('coach', coach, 'student', student)
  );
end;
$$;

create or replace function public.unassign_coach(coach uuid, student uuid)
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
   where coach_id = coach and student_id = student;

  insert into public.audit_log (actor_id, action, target_type, target_id, metadata)
  values (
    auth.uid(),
    'coach.unassign',
    'link',
    coach::text || '/' || student::text,
    jsonb_build_object('coach', coach, 'student', student)
  );
end;
$$;

grant execute on function public.approve_user(uuid) to authenticated;
grant execute on function public.refuse_user(uuid, text) to authenticated;
grant execute on function public.set_user_role(uuid, public.user_role) to authenticated;
grant execute on function public.assign_coach(uuid, uuid) to authenticated;
grant execute on function public.unassign_coach(uuid, uuid) to authenticated;
grant execute on function public.current_role() to authenticated;
grant execute on function public.current_status() to authenticated;
grant execute on function public.is_admin() to authenticated;
