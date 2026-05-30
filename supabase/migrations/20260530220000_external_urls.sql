-- Add optional external URLs to courses and assignments so the admin can
-- point to an off-platform page (Notion, Drive, classroom doc, etc.).

alter table public.courses add column external_url text;
alter table public.assignments add column external_url text;
