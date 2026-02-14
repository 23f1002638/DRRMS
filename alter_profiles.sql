-- =====================================================
-- UPDATE: profiles table extensions
-- Adds fields for user profile management
-- =====================================================

DO $$
BEGIN
  -- Add phone_number if not exists
  BEGIN
    ALTER TABLE profiles ADD COLUMN phone_number TEXT;
  EXCEPTION
    WHEN duplicate_column THEN
      RAISE NOTICE 'phone_number already exists';
  END;

  -- Add avatar_url if not exists
  BEGIN
    ALTER TABLE profiles ADD COLUMN avatar_url TEXT;
  EXCEPTION
    WHEN duplicate_column THEN
      RAISE NOTICE 'avatar_url already exists';
  END;

  -- Add bio if not exists
  BEGIN
    ALTER TABLE profiles ADD COLUMN bio TEXT;
  EXCEPTION
    WHEN duplicate_column THEN
      RAISE NOTICE 'bio already exists';
  END;

  -- Add skills if not exists (for volunteers)
  BEGIN
    ALTER TABLE profiles ADD COLUMN skills TEXT[];
  EXCEPTION
    WHEN duplicate_column THEN
      RAISE NOTICE 'skills already exists';
  END;

  -- Add location if not exists
  BEGIN
    ALTER TABLE profiles ADD COLUMN location TEXT;
  EXCEPTION
    WHEN duplicate_column THEN
      RAISE NOTICE 'location already exists';
  END;

END $$;
