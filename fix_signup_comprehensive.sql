-- =====================================================
-- COMPREHENSIVE FIX FOR SIGN-UP ISSUES
-- =====================================================
-- Run this complete script in Supabase SQL Editor
-- This covers all potential issues with the sign-up flow

-- 1. Recreate the function with error handling
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'victim')
  );
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    RAISE WARNING 'Failed to create profile: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- 3. Grant permissions
GRANT EXECUTE ON FUNCTION handle_new_user() TO postgres, authenticated, anon;

-- 4. Add INSERT policy
DROP POLICY IF EXISTS "Allow profile creation during signup" ON public.profiles;

CREATE POLICY "Allow profile creation during signup"
  ON public.profiles
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- 5. Verify setup
SELECT 'Trigger exists: ' || COUNT(*)::text 
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

SELECT 'Function exists: ' || COUNT(*)::text 
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user';

SELECT 'INSERT policy exists: ' || COUNT(*)::text 
FROM pg_policies 
WHERE tablename = 'profiles' AND cmd = 'INSERT';
