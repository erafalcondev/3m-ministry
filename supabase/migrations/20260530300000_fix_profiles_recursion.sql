-- Hotfix: the profiles_team_read policy created in 20260530270000 referenced
-- public.profiles inside its USING clause, triggering "infinite recursion
-- detected in policy for relation profiles" (Postgres error 42P17) on every
-- read. This broke login because LoginForm reads role+status right after
-- signInWithPassword, and the failure surfaced as "Something went wrong".
-- Rewrite the policy to gate on a security-definer helper which bypasses
-- RLS instead of a direct sub-select on the same table.

create or replace function public.is_approved()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select status = 'approved' from public.profiles where id = auth.uid()),
    false
  );
$$;

grant execute on function public.is_approved() to authenticated;

drop policy if exists "profiles_team_read" on public.profiles;

create policy "profiles_team_read" on public.profiles
  for select using (
    status = 'approved' and public.is_approved()
  );
