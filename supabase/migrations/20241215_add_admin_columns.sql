-- Add admin columns to profiles table
-- Run this in Supabase SQL Editor

-- Add is_admin and is_super_admin columns to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user',
ADD COLUMN IF NOT EXISTS last_sign_in_at TIMESTAMPTZ;

-- Create user_profiles view for admin panel compatibility
CREATE OR REPLACE VIEW user_profiles AS
SELECT
  p.id,
  p.email,
  p.full_name,
  p.avatar_url,
  p.organization_id,
  p.is_admin,
  p.is_super_admin,
  p.role,
  p.created_at,
  p.last_sign_in_at,
  p.onboarding_completed,
  p.user_role,
  p.industry,
  p.ai_experience_level
FROM profiles p;

-- Grant access to the view
GRANT SELECT ON user_profiles TO authenticated;
GRANT SELECT ON user_profiles TO service_role;

-- Create index for admin queries
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON profiles(is_admin) WHERE is_admin = TRUE;
CREATE INDEX IF NOT EXISTS idx_profiles_is_super_admin ON profiles(is_super_admin) WHERE is_super_admin = TRUE;

-- Set yourself as super admin (replace with your user ID)
-- You can find your user ID in Supabase Auth > Users
-- UPDATE profiles SET is_super_admin = TRUE, is_admin = TRUE WHERE email = 'your-email@example.com';

-- RLS policy for user_profiles view (users can only see their own profile, admins can see all)
CREATE POLICY "Users can view own profile via user_profiles" ON profiles
  FOR SELECT
  USING (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin = TRUE OR is_super_admin = TRUE)
    )
  );
