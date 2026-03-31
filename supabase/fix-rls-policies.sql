-- Fix RLS policies for auth_users and profiles
-- Run this in Supabase SQL Editor to fix the RLS issues

-- Drop existing policies if they exist (to avoid conflicts)
drop policy if exists "auth_users_insert" on public.auth_users;
drop policy if exists "auth_users_read" on public.auth_users;
drop policy if exists "profiles_read" on public.profiles;
drop policy if exists "profiles_insert" on public.profiles;
drop policy if exists "profiles_update" on public.profiles;

-- Recreate policies for auth_users
create policy "auth_users_insert" on public.auth_users for insert with check (true);
create policy "auth_users_read" on public.auth_users for select using (true);

-- Recreate policies for profiles
create policy "profiles_read" on public.profiles for select using (true);
create policy "profiles_insert" on public.profiles for insert with check (true);
create policy "profiles_update" on public.profiles for update using (
  current_setting('request.headers', true)::json->>'x-user-id' = id::text
);
