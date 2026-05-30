-- Round 3B — Public-facing contact info on profiles + avatar storage.

-- =====================================================================
-- 1. Extend profiles with public contact info
-- =====================================================================

alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists bio text;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists role_title text;
alter table public.profiles add column if not exists location text;

-- Allow users to update their own profile freely (already exists for the
-- name + must_change_password flag, but make sure all new fields are
-- writable).
-- The existing "profiles_self_update_name" policy already allows updating
-- any column on the row where id = auth.uid(), so no new policy is needed.

-- =====================================================================
-- 2. Avatars Storage bucket
-- =====================================================================

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Public read (avatars are visible to anyone who has the URL — they are
-- displayed on the marketing site / contact page etc.).
create policy "avatars_public_read"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- Users can upload to a folder named after their own id only.
create policy "avatars_self_write"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars_self_update"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars_self_delete"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
