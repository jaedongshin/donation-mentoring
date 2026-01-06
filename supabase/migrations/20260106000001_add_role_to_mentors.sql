ALTER TABLE public.mentors ADD COLUMN IF NOT EXISTS role text DEFAULT 'mentor';
ALTER TABLE public.mentors ADD CONSTRAINT mentors_role_check CHECK (role IN ('admin', 'mentor'));
