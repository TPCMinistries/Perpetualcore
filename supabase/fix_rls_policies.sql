-- Fix infinite recursion in profiles RLS policies

-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can view profiles in their organization" ON profiles;

-- Create a simpler policy that doesn't cause recursion
-- Users can view their own profile
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can view other profiles in the same organization (using a function to avoid recursion)
CREATE OR REPLACE FUNCTION user_organization_id()
RETURNS UUID AS $$
  SELECT organization_id FROM profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

CREATE POLICY "Users can view organization profiles" ON profiles
  FOR SELECT USING (organization_id = user_organization_id());

-- Update the existing update policy to be more specific
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);
