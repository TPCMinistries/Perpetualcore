-- Add onboarding fields to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS industry TEXT,
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS primary_goal TEXT;

-- Create onboarding progress tracking table
CREATE TABLE IF NOT EXISTS onboarding_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  step_key TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, step_key)
);

-- Enable RLS
ALTER TABLE onboarding_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for onboarding_progress
CREATE POLICY "Users can view their own onboarding progress"
  ON onboarding_progress
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own onboarding progress"
  ON onboarding_progress
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own onboarding progress"
  ON onboarding_progress
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Helper function to mark onboarding step complete
CREATE OR REPLACE FUNCTION mark_onboarding_step_complete(
  p_step_key TEXT
) RETURNS VOID AS $$
BEGIN
  INSERT INTO onboarding_progress (user_id, step_key, completed, completed_at)
  VALUES (auth.uid(), p_step_key, TRUE, NOW())
  ON CONFLICT (user_id, step_key)
  DO UPDATE SET
    completed = TRUE,
    completed_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get user's onboarding progress
CREATE OR REPLACE FUNCTION get_onboarding_progress()
RETURNS TABLE (
  step_key TEXT,
  completed BOOLEAN,
  completed_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    op.step_key,
    op.completed,
    op.completed_at
  FROM onboarding_progress op
  WHERE op.user_id = auth.uid()
  ORDER BY op.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_onboarding_progress_user_id ON onboarding_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_progress_step_key ON onboarding_progress(step_key);
CREATE INDEX IF NOT EXISTS idx_profiles_industry ON profiles(industry);
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_completed ON profiles(onboarding_completed);
