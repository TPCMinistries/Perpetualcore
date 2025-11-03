-- Set lorenzo@theglobalenterprise.org as admin
-- Run this in your Supabase SQL Editor

-- Update the user's role to admin
UPDATE profiles
SET role = 'admin'
WHERE email = 'lorenzo@theglobalenterprise.org';

-- Verify the change
SELECT id, email, full_name, role
FROM profiles
WHERE email = 'lorenzo@theglobalenterprise.org';
