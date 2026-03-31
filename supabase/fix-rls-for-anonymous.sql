-- Fix RLS policies to handle anonymous users (empty x-user-id)
-- Run this in Supabase SQL Editor

-- Drop and recreate ticket_fields policies to handle empty user IDs
DROP POLICY IF EXISTS "ticket_fields_own_read" ON public.ticket_fields;
CREATE POLICY "ticket_fields_own_read" ON public.ticket_fields FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.tickets 
    WHERE id = ticket_id 
    AND (current_setting('request.headers', true)::json->>'x-user-id') != '' 
    AND user_id = (current_setting('request.headers', true)::json->>'x-user-id')::uuid
  )
);

-- Drop and recreate ticket_messages policies to handle empty user IDs
DROP POLICY IF EXISTS "ticket_messages_own_read" ON public.ticket_messages;
CREATE POLICY "ticket_messages_own_read" ON public.ticket_messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.tickets 
    WHERE id = ticket_id 
    AND (current_setting('request.headers', true)::json->>'x-user-id') != '' 
    AND user_id = (current_setting('request.headers', true)::json->>'x-user-id')::uuid
  )
);

-- Verify policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename IN ('ticket_fields', 'ticket_messages')
ORDER BY tablename, policyname;
