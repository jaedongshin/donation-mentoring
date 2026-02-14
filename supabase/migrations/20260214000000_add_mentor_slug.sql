-- Add slug column to mentors table
ALTER TABLE public.mentors ADD COLUMN slug TEXT;

-- Generate slugs for existing mentors
-- Use COALESCE to handle null name_en
UPDATE public.mentors 
SET slug = LOWER(REGEXP_REPLACE(COALESCE(name_en, id::text), '[^a-zA-Z0-9]+', '_', 'g')) || '_' || SUBSTRING(id::text, 1, 4)
WHERE slug IS NULL;

-- Make slug NOT NULL and UNIQUE
ALTER TABLE public.mentors ALTER COLUMN slug SET NOT NULL;
ALTER TABLE public.mentors ADD CONSTRAINT mentors_slug_unique UNIQUE (slug);

-- Add index for faster lookups
CREATE INDEX idx_mentors_slug ON public.mentors(slug);
