-- Add beta_tester column to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS beta_tester BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS beta_tier TEXT CHECK (beta_tier IN ('standard', 'premium', 'unlimited'));

-- Create beta_invite_codes table
CREATE TABLE IF NOT EXISTS beta_invite_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  max_uses INTEGER DEFAULT 1,
  uses_count INTEGER DEFAULT 0,
  beta_tier TEXT NOT NULL DEFAULT 'standard' CHECK (beta_tier IN ('standard', 'premium', 'unlimited')),
  expires_at TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create code_redemptions table to track who used which code
CREATE TABLE IF NOT EXISTS code_redemptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code_id UUID NOT NULL REFERENCES beta_invite_codes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  redeemed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(code_id, user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_beta_invite_codes_code ON beta_invite_codes(code);
CREATE INDEX IF NOT EXISTS idx_code_redemptions_user_id ON code_redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_code_redemptions_code_id ON code_redemptions(code_id);

-- Add RLS policies
ALTER TABLE beta_invite_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE code_redemptions ENABLE ROW LEVEL SECURITY;

-- Anyone can read invite codes (to validate them)
CREATE POLICY "Anyone can read invite codes" ON beta_invite_codes
  FOR SELECT USING (true);

-- Only admins can insert/update/delete invite codes (we'll add admin check later)
CREATE POLICY "Admins can manage invite codes" ON beta_invite_codes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      -- Add admin check here later
    )
  );

-- Users can see their own redemptions
CREATE POLICY "Users can see their redemptions" ON code_redemptions
  FOR SELECT USING (auth.uid() = user_id);

-- Anyone can insert redemptions (during signup)
CREATE POLICY "Anyone can redeem codes" ON code_redemptions
  FOR INSERT WITH CHECK (true);
