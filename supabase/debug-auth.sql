-- Debug script to check auth setup
-- Run this in Supabase SQL Editor to diagnose login issues

-- 1. Check if users exist
SELECT id, username, created_at 
FROM public.auth_users 
ORDER BY created_at DESC 
LIMIT 5;

-- 2. Check if profiles exist
SELECT id, username, role, created_at 
FROM public.profiles 
ORDER BY created_at DESC 
LIMIT 5;

-- 3. Check RLS policies on auth_users
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'auth_users';

-- 4. Check RLS policies on profiles
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'profiles';
