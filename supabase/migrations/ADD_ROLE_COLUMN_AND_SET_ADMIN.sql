-- Add role column to profiles table and set admin
-- Run this in your Supabase SQL Editor

-- Step 1: Add the role column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'profiles'
    AND column_name = 'role'
  ) THEN
    ALTER TABLE profiles
    ADD COLUMN role TEXT DEFAULT 'member';

    RAISE NOTICE 'Added role column to profiles table';
  ELSE
    RAISE NOTICE 'Role column already exists';
  END IF;
END $$;

-- Step 2: Update your user to be admin
UPDATE profiles
SET role = 'admin'
WHERE email = 'lorenzo@theglobalenterprise.org';

-- Step 3: Verify the change
SELECT id, email, full_name, role
FROM profiles
WHERE email = 'lorenzo@theglobalenterprise.org';
