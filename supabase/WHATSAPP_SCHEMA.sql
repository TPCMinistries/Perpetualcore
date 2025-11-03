-- =====================================================
-- WHATSAPP INTEGRATION SCHEMA
-- For Twilio WhatsApp messaging
-- =====================================================

-- WhatsApp accounts table (connected phone numbers)
CREATE TABLE IF NOT EXISTS whatsapp_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  phone_number TEXT NOT NULL, -- User's WhatsApp number (E.164 format)
  twilio_phone_number TEXT, -- Twilio sandbox or dedicated number

  status TEXT DEFAULT 'pending', -- 'pending', 'verified', 'suspended'
  verification_code TEXT,
  verified_at TIMESTAMPTZ,

  -- Settings
  enabled BOOLEAN DEFAULT true,
  ai_enabled BOOLEAN DEFAULT true, -- Auto-reply with AI
  notification_enabled BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, phone_number)
);

-- WhatsApp messages table
CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  whatsapp_account_id UUID NOT NULL REFERENCES whatsapp_accounts(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Message identifiers
  twilio_message_sid TEXT UNIQUE,

  -- Message details
  direction TEXT NOT NULL, -- 'inbound', 'outbound'
  from_number TEXT NOT NULL,
  to_number TEXT NOT NULL,
  body TEXT,

  -- Media
  media_url TEXT,
  media_content_type TEXT,
  num_media INTEGER DEFAULT 0,

  -- Status
  status TEXT DEFAULT 'sent', -- 'queued', 'sent', 'delivered', 'read', 'failed'
  error_message TEXT,

  -- AI response
  ai_response BOOLEAN DEFAULT false,
  ai_model TEXT,
  processing_time_ms INTEGER,

  -- Metadata
  twilio_status TEXT,
  raw_data JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- WhatsApp conversations (threading)
CREATE TABLE IF NOT EXISTS whatsapp_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  whatsapp_account_id UUID NOT NULL REFERENCES whatsapp_accounts(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  phone_number TEXT NOT NULL, -- Other party's number

  title TEXT,
  last_message_at TIMESTAMPTZ,
  last_message_preview TEXT,

  message_count INTEGER DEFAULT 0,
  unread_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(whatsapp_account_id, phone_number)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_whatsapp_accounts_user ON whatsapp_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_accounts_org ON whatsapp_accounts(organization_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_accounts_phone ON whatsapp_accounts(phone_number);

CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_account ON whatsapp_messages(whatsapp_account_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_user ON whatsapp_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_direction ON whatsapp_messages(direction);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_created ON whatsapp_messages(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_account ON whatsapp_conversations(whatsapp_account_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_phone ON whatsapp_conversations(phone_number);

-- RLS Policies
ALTER TABLE whatsapp_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own WhatsApp accounts"
  ON whatsapp_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own WhatsApp accounts"
  ON whatsapp_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own WhatsApp accounts"
  ON whatsapp_accounts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own WhatsApp messages"
  ON whatsapp_messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert WhatsApp messages"
  ON whatsapp_messages FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view their own WhatsApp conversations"
  ON whatsapp_conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can manage WhatsApp conversations"
  ON whatsapp_conversations FOR ALL
  USING (true)
  WITH CHECK (true);

-- Triggers
CREATE TRIGGER update_whatsapp_accounts_updated_at
  BEFORE UPDATE ON whatsapp_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_whatsapp_messages_updated_at
  BEFORE UPDATE ON whatsapp_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- DONE! WhatsApp schema is ready
-- =====================================================
