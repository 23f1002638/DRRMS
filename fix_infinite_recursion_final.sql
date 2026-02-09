-- =====================================================
-- DEFINITIVE FIX FOR INFINITE RECURSION IN PROFILES
-- =====================================================
-- This script completely removes and recreates the profiles
-- table with proper RLS policies that won't cause recursion
-- Run this in Supabase SQL Editor

-- Step 1: Disable RLS temporarily
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL existing policies (clean slate)
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'profiles' AND schemaname = 'public') 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.profiles';
    END LOOP;
END $$;

-- Step 3: Drop and recreate the trigger function (simplified)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'victim'),
    NOW(),
    NOW()
  );
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Profile already exists, just return
    RETURN NEW;
  WHEN OTHERS THEN
    -- Log error but don't fail the signup
    RAISE WARNING 'Error creating profile: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Step 5: Create SIMPLE, NON-RECURSIVE policies
-- These policies do NOT reference the profiles table in their conditions
-- This prevents infinite recursion

-- Allow anyone to read profiles (for public viewing)
CREATE POLICY "profiles_select_policy"
  ON public.profiles
  FOR SELECT
  USING (true);

-- Allow authenticated users to insert their own profile
-- Uses auth.uid() which comes from JWT, not from profiles table
CREATE POLICY "profiles_insert_policy"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Allow users to update only their own profile
-- Uses auth.uid() which comes from JWT, not from profiles table
CREATE POLICY "profiles_update_policy"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow users to delete only their own profile
CREATE POLICY "profiles_delete_policy"
  ON public.profiles
  FOR DELETE
  TO authenticated
  USING (auth.uid() = id);

-- Step 6: Re-enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Step 7: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated;
GRANT ALL ON public.profiles TO postgres, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres, anon, authenticated;

-- Step 8: Verification queries
SELECT 
  'Trigger: ' || CASE WHEN COUNT(*) > 0 THEN '✓ EXISTS' ELSE '✗ MISSING' END as trigger_status
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

SELECT 
  'Function: ' || CASE WHEN COUNT(*) > 0 THEN '✓ EXISTS' ELSE '✗ MISSING' END as function_status
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user';

SELECT 
  'Policies: ' || COUNT(*)::text || ' policies created' as policy_status
FROM pg_policies 
WHERE tablename = 'profiles' AND schemaname = 'public';

SELECT 
  'RLS: ' || CASE WHEN relrowsecurity THEN '✓ ENABLED' ELSE '✗ DISABLED' END as rls_status
FROM pg_class 
WHERE relname = 'profiles' AND relnamespace = 'public'::regnamespace;

-- List all policies for verification
SELECT 
  policyname as policy_name,
  cmd as command,
  CASE 
    WHEN roles = '{public}' THEN 'public'
    WHEN roles = '{authenticated}' THEN 'authenticated'
    ELSE array_to_string(roles, ', ')
  END as applies_to
FROM pg_policies 
WHERE tablename = 'profiles' AND schemaname = 'public'
ORDER BY policyname;
