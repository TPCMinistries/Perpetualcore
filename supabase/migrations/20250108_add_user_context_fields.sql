-- Add user context fields for personalization
-- These are captured during onboarding and used throughout the platform

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS user_role TEXT, -- e.g., 'teacher', 'researcher', 'developer', 'student', 'business_owner', 'content_creator'
ADD COLUMN IF NOT EXISTS industry TEXT, -- e.g., 'education', 'technology', 'healthcare', 'legal', 'creative', 'finance'
ADD COLUMN IF NOT EXISTS primary_goal TEXT, -- What they want to achieve first
ADD COLUMN IF NOT EXISTS team_context TEXT, -- 'solo', 'team_member', 'team_lead', 'educator', 'student'
ADD COLUMN IF NOT EXISTS content_types TEXT[], -- Array of content types they'll work with
ADD COLUMN IF NOT EXISTS ai_experience_level TEXT DEFAULT 'beginner', -- 'beginner', 'intermediate', 'advanced'
ADD COLUMN IF NOT EXISTS preferred_name TEXT, -- How they want to be addressed
ADD COLUMN IF NOT EXISTS timezone TEXT, -- For scheduling and timestamps
ADD COLUMN IF NOT EXISTS use_case_tags TEXT[]; -- Flexible tags for filtering/segmentation

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_profiles_user_role ON profiles(user_role);
CREATE INDEX IF NOT EXISTS idx_profiles_industry ON profiles(industry);
CREATE INDEX IF NOT EXISTS idx_profiles_team_context ON profiles(team_context);
CREATE INDEX IF NOT EXISTS idx_profiles_ai_experience ON profiles(ai_experience_level);

-- Add comments for documentation
COMMENT ON COLUMN profiles.user_role IS 'Primary role: teacher, researcher, developer, student, business_owner, content_creator, etc.';
COMMENT ON COLUMN profiles.industry IS 'Industry/field: education, technology, healthcare, legal, creative, finance, etc.';
COMMENT ON COLUMN profiles.primary_goal IS 'What they want to achieve first - free text from onboarding';
COMMENT ON COLUMN profiles.team_context IS 'Team situation: solo, team_member, team_lead, educator, student';
COMMENT ON COLUMN profiles.content_types IS 'Types of content they work with: documents, code, research_papers, videos, images, etc.';
COMMENT ON COLUMN profiles.ai_experience_level IS 'AI tool experience: beginner, intermediate, advanced - affects UI complexity';
COMMENT ON COLUMN profiles.preferred_name IS 'How they prefer to be addressed (may differ from full_name)';
COMMENT ON COLUMN profiles.use_case_tags IS 'Flexible tags for segmentation and filtering';
