-- Repair the client/schema mismatch that prevented ranking writes.
ALTER TABLE public.ranking
  ADD COLUMN IF NOT EXISTS hidden boolean NOT NULL DEFAULT false;

ALTER TABLE public.ranking
  ADD COLUMN IF NOT EXISTS country text;

NOTIFY pgrst, 'reload schema';
