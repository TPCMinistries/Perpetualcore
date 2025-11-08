-- Add conversation type to distinguish channels vs DMs
-- Add guest user support for external collaborators
-- Safe: Only adds new columns with defaults, doesn't modify existing data

-- Add conversation_type to shared_conversations
ALTER TABLE shared_conversations
  ADD COLUMN IF NOT EXISTS conversation_type TEXT DEFAULT 'channel'
    CHECK (conversation_type IN ('channel', 'dm', 'group_dm'));

-- Add guest support to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_guest BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS guest_invited_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS guest_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS guest_permissions JSONB DEFAULT '{
    "can_view_documents": true,
    "can_download_documents": false,
    "can_create_conversations": false,
    "can_invite_others": false,
    "can_use_ai": true
  }'::jsonb;

-- Create index for guest lookups
CREATE INDEX IF NOT EXISTS idx_profiles_is_guest ON profiles(is_guest) WHERE is_guest = true;
CREATE INDEX IF NOT EXISTS idx_profiles_guest_expires ON profiles(guest_expires_at) WHERE guest_expires_at IS NOT NULL;

-- Add index for conversation type
CREATE INDEX IF NOT EXISTS idx_shared_conversations_type ON shared_conversations(conversation_type);

-- Update RLS policies for guests
-- Guests can only see conversations they're participants in
CREATE POLICY "Guests can view conversations they participate in"
  ON shared_conversations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants cp
      INNER JOIN profiles p ON p.id = cp.user_id
      WHERE cp.conversation_id = shared_conversations.id
        AND cp.user_id = auth.uid()
        AND p.is_guest = true
    )
  );

-- Function to automatically expire guest access
CREATE OR REPLACE FUNCTION expire_guest_users()
RETURNS void AS $$
BEGIN
  -- Disable expired guests by removing them from all conversations
  DELETE FROM conversation_participants
  WHERE user_id IN (
    SELECT id FROM profiles
    WHERE is_guest = true
      AND guest_expires_at IS NOT NULL
      AND guest_expires_at < NOW()
  );

  -- Mark as expired in profiles (keep for audit trail)
  UPDATE profiles
  SET is_guest = false,
      updated_at = NOW()
  WHERE is_guest = true
    AND guest_expires_at IS NOT NULL
    AND guest_expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

COMMENT ON COLUMN shared_conversations.conversation_type IS 'Type of conversation: channel (team), dm (1-on-1), or group_dm (small group)';
COMMENT ON COLUMN profiles.is_guest IS 'External user with limited permissions and expiration';
COMMENT ON COLUMN profiles.guest_permissions IS 'JSON object defining what actions guest can perform';
