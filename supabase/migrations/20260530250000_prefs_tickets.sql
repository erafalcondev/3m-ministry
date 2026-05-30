-- Vague 2B round 2 — Per-user theme preferences + Questions/Tickets system.

-- =====================================================================
-- 1. USER PREFERENCES
-- =====================================================================

create table public.user_preferences (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  theme text not null default 'dark' check (theme in ('dark', 'light')),
  accent text not null default '#0ea5e9' check (accent ~* '^#[0-9a-f]{6}$'),
  updated_at timestamptz not null default now()
);

create or replace function public.touch_user_preferences()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger user_preferences_touch
  before update on public.user_preferences
  for each row execute function public.touch_user_preferences();

alter table public.user_preferences enable row level security;

create policy "prefs_self_read" on public.user_preferences
  for select using (user_id = auth.uid());

create policy "prefs_self_upsert" on public.user_preferences
  for insert with check (user_id = auth.uid());

create policy "prefs_self_update" on public.user_preferences
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- =====================================================================
-- 2. TICKETS — student-asks, admin-replies
-- =====================================================================

create type public.ticket_status as enum ('open', 'in_progress', 'resolved', 'archived');

create table public.tickets (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  subject text not null,
  status public.ticket_status not null default 'open',
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  archived_at timestamptz
);

create index tickets_student_idx on public.tickets (student_id);
create index tickets_status_idx on public.tickets (status);
create index tickets_created_idx on public.tickets (created_at desc);

create table public.ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets (id) on delete cascade,
  author_id uuid references public.profiles (id) on delete set null,
  body text not null,
  created_at timestamptz not null default now()
);

create index ticket_messages_ticket_idx on public.ticket_messages (ticket_id);
create index ticket_messages_created_idx on public.ticket_messages (created_at);

alter table public.tickets enable row level security;
alter table public.ticket_messages enable row level security;

-- Tickets: student sees own, admin sees all
create policy "tickets_student_read" on public.tickets
  for select using (student_id = auth.uid());

create policy "tickets_admin_read" on public.tickets
  for select using (public.is_admin());

create policy "tickets_student_insert" on public.tickets
  for insert with check (student_id = auth.uid());

create policy "tickets_admin_update" on public.tickets
  for update using (public.is_admin()) with check (public.is_admin());

create policy "tickets_student_update" on public.tickets
  for update using (student_id = auth.uid()) with check (student_id = auth.uid());

-- Messages: visible to ticket participants (student + admin)
create policy "ticket_messages_student_read" on public.ticket_messages
  for select using (
    exists (
      select 1 from public.tickets
      where id = ticket_messages.ticket_id and student_id = auth.uid()
    )
  );

create policy "ticket_messages_admin_read" on public.ticket_messages
  for select using (public.is_admin());

create policy "ticket_messages_insert" on public.ticket_messages
  for insert with check (
    author_id = auth.uid() and (
      public.is_admin() or
      exists (
        select 1 from public.tickets
        where id = ticket_messages.ticket_id and student_id = auth.uid()
      )
    )
  );
