-- Bug fix: an admin who approves a user via approve_user() only flipped the
-- public.profiles.status flag. Supabase Auth, however, blocks sign-in until
-- auth.users.email_confirmed_at is set — and the error returned is
-- "Invalid login credentials" (no leakage of whether email/password is the
-- problem). So users were approved in our app but couldn't actually log in.
--
-- The fix: approve_user now also confirms the auth.users row. We also
-- back-fill every already-approved profile whose auth.users row is still
-- unconfirmed.

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

  -- Confirm the Supabase Auth row so signInWithPassword stops failing with
  -- "Invalid login credentials" on the very first attempt.
  update auth.users
     set email_confirmed_at = coalesce(email_confirmed_at, now())
   where id = target;

  insert into public.audit_log (actor_id, action, target_type, target_id)
  values (auth.uid(), 'user.approve', 'profile', target::text);
end;
$$;

-- Back-fill: confirm every already-approved profile whose auth.users row
-- is unconfirmed. Safe to re-run.
update auth.users u
   set email_confirmed_at = coalesce(u.email_confirmed_at, now())
  from public.profiles p
 where p.id = u.id
   and p.status = 'approved';
