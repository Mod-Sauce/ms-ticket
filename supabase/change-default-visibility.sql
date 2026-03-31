-- Change default visibility to 'internal' (private by default)
-- Owners can then make tickets public as needed
-- Run this in Supabase SQL Editor

ALTER TABLE public.tickets 
  ALTER COLUMN visibility SET DEFAULT 'internal';

-- Verify the change
SELECT column_name, column_default, data_type
FROM information_schema.columns
WHERE table_name = 'tickets' AND column_name = 'visibility';
