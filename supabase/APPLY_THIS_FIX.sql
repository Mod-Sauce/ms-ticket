-- CRITICAL FIX: Enable Supabase to join auth_users and profiles tables
-- Run this in Supabase SQL Editor to fix the "Could not find a relationship" error
-- This will make the profiles(...) join syntax work properly

-- Step 1: Ensure the foreign key exists
DO $$ 
BEGIN
    -- Drop the constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'profiles_id_fkey' 
        AND table_name = 'profiles'
    ) THEN
        ALTER TABLE public.profiles DROP CONSTRAINT profiles_id_fkey;
    END IF;
    
    -- Recreate the foreign key constraint
    ALTER TABLE public.profiles 
        ADD CONSTRAINT profiles_id_fkey 
        FOREIGN KEY (id) 
        REFERENCES public.auth_users(id) 
        ON DELETE CASCADE;
END $$;

-- Step 2: Refresh Supabase schema cache
-- This forces Supabase to recognize the relationship
NOTIFY pgrst, 'reload schema';

-- Step 3: Verify the relationship exists
SELECT
    'profiles' as table_name,
    'id' as column_name,
    'auth_users' as references_table,
    'id' as references_column,
    'CASCADE' as on_delete,
    CASE 
        WHEN EXISTS (
            SELECT 1 
            FROM information_schema.table_constraints AS tc 
            JOIN information_schema.key_column_usage AS kcu
              ON tc.constraint_name = kcu.constraint_name
            WHERE tc.constraint_type = 'FOREIGN KEY' 
              AND tc.table_name='profiles'
              AND kcu.column_name='id'
        ) THEN 'EXISTS ✓'
        ELSE 'MISSING ✗'
    END as status;
