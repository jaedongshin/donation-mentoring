DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.admins CASCADE;

ALTER TABLE public.mentors ADD COLUMN IF NOT EXISTS password text;
