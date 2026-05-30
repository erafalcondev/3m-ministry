-- Round 3A patch: let any approved user see basic info of any other approved
-- user. This is needed so that:
--  * Author names show on ticket messages (e.g. when an admin replies to a
--    student, the student must be able to resolve the admin's name).
--  * The future Contacts directory can list everyone with their email.
-- Profile rows for pending / refused users stay invisible to peers — only
-- staff (via the existing profiles_admin_read policy) can see those.

create policy "profiles_team_read" on public.profiles
  for select using (
    status = 'approved' and exists (
      select 1 from public.profiles me
      where me.id = auth.uid() and me.status = 'approved'
    )
  );
