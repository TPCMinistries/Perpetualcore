-- Add demo_mode field to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS demo_mode BOOLEAN DEFAULT FALSE;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_demo_mode ON profiles(demo_mode);
