-- =====================================================
-- FIX: Add missing INSERT policy for profiles table
-- =====================================================
-- This fixes the "Database error saving new user" issue
-- Run this in Supabase SQL Editor

-- Add INSERT policy to allow the handle_new_user() trigger to create profiles
CREATE POLICY "Allow profile creation during signup"
  ON profiles FOR INSERT
  WITH CHECK (true);

-- Note: This policy allows the trigger function to insert new profiles
-- The trigger itself validates that the user is authenticated via auth.users
