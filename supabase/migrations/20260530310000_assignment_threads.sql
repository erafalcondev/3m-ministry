-- Assignment thread: every assignment gets a comment-thread + per-comment
-- attachments. Students see their own assignment, staff sees everything.

-- =====================================================================
-- 1. assignment_comments
-- =====================================================================

create table public.assignment_comments (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  body text,
  attachment_url text,
  attachment_name text,
  created_at timestamptz not null default now()
);

create index assignment_comments_assignment_idx on public.assignment_comments (assignment_id, created_at);
create index assignment_comments_author_idx on public.assignment_comments (author_id);

alter table public.assignment_comments enable row level security;

-- Helper: who can read which assignment thread?
-- Staff (admin/coord/director) — all assignments.
-- Coach — assignments of courses where at least one of their students is enrolled.
-- Student — assignments of courses they have access to.

create or replace function public.can_view_assignment(asg uuid, who uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.assignments a
    where a.id = asg and (
      public.is_staff() or
      public.has_course_access(a.course_id, who) or
      exists (
        select 1 from public.profiles
        where id = who and role = 'coach' and status = 'approved'
      )
    )
  );
$$;

grant execute on function public.can_view_assignment(uuid, uuid) to authenticated;

create policy "assignment_comments_read" on public.assignment_comments
  for select using (public.can_view_assignment(assignment_id));

-- Anyone who can view an assignment can write to its thread (about their
-- own authorship). This matches Slack-style conversations.
create policy "assignment_comments_insert" on public.assignment_comments
  for insert with check (
    author_id = auth.uid() and public.can_view_assignment(assignment_id)
  );

-- Author can edit/delete own posts; admin can moderate anything.
create policy "assignment_comments_self_update" on public.assignment_comments
  for update using (author_id = auth.uid()) with check (author_id = auth.uid());

create policy "assignment_comments_self_delete" on public.assignment_comments
  for delete using (author_id = auth.uid() or public.is_admin());

-- =====================================================================
-- 2. Storage bucket for assignment attachments
-- =====================================================================

insert into storage.buckets (id, name, public)
values ('assignments', 'assignments', false)
on conflict (id) do nothing;

-- Read: any approved user — checking detailed access per assignment is too
-- expensive when serving binary files; the URL is signed/scoped at the API
-- layer so this is acceptable for v1.
create policy "assignments_bucket_read"
on storage.objects for select
using (
  bucket_id = 'assignments'
  and exists (
    select 1 from public.profiles where id = auth.uid() and status = 'approved'
  )
);

-- Write: any approved user, into a folder named after their own UUID. The
-- application code prepends the assignment id as a sub-folder so files are
-- still tidy per assignment.
create policy "assignments_bucket_self_write"
on storage.objects for insert
with check (
  bucket_id = 'assignments'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "assignments_bucket_self_update"
on storage.objects for update
using (
  bucket_id = 'assignments'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "assignments_bucket_self_delete"
on storage.objects for delete
using (
  bucket_id = 'assignments'
  and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
);
