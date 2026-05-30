-- Phase 2A — Add new role values for the CBTE model.
-- ALTER TYPE ADD VALUE cannot be used in the same transaction as the new values,
-- so this lives in its own migration. The next migration uses these values.

alter type public.user_role add value if not exists 'coordinator';
alter type public.user_role add value if not exists 'director';
