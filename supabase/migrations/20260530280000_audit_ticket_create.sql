-- Drop a row in audit_log whenever a new ticket is created so the activity
-- feed surfaces "X a posé une question" to staff. The trigger runs as
-- SECURITY DEFINER so it bypasses the no-insert RLS on audit_log.

create or replace function public.audit_ticket_create()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.audit_log (actor_id, action, target_type, target_id, metadata)
  values (
    new.student_id,
    'ticket.create',
    'ticket',
    new.id::text,
    jsonb_build_object('subject', new.subject, 'category', new.category)
  );
  return new;
end;
$$;

drop trigger if exists tickets_audit_on_create on public.tickets;
create trigger tickets_audit_on_create
  after insert on public.tickets
  for each row execute function public.audit_ticket_create();
