-- Check if auth_users policies exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'auth_users';

-- Also check if any users exist
SELECT id, username, created_at 
FROM public.auth_users 
ORDER BY created_at DESC 
LIMIT 5;
