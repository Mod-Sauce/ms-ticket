-- Fix ALL RLS issues at once
-- Run this in Supabase SQL Editor

-- 1. Change default visibility to 'internal' (private by default)
ALTER TABLE public.tickets
  ALTER COLUMN visibility SET DEFAULT 'internal';

-- 2. Add policy for owners to read ALL tickets (including private)
DROP POLICY IF EXISTS "tickets_owner_read" ON public.tickets;
CREATE POLICY "tickets_owner_read" ON public.tickets FOR SELECT USING (
  (current_setting('request.headers', true)::json->>'x-user-role') = 'owner'
);

-- 3. Fix tickets update policy to allow owners to set visibility
DROP POLICY IF EXISTS "tickets_update" ON public.tickets;
CREATE POLICY "tickets_update" ON public.tickets FOR UPDATE
  USING (
    (current_setting('request.headers', true)::json->>'x-user-id') = user_id::text
    OR (current_setting('request.headers', true)::json->>'x-user-role') = 'owner'
  )
  WITH CHECK (
    (current_setting('request.headers', true)::json->>'x-user-id') = user_id::text
    OR (current_setting('request.headers', true)::json->>'x-user-role') = 'owner'
  );

-- 4. Fix ticket_fields policies to handle anonymous users
DROP POLICY IF EXISTS "ticket_fields_own_read" ON public.ticket_fields;
CREATE POLICY "ticket_fields_own_read" ON public.ticket_fields FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.tickets
    WHERE id = ticket_id
    AND (current_setting('request.headers', true)::json->>'x-user-id') != ''
    AND user_id = (current_setting('request.headers', true)::json->>'x-user-id')::uuid
  )
);

-- 5. Add policy for owners to read ALL ticket fields
DROP POLICY IF EXISTS "ticket_fields_owner_read" ON public.ticket_fields;
CREATE POLICY "ticket_fields_owner_read" ON public.ticket_fields FOR SELECT USING (
  (current_setting('request.headers', true)::json->>'x-user-role') = 'owner'
);

-- 6. Fix ticket_messages policies to handle anonymous users
DROP POLICY IF EXISTS "ticket_messages_own_read" ON public.ticket_messages;
CREATE POLICY "ticket_messages_own_read" ON public.ticket_messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.tickets
    WHERE id = ticket_id
    AND (current_setting('request.headers', true)::json->>'x-user-id') != ''
    AND user_id = (current_setting('request.headers', true)::json->>'x-user-id')::uuid
  )
);

-- 7. Add policy for owners to read ALL ticket messages
DROP POLICY IF EXISTS "ticket_messages_owner_read" ON public.ticket_messages;
CREATE POLICY "ticket_messages_owner_read" ON public.ticket_messages FOR SELECT USING (
  (current_setting('request.headers', true)::json->>'x-user-role') = 'owner'
);

-- Verify all policies
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  cmd,
  CASE 
    WHEN qual IS NOT NULL THEN 'USING clause present'
    ELSE 'No USING clause'
  END as using_clause,
  CASE 
    WHEN with_check IS NOT NULL THEN 'WITH CHECK clause present'
    ELSE 'No WITH CHECK clause'
  END as with_check_clause
FROM pg_policies
WHERE tablename IN ('tickets', 'ticket_fields', 'ticket_messages')
ORDER BY tablename, policyname;
