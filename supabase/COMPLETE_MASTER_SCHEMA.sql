-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Create organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create documents table with vector embeddings
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  file_url TEXT,
  file_type TEXT,
  embedding vector(1536), -- OpenAI embedding dimension
  summary TEXT, -- AI-generated summary (3-4 sentences)
  key_points JSONB, -- Array of key points extracted
  document_type TEXT, -- Detected type (e.g., Legal Contract, Research Paper)
  summary_generated_at TIMESTAMPTZ, -- When summary was created
  summary_tokens_used INTEGER, -- Tokens used for summary
  summary_cost_usd DECIMAL(10, 4), -- Cost in USD
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  model TEXT NOT NULL DEFAULT 'claude-sonnet-4',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  due_date TIMESTAMPTZ,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create calendar_events table
CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  google_event_id TEXT,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  location TEXT,
  attendees JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create emails table
CREATE TABLE IF NOT EXISTS emails (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  gmail_message_id TEXT,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  to_addresses TEXT[] NOT NULL,
  cc_addresses TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_approval', 'approved', 'sent', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create whatsapp_messages table
CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  twilio_message_sid TEXT,
  from_number TEXT NOT NULL,
  to_number TEXT NOT NULL,
  body TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create usage_logs table
CREATE TABLE IF NOT EXISTS usage_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  feature TEXT NOT NULL,
  tokens_used INTEGER,
  cost DECIMAL(10, 6),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create subscriptions table for Stripe
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'trialing')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_organization_id ON profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_documents_organization_id ON documents(organization_id);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_organization_id ON conversations(organization_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_tasks_organization_id ON tasks(organization_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_calendar_events_organization_id ON calendar_events(organization_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_id ON calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_emails_organization_id ON emails(organization_id);
CREATE INDEX IF NOT EXISTS idx_emails_user_id ON emails(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_organization_id ON usage_logs(organization_id);

-- Create vector similarity search index
CREATE INDEX IF NOT EXISTS idx_documents_embedding ON documents USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view profiles in their organization" ON profiles
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Organizations policies
CREATE POLICY "Users can view their organization" ON organizations
  FOR SELECT USING (
    id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update their organization" ON organizations
  FOR UPDATE USING (
    id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Documents policies
CREATE POLICY "Users can view documents in their organization" ON documents
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert documents in their organization" ON documents
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own documents" ON documents
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own documents" ON documents
  FOR DELETE USING (user_id = auth.uid());

-- Conversations policies
CREATE POLICY "Users can view conversations in their organization" ON conversations
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert conversations in their organization" ON conversations
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own conversations" ON conversations
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own conversations" ON conversations
  FOR DELETE USING (user_id = auth.uid());

-- Messages policies
CREATE POLICY "Users can view messages in their organization's conversations" ON messages
  FOR SELECT USING (
    conversation_id IN (
      SELECT id FROM conversations WHERE organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert messages in their organization's conversations" ON messages
  FOR INSERT WITH CHECK (
    conversation_id IN (
      SELECT id FROM conversations WHERE organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

-- Tasks policies
CREATE POLICY "Users can view tasks in their organization" ON tasks
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert tasks in their organization" ON tasks
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update tasks in their organization" ON tasks
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own tasks" ON tasks
  FOR DELETE USING (user_id = auth.uid());

-- Calendar events policies
CREATE POLICY "Users can view calendar events in their organization" ON calendar_events
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert calendar events in their organization" ON calendar_events
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own calendar events" ON calendar_events
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own calendar events" ON calendar_events
  FOR DELETE USING (user_id = auth.uid());

-- Emails policies
CREATE POLICY "Users can view emails in their organization" ON emails
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert emails in their organization" ON emails
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update emails in their organization" ON emails
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- WhatsApp messages policies
CREATE POLICY "Users can view WhatsApp messages in their organization" ON whatsapp_messages
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert WhatsApp messages in their organization" ON whatsapp_messages
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Usage logs policies
CREATE POLICY "Users can view usage logs in their organization" ON usage_logs
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "System can insert usage logs" ON usage_logs
  FOR INSERT WITH CHECK (true);

-- Subscriptions policies
CREATE POLICY "Users can view their organization's subscription" ON subscriptions
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Functions

-- Function to create a new organization and associate user
CREATE OR REPLACE FUNCTION create_organization_and_profile(
  user_id UUID,
  user_email TEXT,
  org_name TEXT,
  org_slug TEXT
)
RETURNS UUID AS $$
DECLARE
  new_org_id UUID;
BEGIN
  -- Create organization
  INSERT INTO organizations (name, slug)
  VALUES (org_name, org_slug)
  RETURNING id INTO new_org_id;

  -- Update or create profile
  INSERT INTO profiles (id, email, organization_id)
  VALUES (user_id, user_email, new_org_id)
  ON CONFLICT (id) DO UPDATE
  SET organization_id = new_org_id;

  RETURN new_org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to search documents using vector similarity
CREATE OR REPLACE FUNCTION search_documents(
  query_embedding vector(1536),
  match_threshold FLOAT,
  match_count INT,
  filter_organization_id UUID
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  similarity FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id,
    d.title,
    d.content,
    1 - (d.embedding <=> query_embedding) AS similarity
  FROM documents d
  WHERE d.organization_id = filter_organization_id
    AND 1 - (d.embedding <=> query_embedding) > match_threshold
  ORDER BY d.embedding <=> query_embedding
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calendar_events_updated_at BEFORE UPDATE ON calendar_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_emails_updated_at BEFORE UPDATE ON emails
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- Add onboarding fields to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS onboarding_skipped BOOLEAN DEFAULT FALSE;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_completed ON profiles(onboarding_completed);
-- Add demo_mode field to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS demo_mode BOOLEAN DEFAULT FALSE;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_demo_mode ON profiles(demo_mode);
-- Migration: Add folders and tags for document organization
-- Created: 2024-01-15

-- 1. Create folders table
CREATE TABLE IF NOT EXISTS folders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  parent_folder_id UUID REFERENCES folders(id) ON DELETE CASCADE,
  color TEXT DEFAULT 'blue',
  icon TEXT DEFAULT 'folder',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create tags table
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT 'gray',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, name)
);

-- 3. Create document-tags junction table
CREATE TABLE IF NOT EXISTS document_tags (
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (document_id, tag_id)
);

-- 4. Add folder_id to documents table
ALTER TABLE documents ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES folders(id) ON DELETE SET NULL;

-- 5. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_folders_organization_id ON folders(organization_id);
CREATE INDEX IF NOT EXISTS idx_folders_parent_id ON folders(parent_folder_id);
CREATE INDEX IF NOT EXISTS idx_folders_user_id ON folders(user_id);
CREATE INDEX IF NOT EXISTS idx_tags_organization_id ON tags(organization_id);
CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);
CREATE INDEX IF NOT EXISTS idx_documents_folder_id ON documents(folder_id);
CREATE INDEX IF NOT EXISTS idx_document_tags_document_id ON document_tags(document_id);
CREATE INDEX IF NOT EXISTS idx_document_tags_tag_id ON document_tags(tag_id);

-- 6. Enable Row Level Security
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_tags ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies for folders
CREATE POLICY "Users can view folders in their organization"
  ON folders FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create folders in their organization"
  ON folders FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM user_profiles WHERE user_id = auth.uid()
    )
    AND user_id = auth.uid()
  );

CREATE POLICY "Users can update their own folders"
  ON folders FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own folders"
  ON folders FOR DELETE
  USING (user_id = auth.uid());

-- 8. RLS Policies for tags
CREATE POLICY "Users can view tags in their organization"
  ON tags FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create tags in their organization"
  ON tags FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete tags in their organization"
  ON tags FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

-- 9. RLS Policies for document_tags
CREATE POLICY "Users can view document tags in their organization"
  ON document_tags FOR SELECT
  USING (
    document_id IN (
      SELECT id FROM documents WHERE organization_id IN (
        SELECT organization_id FROM user_profiles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage document tags"
  ON document_tags FOR ALL
  USING (
    document_id IN (
      SELECT id FROM documents WHERE organization_id IN (
        SELECT organization_id FROM user_profiles WHERE user_id = auth.uid()
      )
    )
  );

-- 10. Function to update folder updated_at timestamp
CREATE OR REPLACE FUNCTION update_folder_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_folder_updated_at
  BEFORE UPDATE ON folders
  FOR EACH ROW
  EXECUTE FUNCTION update_folder_updated_at();

-- 11. Function to prevent circular folder references
CREATE OR REPLACE FUNCTION check_circular_folder_reference()
RETURNS TRIGGER AS $$
DECLARE
  v_parent_id UUID;
  v_depth INT := 0;
  v_max_depth INT := 10;
BEGIN
  -- If no parent, no circular reference possible
  IF NEW.parent_folder_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Check if trying to set self as parent
  IF NEW.id = NEW.parent_folder_id THEN
    RAISE EXCEPTION 'A folder cannot be its own parent';
  END IF;

  -- Walk up the folder tree to check for circular reference
  v_parent_id := NEW.parent_folder_id;

  WHILE v_parent_id IS NOT NULL AND v_depth < v_max_depth LOOP
    -- If we find our own ID in the parent chain, it's circular
    IF v_parent_id = NEW.id THEN
      RAISE EXCEPTION 'Circular folder reference detected';
    END IF;

    -- Get the next parent
    SELECT parent_folder_id INTO v_parent_id
    FROM folders
    WHERE id = v_parent_id;

    v_depth := v_depth + 1;
  END LOOP;

  -- Check if we hit max depth (possible infinite loop)
  IF v_depth >= v_max_depth THEN
    RAISE EXCEPTION 'Folder nesting too deep (max % levels)', v_max_depth;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_circular_folder_reference
  BEFORE INSERT OR UPDATE ON folders
  FOR EACH ROW
  EXECUTE FUNCTION check_circular_folder_reference();

-- 12. Comments for documentation
COMMENT ON TABLE folders IS 'Hierarchical folder structure for organizing documents';
COMMENT ON TABLE tags IS 'Tags for categorizing documents (many-to-many relationship)';
COMMENT ON TABLE document_tags IS 'Junction table connecting documents to tags';
COMMENT ON COLUMN folders.parent_folder_id IS 'Reference to parent folder for nested structure';
COMMENT ON COLUMN folders.color IS 'Display color for folder (e.g., blue, green, red)';
COMMENT ON COLUMN folders.icon IS 'Icon name for folder display';
-- Migration: Add third-party integrations (Slack, Zoom, Google Drive)
-- Created: 2024-01-16

-- 1. Create integrations table
CREATE TABLE IF NOT EXISTS integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  provider TEXT NOT NULL, -- 'slack', 'zoom', 'google_drive', etc.
  provider_user_id TEXT, -- ID of user on the provider's platform
  provider_team_id TEXT, -- Team/workspace ID (for Slack, etc.)
  access_token TEXT NOT NULL, -- Encrypted access token
  refresh_token TEXT, -- Encrypted refresh token
  token_expires_at TIMESTAMPTZ, -- When access token expires
  scopes TEXT[], -- Granted OAuth scopes
  metadata JSONB DEFAULT '{}', -- Additional provider-specific data
  is_active BOOLEAN DEFAULT true,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, provider, provider_user_id)
);

-- 2. Create integration_actions table (for tracking integration usage)
CREATE TABLE IF NOT EXISTS integration_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  integration_id UUID NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- 'slack_message', 'zoom_meeting', 'drive_upload', etc.
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'success', 'failed'
  request_data JSONB, -- What was requested
  response_data JSONB, -- Response from provider
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_integrations_organization_id ON integrations(organization_id);
CREATE INDEX IF NOT EXISTS idx_integrations_user_id ON integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_integrations_provider ON integrations(provider);
CREATE INDEX IF NOT EXISTS idx_integrations_active ON integrations(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_integration_actions_integration_id ON integration_actions(integration_id);
CREATE INDEX IF NOT EXISTS idx_integration_actions_created_at ON integration_actions(created_at DESC);

-- 4. Enable Row Level Security
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_actions ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for integrations
CREATE POLICY "Users can view integrations in their organization"
  ON integrations FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create integrations in their organization"
  ON integrations FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM user_profiles WHERE user_id = auth.uid()
    )
    AND user_id = auth.uid()
  );

CREATE POLICY "Users can update their own integrations"
  ON integrations FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own integrations"
  ON integrations FOR DELETE
  USING (user_id = auth.uid());

-- 6. RLS Policies for integration_actions
CREATE POLICY "Users can view integration actions in their organization"
  ON integration_actions FOR SELECT
  USING (
    integration_id IN (
      SELECT id FROM integrations WHERE organization_id IN (
        SELECT organization_id FROM user_profiles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create integration actions"
  ON integration_actions FOR INSERT
  WITH CHECK (
    integration_id IN (
      SELECT id FROM integrations WHERE organization_id IN (
        SELECT organization_id FROM user_profiles WHERE user_id = auth.uid()
      )
    )
  );

-- 7. Function to update integration updated_at timestamp
CREATE OR REPLACE FUNCTION update_integration_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_integration_updated_at
  BEFORE UPDATE ON integrations
  FOR EACH ROW
  EXECUTE FUNCTION update_integration_updated_at();

-- 8. Function to refresh expired tokens (placeholder - implement in app code)
CREATE OR REPLACE FUNCTION check_expired_integrations()
RETURNS TABLE(id UUID, provider TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT i.id, i.provider
  FROM integrations i
  WHERE i.is_active = true
    AND i.token_expires_at IS NOT NULL
    AND i.token_expires_at < NOW() + INTERVAL '5 minutes'
    AND i.refresh_token IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- 9. Comments for documentation
COMMENT ON TABLE integrations IS 'OAuth integrations with third-party services (Slack, Zoom, Google Drive)';
COMMENT ON TABLE integration_actions IS 'Log of actions performed through integrations';
COMMENT ON COLUMN integrations.access_token IS 'Encrypted OAuth access token - MUST be encrypted in application';
COMMENT ON COLUMN integrations.refresh_token IS 'Encrypted OAuth refresh token - MUST be encrypted in application';
COMMENT ON COLUMN integrations.scopes IS 'Array of OAuth scopes granted by the user';
COMMENT ON COLUMN integrations.metadata IS 'Provider-specific metadata (team name, workspace URL, etc.)';
-- Migration: Add Two-Factor Authentication (2FA/MFA)
-- Created: 2024-01-17

-- 1. Add 2FA columns to user_profiles
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS two_factor_secret TEXT, -- Encrypted TOTP secret
  ADD COLUMN IF NOT EXISTS two_factor_backup_codes TEXT[], -- Encrypted backup codes
  ADD COLUMN IF NOT EXISTS two_factor_enabled_at TIMESTAMPTZ;

-- 2. Create 2FA verification attempts table (for rate limiting and security)
CREATE TABLE IF NOT EXISTS two_factor_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  attempt_type TEXT NOT NULL, -- 'setup', 'login', 'disable'
  success BOOLEAN NOT NULL DEFAULT false,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create 2FA recovery events table
CREATE TABLE IF NOT EXISTS two_factor_recovery (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  recovery_method TEXT NOT NULL, -- 'backup_code', 'admin_reset'
  recovery_code_hash TEXT, -- Hash of the used backup code
  success BOOLEAN NOT NULL DEFAULT false,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create indexes
CREATE INDEX IF NOT EXISTS idx_two_factor_attempts_user_id ON two_factor_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_two_factor_attempts_created_at ON two_factor_attempts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_two_factor_recovery_user_id ON two_factor_recovery(user_id);

-- 5. Enable Row Level Security
ALTER TABLE two_factor_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE two_factor_recovery ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies for two_factor_attempts
CREATE POLICY "Users can view their own 2FA attempts"
  ON two_factor_attempts FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Service can insert 2FA attempts"
  ON two_factor_attempts FOR INSERT
  WITH CHECK (true); -- API will handle authorization

-- 7. RLS Policies for two_factor_recovery
CREATE POLICY "Users can view their own recovery events"
  ON two_factor_recovery FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Service can insert recovery events"
  ON two_factor_recovery FOR INSERT
  WITH CHECK (true); -- API will handle authorization

-- 8. Function to check 2FA rate limiting
CREATE OR REPLACE FUNCTION check_2fa_rate_limit(
  p_user_id UUID,
  p_attempt_type TEXT,
  p_time_window INTERVAL DEFAULT INTERVAL '15 minutes',
  p_max_attempts INT DEFAULT 5
)
RETURNS BOOLEAN AS $$
DECLARE
  v_attempt_count INT;
BEGIN
  -- Count failed attempts in the time window
  SELECT COUNT(*)
  INTO v_attempt_count
  FROM two_factor_attempts
  WHERE user_id = p_user_id
    AND attempt_type = p_attempt_type
    AND success = false
    AND created_at > NOW() - p_time_window;

  -- Return true if under the limit
  RETURN v_attempt_count < p_max_attempts;
END;
$$ LANGUAGE plpgsql;

-- 9. Function to clean up old 2FA attempts (for maintenance)
CREATE OR REPLACE FUNCTION cleanup_old_2fa_attempts()
RETURNS INT AS $$
DECLARE
  v_deleted_count INT;
BEGIN
  -- Delete attempts older than 90 days
  DELETE FROM two_factor_attempts
  WHERE created_at < NOW() - INTERVAL '90 days';

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 10. Function to get user 2FA status
CREATE OR REPLACE FUNCTION get_user_2fa_status(p_user_id UUID)
RETURNS TABLE(
  enabled BOOLEAN,
  enabled_at TIMESTAMPTZ,
  backup_codes_count INT,
  recent_attempts INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    up.two_factor_enabled,
    up.two_factor_enabled_at,
    COALESCE(array_length(up.two_factor_backup_codes, 1), 0),
    (
      SELECT COUNT(*)::INT
      FROM two_factor_attempts
      WHERE user_id = p_user_id
        AND created_at > NOW() - INTERVAL '24 hours'
    )
  FROM user_profiles up
  WHERE up.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- 11. Trigger to log 2FA status changes
CREATE OR REPLACE FUNCTION log_2fa_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Log when 2FA is enabled or disabled
  IF OLD.two_factor_enabled IS DISTINCT FROM NEW.two_factor_enabled THEN
    INSERT INTO two_factor_attempts (user_id, attempt_type, success)
    VALUES (
      NEW.user_id,
      CASE WHEN NEW.two_factor_enabled THEN 'enable' ELSE 'disable' END,
      true
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_2fa_status_change
  AFTER UPDATE ON user_profiles
  FOR EACH ROW
  WHEN (OLD.two_factor_enabled IS DISTINCT FROM NEW.two_factor_enabled)
  EXECUTE FUNCTION log_2fa_status_change();

-- 12. Comments for documentation
COMMENT ON COLUMN user_profiles.two_factor_enabled IS 'Whether 2FA/MFA is enabled for this user';
COMMENT ON COLUMN user_profiles.two_factor_secret IS 'Encrypted TOTP secret key - MUST be encrypted in application';
COMMENT ON COLUMN user_profiles.two_factor_backup_codes IS 'Array of encrypted backup recovery codes - MUST be encrypted in application';
COMMENT ON COLUMN user_profiles.two_factor_enabled_at IS 'Timestamp when 2FA was first enabled';
COMMENT ON TABLE two_factor_attempts IS 'Log of 2FA verification attempts for security monitoring and rate limiting';
COMMENT ON TABLE two_factor_recovery IS 'Log of 2FA recovery events (backup code usage, admin resets)';
COMMENT ON FUNCTION check_2fa_rate_limit IS 'Check if user has exceeded 2FA attempt rate limit';
COMMENT ON FUNCTION cleanup_old_2fa_attempts IS 'Maintenance function to clean up old 2FA attempt logs';
-- Add SSO/SAML support
-- This migration adds tables and functions for Single Sign-On and SAML authentication

-- SSO Providers table - stores configuration for SSO/SAML providers
CREATE TABLE IF NOT EXISTS sso_providers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Provider details
  provider_type TEXT NOT NULL CHECK (provider_type IN ('saml', 'oauth2', 'oidc')),
  provider_name TEXT NOT NULL, -- e.g., "Google Workspace", "Azure AD", "Okta"
  enabled BOOLEAN DEFAULT false,

  -- SAML Configuration
  saml_entity_id TEXT,
  saml_sso_url TEXT,
  saml_slo_url TEXT,
  saml_certificate TEXT,
  saml_signature_algorithm TEXT DEFAULT 'sha256',
  saml_name_id_format TEXT DEFAULT 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',

  -- OAuth2/OIDC Configuration
  oauth_client_id TEXT,
  oauth_client_secret TEXT,
  oauth_authorization_url TEXT,
  oauth_token_url TEXT,
  oauth_user_info_url TEXT,
  oauth_scopes TEXT[] DEFAULT ARRAY['openid', 'profile', 'email'],

  -- Attribute mapping (JSON object mapping SSO attributes to our user fields)
  attribute_mapping JSONB DEFAULT '{
    "email": "email",
    "firstName": "given_name",
    "lastName": "family_name",
    "displayName": "name"
  }'::jsonb,

  -- Settings
  auto_provision_users BOOLEAN DEFAULT true, -- Automatically create users on first login
  enforce_sso BOOLEAN DEFAULT false, -- Require SSO login for this organization
  allowed_domains TEXT[], -- Email domains allowed to use this SSO

  -- Metadata
  created_by UUID REFERENCES user_profiles(user_id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(organization_id, provider_name)
);

-- SSO Sessions table - tracks SSO login sessions
CREATE TABLE IF NOT EXISTS sso_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID NOT NULL REFERENCES sso_providers(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_profiles(user_id) ON DELETE CASCADE,

  -- Session data
  session_index TEXT, -- SAML SessionIndex
  name_id TEXT, -- SAML NameID
  external_user_id TEXT, -- ID from the SSO provider

  -- Tracking
  ip_address INET,
  user_agent TEXT,
  login_at TIMESTAMPTZ DEFAULT NOW(),
  logout_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SSO Login Attempts table - audit log of SSO login attempts
CREATE TABLE IF NOT EXISTS sso_login_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID REFERENCES sso_providers(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_profiles(user_id) ON DELETE SET NULL,

  -- Attempt details
  email TEXT,
  success BOOLEAN NOT NULL,
  error_message TEXT,
  error_code TEXT,

  -- Request details
  ip_address INET,
  user_agent TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sso_providers_org ON sso_providers(organization_id);
CREATE INDEX IF NOT EXISTS idx_sso_providers_enabled ON sso_providers(enabled) WHERE enabled = true;
CREATE INDEX IF NOT EXISTS idx_sso_sessions_provider ON sso_sessions(provider_id);
CREATE INDEX IF NOT EXISTS idx_sso_sessions_user ON sso_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sso_sessions_expires ON sso_sessions(expires_at) WHERE logout_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_sso_login_attempts_provider ON sso_login_attempts(provider_id);
CREATE INDEX IF NOT EXISTS idx_sso_login_attempts_created ON sso_login_attempts(created_at);

-- Row Level Security
ALTER TABLE sso_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sso_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sso_login_attempts ENABLE ROW LEVEL SECURITY;

-- Policies for sso_providers
CREATE POLICY "Users can view their organization's SSO providers"
  ON sso_providers FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Organization admins can manage SSO providers"
  ON sso_providers FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Policies for sso_sessions
CREATE POLICY "Users can view their own SSO sessions"
  ON sso_sessions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "System can manage SSO sessions"
  ON sso_sessions FOR ALL
  USING (true);

-- Policies for sso_login_attempts
CREATE POLICY "Organization admins can view SSO login attempts"
  ON sso_login_attempts FOR SELECT
  USING (
    provider_id IN (
      SELECT sp.id FROM sso_providers sp
      INNER JOIN user_profiles up ON up.organization_id = sp.organization_id
      WHERE up.user_id = auth.uid() AND up.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "System can insert SSO login attempts"
  ON sso_login_attempts FOR INSERT
  WITH CHECK (true);

-- Function to get organization's SSO configuration
CREATE OR REPLACE FUNCTION get_organization_sso_config(p_org_id UUID)
RETURNS TABLE (
  id UUID,
  provider_type TEXT,
  provider_name TEXT,
  enabled BOOLEAN,
  enforce_sso BOOLEAN,
  allowed_domains TEXT[],
  saml_entity_id TEXT,
  saml_sso_url TEXT,
  oauth_authorization_url TEXT,
  oauth_client_id TEXT,
  oauth_scopes TEXT[]
) SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    sp.id,
    sp.provider_type,
    sp.provider_name,
    sp.enabled,
    sp.enforce_sso,
    sp.allowed_domains,
    sp.saml_entity_id,
    sp.saml_sso_url,
    sp.oauth_authorization_url,
    sp.oauth_client_id,
    sp.oauth_scopes
  FROM sso_providers sp
  WHERE sp.organization_id = p_org_id
    AND sp.enabled = true
  ORDER BY sp.created_at;
END;
$$;

-- Function to check if email domain requires SSO
CREATE OR REPLACE FUNCTION check_sso_required(p_email TEXT)
RETURNS TABLE (
  required BOOLEAN,
  provider_id UUID,
  provider_name TEXT,
  provider_type TEXT,
  organization_id UUID
) SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_domain TEXT;
BEGIN
  -- Extract domain from email
  v_domain := split_part(p_email, '@', 2);

  RETURN QUERY
  SELECT
    sp.enforce_sso as required,
    sp.id as provider_id,
    sp.provider_name,
    sp.provider_type,
    sp.organization_id
  FROM sso_providers sp
  WHERE sp.enabled = true
    AND sp.enforce_sso = true
    AND v_domain = ANY(sp.allowed_domains)
  LIMIT 1;
END;
$$;

-- Function to cleanup expired SSO sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sso_sessions()
RETURNS INTEGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  -- Delete sessions that have expired
  DELETE FROM sso_sessions
  WHERE expires_at < NOW()
    AND logout_at IS NULL;

  GET DIAGNOSTICS v_deleted = ROW_COUNT;

  RETURN v_deleted;
END;
$$;

-- Function to log SSO login attempt
CREATE OR REPLACE FUNCTION log_sso_login_attempt(
  p_provider_id UUID,
  p_user_id UUID,
  p_email TEXT,
  p_success BOOLEAN,
  p_error_message TEXT DEFAULT NULL,
  p_error_code TEXT DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_attempt_id UUID;
BEGIN
  INSERT INTO sso_login_attempts (
    provider_id,
    user_id,
    email,
    success,
    error_message,
    error_code,
    ip_address,
    user_agent
  ) VALUES (
    p_provider_id,
    p_user_id,
    p_email,
    p_success,
    p_error_message,
    p_error_code,
    p_ip_address,
    p_user_agent
  )
  RETURNING id INTO v_attempt_id;

  RETURN v_attempt_id;
END;
$$;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_sso_providers_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_sso_providers_timestamp
  BEFORE UPDATE ON sso_providers
  FOR EACH ROW
  EXECUTE FUNCTION update_sso_providers_updated_at();

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION get_organization_sso_config(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION check_sso_required(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_sso_sessions() TO authenticated;
GRANT EXECUTE ON FUNCTION log_sso_login_attempt(UUID, UUID, TEXT, BOOLEAN, TEXT, TEXT, INET, TEXT) TO authenticated;

COMMENT ON TABLE sso_providers IS 'Configuration for SSO/SAML identity providers';
COMMENT ON TABLE sso_sessions IS 'Active SSO login sessions';
COMMENT ON TABLE sso_login_attempts IS 'Audit log of SSO login attempts';
-- Add Audit Logs System
-- This migration adds comprehensive audit logging for compliance and security

-- Audit Events table - stores all audit events
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Actor (who performed the action)
  user_id UUID REFERENCES user_profiles(user_id) ON DELETE SET NULL,
  actor_email TEXT,
  actor_name TEXT,
  actor_ip_address INET,
  actor_user_agent TEXT,

  -- Event details
  event_type TEXT NOT NULL, -- e.g., 'user.login', 'document.created', 'settings.updated'
  event_category TEXT NOT NULL CHECK (event_category IN (
    'authentication',
    'authorization',
    'data_access',
    'data_modification',
    'configuration',
    'security',
    'integration',
    'admin'
  )),
  event_action TEXT NOT NULL CHECK (event_action IN (
    'created',
    'updated',
    'deleted',
    'accessed',
    'exported',
    'shared',
    'login',
    'logout',
    'failed_login',
    'permission_granted',
    'permission_revoked',
    'configuration_changed',
    'integration_connected',
    'integration_disconnected'
  )),

  -- Target (what was acted upon)
  resource_type TEXT, -- e.g., 'document', 'user', 'organization', 'sso_provider'
  resource_id UUID,
  resource_name TEXT,

  -- Additional context
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Result
  status TEXT NOT NULL CHECK (status IN ('success', 'failure', 'warning')),
  error_message TEXT,

  -- Severity level for filtering/alerting
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('debug', 'info', 'warning', 'error', 'critical')),

  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- For retention policies
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '2 years'
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_org ON audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_category ON audit_logs(event_category);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_action ON audit_logs(event_action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_status ON audit_logs(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON audit_logs(severity);
CREATE INDEX IF NOT EXISTS idx_audit_logs_expires_at ON audit_logs(expires_at) WHERE expires_at IS NOT NULL;

-- Full-text search index on description
CREATE INDEX IF NOT EXISTS idx_audit_logs_description_search ON audit_logs USING gin(to_tsvector('english', description));

-- Audit Log Exports table - track when audit logs are exported
CREATE TABLE IF NOT EXISTS audit_log_exports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,

  -- Export details
  export_format TEXT NOT NULL CHECK (export_format IN ('csv', 'json', 'pdf')),
  filters JSONB, -- The filters applied to the export
  record_count INTEGER,
  date_range_start TIMESTAMPTZ,
  date_range_end TIMESTAMPTZ,

  -- File details
  file_url TEXT,
  file_size_bytes BIGINT,

  -- Tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_audit_log_exports_org ON audit_log_exports(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_exports_user ON audit_log_exports(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_exports_created_at ON audit_log_exports(created_at DESC);

-- Row Level Security
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log_exports ENABLE ROW LEVEL SECURITY;

-- Policies for audit_logs
-- Only organization admins and owners can view audit logs
CREATE POLICY "Organization admins can view audit logs"
  ON audit_logs FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- System can insert audit logs (no user restrictions)
CREATE POLICY "System can insert audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (true);

-- Prevent updates and deletes (audit logs are immutable)
CREATE POLICY "Audit logs are immutable"
  ON audit_logs FOR UPDATE
  USING (false);

CREATE POLICY "Audit logs cannot be deleted"
  ON audit_logs FOR DELETE
  USING (false);

-- Policies for audit_log_exports
CREATE POLICY "Users can view their own exports"
  ON audit_log_exports FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Organization admins can view all exports"
  ON audit_log_exports FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Organization admins can create exports"
  ON audit_log_exports FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM user_profiles
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Function to log audit event
CREATE OR REPLACE FUNCTION log_audit_event(
  p_organization_id UUID,
  p_user_id UUID,
  p_actor_email TEXT,
  p_actor_name TEXT,
  p_event_type TEXT,
  p_event_category TEXT,
  p_event_action TEXT,
  p_resource_type TEXT DEFAULT NULL,
  p_resource_id UUID DEFAULT NULL,
  p_resource_name TEXT DEFAULT NULL,
  p_description TEXT DEFAULT '',
  p_metadata JSONB DEFAULT '{}'::jsonb,
  p_status TEXT DEFAULT 'success',
  p_error_message TEXT DEFAULT NULL,
  p_severity TEXT DEFAULT 'info',
  p_actor_ip_address INET DEFAULT NULL,
  p_actor_user_agent TEXT DEFAULT NULL
)
RETURNS UUID
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_audit_id UUID;
BEGIN
  INSERT INTO audit_logs (
    organization_id,
    user_id,
    actor_email,
    actor_name,
    actor_ip_address,
    actor_user_agent,
    event_type,
    event_category,
    event_action,
    resource_type,
    resource_id,
    resource_name,
    description,
    metadata,
    status,
    error_message,
    severity
  ) VALUES (
    p_organization_id,
    p_user_id,
    p_actor_email,
    p_actor_name,
    p_actor_ip_address,
    p_actor_user_agent,
    p_event_type,
    p_event_category,
    p_event_action,
    p_resource_type,
    p_resource_id,
    p_resource_name,
    p_description,
    p_metadata,
    p_status,
    p_error_message,
    p_severity
  )
  RETURNING id INTO v_audit_id;

  RETURN v_audit_id;
END;
$$;

-- Function to get audit log statistics
CREATE OR REPLACE FUNCTION get_audit_log_stats(
  p_organization_id UUID,
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  total_events BIGINT,
  successful_events BIGINT,
  failed_events BIGINT,
  critical_events BIGINT,
  events_by_category JSONB,
  events_by_action JSONB,
  top_users JSONB,
  recent_critical JSONB
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH stats AS (
    SELECT
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE status = 'success') as successful,
      COUNT(*) FILTER (WHERE status = 'failure') as failed,
      COUNT(*) FILTER (WHERE severity = 'critical') as critical
    FROM audit_logs
    WHERE organization_id = p_organization_id
      AND created_at >= NOW() - (p_days || ' days')::INTERVAL
  ),
  by_category AS (
    SELECT jsonb_object_agg(event_category, count) as result
    FROM (
      SELECT event_category, COUNT(*) as count
      FROM audit_logs
      WHERE organization_id = p_organization_id
        AND created_at >= NOW() - (p_days || ' days')::INTERVAL
      GROUP BY event_category
      ORDER BY count DESC
    ) t
  ),
  by_action AS (
    SELECT jsonb_object_agg(event_action, count) as result
    FROM (
      SELECT event_action, COUNT(*) as count
      FROM audit_logs
      WHERE organization_id = p_organization_id
        AND created_at >= NOW() - (p_days || ' days')::INTERVAL
      GROUP BY event_action
      ORDER BY count DESC
    ) t
  ),
  top_users_data AS (
    SELECT jsonb_agg(jsonb_build_object(
      'email', actor_email,
      'name', actor_name,
      'count', count
    )) as result
    FROM (
      SELECT actor_email, actor_name, COUNT(*) as count
      FROM audit_logs
      WHERE organization_id = p_organization_id
        AND created_at >= NOW() - (p_days || ' days')::INTERVAL
        AND user_id IS NOT NULL
      GROUP BY actor_email, actor_name
      ORDER BY count DESC
      LIMIT 10
    ) t
  ),
  recent_critical_data AS (
    SELECT jsonb_agg(jsonb_build_object(
      'event_type', event_type,
      'description', description,
      'created_at', created_at,
      'actor_email', actor_email
    )) as result
    FROM (
      SELECT event_type, description, created_at, actor_email
      FROM audit_logs
      WHERE organization_id = p_organization_id
        AND severity = 'critical'
        AND created_at >= NOW() - (p_days || ' days')::INTERVAL
      ORDER BY created_at DESC
      LIMIT 10
    ) t
  )
  SELECT
    s.total,
    s.successful,
    s.failed,
    s.critical,
    COALESCE(bc.result, '{}'::jsonb),
    COALESCE(ba.result, '{}'::jsonb),
    COALESCE(tu.result, '[]'::jsonb),
    COALESCE(rc.result, '[]'::jsonb)
  FROM stats s
  CROSS JOIN by_category bc
  CROSS JOIN by_action ba
  CROSS JOIN top_users_data tu
  CROSS JOIN recent_critical_data rc;
END;
$$;

-- Function to cleanup expired audit logs
CREATE OR REPLACE FUNCTION cleanup_expired_audit_logs()
RETURNS INTEGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  -- Delete audit logs that have expired
  DELETE FROM audit_logs
  WHERE expires_at IS NOT NULL
    AND expires_at < NOW();

  GET DIAGNOSTICS v_deleted = ROW_COUNT;

  RETURN v_deleted;
END;
$$;

-- Trigger function to automatically log certain database changes
CREATE OR REPLACE FUNCTION auto_audit_log()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_organization_id UUID;
  v_event_action TEXT;
  v_description TEXT;
BEGIN
  -- Determine action
  IF TG_OP = 'INSERT' THEN
    v_event_action := 'created';
    v_description := TG_TABLE_NAME || ' created';
  ELSIF TG_OP = 'UPDATE' THEN
    v_event_action := 'updated';
    v_description := TG_TABLE_NAME || ' updated';
  ELSIF TG_OP = 'DELETE' THEN
    v_event_action := 'deleted';
    v_description := TG_TABLE_NAME || ' deleted';
  END IF;

  -- Get organization_id from the record
  IF TG_OP = 'DELETE' THEN
    v_organization_id := OLD.organization_id;
  ELSE
    v_organization_id := NEW.organization_id;
  END IF;

  -- Log the event
  PERFORM log_audit_event(
    p_organization_id := v_organization_id,
    p_user_id := auth.uid(),
    p_actor_email := NULL,
    p_actor_name := NULL,
    p_event_type := TG_TABLE_NAME || '.' || lower(v_event_action),
    p_event_category := 'data_modification',
    p_event_action := v_event_action,
    p_resource_type := TG_TABLE_NAME,
    p_resource_id := CASE WHEN TG_OP = 'DELETE' THEN OLD.id ELSE NEW.id END,
    p_description := v_description,
    p_status := 'success',
    p_severity := 'info'
  );

  RETURN NULL;
END;
$$;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION log_audit_event(UUID, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, UUID, TEXT, TEXT, JSONB, TEXT, TEXT, TEXT, INET, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_audit_log_stats(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_audit_logs() TO authenticated;

COMMENT ON TABLE audit_logs IS 'Comprehensive audit log of all system events for compliance and security';
COMMENT ON TABLE audit_log_exports IS 'Track exports of audit logs for compliance requirements';
COMMENT ON FUNCTION log_audit_event IS 'Helper function to create audit log entries';
COMMENT ON FUNCTION get_audit_log_stats IS 'Get aggregated statistics about audit logs';
COMMENT ON FUNCTION cleanup_expired_audit_logs IS 'Remove audit logs past their retention period';
-- Add Role-Based Access Control (RBAC)
-- This migration adds granular permissions and role management

-- Permissions table - defines all available permissions in the system
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Permission identification
  name TEXT NOT NULL UNIQUE, -- e.g., 'documents.create', 'users.delete'
  resource TEXT NOT NULL, -- e.g., 'documents', 'users', 'settings'
  action TEXT NOT NULL, -- e.g., 'create', 'read', 'update', 'delete', 'manage'

  -- Description
  description TEXT NOT NULL,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(resource, action)
);

-- Roles table - extends the existing role field in user_profiles
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Role identification
  name TEXT NOT NULL, -- e.g., 'Project Manager', 'Content Editor'
  slug TEXT NOT NULL, -- e.g., 'project-manager', 'content-editor'
  description TEXT,

  -- System roles cannot be deleted
  is_system_role BOOLEAN DEFAULT false,

  -- Metadata
  created_by UUID REFERENCES user_profiles(user_id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(organization_id, slug)
);

-- Role Permissions junction table
CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,

  -- Optional constraints on the permission
  conditions JSONB, -- JSON conditions for dynamic permissions

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(role_id, permission_id)
);

-- User Custom Permissions - override role permissions for specific users
CREATE TABLE IF NOT EXISTS user_custom_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,

  -- Grant or deny
  grant_type TEXT NOT NULL CHECK (grant_type IN ('grant', 'deny')),

  -- Optional resource-specific permission
  resource_id UUID, -- Specific resource this permission applies to

  -- Expiration
  expires_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, permission_id, resource_id)
);

-- Permission Groups - for organizing permissions
CREATE TABLE IF NOT EXISTS permission_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add group to permissions
ALTER TABLE permissions ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES permission_groups(id) ON DELETE SET NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_permissions_resource ON permissions(resource);
CREATE INDEX IF NOT EXISTS idx_permissions_group ON permissions(group_id);
CREATE INDEX IF NOT EXISTS idx_roles_org ON roles(organization_id);
CREATE INDEX IF NOT EXISTS idx_roles_slug ON roles(slug);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission ON role_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_user_custom_permissions_user ON user_custom_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_custom_permissions_resource ON user_custom_permissions(resource_id);

-- Row Level Security
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_custom_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE permission_groups ENABLE ROW LEVEL SECURITY;

-- Policies for permissions (read-only for all authenticated users)
CREATE POLICY "Permissions are visible to all authenticated users"
  ON permissions FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Policies for permission_groups
CREATE POLICY "Permission groups are visible to all authenticated users"
  ON permission_groups FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Policies for roles
CREATE POLICY "Users can view roles in their organization"
  ON roles FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Organization admins can manage roles"
  ON roles FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Policies for role_permissions
CREATE POLICY "Users can view role permissions in their organization"
  ON role_permissions FOR SELECT
  USING (
    role_id IN (
      SELECT r.id FROM roles r
      INNER JOIN user_profiles up ON up.organization_id = r.organization_id
      WHERE up.user_id = auth.uid()
    )
  );

CREATE POLICY "Organization admins can manage role permissions"
  ON role_permissions FOR ALL
  USING (
    role_id IN (
      SELECT r.id FROM roles r
      INNER JOIN user_profiles up ON up.organization_id = r.organization_id
      WHERE up.user_id = auth.uid() AND up.role IN ('owner', 'admin')
    )
  );

-- Policies for user_custom_permissions
CREATE POLICY "Users can view their own custom permissions"
  ON user_custom_permissions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Organization admins can manage user custom permissions"
  ON user_custom_permissions FOR ALL
  USING (
    user_id IN (
      SELECT user_id FROM user_profiles
      WHERE organization_id IN (
        SELECT organization_id FROM user_profiles
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
      )
    )
  );

-- Function to check if user has permission
CREATE OR REPLACE FUNCTION user_has_permission(
  p_user_id UUID,
  p_permission_name TEXT,
  p_resource_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_has_permission BOOLEAN := false;
  v_user_role TEXT;
  v_organization_id UUID;
  v_permission_id UUID;
BEGIN
  -- Get user's role and organization
  SELECT role, organization_id INTO v_user_role, v_organization_id
  FROM user_profiles
  WHERE user_id = p_user_id;

  -- Owners always have all permissions
  IF v_user_role = 'owner' THEN
    RETURN true;
  END IF;

  -- Get permission ID
  SELECT id INTO v_permission_id
  FROM permissions
  WHERE name = p_permission_name;

  IF v_permission_id IS NULL THEN
    RETURN false;
  END IF;

  -- Check for explicit deny in custom permissions
  IF EXISTS (
    SELECT 1 FROM user_custom_permissions
    WHERE user_id = p_user_id
      AND permission_id = v_permission_id
      AND grant_type = 'deny'
      AND (resource_id IS NULL OR resource_id = p_resource_id)
      AND (expires_at IS NULL OR expires_at > NOW())
  ) THEN
    RETURN false;
  END IF;

  -- Check for explicit grant in custom permissions
  IF EXISTS (
    SELECT 1 FROM user_custom_permissions
    WHERE user_id = p_user_id
      AND permission_id = v_permission_id
      AND grant_type = 'grant'
      AND (resource_id IS NULL OR resource_id = p_resource_id)
      AND (expires_at IS NULL OR expires_at > NOW())
  ) THEN
    RETURN true;
  END IF;

  -- Check role permissions
  -- First, find the role ID for the user's role in their organization
  SELECT EXISTS (
    SELECT 1
    FROM roles r
    INNER JOIN role_permissions rp ON rp.role_id = r.id
    WHERE r.organization_id = v_organization_id
      AND r.slug = v_user_role
      AND rp.permission_id = v_permission_id
  ) INTO v_has_permission;

  RETURN v_has_permission;
END;
$$;

-- Function to get user's permissions
CREATE OR REPLACE FUNCTION get_user_permissions(p_user_id UUID)
RETURNS TABLE (
  permission_name TEXT,
  permission_description TEXT,
  resource TEXT,
  action TEXT,
  source TEXT -- 'role' or 'custom'
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_user_role TEXT;
  v_organization_id UUID;
BEGIN
  -- Get user's role and organization
  SELECT role, organization_id INTO v_user_role, v_organization_id
  FROM user_profiles
  WHERE user_id = p_user_id;

  -- If owner, return all permissions
  IF v_user_role = 'owner' THEN
    RETURN QUERY
    SELECT p.name, p.description, p.resource, p.action, 'role'::TEXT
    FROM permissions p;
    RETURN;
  END IF;

  -- Return role permissions
  RETURN QUERY
  SELECT DISTINCT p.name, p.description, p.resource, p.action, 'role'::TEXT
  FROM permissions p
  INNER JOIN role_permissions rp ON rp.permission_id = p.id
  INNER JOIN roles r ON r.id = rp.role_id
  WHERE r.organization_id = v_organization_id
    AND r.slug = v_user_role

  UNION

  -- Return custom granted permissions (not denied)
  SELECT p.name, p.description, p.resource, p.action, 'custom'::TEXT
  FROM permissions p
  INNER JOIN user_custom_permissions ucp ON ucp.permission_id = p.id
  WHERE ucp.user_id = p_user_id
    AND ucp.grant_type = 'grant'
    AND (ucp.expires_at IS NULL OR ucp.expires_at > NOW());
END;
$$;

-- Insert default permission groups
INSERT INTO permission_groups (name, description, icon, sort_order) VALUES
  ('Documents', 'Permissions related to document management', 'file-text', 1),
  ('Tasks', 'Permissions related to task management', 'check-square', 2),
  ('Users', 'Permissions related to user management', 'users', 3),
  ('Settings', 'Permissions related to organization settings', 'settings', 4),
  ('Integrations', 'Permissions related to third-party integrations', 'plug', 5),
  ('AI', 'Permissions related to AI features', 'cpu', 6),
  ('Security', 'Permissions related to security features', 'shield', 7),
  ('Billing', 'Permissions related to billing and subscriptions', 'credit-card', 8)
ON CONFLICT (name) DO NOTHING;

-- Insert default permissions
WITH groups AS (
  SELECT id, name FROM permission_groups
)
INSERT INTO permissions (name, resource, action, description, group_id) VALUES
  -- Documents
  ('documents.create', 'documents', 'create', 'Create new documents', (SELECT id FROM groups WHERE name = 'Documents')),
  ('documents.read', 'documents', 'read', 'View documents', (SELECT id FROM groups WHERE name = 'Documents')),
  ('documents.update', 'documents', 'update', 'Edit documents', (SELECT id FROM groups WHERE name = 'Documents')),
  ('documents.delete', 'documents', 'delete', 'Delete documents', (SELECT id FROM groups WHERE name = 'Documents')),
  ('documents.share', 'documents', 'share', 'Share documents with others', (SELECT id FROM groups WHERE name = 'Documents')),

  -- Tasks
  ('tasks.create', 'tasks', 'create', 'Create new tasks', (SELECT id FROM groups WHERE name = 'Tasks')),
  ('tasks.read', 'tasks', 'read', 'View tasks', (SELECT id FROM groups WHERE name = 'Tasks')),
  ('tasks.update', 'tasks', 'update', 'Edit tasks', (SELECT id FROM groups WHERE name = 'Tasks')),
  ('tasks.delete', 'tasks', 'delete', 'Delete tasks', (SELECT id FROM groups WHERE name = 'Tasks')),
  ('tasks.assign', 'tasks', 'assign', 'Assign tasks to others', (SELECT id FROM groups WHERE name = 'Tasks')),

  -- Users
  ('users.invite', 'users', 'invite', 'Invite new users', (SELECT id FROM groups WHERE name = 'Users')),
  ('users.read', 'users', 'read', 'View user profiles', (SELECT id FROM groups WHERE name = 'Users')),
  ('users.update', 'users', 'update', 'Edit user profiles', (SELECT id FROM groups WHERE name = 'Users')),
  ('users.delete', 'users', 'delete', 'Remove users', (SELECT id FROM groups WHERE name = 'Users')),
  ('users.manage_roles', 'users', 'manage_roles', 'Assign roles to users', (SELECT id FROM groups WHERE name = 'Users')),

  -- Settings
  ('settings.read', 'settings', 'read', 'View organization settings', (SELECT id FROM groups WHERE name = 'Settings')),
  ('settings.update', 'settings', 'update', 'Update organization settings', (SELECT id FROM groups WHERE name = 'Settings')),
  ('settings.security', 'settings', 'security', 'Manage security settings (2FA, SSO)', (SELECT id FROM groups WHERE name = 'Settings')),

  -- Integrations
  ('integrations.connect', 'integrations', 'connect', 'Connect new integrations', (SELECT id FROM groups WHERE name = 'Integrations')),
  ('integrations.read', 'integrations', 'read', 'View integrations', (SELECT id FROM groups WHERE name = 'Integrations')),
  ('integrations.disconnect', 'integrations', 'disconnect', 'Disconnect integrations', (SELECT id FROM groups WHERE name = 'Integrations')),

  -- AI
  ('ai.use', 'ai', 'use', 'Use AI features', (SELECT id FROM groups WHERE name = 'AI')),
  ('ai.configure', 'ai', 'configure', 'Configure AI agents and automations', (SELECT id FROM groups WHERE name = 'AI')),

  -- Security
  ('security.audit_logs', 'security', 'audit_logs', 'View audit logs', (SELECT id FROM groups WHERE name = 'Security')),
  ('security.manage_sso', 'security', 'manage_sso', 'Manage SSO providers', (SELECT id FROM groups WHERE name = 'Security')),

  -- Billing
  ('billing.read', 'billing', 'read', 'View billing information', (SELECT id FROM groups WHERE name = 'Billing')),
  ('billing.update', 'billing', 'update', 'Update billing information', (SELECT id FROM groups WHERE name = 'Billing'))
ON CONFLICT (name) DO NOTHING;

-- Create default system roles for each organization
-- This will be done via application code when organizations are created

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_roles_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_roles_timestamp
  BEFORE UPDATE ON roles
  FOR EACH ROW
  EXECUTE FUNCTION update_roles_updated_at();

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION user_has_permission(UUID, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_permissions(UUID) TO authenticated;

COMMENT ON TABLE permissions IS 'System-wide permissions that can be assigned to roles';
COMMENT ON TABLE roles IS 'Custom roles for organizations with specific permission sets';
COMMENT ON TABLE role_permissions IS 'Mapping between roles and permissions';
COMMENT ON TABLE user_custom_permissions IS 'User-specific permission overrides';
COMMENT ON FUNCTION user_has_permission IS 'Check if a user has a specific permission';
COMMENT ON FUNCTION get_user_permissions IS 'Get all permissions for a user';
-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Stripe data
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_price_id TEXT,
  stripe_product_id TEXT,

  -- Plan details
  plan TEXT NOT NULL CHECK (plan IN ('free', 'pro', 'team', 'enterprise')),
  status TEXT NOT NULL CHECK (status IN ('active', 'trialing', 'past_due', 'canceled', 'unpaid', 'incomplete', 'incomplete_expired')),
  billing_interval TEXT CHECK (billing_interval IN ('month', 'year')),

  -- Dates
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,

  -- Metadata
  cancel_at_period_end BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(organization_id)
);

-- Usage tracking table
CREATE TABLE IF NOT EXISTS usage_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Usage metrics
  ai_messages_count INTEGER DEFAULT 0,
  documents_count INTEGER DEFAULT 0,
  storage_bytes BIGINT DEFAULT 0,
  emails_sent INTEGER DEFAULT 0,
  whatsapp_messages INTEGER DEFAULT 0,
  workflows_executed INTEGER DEFAULT 0,

  -- Reset tracking
  period_start TIMESTAMPTZ DEFAULT NOW(),
  period_end TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '1 month'),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(organization_id, period_start)
);

-- Stripe events log (for debugging and idempotency)
CREATE TABLE IF NOT EXISTS stripe_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  event_data JSONB NOT NULL,
  processed BOOLEAN DEFAULT false,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,

  stripe_invoice_id TEXT UNIQUE,
  stripe_customer_id TEXT,

  amount_due INTEGER NOT NULL,
  amount_paid INTEGER DEFAULT 0,
  currency TEXT DEFAULT 'usd',

  status TEXT NOT NULL CHECK (status IN ('draft', 'open', 'paid', 'void', 'uncollectible')),

  invoice_pdf TEXT,
  hosted_invoice_url TEXT,

  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  due_date TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_organization_id ON subscriptions(organization_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_organization_id ON usage_tracking(organization_id);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_period ON usage_tracking(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_stripe_events_event_id ON stripe_events(event_id);
CREATE INDEX IF NOT EXISTS idx_invoices_organization_id ON invoices(organization_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_usage_tracking_updated_at ON usage_tracking;
CREATE TRIGGER update_usage_tracking_updated_at
  BEFORE UPDATE ON usage_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_invoices_updated_at ON invoices;
CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to check if user has active subscription
CREATE OR REPLACE FUNCTION has_active_subscription(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM subscriptions
    WHERE user_id = p_user_id
    AND status IN ('active', 'trialing')
    AND (current_period_end IS NULL OR current_period_end > NOW())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's plan limits
CREATE OR REPLACE FUNCTION get_plan_limits(p_plan TEXT)
RETURNS TABLE (
  ai_messages_limit INTEGER,
  documents_limit INTEGER,
  storage_gb_limit INTEGER,
  team_members_limit INTEGER,
  has_advanced_ai BOOLEAN,
  has_workflows BOOLEAN,
  has_sso BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    CASE p_plan
      WHEN 'free' THEN 100
      WHEN 'pro' THEN -1  -- unlimited
      WHEN 'team' THEN -1
      WHEN 'enterprise' THEN -1
      ELSE 100
    END AS ai_messages_limit,
    CASE p_plan
      WHEN 'free' THEN 5
      WHEN 'pro' THEN -1
      WHEN 'team' THEN -1
      WHEN 'enterprise' THEN -1
      ELSE 5
    END AS documents_limit,
    CASE p_plan
      WHEN 'free' THEN 1
      WHEN 'pro' THEN 50
      WHEN 'team' THEN 500
      WHEN 'enterprise' THEN -1
      ELSE 1
    END AS storage_gb_limit,
    CASE p_plan
      WHEN 'free' THEN 1
      WHEN 'pro' THEN 5
      WHEN 'team' THEN -1
      WHEN 'enterprise' THEN -1
      ELSE 1
    END AS team_members_limit,
    CASE p_plan
      WHEN 'free' THEN false
      ELSE true
    END AS has_advanced_ai,
    CASE p_plan
      WHEN 'free' THEN false
      ELSE true
    END AS has_workflows,
    CASE p_plan
      WHEN 'free' THEN false
      WHEN 'pro' THEN false
      ELSE true
    END AS has_sso;
END;
$$ LANGUAGE plpgsql;

-- Function to check usage against limits
CREATE OR REPLACE FUNCTION check_usage_limit(
  p_organization_id UUID,
  p_metric TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_plan TEXT;
  v_current_usage INTEGER;
  v_limit INTEGER;
BEGIN
  -- Get the organization's plan
  SELECT plan INTO v_plan
  FROM subscriptions
  WHERE organization_id = p_organization_id
  AND status IN ('active', 'trialing')
  LIMIT 1;

  -- Default to free plan if no subscription
  IF v_plan IS NULL THEN
    v_plan := 'free';
  END IF;

  -- Get current usage for the metric
  IF p_metric = 'ai_messages' THEN
    SELECT ai_messages_count INTO v_current_usage
    FROM usage_tracking
    WHERE organization_id = p_organization_id
    AND period_end > NOW()
    LIMIT 1;

    SELECT ai_messages_limit INTO v_limit
    FROM get_plan_limits(v_plan);
  ELSIF p_metric = 'documents' THEN
    SELECT documents_count INTO v_current_usage
    FROM usage_tracking
    WHERE organization_id = p_organization_id
    AND period_end > NOW()
    LIMIT 1;

    SELECT documents_limit INTO v_limit
    FROM get_plan_limits(v_plan);
  END IF;

  -- -1 means unlimited
  IF v_limit = -1 THEN
    RETURN true;
  END IF;

  -- Check if under limit
  RETURN COALESCE(v_current_usage, 0) < v_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Users can view their own subscription
CREATE POLICY "Users can view own subscription"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Users can view their organization's subscription
CREATE POLICY "Users can view organization subscription"
  ON subscriptions FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles
      WHERE user_id = auth.uid()
    )
  );

-- Only service role can modify subscriptions
CREATE POLICY "Service role can manage subscriptions"
  ON subscriptions FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Users can view their usage
CREATE POLICY "Users can view own usage"
  ON usage_tracking FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles
      WHERE user_id = auth.uid()
    )
  );

-- Users can view their invoices
CREATE POLICY "Users can view own invoices"
  ON invoices FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles
      WHERE user_id = auth.uid()
    )
  );

-- Initialize usage tracking for existing organizations
INSERT INTO usage_tracking (user_id, organization_id)
SELECT
  up.user_id,
  up.organization_id
FROM user_profiles up
LEFT JOIN usage_tracking ut ON ut.organization_id = up.organization_id
WHERE ut.id IS NULL
AND up.organization_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Initialize free subscriptions for existing users
INSERT INTO subscriptions (user_id, organization_id, plan, status)
SELECT
  up.user_id,
  up.organization_id,
  'free',
  'active'
FROM user_profiles up
LEFT JOIN subscriptions s ON s.organization_id = up.organization_id
WHERE s.id IS NULL
AND up.organization_id IS NOT NULL
ON CONFLICT DO NOTHING;
-- Sales Contacts Table
-- Stores enterprise sales inquiries from the contact form

CREATE TABLE IF NOT EXISTS sales_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT NOT NULL,
  phone TEXT,
  company_size TEXT NOT NULL,
  interested_in TEXT NOT NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  contacted_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  assigned_to UUID REFERENCES auth.users(id),

  -- Constraints
  CONSTRAINT valid_company_size CHECK (
    company_size IN ('1-10', '11-50', '51-200', '201-500', '501-1000', '1000+')
  ),
  CONSTRAINT valid_interested_in CHECK (
    interested_in IN ('business', 'enterprise', 'custom', 'consultation')
  ),
  CONSTRAINT valid_status CHECK (
    status IN ('new', 'contacted', 'qualified', 'demo_scheduled', 'proposal_sent', 'closed_won', 'closed_lost')
  ),
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Index for faster lookups
CREATE INDEX idx_sales_contacts_status ON sales_contacts(status);
CREATE INDEX idx_sales_contacts_created_at ON sales_contacts(created_at DESC);
CREATE INDEX idx_sales_contacts_email ON sales_contacts(email);
CREATE INDEX idx_sales_contacts_company ON sales_contacts(company);

-- RLS Policies
ALTER TABLE sales_contacts ENABLE ROW LEVEL SECURITY;

-- Only authenticated users with admin role can view sales contacts
CREATE POLICY "Admin users can view sales contacts"
  ON sales_contacts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Only admin users can update sales contacts
CREATE POLICY "Admin users can update sales contacts"
  ON sales_contacts
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Anyone can insert (form submission doesn't require auth)
CREATE POLICY "Anyone can submit sales contact"
  ON sales_contacts
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_sales_contacts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sales_contacts_updated_at
  BEFORE UPDATE ON sales_contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_sales_contacts_updated_at();

-- Comments
COMMENT ON TABLE sales_contacts IS 'Enterprise sales inquiries from contact form';
COMMENT ON COLUMN sales_contacts.status IS 'Sales pipeline status: new, contacted, qualified, demo_scheduled, proposal_sent, closed_won, closed_lost';
COMMENT ON COLUMN sales_contacts.company_size IS 'Number of employees: 1-10, 11-50, 51-200, 201-500, 501-1000, 1000+';
COMMENT ON COLUMN sales_contacts.interested_in IS 'Plan they are interested in: business, enterprise, custom, consultation';
-- Create user_profiles as a view of profiles for backwards compatibility
-- This fixes the inconsistency where some code references user_profiles
-- but the actual table is called profiles

-- Create view
CREATE OR REPLACE VIEW user_profiles AS
SELECT * FROM profiles;

-- Create instead-of triggers to make the view writable
CREATE OR REPLACE FUNCTION user_profiles_insert()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, avatar_url, organization_id, created_at, updated_at)
  VALUES (NEW.id, NEW.email, NEW.full_name, NEW.avatar_url, NEW.organization_id, NEW.created_at, NEW.updated_at);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION user_profiles_update()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET
    email = NEW.email,
    full_name = NEW.full_name,
    avatar_url = NEW.avatar_url,
    organization_id = NEW.organization_id,
    updated_at = NEW.updated_at
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION user_profiles_delete()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM profiles WHERE id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS user_profiles_insert_trigger ON user_profiles;
DROP TRIGGER IF EXISTS user_profiles_update_trigger ON user_profiles;
DROP TRIGGER IF EXISTS user_profiles_delete_trigger ON user_profiles;

-- Create triggers
CREATE TRIGGER user_profiles_insert_trigger
  INSTEAD OF INSERT ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION user_profiles_insert();

CREATE TRIGGER user_profiles_update_trigger
  INSTEAD OF UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION user_profiles_update();

CREATE TRIGGER user_profiles_delete_trigger
  INSTEAD OF DELETE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION user_profiles_delete();

-- Add helpful comment
COMMENT ON VIEW user_profiles IS 'Compatibility view for profiles table. Use profiles table directly in new code.';
-- Marketplace Infrastructure
-- Allows users to buy/sell custom AI agents and workflows
-- Platform takes 30% commission on all sales

-- Create marketplace_items table
CREATE TABLE IF NOT EXISTS marketplace_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Item details
  type TEXT NOT NULL CHECK (type IN ('agent', 'workflow')),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  long_description TEXT,

  -- Pricing
  pricing_type TEXT NOT NULL CHECK (pricing_type IN ('one_time', 'subscription')),
  price DECIMAL(10, 2) NOT NULL,
  subscription_interval TEXT CHECK (subscription_interval IN ('monthly', 'yearly')),

  -- Media
  thumbnail_url TEXT,
  images TEXT[] DEFAULT '{}',
  demo_video_url TEXT,

  -- Metadata
  category TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  features JSONB DEFAULT '[]'::jsonb,

  -- Configuration (stored as JSON)
  config JSONB NOT NULL,

  -- Stats
  total_sales INTEGER DEFAULT 0,
  total_revenue DECIMAL(10, 2) DEFAULT 0,
  average_rating DECIMAL(3, 2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,

  -- Status
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_review', 'approved', 'rejected', 'archived')),
  rejection_reason TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ,

  -- Indexes for search
  search_vector tsvector
);

-- Create marketplace_purchases table
CREATE TABLE IF NOT EXISTS marketplace_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES marketplace_items(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  buyer_organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Purchase details
  purchase_type TEXT NOT NULL CHECK (purchase_type IN ('one_time', 'subscription')),
  price_paid DECIMAL(10, 2) NOT NULL,
  platform_commission DECIMAL(10, 2) NOT NULL, -- 30%
  creator_payout DECIMAL(10, 2) NOT NULL, -- 70%

  -- Subscription info
  stripe_subscription_id TEXT,
  subscription_status TEXT CHECK (subscription_status IN ('active', 'canceled', 'expired')),
  subscription_end_date TIMESTAMPTZ,

  -- Status
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'refunded')),
  refund_reason TEXT,
  refunded_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create marketplace_reviews table
CREATE TABLE IF NOT EXISTS marketplace_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES marketplace_items(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  purchase_id UUID NOT NULL REFERENCES marketplace_purchases(id) ON DELETE CASCADE,

  -- Review content
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  comment TEXT,

  -- Response from creator
  creator_response TEXT,
  creator_responded_at TIMESTAMPTZ,

  -- Status
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'hidden', 'flagged')),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent duplicate reviews
  UNIQUE(item_id, reviewer_id)
);

-- Create marketplace_payouts table
CREATE TABLE IF NOT EXISTS marketplace_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Payout details
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',

  -- Period
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,

  -- Purchases included
  purchase_ids UUID[] NOT NULL,

  -- Stripe info
  stripe_transfer_id TEXT,
  stripe_payout_id TEXT,

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  failure_reason TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Create indexes
CREATE INDEX idx_marketplace_items_creator ON marketplace_items(creator_id);
CREATE INDEX idx_marketplace_items_status ON marketplace_items(status);
CREATE INDEX idx_marketplace_items_type ON marketplace_items(type);
CREATE INDEX idx_marketplace_items_category ON marketplace_items(category);
CREATE INDEX idx_marketplace_items_rating ON marketplace_items(average_rating DESC);
CREATE INDEX idx_marketplace_items_sales ON marketplace_items(total_sales DESC);
CREATE INDEX idx_marketplace_items_search ON marketplace_items USING gin(search_vector);

CREATE INDEX idx_marketplace_purchases_buyer ON marketplace_purchases(buyer_id);
CREATE INDEX idx_marketplace_purchases_item ON marketplace_purchases(item_id);
CREATE INDEX idx_marketplace_purchases_created ON marketplace_purchases(created_at DESC);

CREATE INDEX idx_marketplace_reviews_item ON marketplace_reviews(item_id);
CREATE INDEX idx_marketplace_reviews_rating ON marketplace_reviews(rating);

CREATE INDEX idx_marketplace_payouts_creator ON marketplace_payouts(creator_id);
CREATE INDEX idx_marketplace_payouts_status ON marketplace_payouts(status);

-- Create search vector update trigger
CREATE OR REPLACE FUNCTION update_marketplace_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW.tags, ' '), '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER marketplace_items_search_vector_update
  BEFORE INSERT OR UPDATE ON marketplace_items
  FOR EACH ROW
  EXECUTE FUNCTION update_marketplace_search_vector();

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_marketplace_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER marketplace_items_updated_at
  BEFORE UPDATE ON marketplace_items
  FOR EACH ROW
  EXECUTE FUNCTION update_marketplace_updated_at();

CREATE TRIGGER marketplace_purchases_updated_at
  BEFORE UPDATE ON marketplace_purchases
  FOR EACH ROW
  EXECUTE FUNCTION update_marketplace_updated_at();

CREATE TRIGGER marketplace_reviews_updated_at
  BEFORE UPDATE ON marketplace_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_marketplace_updated_at();

-- RLS Policies
ALTER TABLE marketplace_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_payouts ENABLE ROW LEVEL SECURITY;

-- Marketplace items policies
CREATE POLICY "Anyone can view approved marketplace items"
  ON marketplace_items
  FOR SELECT
  TO authenticated, anon
  USING (status = 'approved');

CREATE POLICY "Creators can view their own items"
  ON marketplace_items
  FOR SELECT
  TO authenticated
  USING (creator_id = auth.uid());

CREATE POLICY "Creators can create items"
  ON marketplace_items
  FOR INSERT
  TO authenticated
  WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Creators can update their own items"
  ON marketplace_items
  FOR UPDATE
  TO authenticated
  USING (creator_id = auth.uid())
  WITH CHECK (creator_id = auth.uid());

-- Purchase policies
CREATE POLICY "Buyers can view their purchases"
  ON marketplace_purchases
  FOR SELECT
  TO authenticated
  USING (buyer_id = auth.uid());

CREATE POLICY "Creators can view purchases of their items"
  ON marketplace_purchases
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM marketplace_items
      WHERE marketplace_items.id = marketplace_purchases.item_id
      AND marketplace_items.creator_id = auth.uid()
    )
  );

-- Review policies
CREATE POLICY "Anyone can view published reviews"
  ON marketplace_reviews
  FOR SELECT
  TO authenticated, anon
  USING (status = 'published');

CREATE POLICY "Buyers can create reviews for purchased items"
  ON marketplace_reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (
    reviewer_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM marketplace_purchases
      WHERE marketplace_purchases.id = purchase_id
      AND marketplace_purchases.buyer_id = auth.uid()
    )
  );

-- Payout policies
CREATE POLICY "Creators can view their payouts"
  ON marketplace_payouts
  FOR SELECT
  TO authenticated
  USING (creator_id = auth.uid());

-- Comments
COMMENT ON TABLE marketplace_items IS 'Marketplace listings for AI agents and workflows';
COMMENT ON TABLE marketplace_purchases IS 'Purchase history and subscription tracking';
COMMENT ON TABLE marketplace_reviews IS 'User reviews and ratings for marketplace items';
COMMENT ON TABLE marketplace_payouts IS 'Creator payout tracking (70% of sales after 30% platform commission)';
-- API Access Infrastructure
-- Enables pay-per-call API access with usage tracking and billing

-- Create api_keys table
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Key details
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE, -- Hashed API key for security
  key_prefix TEXT NOT NULL, -- First 8 chars for display (e.g., "sk_prod_")

  -- Environment
  environment TEXT NOT NULL CHECK (environment IN ('production', 'development', 'test')),

  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked', 'expired')),

  -- Rate limiting
  rate_limit_per_minute INTEGER DEFAULT 60,
  rate_limit_per_day INTEGER DEFAULT 10000,

  -- Usage tracking
  total_requests BIGINT DEFAULT 0,
  last_used_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- Create api_usage table for detailed tracking
CREATE TABLE IF NOT EXISTS api_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Request details
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER NOT NULL,

  -- AI model details (if applicable)
  model TEXT,
  input_tokens INTEGER,
  output_tokens INTEGER,
  total_tokens INTEGER,

  -- Cost calculation
  cost_usd DECIMAL(10, 6),

  -- Performance metrics
  response_time_ms INTEGER,

  -- Metadata
  user_agent TEXT,
  ip_address INET,
  request_metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create api_usage_aggregates table for efficient querying
CREATE TABLE IF NOT EXISTS api_usage_aggregates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Time period
  period_type TEXT NOT NULL CHECK (period_type IN ('hourly', 'daily', 'monthly')),
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,

  -- Aggregated metrics
  total_requests BIGINT DEFAULT 0,
  total_tokens BIGINT DEFAULT 0,
  total_cost_usd DECIMAL(10, 2) DEFAULT 0,

  -- By model
  usage_by_model JSONB DEFAULT '{}'::jsonb,

  -- By endpoint
  usage_by_endpoint JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint for period
  UNIQUE(user_id, organization_id, period_type, period_start)
);

-- Create api_billing table
CREATE TABLE IF NOT EXISTS api_billing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Billing period
  billing_period_start TIMESTAMPTZ NOT NULL,
  billing_period_end TIMESTAMPTZ NOT NULL,

  -- Usage details
  total_requests BIGINT DEFAULT 0,
  included_requests BIGINT DEFAULT 0, -- From subscription
  overage_requests BIGINT DEFAULT 0,

  -- Costs
  subscription_cost_usd DECIMAL(10, 2) DEFAULT 0,
  usage_cost_usd DECIMAL(10, 2) DEFAULT 0,
  total_cost_usd DECIMAL(10, 2) DEFAULT 0,

  -- Payment
  stripe_invoice_id TEXT,
  paid_at TIMESTAMPTZ,

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint
  UNIQUE(user_id, organization_id, billing_period_start)
);

-- Create api_rate_limits table for tracking rate limit violations
CREATE TABLE IF NOT EXISTS api_rate_limit_violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Violation details
  limit_type TEXT NOT NULL CHECK (limit_type IN ('per_minute', 'per_day', 'per_month')),
  current_count BIGINT NOT NULL,
  limit_value BIGINT NOT NULL,

  -- Context
  endpoint TEXT,
  ip_address INET,

  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_api_keys_user ON api_keys(user_id);
CREATE INDEX idx_api_keys_organization ON api_keys(organization_id);
CREATE INDEX idx_api_keys_status ON api_keys(status);
CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash);

CREATE INDEX idx_api_usage_key ON api_usage(api_key_id);
CREATE INDEX idx_api_usage_user ON api_usage(user_id);
CREATE INDEX idx_api_usage_org ON api_usage(organization_id);
CREATE INDEX idx_api_usage_created ON api_usage(created_at DESC);
CREATE INDEX idx_api_usage_endpoint ON api_usage(endpoint);
CREATE INDEX idx_api_usage_model ON api_usage(model);

CREATE INDEX idx_api_usage_aggregates_user ON api_usage_aggregates(user_id);
CREATE INDEX idx_api_usage_aggregates_org ON api_usage_aggregates(organization_id);
CREATE INDEX idx_api_usage_aggregates_period ON api_usage_aggregates(period_type, period_start);

CREATE INDEX idx_api_billing_user ON api_billing(user_id);
CREATE INDEX idx_api_billing_org ON api_billing(organization_id);
CREATE INDEX idx_api_billing_period ON api_billing(billing_period_start);
CREATE INDEX idx_api_billing_status ON api_billing(status);

CREATE INDEX idx_api_rate_violations_key ON api_rate_limit_violations(api_key_id);
CREATE INDEX idx_api_rate_violations_created ON api_rate_limit_violations(created_at);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_api_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER api_keys_updated_at
  BEFORE UPDATE ON api_keys
  FOR EACH ROW
  EXECUTE FUNCTION update_api_updated_at();

CREATE TRIGGER api_usage_aggregates_updated_at
  BEFORE UPDATE ON api_usage_aggregates
  FOR EACH ROW
  EXECUTE FUNCTION update_api_updated_at();

CREATE TRIGGER api_billing_updated_at
  BEFORE UPDATE ON api_billing
  FOR EACH ROW
  EXECUTE FUNCTION update_api_updated_at();

-- RLS Policies
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage_aggregates ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_billing ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_rate_limit_violations ENABLE ROW LEVEL SECURITY;

-- API Keys policies
CREATE POLICY "Users can view their own API keys"
  ON api_keys
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own API keys"
  ON api_keys
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own API keys"
  ON api_keys
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own API keys"
  ON api_keys
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- API Usage policies
CREATE POLICY "Users can view their own usage"
  ON api_usage
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- API Usage Aggregates policies
CREATE POLICY "Users can view their own usage aggregates"
  ON api_usage_aggregates
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- API Billing policies
CREATE POLICY "Users can view their own billing"
  ON api_billing
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Rate Limit Violations policies
CREATE POLICY "Users can view their own rate limit violations"
  ON api_rate_limit_violations
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Function to generate API key prefix based on environment
CREATE OR REPLACE FUNCTION generate_api_key_prefix(env TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN CASE env
    WHEN 'production' THEN 'sk_prod_'
    WHEN 'development' THEN 'sk_dev_'
    WHEN 'test' THEN 'sk_test_'
    ELSE 'sk_'
  END;
END;
$$ LANGUAGE plpgsql;

-- Function to aggregate usage data (to be called periodically)
CREATE OR REPLACE FUNCTION aggregate_api_usage(
  agg_user_id UUID,
  agg_org_id UUID,
  agg_period_type TEXT,
  agg_period_start TIMESTAMPTZ,
  agg_period_end TIMESTAMPTZ
)
RETURNS VOID AS $$
DECLARE
  v_total_requests BIGINT;
  v_total_tokens BIGINT;
  v_total_cost DECIMAL(10, 2);
  v_usage_by_model JSONB;
  v_usage_by_endpoint JSONB;
BEGIN
  -- Calculate aggregates
  SELECT
    COUNT(*),
    COALESCE(SUM(total_tokens), 0),
    COALESCE(SUM(cost_usd), 0)
  INTO v_total_requests, v_total_tokens, v_total_cost
  FROM api_usage
  WHERE user_id = agg_user_id
    AND organization_id = agg_org_id
    AND created_at >= agg_period_start
    AND created_at < agg_period_end;

  -- Aggregate by model
  SELECT jsonb_object_agg(model, model_stats)
  INTO v_usage_by_model
  FROM (
    SELECT
      model,
      jsonb_build_object(
        'requests', COUNT(*),
        'tokens', COALESCE(SUM(total_tokens), 0),
        'cost', COALESCE(SUM(cost_usd), 0)
      ) as model_stats
    FROM api_usage
    WHERE user_id = agg_user_id
      AND organization_id = agg_org_id
      AND created_at >= agg_period_start
      AND created_at < agg_period_end
      AND model IS NOT NULL
    GROUP BY model
  ) model_agg;

  -- Aggregate by endpoint
  SELECT jsonb_object_agg(endpoint, endpoint_stats)
  INTO v_usage_by_endpoint
  FROM (
    SELECT
      endpoint,
      jsonb_build_object(
        'requests', COUNT(*),
        'avg_response_time_ms', AVG(response_time_ms)
      ) as endpoint_stats
    FROM api_usage
    WHERE user_id = agg_user_id
      AND organization_id = agg_org_id
      AND created_at >= agg_period_start
      AND created_at < agg_period_end
    GROUP BY endpoint
  ) endpoint_agg;

  -- Insert or update aggregate
  INSERT INTO api_usage_aggregates (
    user_id,
    organization_id,
    period_type,
    period_start,
    period_end,
    total_requests,
    total_tokens,
    total_cost_usd,
    usage_by_model,
    usage_by_endpoint
  ) VALUES (
    agg_user_id,
    agg_org_id,
    agg_period_type,
    agg_period_start,
    agg_period_end,
    v_total_requests,
    v_total_tokens,
    v_total_cost,
    COALESCE(v_usage_by_model, '{}'::jsonb),
    COALESCE(v_usage_by_endpoint, '{}'::jsonb)
  )
  ON CONFLICT (user_id, organization_id, period_type, period_start)
  DO UPDATE SET
    total_requests = EXCLUDED.total_requests,
    total_tokens = EXCLUDED.total_tokens,
    total_cost_usd = EXCLUDED.total_cost_usd,
    usage_by_model = EXCLUDED.usage_by_model,
    usage_by_endpoint = EXCLUDED.usage_by_endpoint,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE api_keys IS 'API keys for programmatic access to AI OS';
COMMENT ON TABLE api_usage IS 'Detailed API usage logs for billing and analytics';
COMMENT ON TABLE api_usage_aggregates IS 'Aggregated API usage metrics for faster queries';
COMMENT ON TABLE api_billing IS 'Monthly API billing records';
COMMENT ON TABLE api_rate_limit_violations IS 'Rate limit violation tracking';
-- Partner/Affiliate Program Infrastructure
-- Enables recurring commission tracking with multi-tier structure

-- Create partners table
CREATE TABLE IF NOT EXISTS partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Partner details
  partner_name TEXT NOT NULL,
  partner_email TEXT NOT NULL,
  partner_type TEXT NOT NULL CHECK (partner_type IN ('individual', 'agency', 'reseller')),

  -- Commission tier
  tier TEXT NOT NULL DEFAULT 'affiliate' CHECK (tier IN ('affiliate', 'partner', 'enterprise')),
  commission_rate DECIMAL(5, 2) NOT NULL DEFAULT 20.00, -- Percentage
  commission_duration_months INTEGER NOT NULL DEFAULT 12, -- How long commissions paid

  -- Referral tracking
  referral_code TEXT NOT NULL UNIQUE,
  referral_link TEXT NOT NULL,

  -- Stats
  total_referrals INTEGER DEFAULT 0,
  active_referrals INTEGER DEFAULT 0,
  total_earnings DECIMAL(10, 2) DEFAULT 0,
  pending_payout DECIMAL(10, 2) DEFAULT 0,

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'terminated')),
  approved_at TIMESTAMPTZ,
  suspended_reason TEXT,

  -- Payout details
  payout_method TEXT DEFAULT 'stripe' CHECK (payout_method IN ('stripe', 'paypal', 'wire')),
  payout_email TEXT,
  stripe_account_id TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create partner_referrals table
CREATE TABLE IF NOT EXISTS partner_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,

  -- Customer details
  customer_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  customer_email TEXT NOT NULL,

  -- Subscription details
  subscription_id TEXT, -- Stripe subscription ID
  plan_name TEXT NOT NULL,
  plan_price DECIMAL(10, 2) NOT NULL,

  -- Commission details
  commission_rate DECIMAL(5, 2) NOT NULL, -- Rate at time of referral
  commission_duration_months INTEGER NOT NULL, -- Locked in at referral time
  commission_start_date TIMESTAMPTZ NOT NULL,
  commission_end_date TIMESTAMPTZ NOT NULL,

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'churned', 'refunded')),
  activated_at TIMESTAMPTZ,
  churned_at TIMESTAMPTZ,

  -- Tracking
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  landing_page TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create partner_commissions table
CREATE TABLE IF NOT EXISTS partner_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  referral_id UUID NOT NULL REFERENCES partner_referrals(id) ON DELETE CASCADE,

  -- Period
  billing_period_start TIMESTAMPTZ NOT NULL,
  billing_period_end TIMESTAMPTZ NOT NULL,

  -- Commission details
  subscription_revenue DECIMAL(10, 2) NOT NULL,
  commission_rate DECIMAL(5, 2) NOT NULL,
  commission_amount DECIMAL(10, 2) NOT NULL,

  -- Payment tracking
  payout_id UUID REFERENCES partner_payouts(id) ON DELETE SET NULL,

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'cancelled')),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint
  UNIQUE(referral_id, billing_period_start)
);

-- Create partner_payouts table
CREATE TABLE IF NOT EXISTS partner_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,

  -- Payout details
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',

  -- Period covered
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,

  -- Commissions included
  commission_ids UUID[] NOT NULL,

  -- Payment method
  payout_method TEXT NOT NULL CHECK (payout_method IN ('stripe', 'paypal', 'wire')),
  payout_email TEXT,

  -- Stripe/PayPal tracking
  stripe_transfer_id TEXT,
  paypal_transaction_id TEXT,

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  failure_reason TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Create partner_tier_requirements table
CREATE TABLE IF NOT EXISTS partner_tier_requirements (
  tier TEXT PRIMARY KEY CHECK (tier IN ('affiliate', 'partner', 'enterprise')),

  -- Requirements
  min_monthly_referrals INTEGER NOT NULL,
  min_arr DECIMAL(10, 2) NOT NULL,

  -- Benefits
  commission_rate DECIMAL(5, 2) NOT NULL,
  commission_duration_months INTEGER NOT NULL,

  -- Features
  priority_support BOOLEAN DEFAULT false,
  co_marketing BOOLEAN DEFAULT false,
  white_label BOOLEAN DEFAULT false,
  dedicated_manager BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default tier requirements
INSERT INTO partner_tier_requirements (tier, min_monthly_referrals, min_arr, commission_rate, commission_duration_months, priority_support, co_marketing, white_label, dedicated_manager)
VALUES
  ('affiliate', 0, 0, 20.00, 12, false, false, false, false),
  ('partner', 5, 5000, 25.00, 24, true, true, false, false),
  ('enterprise', 10, 50000, 30.00, 36, true, true, true, true)
ON CONFLICT (tier) DO NOTHING;

-- Create indexes
CREATE INDEX idx_partners_user ON partners(user_id);
CREATE INDEX idx_partners_referral_code ON partners(referral_code);
CREATE INDEX idx_partners_tier ON partners(tier);
CREATE INDEX idx_partners_status ON partners(status);

CREATE INDEX idx_partner_referrals_partner ON partner_referrals(partner_id);
CREATE INDEX idx_partner_referrals_customer ON partner_referrals(customer_user_id);
CREATE INDEX idx_partner_referrals_status ON partner_referrals(status);
CREATE INDEX idx_partner_referrals_created ON partner_referrals(created_at DESC);

CREATE INDEX idx_partner_commissions_partner ON partner_commissions(partner_id);
CREATE INDEX idx_partner_commissions_referral ON partner_commissions(referral_id);
CREATE INDEX idx_partner_commissions_status ON partner_commissions(status);
CREATE INDEX idx_partner_commissions_period ON partner_commissions(billing_period_start);

CREATE INDEX idx_partner_payouts_partner ON partner_payouts(partner_id);
CREATE INDEX idx_partner_payouts_status ON partner_payouts(status);
CREATE INDEX idx_partner_payouts_period ON partner_payouts(period_start);

-- Create updated_at triggers
CREATE TRIGGER partners_updated_at
  BEFORE UPDATE ON partners
  FOR EACH ROW
  EXECUTE FUNCTION update_api_updated_at();

CREATE TRIGGER partner_referrals_updated_at
  BEFORE UPDATE ON partner_referrals
  FOR EACH ROW
  EXECUTE FUNCTION update_api_updated_at();

CREATE TRIGGER partner_commissions_updated_at
  BEFORE UPDATE ON partner_commissions
  FOR EACH ROW
  EXECUTE FUNCTION update_api_updated_at();

CREATE TRIGGER partner_tier_requirements_updated_at
  BEFORE UPDATE ON partner_tier_requirements
  FOR EACH ROW
  EXECUTE FUNCTION update_api_updated_at();

-- RLS Policies
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_tier_requirements ENABLE ROW LEVEL SECURITY;

-- Partners policies
CREATE POLICY "Partners can view their own profile"
  ON partners
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Partners can update their own profile"
  ON partners
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Referrals policies
CREATE POLICY "Partners can view their referrals"
  ON partner_referrals
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM partners
      WHERE partners.id = partner_referrals.partner_id
      AND partners.user_id = auth.uid()
    )
  );

-- Commissions policies
CREATE POLICY "Partners can view their commissions"
  ON partner_commissions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM partners
      WHERE partners.id = partner_commissions.partner_id
      AND partners.user_id = auth.uid()
    )
  );

-- Payouts policies
CREATE POLICY "Partners can view their payouts"
  ON partner_payouts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM partners
      WHERE partners.id = partner_payouts.partner_id
      AND partners.user_id = auth.uid()
    )
  );

-- Tier requirements policies (read-only for all authenticated users)
CREATE POLICY "Anyone can view tier requirements"
  ON partner_tier_requirements
  FOR SELECT
  TO authenticated
  USING (true);

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate partner tier based on performance
CREATE OR REPLACE FUNCTION calculate_partner_tier(p_partner_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_monthly_referrals INTEGER;
  v_arr DECIMAL(10, 2);
  v_new_tier TEXT;
BEGIN
  -- Calculate monthly referrals (last 30 days)
  SELECT COUNT(*)
  INTO v_monthly_referrals
  FROM partner_referrals
  WHERE partner_id = p_partner_id
    AND status = 'active'
    AND activated_at >= NOW() - INTERVAL '30 days';

  -- Calculate ARR (annual recurring revenue from active referrals)
  SELECT COALESCE(SUM(plan_price * 12), 0)
  INTO v_arr
  FROM partner_referrals
  WHERE partner_id = p_partner_id
    AND status = 'active';

  -- Determine tier (check from highest to lowest)
  IF v_monthly_referrals >= 10 AND v_arr >= 50000 THEN
    v_new_tier := 'enterprise';
  ELSIF v_monthly_referrals >= 5 AND v_arr >= 5000 THEN
    v_new_tier := 'partner';
  ELSE
    v_new_tier := 'affiliate';
  END IF;

  RETURN v_new_tier;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate monthly commissions
CREATE OR REPLACE FUNCTION calculate_partner_commissions(
  p_period_start TIMESTAMPTZ,
  p_period_end TIMESTAMPTZ
)
RETURNS VOID AS $$
DECLARE
  r RECORD;
  v_commission_amount DECIMAL(10, 2);
BEGIN
  -- Loop through all active referrals that should generate commissions
  FOR r IN
    SELECT
      pr.id as referral_id,
      pr.partner_id,
      pr.plan_price,
      pr.commission_rate,
      pr.commission_start_date,
      pr.commission_end_date
    FROM partner_referrals pr
    WHERE pr.status = 'active'
      AND pr.commission_start_date <= p_period_end
      AND pr.commission_end_date >= p_period_start
  LOOP
    -- Calculate commission amount
    v_commission_amount := r.plan_price * (r.commission_rate / 100);

    -- Insert commission record
    INSERT INTO partner_commissions (
      partner_id,
      referral_id,
      billing_period_start,
      billing_period_end,
      subscription_revenue,
      commission_rate,
      commission_amount,
      status
    ) VALUES (
      r.partner_id,
      r.referral_id,
      p_period_start,
      p_period_end,
      r.plan_price,
      r.commission_rate,
      v_commission_amount,
      'approved'
    )
    ON CONFLICT (referral_id, billing_period_start) DO NOTHING;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE partners IS 'Partner/affiliate program members';
COMMENT ON TABLE partner_referrals IS 'Customers referred by partners';
COMMENT ON TABLE partner_commissions IS 'Monthly recurring commissions for partners';
COMMENT ON TABLE partner_payouts IS 'Partner payout records';
COMMENT ON TABLE partner_tier_requirements IS 'Partner tier definitions and requirements';
-- Helper functions for Stripe webhook processing

-- Function to increment marketplace sales
CREATE OR REPLACE FUNCTION increment_marketplace_sales(
  p_item_id UUID,
  p_revenue DECIMAL(10, 2)
)
RETURNS VOID AS $$
BEGIN
  UPDATE marketplace_items
  SET
    total_sales = total_sales + 1,
    total_revenue = total_revenue + p_revenue,
    updated_at = NOW()
  WHERE id = p_item_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update partner earnings
CREATE OR REPLACE FUNCTION update_partner_earnings(
  p_partner_id UUID,
  p_amount DECIMAL(10, 2)
)
RETURNS VOID AS $$
BEGIN
  UPDATE partners
  SET
    total_earnings = total_earnings + p_amount,
    pending_payout = pending_payout + p_amount,
    updated_at = NOW()
  WHERE id = p_partner_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update marketplace item ratings
CREATE OR REPLACE FUNCTION update_marketplace_item_rating(
  p_item_id UUID
)
RETURNS VOID AS $$
DECLARE
  v_avg_rating DECIMAL(3, 2);
  v_review_count INTEGER;
BEGIN
  SELECT
    COALESCE(AVG(rating), 0),
    COUNT(*)
  INTO v_avg_rating, v_review_count
  FROM marketplace_reviews
  WHERE item_id = p_item_id
    AND status = 'published';

  UPDATE marketplace_items
  SET
    average_rating = v_avg_rating,
    review_count = v_review_count,
    updated_at = NOW()
  WHERE id = p_item_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update item ratings when reviews are added/updated
CREATE OR REPLACE FUNCTION trigger_update_item_rating()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM update_marketplace_item_rating(NEW.item_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER marketplace_reviews_rating_update
  AFTER INSERT OR UPDATE ON marketplace_reviews
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_item_rating();

-- Function to check partner tier eligibility and upgrade
CREATE OR REPLACE FUNCTION check_partner_tier_upgrades()
RETURNS VOID AS $$
DECLARE
  r RECORD;
  v_new_tier TEXT;
  v_tier_config RECORD;
BEGIN
  FOR r IN
    SELECT id, tier
    FROM partners
    WHERE status = 'active'
  LOOP
    -- Calculate new tier
    v_new_tier := calculate_partner_tier(r.id);

    -- If tier changed, update partner
    IF v_new_tier != r.tier THEN
      -- Get tier configuration
      SELECT *
      INTO v_tier_config
      FROM partner_tier_requirements
      WHERE tier = v_new_tier;

      -- Update partner
      UPDATE partners
      SET
        tier = v_new_tier,
        commission_rate = v_tier_config.commission_rate,
        commission_duration_months = v_tier_config.commission_duration_months,
        updated_at = NOW()
      WHERE id = r.id;

      -- Log tier upgrade
      INSERT INTO partner_tier_history (
        partner_id,
        old_tier,
        new_tier,
        upgraded_at
      ) VALUES (
        r.id,
        r.tier,
        v_new_tier,
        NOW()
      );
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create partner tier history table
CREATE TABLE IF NOT EXISTS partner_tier_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  old_tier TEXT NOT NULL,
  new_tier TEXT NOT NULL,
  upgraded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_partner_tier_history_partner ON partner_tier_history(partner_id);
CREATE INDEX idx_partner_tier_history_date ON partner_tier_history(upgraded_at DESC);

-- RLS for tier history
ALTER TABLE partner_tier_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partners can view their tier history"
  ON partner_tier_history
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM partners
      WHERE partners.id = partner_tier_history.partner_id
      AND partners.user_id = auth.uid()
    )
  );

-- Function to process monthly partner payouts
CREATE OR REPLACE FUNCTION process_partner_payouts(
  p_period_start TIMESTAMPTZ,
  p_period_end TIMESTAMPTZ,
  p_min_payout_amount DECIMAL(10, 2) DEFAULT 100.00
)
RETURNS INTEGER AS $$
DECLARE
  r RECORD;
  v_commission_ids UUID[];
  v_payout_id UUID;
  v_payouts_created INTEGER := 0;
BEGIN
  FOR r IN
    SELECT
      p.id as partner_id,
      p.payout_method,
      p.payout_email,
      SUM(pc.commission_amount) as total_amount,
      array_agg(pc.id) as commission_ids
    FROM partners p
    INNER JOIN partner_commissions pc ON pc.partner_id = p.id
    WHERE p.status = 'active'
      AND pc.status = 'approved'
      AND pc.payout_id IS NULL
      AND pc.billing_period_start >= p_period_start
      AND pc.billing_period_end <= p_period_end
    GROUP BY p.id, p.payout_method, p.payout_email
    HAVING SUM(pc.commission_amount) >= p_min_payout_amount
  LOOP
    -- Create payout record
    INSERT INTO partner_payouts (
      partner_id,
      amount,
      period_start,
      period_end,
      commission_ids,
      payout_method,
      payout_email,
      status
    ) VALUES (
      r.partner_id,
      r.total_amount,
      p_period_start,
      p_period_end,
      r.commission_ids,
      r.payout_method,
      r.payout_email,
      'pending'
    )
    RETURNING id INTO v_payout_id;

    -- Link commissions to payout
    UPDATE partner_commissions
    SET payout_id = v_payout_id
    WHERE id = ANY(r.commission_ids);

    -- Update partner pending payout
    UPDATE partners
    SET pending_payout = pending_payout - r.total_amount
    WHERE id = r.partner_id;

    v_payouts_created := v_payouts_created + 1;
  END LOOP;

  RETURN v_payouts_created;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON FUNCTION increment_marketplace_sales IS 'Increment sales counter and revenue for marketplace item';
COMMENT ON FUNCTION update_partner_earnings IS 'Update partner total earnings and pending payout';
COMMENT ON FUNCTION update_marketplace_item_rating IS 'Recalculate and update marketplace item average rating';
COMMENT ON FUNCTION check_partner_tier_upgrades IS 'Check all partners for tier upgrades based on performance';
COMMENT ON FUNCTION process_partner_payouts IS 'Create monthly payout records for partners';
-- CUSTOM AI ASSISTANTS SCHEMA
-- This schema manages custom AI assistants with specific roles and personalities

-- =====================================================
-- TABLE: ai_assistants
-- Stores custom AI assistants created by users
-- =====================================================
CREATE TABLE IF NOT EXISTS ai_assistants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Assistant details
  name TEXT NOT NULL,
  description TEXT,
  role TEXT NOT NULL, -- 'marketing', 'research', 'code_review', 'writing', 'data_analysis', 'customer_support', 'project_management', 'custom'
  avatar_emoji TEXT DEFAULT '🤖',

  -- Personality & Behavior
  personality_traits JSONB DEFAULT '[]'::jsonb, -- Array of traits like ["professional", "concise", "friendly"]
  tone TEXT DEFAULT 'professional', -- 'professional', 'casual', 'friendly', 'formal', 'creative'
  verbosity TEXT DEFAULT 'balanced', -- 'concise', 'balanced', 'detailed'

  -- Instructions & Context
  system_instructions TEXT NOT NULL, -- Core instructions for the assistant
  context_knowledge TEXT, -- Additional context/knowledge base
  example_interactions JSONB DEFAULT '[]'::jsonb, -- Array of example Q&A pairs

  -- Capabilities
  capabilities JSONB DEFAULT '[]'::jsonb, -- Array of capabilities like ["web_search", "code_generation", "data_analysis"]
  tools_enabled JSONB DEFAULT '{}'::jsonb, -- Enabled tools/integrations

  -- Settings
  model_preference TEXT DEFAULT 'gpt-4', -- AI model to use
  temperature DECIMAL(3,2) DEFAULT 0.7,
  max_tokens INTEGER DEFAULT 2000,
  enabled BOOLEAN DEFAULT true,

  -- Sharing
  is_public BOOLEAN DEFAULT false, -- Can be shared with organization
  is_featured BOOLEAN DEFAULT false, -- Featured in marketplace

  -- Usage stats
  total_conversations INTEGER DEFAULT 0,
  total_messages INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_role CHECK (role IN ('marketing', 'research', 'code_review', 'writing', 'data_analysis', 'customer_support', 'project_management', 'sales', 'hr', 'finance', 'legal', 'custom')),
  CONSTRAINT valid_tone CHECK (tone IN ('professional', 'casual', 'friendly', 'formal', 'creative', 'empathetic')),
  CONSTRAINT valid_verbosity CHECK (verbosity IN ('concise', 'balanced', 'detailed'))
);

-- =====================================================
-- TABLE: assistant_conversations
-- Stores conversations with AI assistants
-- =====================================================
CREATE TABLE IF NOT EXISTS assistant_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assistant_id UUID NOT NULL REFERENCES ai_assistants(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Conversation details
  title TEXT, -- Auto-generated or user-provided
  status TEXT DEFAULT 'active', -- 'active', 'archived'

  -- Context
  context_data JSONB DEFAULT '{}'::jsonb, -- Additional context for this conversation

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_status CHECK (status IN ('active', 'archived'))
);

-- =====================================================
-- TABLE: assistant_messages
-- Stores individual messages in conversations
-- =====================================================
CREATE TABLE IF NOT EXISTS assistant_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES assistant_conversations(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Message details
  role TEXT NOT NULL, -- 'user', 'assistant', 'system'
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb, -- Model used, tokens, etc.

  -- Attachments
  attachments JSONB DEFAULT '[]'::jsonb, -- Array of file references

  -- Feedback
  rating INTEGER, -- 1-5 stars
  feedback TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_role CHECK (role IN ('user', 'assistant', 'system')),
  CONSTRAINT valid_rating CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5))
);

-- =====================================================
-- TABLE: assistant_role_templates
-- Pre-configured templates for different assistant roles
-- =====================================================
CREATE TABLE IF NOT EXISTS assistant_role_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Template info
  name TEXT NOT NULL,
  description TEXT,
  role TEXT NOT NULL,
  avatar_emoji TEXT DEFAULT '🤖',
  category TEXT, -- 'business', 'creative', 'technical', 'support'

  -- Default configuration
  default_instructions TEXT NOT NULL,
  default_personality JSONB DEFAULT '[]'::jsonb,
  default_tone TEXT DEFAULT 'professional',
  default_verbosity TEXT DEFAULT 'balanced',
  default_capabilities JSONB DEFAULT '[]'::jsonb,

  -- Example use cases
  use_cases JSONB DEFAULT '[]'::jsonb, -- Array of example use cases
  example_prompts JSONB DEFAULT '[]'::jsonb, -- Array of example prompts to try

  -- Template metadata
  is_popular BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX idx_ai_assistants_org ON ai_assistants(organization_id);
CREATE INDEX idx_ai_assistants_user ON ai_assistants(user_id);
CREATE INDEX idx_ai_assistants_role ON ai_assistants(role);
CREATE INDEX idx_ai_assistants_enabled ON ai_assistants(enabled) WHERE enabled = true;
CREATE INDEX idx_ai_assistants_public ON ai_assistants(is_public) WHERE is_public = true;

CREATE INDEX idx_conversations_assistant ON assistant_conversations(assistant_id);
CREATE INDEX idx_conversations_user ON assistant_conversations(user_id);
CREATE INDEX idx_conversations_org ON assistant_conversations(organization_id);
CREATE INDEX idx_conversations_status ON assistant_conversations(status);

CREATE INDEX idx_messages_conversation ON assistant_messages(conversation_id);
CREATE INDEX idx_messages_created ON assistant_messages(created_at DESC);

CREATE INDEX idx_role_templates_category ON assistant_role_templates(category);
CREATE INDEX idx_role_templates_popular ON assistant_role_templates(is_popular) WHERE is_popular = true;

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================
ALTER TABLE ai_assistants ENABLE ROW LEVEL SECURITY;
ALTER TABLE assistant_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE assistant_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE assistant_role_templates ENABLE ROW LEVEL SECURITY;

-- AI Assistants Policies
CREATE POLICY "Users can view their organization's assistants"
  ON ai_assistants FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
    OR (is_public = true AND organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    ))
  );

CREATE POLICY "Users can create assistants in their organization"
  ON ai_assistants FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
    AND user_id = auth.uid()
  );

CREATE POLICY "Users can update their own assistants"
  ON ai_assistants FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own assistants"
  ON ai_assistants FOR DELETE
  USING (user_id = auth.uid());

-- Conversations Policies
CREATE POLICY "Users can view their own conversations"
  ON assistant_conversations FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create conversations"
  ON assistant_conversations FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own conversations"
  ON assistant_conversations FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own conversations"
  ON assistant_conversations FOR DELETE
  USING (user_id = auth.uid());

-- Messages Policies
CREATE POLICY "Users can view messages from their conversations"
  ON assistant_messages FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM assistant_conversations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert messages"
  ON assistant_messages FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their messages"
  ON assistant_messages FOR UPDATE
  USING (
    conversation_id IN (
      SELECT id FROM assistant_conversations WHERE user_id = auth.uid()
    )
  );

-- Role Templates Policies (public read)
CREATE POLICY "Anyone can view role templates"
  ON assistant_role_templates FOR SELECT
  USING (true);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to update conversation timestamp
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE assistant_conversations
  SET
    last_message_at = NEW.created_at,
    updated_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update conversation timestamp on new message
CREATE TRIGGER update_conversation_on_message
  AFTER INSERT ON assistant_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_timestamp();

-- Function to update assistant usage stats
CREATE OR REPLACE FUNCTION update_assistant_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.role = 'user' THEN
      UPDATE ai_assistants
      SET
        total_messages = total_messages + 1,
        last_used_at = NEW.created_at,
        updated_at = NEW.created_at
      WHERE id = (
        SELECT assistant_id FROM assistant_conversations WHERE id = NEW.conversation_id
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update assistant stats
CREATE TRIGGER update_assistant_stats_trigger
  AFTER INSERT ON assistant_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_assistant_stats();

-- =====================================================
-- SEED DATA: Role Templates
-- =====================================================
INSERT INTO assistant_role_templates (name, description, role, avatar_emoji, category, default_instructions, default_personality, default_tone, default_verbosity, default_capabilities, use_cases, example_prompts, is_popular) VALUES

-- Business Category
(
  'Marketing Assistant',
  'Expert in marketing strategy, content creation, and campaign planning',
  'marketing',
  '📢',
  'business',
  'You are a marketing expert with deep knowledge of digital marketing, content strategy, SEO, social media, and campaign planning. Help users create effective marketing materials, develop strategies, and optimize their marketing efforts. Be creative yet data-driven in your recommendations.',
  '["creative", "strategic", "data-driven", "persuasive"]'::jsonb,
  'professional',
  'balanced',
  '["content_creation", "strategy_planning", "data_analysis", "trend_analysis"]'::jsonb,
  '["Create marketing campaigns", "Write ad copy", "Develop content calendars", "Analyze marketing metrics", "Plan social media strategy"]'::jsonb,
  '["Help me create a marketing campaign for our new product", "Write compelling ad copy for Facebook ads", "Develop a content calendar for Q1"]'::jsonb,
  true
),

(
  'Sales Assistant',
  'Helps with sales strategy, pitch creation, and customer communication',
  'sales',
  '💼',
  'business',
  'You are a sales professional who helps craft compelling pitches, handle objections, develop sales strategies, and improve customer communication. Focus on understanding customer needs and providing value-driven solutions.',
  '["persuasive", "empathetic", "goal-oriented", "strategic"]'::jsonb,
  'professional',
  'balanced',
  '["pitch_creation", "objection_handling", "strategy_planning", "crm_integration"]'::jsonb,
  '["Create sales pitches", "Handle customer objections", "Develop sales scripts", "Analyze sales pipeline", "Improve closing rates"]'::jsonb,
  '["Help me create a pitch for enterprise clients", "How should I handle price objections?", "Write a follow-up email after demo"]'::jsonb,
  true
),

(
  'Project Management Assistant',
  'Helps plan, organize, and track projects effectively',
  'project_management',
  '📋',
  'business',
  'You are an experienced project manager who helps with project planning, task breakdown, timeline creation, risk management, and team coordination. Use proven methodologies like Agile, Scrum, and Waterfall appropriately.',
  '["organized", "detail-oriented", "proactive", "strategic"]'::jsonb,
  'professional',
  'detailed',
  '["task_planning", "timeline_creation", "risk_assessment", "resource_allocation"]'::jsonb,
  '["Create project plans", "Break down complex projects", "Manage timelines", "Assess risks", "Coordinate teams"]'::jsonb,
  '["Help me create a project plan for a new feature", "Break down this project into sprints", "What are the risks in this timeline?"]'::jsonb,
  true
),

-- Technical Category
(
  'Code Review Assistant',
  'Reviews code for quality, security, and best practices',
  'code_review',
  '👨‍💻',
  'technical',
  'You are a senior software engineer who reviews code for quality, security vulnerabilities, performance issues, and adherence to best practices. Provide constructive feedback with specific suggestions for improvement. Focus on maintainability, readability, and scalability.',
  '["detail-oriented", "analytical", "constructive", "knowledgeable"]'::jsonb,
  'professional',
  'detailed',
  '["code_analysis", "security_audit", "performance_optimization", "best_practices"]'::jsonb,
  '["Review code quality", "Identify security issues", "Suggest performance improvements", "Check for best practices", "Provide refactoring suggestions"]'::jsonb,
  '["Review this React component for issues", "Check this API endpoint for security vulnerabilities", "How can I optimize this database query?"]'::jsonb,
  true
),

(
  'Data Analysis Assistant',
  'Helps analyze data, create visualizations, and extract insights',
  'data_analysis',
  '📊',
  'technical',
  'You are a data analyst who helps interpret data, create meaningful visualizations, perform statistical analysis, and extract actionable insights. Explain complex data concepts in simple terms and recommend appropriate analysis methods.',
  '["analytical", "detail-oriented", "clear", "insightful"]'::jsonb,
  'professional',
  'detailed',
  '["data_analysis", "visualization", "statistical_analysis", "insight_extraction"]'::jsonb,
  '["Analyze datasets", "Create visualizations", "Perform statistical tests", "Extract insights", "Build dashboards"]'::jsonb,
  '["Help me analyze this sales data", "What visualization would work best for this data?", "Perform a statistical analysis of customer trends"]'::jsonb,
  true
),

(
  'Research Assistant',
  'Conducts thorough research and synthesizes information',
  'research',
  '🔍',
  'technical',
  'You are a research specialist who helps gather information, analyze sources, synthesize findings, and present comprehensive research summaries. Be thorough, cite sources when possible, and provide balanced perspectives on topics.',
  '["thorough", "analytical", "objective", "organized"]'::jsonb,
  'professional',
  'detailed',
  '["research", "source_analysis", "synthesis", "fact_checking"]'::jsonb,
  '["Conduct market research", "Analyze competitors", "Summarize academic papers", "Research industry trends", "Gather data on topics"]'::jsonb,
  '["Research our top 5 competitors", "Summarize the latest trends in AI", "Find data on market size for SaaS products"]'::jsonb,
  true
),

-- Creative Category
(
  'Content Writing Assistant',
  'Creates engaging written content for various purposes',
  'writing',
  '✍️',
  'creative',
  'You are a skilled content writer who creates engaging, well-structured content for blogs, articles, social media, emails, and more. Adapt your writing style to match the audience and purpose. Focus on clarity, engagement, and SEO best practices.',
  '["creative", "engaging", "clear", "adaptable"]'::jsonb,
  'friendly',
  'balanced',
  '["content_creation", "copywriting", "editing", "seo_optimization"]'::jsonb,
  '["Write blog posts", "Create social media content", "Draft emails", "Write product descriptions", "Edit and improve content"]'::jsonb,
  '["Write a blog post about productivity tips", "Create engaging LinkedIn posts", "Draft an email announcement for new feature"]'::jsonb,
  true
),

(
  'Creative Brainstorming Assistant',
  'Generates creative ideas and solutions',
  'custom',
  '💡',
  'creative',
  'You are a creative thinking partner who helps generate innovative ideas, explore possibilities, and think outside the box. Use techniques like brainstorming, mind mapping, and lateral thinking to help users discover creative solutions.',
  '["creative", "open-minded", "energetic", "inspiring"]'::jsonb,
  'creative',
  'balanced',
  '["brainstorming", "ideation", "creative_thinking", "problem_solving"]'::jsonb,
  '["Generate product ideas", "Brainstorm campaign concepts", "Explore solutions to problems", "Create naming ideas", "Develop creative strategies"]'::jsonb,
  '["Help me brainstorm names for my new app", "Generate creative marketing campaign ideas", "What are some innovative features we could add?"]'::jsonb,
  false
),

-- Support Category
(
  'Customer Support Assistant',
  'Helps handle customer inquiries and support tickets',
  'customer_support',
  '🎧',
  'support',
  'You are a customer support specialist who helps craft empathetic, helpful responses to customer inquiries. Focus on understanding customer needs, providing clear solutions, and maintaining a positive tone even in difficult situations.',
  '["empathetic", "patient", "helpful", "clear"]'::jsonb,
  'empathetic',
  'balanced',
  '["support_tickets", "faq_creation", "response_templates", "escalation_handling"]'::jsonb,
  '["Draft support responses", "Create FAQ content", "Handle escalations", "Improve response templates", "Analyze support trends"]'::jsonb,
  '["Help me respond to this customer complaint", "Create an FAQ for common issues", "Draft an apology email for service disruption"]'::jsonb,
  true
),

(
  'HR & People Assistant',
  'Assists with HR tasks, team management, and employee communication',
  'hr',
  '👥',
  'business',
  'You are an HR professional who helps with recruitment, employee communication, policy guidance, and people management. Provide advice that is fair, compliant with best practices, and focused on creating a positive work environment.',
  '["empathetic", "fair", "professional", "supportive"]'::jsonb,
  'professional',
  'balanced',
  '["recruitment", "communication", "policy_guidance", "team_building"]'::jsonb,
  '["Draft job descriptions", "Create onboarding plans", "Handle employee communications", "Develop team-building activities", "Provide policy guidance"]'::jsonb,
  '["Help me write a job description for a senior developer", "Create an onboarding checklist", "Draft an announcement about policy changes"]'::jsonb,
  false
),

(
  'Finance & Budgeting Assistant',
  'Helps with financial planning, budgeting, and analysis',
  'finance',
  '💰',
  'business',
  'You are a financial advisor who helps with budgeting, financial planning, expense analysis, and basic financial modeling. Provide clear, actionable financial advice while noting when professional financial consultation is recommended.',
  '["analytical", "detail-oriented", "prudent", "clear"]'::jsonb,
  'professional',
  'detailed',
  '["budget_planning", "expense_analysis", "financial_modeling", "forecasting"]'::jsonb,
  '["Create budgets", "Analyze expenses", "Build financial models", "Forecast revenue", "Optimize spending"]'::jsonb,
  '["Help me create a marketing budget for Q1", "Analyze our monthly expenses", "Build a revenue forecast model"]'::jsonb,
  false
),

(
  'Legal Document Assistant',
  'Helps draft and review legal documents and contracts',
  'legal',
  '⚖️',
  'business',
  'You are a legal assistant who helps draft and review documents, contracts, and policies. Provide general guidance but always recommend consulting qualified legal professionals for important legal matters. Focus on clarity and standard best practices.',
  '["precise", "thorough", "careful", "clear"]'::jsonb,
  'formal',
  'detailed',
  '["document_drafting", "contract_review", "policy_creation", "legal_research"]'::jsonb,
  '["Draft contracts", "Review agreements", "Create policies", "Summarize legal documents", "Provide general legal guidance"]'::jsonb,
  '["Help me draft an NDA template", "Review this service agreement", "Create a privacy policy outline"]'::jsonb,
  false
);

-- =====================================================
-- HELPFUL QUERIES (for reference)
-- =====================================================

-- Get most popular assistants
-- SELECT * FROM ai_assistants
-- WHERE is_public = true
-- ORDER BY total_messages DESC, total_conversations DESC
-- LIMIT 10;

-- Get user's active conversations with message count
-- SELECT
--   c.id,
--   c.title,
--   a.name as assistant_name,
--   COUNT(m.id) as message_count,
--   MAX(m.created_at) as last_message
-- FROM assistant_conversations c
-- JOIN ai_assistants a ON c.assistant_id = a.id
-- LEFT JOIN assistant_messages m ON c.id = m.conversation_id
-- WHERE c.user_id = 'USER_ID' AND c.status = 'active'
-- GROUP BY c.id, c.title, a.name
-- ORDER BY last_message DESC;

-- Get conversation with full message history
-- SELECT
--   m.id,
--   m.role,
--   m.content,
--   m.created_at,
--   m.rating
-- FROM assistant_messages m
-- WHERE m.conversation_id = 'CONVERSATION_ID'
-- ORDER BY m.created_at ASC;
-- AI Agents (Autonomous Workers)
CREATE TABLE IF NOT EXISTS ai_agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  description TEXT,
  agent_type TEXT NOT NULL,
  -- Types: document_analyzer, task_manager, meeting_assistant, email_organizer, research_assistant

  -- Agent configuration
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Examples:
  -- Document Analyzer: {"auto_tag": true, "auto_summarize": true, "languages": ["en"]}
  -- Task Manager: {"priority_threshold": "high", "auto_reschedule": true}
  -- Meeting Assistant: {"auto_create_tasks": true, "send_reminders": true}

  -- Agent personality/behavior
  personality TEXT DEFAULT 'professional',
  -- Options: professional, friendly, concise, detailed

  instructions TEXT,
  -- Custom instructions: "Always prioritize urgent tasks" "Focus on technical documents"

  -- Status
  enabled BOOLEAN DEFAULT TRUE,
  last_active_at TIMESTAMPTZ,

  -- Performance metrics
  total_actions INTEGER DEFAULT 0,
  successful_actions INTEGER DEFAULT 0,
  failed_actions INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent activity logs
CREATE TABLE IF NOT EXISTS agent_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL REFERENCES ai_agents(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  activity_type TEXT NOT NULL,
  -- Types: analysis, action, monitoring, suggestion, error

  title TEXT NOT NULL,
  description TEXT,

  -- Input/output data
  input_data JSONB,
  output_data JSONB,

  -- Related entities
  related_document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  related_task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  related_conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,

  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'failed', 'pending')),
  error_message TEXT,

  -- AI model used
  model_used TEXT,
  tokens_used INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent templates (pre-configured agents)
CREATE TABLE IF NOT EXISTS agent_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  agent_type TEXT NOT NULL,
  icon TEXT,
  category TEXT NOT NULL,

  -- Default configuration
  default_config JSONB NOT NULL,
  default_personality TEXT DEFAULT 'professional',
  default_instructions TEXT,

  -- Capabilities
  capabilities TEXT[] DEFAULT ARRAY[]::TEXT[],
  -- Example: ["document_analysis", "task_creation", "email_sending"]

  usage_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ai_agents_organization_id ON ai_agents(organization_id);
CREATE INDEX IF NOT EXISTS idx_ai_agents_user_id ON ai_agents(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_agents_enabled ON ai_agents(enabled);
CREATE INDEX IF NOT EXISTS idx_ai_agents_agent_type ON ai_agents(agent_type);

CREATE INDEX IF NOT EXISTS idx_agent_activities_agent_id ON agent_activities(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_activities_organization_id ON agent_activities(organization_id);
CREATE INDEX IF NOT EXISTS idx_agent_activities_created_at ON agent_activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_activities_activity_type ON agent_activities(activity_type);

CREATE INDEX IF NOT EXISTS idx_agent_templates_category ON agent_templates(category);

-- RLS Policies
ALTER TABLE ai_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_templates ENABLE ROW LEVEL SECURITY;

-- AI Agents policies
CREATE POLICY "Users can view agents in their organization" ON ai_agents
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert agents in their organization" ON ai_agents
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own agents" ON ai_agents
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own agents" ON ai_agents
  FOR DELETE USING (user_id = auth.uid());

-- Agent activities policies
CREATE POLICY "Users can view activities in their organization" ON agent_activities
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "System can insert activities" ON agent_activities
  FOR INSERT WITH CHECK (true);

-- Templates are public read
CREATE POLICY "Anyone can view agent templates" ON agent_templates
  FOR SELECT USING (true);

-- Triggers
CREATE TRIGGER update_ai_agents_updated_at BEFORE UPDATE ON ai_agents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default agent templates
INSERT INTO agent_templates (name, description, agent_type, icon, category, default_config, default_instructions, capabilities) VALUES
  (
    'Document Intelligence Agent',
    'Automatically analyzes, tags, and summarizes uploaded documents',
    'document_analyzer',
    '📚',
    'Documents',
    '{"auto_tag": true, "auto_summarize": true, "extract_entities": true}'::jsonb,
    'Analyze all uploaded documents. Extract key information, generate concise summaries, and suggest relevant tags based on content.',
    ARRAY['document_analysis', 'tagging', 'summarization']
  ),
  (
    'Task Prioritization Agent',
    'Monitors your tasks and intelligently prioritizes them based on deadlines and importance',
    'task_manager',
    '✅',
    'Productivity',
    '{"auto_prioritize": true, "deadline_threshold_hours": 24, "notify_on_overdue": true}'::jsonb,
    'Monitor all tasks. Automatically adjust priorities based on deadlines, dependencies, and user behavior patterns. Send alerts for high-priority items.',
    ARRAY['task_management', 'prioritization', 'notifications']
  ),
  (
    'Meeting Preparation Agent',
    'Prepares you for upcoming meetings by gathering context and creating agendas',
    'meeting_assistant',
    '📅',
    'Calendar',
    '{"hours_before": 2, "create_agenda": true, "gather_context": true}'::jsonb,
    'Monitor calendar for upcoming meetings. 2 hours before each meeting, gather relevant documents, create agenda items, and prepare summary of previous meetings with same attendees.',
    ARRAY['calendar_monitoring', 'document_search', 'agenda_creation']
  ),
  (
    'Email Triage Agent',
    'Organizes your inbox by categorizing and prioritizing emails',
    'email_organizer',
    '📧',
    'Communication',
    '{"auto_categorize": true, "priority_keywords": ["urgent", "asap", "important"], "auto_archive_spam": false}'::jsonb,
    'Monitor incoming emails. Categorize by type (action required, FYI, newsletters). Flag urgent items. Suggest quick replies for common questions.',
    ARRAY['email_analysis', 'categorization', 'smart_replies']
  ),
  (
    'Research & Insights Agent',
    'Conducts research across your documents and provides insights',
    'research_assistant',
    '🔍',
    'Knowledge',
    '{"search_depth": "thorough", "cite_sources": true, "cross_reference": true}'::jsonb,
    'When asked questions, search through all documents and conversations. Provide comprehensive answers with citations. Identify patterns and connections across different sources.',
    ARRAY['document_search', 'knowledge_synthesis', 'citation']
  ),
  (
    'Workflow Optimizer Agent',
    'Analyzes your usage patterns and suggests workflow improvements',
    'workflow_optimizer',
    '⚡',
    'Productivity',
    '{"analysis_window_days": 7, "min_pattern_occurrences": 3, "suggestion_frequency": "weekly"}'::jsonb,
    'Observe user behavior patterns. Identify repetitive tasks that could be automated. Suggest new workflows and shortcuts based on actual usage data.',
    ARRAY['usage_analysis', 'pattern_detection', 'suggestions']
  ),
  (
    'Daily Digest Agent',
    'Prepares a personalized daily summary of your work',
    'daily_digest',
    '📰',
    'Productivity',
    '{"send_time": "09:00", "include_tasks": true, "include_calendar": true, "include_metrics": true}'::jsonb,
    'Every morning, compile a digest: upcoming tasks, calendar events, unread important emails, productivity metrics from yesterday, and suggested focus areas for today.',
    ARRAY['data_aggregation', 'email_sending', 'analytics']
  ),
  (
    'Sentiment Monitor Agent',
    'Monitors communication tone and alerts you to potential issues',
    'sentiment_monitor',
    '😊',
    'Communication',
    '{"monitor_emails": true, "monitor_messages": true, "alert_threshold": "negative"}'::jsonb,
    'Analyze sentiment in emails and messages. Alert when detecting frustration, urgency, or negative sentiment from important contacts. Suggest empathetic responses.',
    ARRAY['sentiment_analysis', 'alerts', 'response_suggestions']
  )
ON CONFLICT DO NOTHING;
-- Workflows (Automation Rules)
CREATE TABLE IF NOT EXISTS workflows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  enabled BOOLEAN DEFAULT TRUE,

  -- Trigger configuration
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('event', 'schedule', 'manual')),
  trigger_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Examples:
  -- Event: {"event": "document.uploaded", "filters": {"file_type": "pdf"}}
  -- Schedule: {"cron": "0 9 * * 1", "timezone": "America/New_York"}
  -- Manual: {}

  -- Actions to perform when triggered
  actions JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Example: [
  --   {"type": "ai_analyze", "config": {"prompt": "Summarize this document"}},
  --   {"type": "create_task", "config": {"title": "Review summary", "priority": "high"}},
  --   {"type": "send_email", "config": {"to": "user@example.com", "subject": "New document"}}
  -- ]

  -- Execution tracking
  last_run_at TIMESTAMPTZ,
  last_run_status TEXT CHECK (last_run_status IN ('success', 'failed', 'running')),
  run_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workflow execution logs
CREATE TABLE IF NOT EXISTS workflow_executions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'success', 'failed')),
  trigger_data JSONB, -- Data that triggered this execution

  -- Step-by-step execution log
  steps JSONB DEFAULT '[]'::jsonb,
  -- Example: [
  --   {"step": 1, "action": "ai_analyze", "status": "success", "output": "Summary: ..."},
  --   {"step": 2, "action": "create_task", "status": "success", "task_id": "uuid"}
  -- ]

  error_message TEXT,
  duration_ms INTEGER,

  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Workflow templates (pre-built automation recipes)
CREATE TABLE IF NOT EXISTS workflow_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  icon TEXT,

  -- Template configuration
  trigger_type TEXT NOT NULL,
  trigger_config JSONB NOT NULL,
  actions JSONB NOT NULL,

  -- Popularity and usage
  usage_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_workflows_organization_id ON workflows(organization_id);
CREATE INDEX IF NOT EXISTS idx_workflows_user_id ON workflows(user_id);
CREATE INDEX IF NOT EXISTS idx_workflows_enabled ON workflows(enabled);
CREATE INDEX IF NOT EXISTS idx_workflows_trigger_type ON workflows(trigger_type);

CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow_id ON workflow_executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_status ON workflow_executions(status);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_started_at ON workflow_executions(started_at);

CREATE INDEX IF NOT EXISTS idx_workflow_templates_category ON workflow_templates(category);

-- RLS Policies
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_templates ENABLE ROW LEVEL SECURITY;

-- Workflows policies
CREATE POLICY "Users can view workflows in their organization" ON workflows
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert workflows in their organization" ON workflows
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own workflows" ON workflows
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own workflows" ON workflows
  FOR DELETE USING (user_id = auth.uid());

-- Workflow executions policies
CREATE POLICY "Users can view executions in their organization" ON workflow_executions
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "System can insert executions" ON workflow_executions
  FOR INSERT WITH CHECK (true);

-- Templates are public read
CREATE POLICY "Anyone can view workflow templates" ON workflow_templates
  FOR SELECT USING (true);

-- Triggers
CREATE TRIGGER update_workflows_updated_at BEFORE UPDATE ON workflows
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default workflow templates
INSERT INTO workflow_templates (name, description, category, icon, trigger_type, trigger_config, actions) VALUES
  (
    'Auto-summarize uploaded documents',
    'Automatically generate AI summaries for new documents',
    'Documents',
    '📄',
    'event',
    '{"event": "document.uploaded"}'::jsonb,
    '[
      {"type": "ai_analyze", "config": {"prompt": "Generate a concise summary of this document in 3-5 bullet points"}},
      {"type": "update_document", "config": {"field": "summary", "value": "{{ai_output}}"}}
    ]'::jsonb
  ),
  (
    'Daily task digest',
    'Send a daily email with upcoming tasks',
    'Tasks',
    '✅',
    'schedule',
    '{"cron": "0 9 * * *", "timezone": "UTC"}'::jsonb,
    '[
      {"type": "fetch_tasks", "config": {"status": ["todo", "in_progress"], "limit": 10}},
      {"type": "send_email", "config": {"subject": "Your tasks for today", "template": "task_digest"}}
    ]'::jsonb
  ),
  (
    'Auto-create tasks from meetings',
    'Create follow-up tasks for calendar events',
    'Calendar',
    '📅',
    'event',
    '{"event": "calendar.event_ended"}'::jsonb,
    '[
      {"type": "ai_analyze", "config": {"prompt": "Extract action items from this meeting"}},
      {"type": "create_tasks", "config": {"source": "ai_output", "priority": "medium"}}
    ]'::jsonb
  ),
  (
    'High-priority task alerts',
    'Get notified when high-priority tasks are due soon',
    'Tasks',
    '🔔',
    'schedule',
    '{"cron": "0 8,14,20 * * *", "timezone": "UTC"}'::jsonb,
    '[
      {"type": "fetch_tasks", "config": {"priority": "high", "due_within_hours": 24}},
      {"type": "send_notification", "config": {"title": "High-priority tasks due soon", "template": "task_alert"}}
    ]'::jsonb
  ),
  (
    'Weekly analytics report',
    'Get a weekly summary of your productivity metrics',
    'Analytics',
    '📊',
    'schedule',
    '{"cron": "0 9 * * 1", "timezone": "UTC"}'::jsonb,
    '[
      {"type": "generate_analytics", "config": {"period": "last_week"}},
      {"type": "send_email", "config": {"subject": "Your weekly productivity report", "template": "analytics_report"}}
    ]'::jsonb
  ),
  (
    'Smart document tagging',
    'Automatically tag documents based on content',
    'Documents',
    '🏷️',
    'event',
    '{"event": "document.uploaded"}'::jsonb,
    '[
      {"type": "ai_analyze", "config": {"prompt": "Suggest 3-5 relevant tags for this document based on its content"}},
      {"type": "update_document", "config": {"field": "tags", "value": "{{ai_output}}"}}
    ]'::jsonb
  )
ON CONFLICT DO NOTHING;
-- SCHEDULED JOBS SCHEMA
-- This schema manages scheduled jobs/cron tasks for AI automation

-- =====================================================
-- TABLE: scheduled_jobs
-- Stores scheduled tasks that run on a recurring basis
-- =====================================================
CREATE TABLE IF NOT EXISTS scheduled_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Job identification
  name TEXT NOT NULL,
  description TEXT,

  -- Scheduling
  cron_expression TEXT NOT NULL, -- e.g., "0 9 * * *" (9am daily)
  timezone TEXT DEFAULT 'UTC',

  -- Job configuration
  job_type TEXT NOT NULL, -- 'workflow', 'agent', 'custom'
  target_id UUID, -- References workflows or agents table
  config JSONB DEFAULT '{}'::jsonb,

  -- Execution settings
  enabled BOOLEAN DEFAULT true,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  timeout_seconds INTEGER DEFAULT 300,

  -- Tracking
  last_run_at TIMESTAMPTZ,
  last_run_status TEXT, -- 'success', 'failed', 'timeout'
  next_run_at TIMESTAMPTZ,
  total_runs INTEGER DEFAULT 0,
  successful_runs INTEGER DEFAULT 0,
  failed_runs INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_job_type CHECK (job_type IN ('workflow', 'agent', 'custom')),
  CONSTRAINT valid_cron CHECK (cron_expression ~ '^[0-9\*\-\,\/]+ [0-9\*\-\,\/]+ [0-9\*\-\,\/]+ [0-9\*\-\,\/]+ [0-9\*\-\,\/]+$')
);

-- =====================================================
-- TABLE: job_executions
-- Logs every execution of a scheduled job
-- =====================================================
CREATE TABLE IF NOT EXISTS job_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES scheduled_jobs(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Execution details
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'running', 'success', 'failed', 'timeout'
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,

  -- Execution data
  input_data JSONB,
  output_data JSONB,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,

  -- Logs
  logs JSONB DEFAULT '[]'::jsonb, -- Array of log entries

  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_status CHECK (status IN ('pending', 'running', 'success', 'failed', 'timeout', 'cancelled'))
);

-- =====================================================
-- TABLE: job_templates
-- Pre-configured scheduled job templates
-- =====================================================
CREATE TABLE IF NOT EXISTS job_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Template info
  name TEXT NOT NULL,
  description TEXT,
  category TEXT, -- 'productivity', 'analytics', 'maintenance', 'communication'
  icon TEXT,

  -- Default configuration
  default_cron TEXT NOT NULL,
  default_config JSONB DEFAULT '{}'::jsonb,
  job_type TEXT NOT NULL,

  -- Template metadata
  is_popular BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_template_job_type CHECK (job_type IN ('workflow', 'agent', 'custom'))
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX idx_scheduled_jobs_org ON scheduled_jobs(organization_id);
CREATE INDEX idx_scheduled_jobs_user ON scheduled_jobs(user_id);
CREATE INDEX idx_scheduled_jobs_enabled ON scheduled_jobs(enabled) WHERE enabled = true;
CREATE INDEX idx_scheduled_jobs_next_run ON scheduled_jobs(next_run_at) WHERE enabled = true;
CREATE INDEX idx_scheduled_jobs_type ON scheduled_jobs(job_type);

CREATE INDEX idx_job_executions_job ON job_executions(job_id);
CREATE INDEX idx_job_executions_org ON job_executions(organization_id);
CREATE INDEX idx_job_executions_status ON job_executions(status);
CREATE INDEX idx_job_executions_started ON job_executions(started_at DESC);

CREATE INDEX idx_job_templates_category ON job_templates(category);
CREATE INDEX idx_job_templates_popular ON job_templates(is_popular) WHERE is_popular = true;

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================
ALTER TABLE scheduled_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_templates ENABLE ROW LEVEL SECURITY;

-- Scheduled Jobs Policies
CREATE POLICY "Users can view their organization's jobs"
  ON scheduled_jobs FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can create jobs in their organization"
  ON scheduled_jobs FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
    AND user_id = auth.uid()
  );

CREATE POLICY "Users can update their own jobs"
  ON scheduled_jobs FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own jobs"
  ON scheduled_jobs FOR DELETE
  USING (user_id = auth.uid());

-- Job Executions Policies
CREATE POLICY "Users can view their organization's executions"
  ON job_executions FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "System can insert executions"
  ON job_executions FOR INSERT
  WITH CHECK (true); -- Will be restricted by application logic

-- Job Templates Policies (public read)
CREATE POLICY "Anyone can view job templates"
  ON job_templates FOR SELECT
  USING (true);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to calculate next run time based on cron expression
-- Note: In production, use a proper cron parser library
CREATE OR REPLACE FUNCTION calculate_next_run(cron_expr TEXT, from_time TIMESTAMPTZ DEFAULT NOW())
RETURNS TIMESTAMPTZ AS $$
BEGIN
  -- Simplified: Add 1 hour for demo purposes
  -- In production, use a proper cron parser like pg_cron or application-level parser
  RETURN from_time + INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;

-- Function to update job stats after execution
CREATE OR REPLACE FUNCTION update_job_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'success' OR NEW.status = 'failed' THEN
    UPDATE scheduled_jobs
    SET
      last_run_at = NEW.started_at,
      last_run_status = NEW.status,
      total_runs = total_runs + 1,
      successful_runs = successful_runs + CASE WHEN NEW.status = 'success' THEN 1 ELSE 0 END,
      failed_runs = failed_runs + CASE WHEN NEW.status = 'failed' THEN 1 ELSE 0 END,
      next_run_at = calculate_next_run(cron_expression, NEW.completed_at),
      updated_at = NOW()
    WHERE id = NEW.job_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update job stats
CREATE TRIGGER update_job_stats_trigger
  AFTER UPDATE ON job_executions
  FOR EACH ROW
  WHEN (OLD.status != NEW.status AND (NEW.status = 'success' OR NEW.status = 'failed'))
  EXECUTE FUNCTION update_job_stats();

-- =====================================================
-- SEED DATA: Job Templates
-- =====================================================
INSERT INTO job_templates (name, description, category, icon, default_cron, job_type, is_popular, default_config) VALUES
  -- Daily tasks
  (
    'Daily Morning Briefing',
    'Get a comprehensive morning briefing with tasks, calendar, and priorities',
    'productivity',
    '☀️',
    '0 8 * * *', -- 8am daily
    'agent',
    true,
    '{"agent_type": "daily_digest", "include": ["tasks", "calendar", "emails", "priorities"]}'::jsonb
  ),
  (
    'Daily Task Review',
    'Review and prioritize tasks every morning',
    'productivity',
    '✅',
    '0 9 * * 1-5', -- 9am weekdays
    'agent',
    true,
    '{"agent_type": "task_manager", "action": "prioritize"}'::jsonb
  ),
  (
    'End of Day Summary',
    'Get a summary of completed work and tomorrow''s priorities',
    'productivity',
    '🌙',
    '0 17 * * 1-5', -- 5pm weekdays
    'agent',
    true,
    '{"agent_type": "daily_digest", "mode": "eod_summary"}'::jsonb
  ),

  -- Weekly tasks
  (
    'Weekly Team Report',
    'Generate and send weekly team productivity report',
    'analytics',
    '📊',
    '0 9 * * 1', -- 9am Monday
    'workflow',
    true,
    '{"report_type": "weekly", "recipients": ["team"], "include_metrics": true}'::jsonb
  ),
  (
    'Weekly Meeting Prep',
    'Prepare materials for weekly team meetings',
    'productivity',
    '📅',
    '0 10 * * 0', -- 10am Sunday
    'agent',
    false,
    '{"agent_type": "meeting_assistant", "meeting_pattern": "weekly_team"}'::jsonb
  ),

  -- Document management
  (
    'Document Cleanup',
    'Archive old documents and clean up tags',
    'maintenance',
    '🗂️',
    '0 2 * * 0', -- 2am Sunday
    'workflow',
    false,
    '{"action": "cleanup", "archive_older_than_days": 90}'::jsonb
  ),
  (
    'Automatic Document Tagging',
    'Process untagged documents and apply AI tags',
    'maintenance',
    '🏷️',
    '0 3 * * *', -- 3am daily
    'agent',
    false,
    '{"agent_type": "document_analyzer", "action": "tag_untagged"}'::jsonb
  ),

  -- Communication
  (
    'Email Triage',
    'Automatically categorize and prioritize morning emails',
    'communication',
    '📧',
    '0 7 * * 1-5', -- 7am weekdays
    'agent',
    true,
    '{"agent_type": "email_organizer", "auto_categorize": true}'::jsonb
  ),
  (
    'Inbox Zero Reminder',
    'Remind to clear inbox at end of day',
    'communication',
    '📬',
    '0 16 * * 1-5', -- 4pm weekdays
    'workflow',
    false,
    '{"action": "notification", "message": "Time to achieve inbox zero!"}'::jsonb
  ),

  -- Analytics
  (
    'Monthly Analytics Report',
    'Generate comprehensive monthly analytics',
    'analytics',
    '📈',
    '0 9 1 * *', -- 9am on 1st of month
    'workflow',
    true,
    '{"report_type": "monthly", "include_all_metrics": true}'::jsonb
  ),
  (
    'Productivity Insights',
    'Analyze work patterns and suggest improvements',
    'analytics',
    '💡',
    '0 10 * * 5', -- 10am Friday
    'agent',
    false,
    '{"agent_type": "workflow_optimizer", "analyze_week": true}'::jsonb
  ),

  -- Custom intervals
  (
    'Hourly Task Sync',
    'Sync tasks across all platforms hourly',
    'maintenance',
    '🔄',
    '0 * * * *', -- Every hour
    'workflow',
    false,
    '{"action": "sync", "platforms": ["calendar", "email", "tasks"]}'::jsonb
  ),
  (
    'Every 15 Minutes - High Priority Check',
    'Check for high-priority items every 15 minutes',
    'productivity',
    '⚡',
    '*/15 * * * *', -- Every 15 minutes
    'agent',
    false,
    '{"agent_type": "task_manager", "filter": "high_priority"}'::jsonb
  );

-- =====================================================
-- INITIAL DATA SETUP
-- =====================================================

-- Function to initialize next_run_at for existing jobs
CREATE OR REPLACE FUNCTION initialize_next_run_times()
RETURNS void AS $$
BEGIN
  UPDATE scheduled_jobs
  SET next_run_at = calculate_next_run(cron_expression, NOW())
  WHERE next_run_at IS NULL AND enabled = true;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- HELPFUL QUERIES (for reference)
-- =====================================================

-- Get all jobs due to run
-- SELECT * FROM scheduled_jobs
-- WHERE enabled = true
--   AND next_run_at <= NOW()
-- ORDER BY next_run_at;

-- Get job execution history with success rate
-- SELECT
--   sj.id,
--   sj.name,
--   sj.total_runs,
--   sj.successful_runs,
--   sj.failed_runs,
--   CASE
--     WHEN sj.total_runs > 0
--     THEN ROUND((sj.successful_runs::numeric / sj.total_runs * 100), 2)
--     ELSE 0
--   END as success_rate_percent
-- FROM scheduled_jobs sj
-- ORDER BY success_rate_percent DESC;

-- Get recent executions with duration
-- SELECT
--   je.id,
--   sj.name as job_name,
--   je.status,
--   je.started_at,
--   je.duration_ms / 1000.0 as duration_seconds
-- FROM job_executions je
-- JOIN scheduled_jobs sj ON je.job_id = sj.id
-- ORDER BY je.started_at DESC
-- LIMIT 20;
-- PROACTIVE AI SUGGESTIONS SCHEMA
-- This schema manages AI-generated suggestions for users

-- =====================================================
-- TABLE: ai_suggestions
-- Stores AI-generated suggestions for users
-- =====================================================
CREATE TABLE IF NOT EXISTS ai_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Suggestion details
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL, -- 'productivity', 'workflow', 'task', 'document', 'email', 'meeting', 'optimization', 'insight'
  priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'

  -- Context
  context_type TEXT, -- 'task', 'document', 'email', 'calendar', 'workflow', 'general'
  context_id UUID, -- Reference to related entity
  context_data JSONB DEFAULT '{}'::jsonb, -- Additional context

  -- Action
  suggested_action TEXT NOT NULL, -- What action to take
  action_type TEXT, -- 'create', 'update', 'delete', 'optimize', 'review', 'schedule'
  action_data JSONB DEFAULT '{}'::jsonb, -- Data for executing the action
  action_url TEXT, -- Deep link to execute action

  -- AI metadata
  confidence_score DECIMAL(3,2), -- 0.00 to 1.00
  reasoning TEXT, -- Why this suggestion was made
  related_patterns JSONB DEFAULT '[]'::jsonb, -- Patterns that led to this suggestion

  -- User interaction
  status TEXT DEFAULT 'pending', -- 'pending', 'viewed', 'accepted', 'dismissed', 'snoozed'
  viewed_at TIMESTAMPTZ,
  actioned_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,
  snoozed_until TIMESTAMPTZ,
  feedback TEXT, -- User feedback on suggestion

  -- Scheduling
  expires_at TIMESTAMPTZ, -- When suggestion becomes irrelevant
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_category CHECK (category IN ('productivity', 'workflow', 'task', 'document', 'email', 'meeting', 'optimization', 'insight', 'collaboration')),
  CONSTRAINT valid_priority CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'viewed', 'accepted', 'dismissed', 'snoozed'))
);

-- =====================================================
-- TABLE: suggestion_templates
-- Templates for common suggestion patterns
-- =====================================================
CREATE TABLE IF NOT EXISTS suggestion_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Template info
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  priority TEXT DEFAULT 'medium',

  -- Template content
  title_template TEXT NOT NULL, -- Can include {variables}
  description_template TEXT NOT NULL,
  suggested_action_template TEXT NOT NULL,

  -- Trigger conditions
  trigger_type TEXT NOT NULL, -- 'pattern', 'time', 'event', 'threshold'
  trigger_conditions JSONB NOT NULL, -- Conditions that trigger this suggestion

  -- Metadata
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLE: user_suggestion_preferences
-- User preferences for suggestions
-- =====================================================
CREATE TABLE IF NOT EXISTS user_suggestion_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,

  -- Category preferences
  enabled_categories JSONB DEFAULT '["productivity", "workflow", "task", "document", "email", "meeting", "optimization", "insight"]'::jsonb,
  disabled_categories JSONB DEFAULT '[]'::jsonb,

  -- Frequency
  max_suggestions_per_day INTEGER DEFAULT 10,
  notification_enabled BOOLEAN DEFAULT true,

  -- Quiet hours
  quiet_hours_start TIME,
  quiet_hours_end TIME,

  -- Preferences
  min_confidence_score DECIMAL(3,2) DEFAULT 0.70,
  auto_dismiss_low_confidence BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX idx_suggestions_user ON ai_suggestions(user_id);
CREATE INDEX idx_suggestions_org ON ai_suggestions(organization_id);
CREATE INDEX idx_suggestions_status ON ai_suggestions(status);
CREATE INDEX idx_suggestions_category ON ai_suggestions(category);
CREATE INDEX idx_suggestions_priority ON ai_suggestions(priority);
CREATE INDEX idx_suggestions_created ON ai_suggestions(created_at DESC);
CREATE INDEX idx_suggestions_expires ON ai_suggestions(expires_at) WHERE expires_at IS NOT NULL;

CREATE INDEX idx_suggestion_templates_category ON suggestion_templates(category);
CREATE INDEX idx_suggestion_templates_active ON suggestion_templates(is_active) WHERE is_active = true;

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================
ALTER TABLE ai_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE suggestion_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_suggestion_preferences ENABLE ROW LEVEL SECURITY;

-- Suggestions Policies
CREATE POLICY "Users can view their own suggestions"
  ON ai_suggestions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "System can create suggestions"
  ON ai_suggestions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own suggestions"
  ON ai_suggestions FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own suggestions"
  ON ai_suggestions FOR DELETE
  USING (user_id = auth.uid());

-- Templates Policies (public read)
CREATE POLICY "Anyone can view active templates"
  ON suggestion_templates FOR SELECT
  USING (is_active = true);

-- Preferences Policies
CREATE POLICY "Users can view their own preferences"
  ON user_suggestion_preferences FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own preferences"
  ON user_suggestion_preferences FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own preferences"
  ON user_suggestion_preferences FOR UPDATE
  USING (user_id = auth.uid());

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to auto-dismiss expired suggestions
CREATE OR REPLACE FUNCTION dismiss_expired_suggestions()
RETURNS void AS $$
BEGIN
  UPDATE ai_suggestions
  SET
    status = 'dismissed',
    dismissed_at = NOW(),
    updated_at = NOW()
  WHERE
    status IN ('pending', 'viewed', 'snoozed')
    AND expires_at IS NOT NULL
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to mark suggestion as viewed
CREATE OR REPLACE FUNCTION mark_suggestion_viewed()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'viewed' AND OLD.status = 'pending' THEN
    NEW.viewed_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER mark_viewed_trigger
  BEFORE UPDATE ON ai_suggestions
  FOR EACH ROW
  WHEN (NEW.status = 'viewed' AND OLD.status = 'pending')
  EXECUTE FUNCTION mark_suggestion_viewed();

-- =====================================================
-- SEED DATA: Suggestion Templates
-- =====================================================
INSERT INTO suggestion_templates (name, description, category, priority, title_template, description_template, suggested_action_template, trigger_type, trigger_conditions) VALUES

-- Productivity Suggestions
(
  'Overdue Tasks Reminder',
  'Remind user about overdue tasks',
  'productivity',
  'high',
  'You have {count} overdue tasks',
  'These tasks are past their due date and need attention: {task_list}',
  'Review and update your overdue tasks',
  'threshold',
  '{"metric": "overdue_tasks", "operator": ">", "value": 0}'::jsonb
),

(
  'Unread Email Buildup',
  'Alert when inbox has too many unread emails',
  'email',
  'medium',
  '{count} unread emails in your inbox',
  'Your inbox has accumulated {count} unread emails. Consider processing them to stay organized.',
  'Process your unread emails',
  'threshold',
  '{"metric": "unread_emails", "operator": ">", "value": 50}'::jsonb
),

(
  'Daily Task Planning',
  'Suggest planning tasks for the day',
  'productivity',
  'medium',
  'Plan your day',
  'You haven''t reviewed your tasks today. Take a moment to prioritize your work.',
  'Review and prioritize today''s tasks',
  'time',
  '{"time": "09:00", "days": ["monday", "tuesday", "wednesday", "thursday", "friday"]}'::jsonb
),

-- Workflow Optimization
(
  'Repetitive Task Pattern',
  'Identify repetitive tasks that could be automated',
  'workflow',
  'medium',
  'Automate repetitive task: {task_name}',
  'You''ve done this task {count} times this month. Consider creating a workflow to automate it.',
  'Create a workflow automation',
  'pattern',
  '{"metric": "task_repetition", "threshold": 5, "timeframe": "month"}'::jsonb
),

(
  'Workflow Efficiency',
  'Suggest workflow improvements',
  'optimization',
  'low',
  'Optimize your {workflow_name} workflow',
  'Based on execution history, we found opportunities to improve this workflow.',
  'Review workflow optimization suggestions',
  'pattern',
  '{"metric": "workflow_performance", "analyze": true}'::jsonb
),

-- Meeting Preparation
(
  'Upcoming Meeting Prep',
  'Remind to prepare for upcoming meetings',
  'meeting',
  'high',
  'Prepare for "{meeting_title}"',
  'Your meeting "{meeting_title}" is in {time_until}. Review the agenda and prepare materials.',
  'Prepare for the meeting',
  'time',
  '{"lead_time_hours": 2, "requires_preparation": true}'::jsonb
),

(
  'Meeting Follow-up Tasks',
  'Create tasks from meeting notes',
  'meeting',
  'medium',
  'Create follow-up tasks from "{meeting_title}"',
  'Your meeting "{meeting_title}" ended {time_ago}. Create tasks for action items discussed.',
  'Create follow-up tasks',
  'event',
  '{"trigger": "meeting_ended", "delay_hours": 1}'::jsonb
),

-- Document Organization
(
  'Unorganized Documents',
  'Suggest organizing documents',
  'document',
  'low',
  'Organize {count} untagged documents',
  'You have {count} documents without tags or folders. Organize them for easier discovery.',
  'Tag and organize documents',
  'threshold',
  '{"metric": "untagged_documents", "operator": ">", "value": 10}'::jsonb
),

(
  'Document Review Needed',
  'Remind to review stale documents',
  'document',
  'low',
  'Review outdated documents',
  'Some of your documents haven''t been updated in over 6 months. Review them for accuracy.',
  'Review and update old documents',
  'time',
  '{"metric": "document_age", "threshold_days": 180}'::jsonb
),

-- Task Management
(
  'High Priority Task Alert',
  'Alert about new high priority tasks',
  'task',
  'urgent',
  'New high priority task: {task_title}',
  'A high priority task "{task_title}" was just assigned to you.',
  'Review the high priority task',
  'event',
  '{"trigger": "task_created", "priority": "high"}'::jsonb
),

(
  'Task Completion Streak',
  'Encourage continued productivity',
  'productivity',
  'low',
  'Great job! {count} tasks completed',
  'You''ve completed {count} tasks today. Keep up the momentum!',
  'Continue your productivity streak',
  'pattern',
  '{"metric": "tasks_completed_today", "operator": ">=", "value": 5}'::jsonb
),

-- Collaboration
(
  'Pending Response',
  'Remind about messages needing response',
  'collaboration',
  'medium',
  '{count} messages awaiting your response',
  'You have {count} messages from team members that need a response.',
  'Respond to pending messages',
  'threshold',
  '{"metric": "pending_responses", "operator": ">", "value": 3}'::jsonb
),

(
  'Team Update Needed',
  'Suggest sharing status update',
  'collaboration',
  'low',
  'Share a status update with your team',
  'It''s been {days} days since you shared a status update. Keep your team informed.',
  'Post a status update',
  'time',
  '{"metric": "days_since_update", "threshold": 7}'::jsonb
),

-- Insights
(
  'Weekly Productivity Insight',
  'Share weekly productivity analysis',
  'insight',
  'low',
  'Your weekly productivity summary',
  'This week you completed {tasks_completed} tasks and attended {meetings_count} meetings.',
  'View detailed productivity insights',
  'time',
  '{"day": "friday", "time": "17:00"}'::jsonb
),

(
  'Goal Progress Update',
  'Update on goal progress',
  'insight',
  'medium',
  'You''re {percent}% towards your {goal_type} goal',
  'Great progress! You''re {percent}% of the way to your {goal_type} goal.',
  'Review goal progress',
  'pattern',
  '{"metric": "goal_progress", "check_interval_days": 7}'::jsonb
);

-- =====================================================
-- HELPER FUNCTIONS FOR GENERATING SUGGESTIONS
-- =====================================================

-- Function to generate suggestions based on templates
CREATE OR REPLACE FUNCTION generate_suggestions_for_user(
  target_user_id UUID,
  target_org_id UUID
) RETURNS SETOF ai_suggestions AS $$
DECLARE
  template RECORD;
  new_suggestion ai_suggestions;
BEGIN
  -- This is a simplified version - in production, implement proper trigger logic
  -- For now, just return empty set
  RETURN;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- HELPFUL QUERIES (for reference)
-- =====================================================

-- Get active suggestions for user
-- SELECT * FROM ai_suggestions
-- WHERE user_id = 'USER_ID'
--   AND status IN ('pending', 'viewed', 'snoozed')
--   AND (expires_at IS NULL OR expires_at > NOW())
--   AND (snoozed_until IS NULL OR snoozed_until < NOW())
-- ORDER BY priority DESC, created_at DESC;

-- Get suggestion stats
-- SELECT
--   category,
--   status,
--   COUNT(*) as count,
--   AVG(confidence_score) as avg_confidence
-- FROM ai_suggestions
-- WHERE user_id = 'USER_ID'
-- GROUP BY category, status;

-- Get acceptance rate by category
-- SELECT
--   category,
--   COUNT(*) as total,
--   SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) as accepted,
--   ROUND(SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END)::numeric / COUNT(*) * 100, 2) as acceptance_rate
-- FROM ai_suggestions
-- WHERE user_id = 'USER_ID'
-- GROUP BY category;
-- COLLABORATION FEATURES SCHEMA
-- This schema manages comments, mentions, activity feed, and real-time collaboration

-- =====================================================
-- TABLE: comments
-- Universal comments system for any entity
-- =====================================================
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- What is being commented on
  entity_type TEXT NOT NULL, -- 'document', 'task', 'workflow', 'email', 'meeting', 'agent', etc.
  entity_id UUID NOT NULL, -- ID of the entity being commented on

  -- Comment content
  content TEXT NOT NULL,
  content_html TEXT, -- Rendered HTML with mentions highlighted

  -- Thread support
  parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE, -- For replies
  thread_position INTEGER DEFAULT 0, -- Position in thread

  -- Mentions
  mentioned_user_ids UUID[] DEFAULT ARRAY[]::UUID[], -- Array of mentioned user IDs

  -- Reactions
  reactions JSONB DEFAULT '{}'::jsonb, -- {"👍": ["user1", "user2"], "❤️": ["user3"]}

  -- Metadata
  is_edited BOOLEAN DEFAULT false,
  edited_at TIMESTAMPTZ,
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_entity_type CHECK (entity_type IN ('document', 'task', 'workflow', 'email', 'meeting', 'agent', 'workflow_execution', 'suggestion', 'calendar_event'))
);

-- =====================================================
-- TABLE: mentions
-- Track @mentions across the platform
-- =====================================================
CREATE TABLE IF NOT EXISTS mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Who was mentioned
  mentioned_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Who mentioned them
  mentioning_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Where they were mentioned
  mention_type TEXT NOT NULL, -- 'comment', 'document', 'task', 'message'
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,

  -- Context
  context TEXT, -- Snippet of text around the mention
  url TEXT, -- Deep link to the mention

  -- Status
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_mention_type CHECK (mention_type IN ('comment', 'document', 'task', 'message', 'description')),
  CONSTRAINT valid_entity_type CHECK (entity_type IN ('document', 'task', 'workflow', 'email', 'meeting', 'comment', 'message'))
);

-- =====================================================
-- TABLE: activity_feed
-- Track all team activities for the feed
-- =====================================================
CREATE TABLE IF NOT EXISTS activity_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Actor (who did the action)
  actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_name TEXT, -- Cached name for deleted users

  -- Action
  action_type TEXT NOT NULL, -- 'created', 'updated', 'deleted', 'commented', 'mentioned', 'completed', 'assigned', 'shared'

  -- Target (what was acted upon)
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  entity_name TEXT, -- Cached name of entity

  -- Additional context
  metadata JSONB DEFAULT '{}'::jsonb, -- Extra data about the action

  -- Visibility
  is_public BOOLEAN DEFAULT true, -- If false, only visible to specific users
  visible_to_user_ids UUID[], -- If not public, who can see it

  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_action_type CHECK (action_type IN ('created', 'updated', 'deleted', 'commented', 'mentioned', 'completed', 'assigned', 'shared', 'archived', 'restored', 'uploaded', 'downloaded')),
  CONSTRAINT valid_entity_type CHECK (entity_type IN ('document', 'task', 'workflow', 'email', 'meeting', 'agent', 'comment', 'file', 'folder'))
);

-- =====================================================
-- TABLE: document_versions
-- Track document version history
-- =====================================================
CREATE TABLE IF NOT EXISTS document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Document reference
  document_id UUID NOT NULL, -- References documents table

  -- Version info
  version_number INTEGER NOT NULL,
  title TEXT,
  content TEXT,
  content_snapshot JSONB, -- Full snapshot of document state

  -- Change tracking
  changed_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  change_summary TEXT, -- Brief description of changes
  changes_diff JSONB, -- Detailed diff of changes

  -- Size tracking
  content_length INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(document_id, version_number)
);

-- =====================================================
-- TABLE: realtime_presence
-- Track who is currently viewing/editing
-- =====================================================
CREATE TABLE IF NOT EXISTS realtime_presence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Location
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,

  -- Status
  status TEXT DEFAULT 'viewing', -- 'viewing', 'editing', 'commenting'
  cursor_position INTEGER, -- For text editing

  -- Metadata
  user_agent TEXT,
  last_active_at TIMESTAMPTZ DEFAULT NOW(),

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, entity_type, entity_id),

  CONSTRAINT valid_status CHECK (status IN ('viewing', 'editing', 'commenting', 'idle'))
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Comments indexes
CREATE INDEX idx_comments_entity ON comments(entity_type, entity_id);
CREATE INDEX idx_comments_user ON comments(user_id);
CREATE INDEX idx_comments_org ON comments(organization_id);
CREATE INDEX idx_comments_parent ON comments(parent_comment_id) WHERE parent_comment_id IS NOT NULL;
CREATE INDEX idx_comments_created ON comments(created_at DESC);
CREATE INDEX idx_comments_mentions ON comments USING GIN(mentioned_user_ids);

-- Mentions indexes
CREATE INDEX idx_mentions_user ON mentions(mentioned_user_id);
CREATE INDEX idx_mentions_entity ON mentions(entity_type, entity_id);
CREATE INDEX idx_mentions_unread ON mentions(mentioned_user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_mentions_created ON mentions(created_at DESC);

-- Activity feed indexes
CREATE INDEX idx_activity_org ON activity_feed(organization_id);
CREATE INDEX idx_activity_actor ON activity_feed(actor_user_id);
CREATE INDEX idx_activity_entity ON activity_feed(entity_type, entity_id);
CREATE INDEX idx_activity_created ON activity_feed(created_at DESC);
CREATE INDEX idx_activity_visible ON activity_feed USING GIN(visible_to_user_ids) WHERE visible_to_user_ids IS NOT NULL;

-- Document versions indexes
CREATE INDEX idx_doc_versions_document ON document_versions(document_id);
CREATE INDEX idx_doc_versions_created ON document_versions(created_at DESC);
CREATE INDEX idx_doc_versions_user ON document_versions(changed_by_user_id);

-- Realtime presence indexes
CREATE INDEX idx_presence_entity ON realtime_presence(entity_type, entity_id);
CREATE INDEX idx_presence_user ON realtime_presence(user_id);
CREATE INDEX idx_presence_active ON realtime_presence(last_active_at) WHERE status != 'idle';

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE realtime_presence ENABLE ROW LEVEL SECURITY;

-- Comments Policies
CREATE POLICY "Users can view comments in their organization"
  ON comments FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
    AND is_deleted = false
  );

CREATE POLICY "Users can create comments"
  ON comments FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
    AND user_id = auth.uid()
  );

CREATE POLICY "Users can update their own comments"
  ON comments FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can soft delete their own comments"
  ON comments FOR UPDATE
  USING (user_id = auth.uid());

-- Mentions Policies
CREATE POLICY "Users can view their own mentions"
  ON mentions FOR SELECT
  USING (mentioned_user_id = auth.uid());

CREATE POLICY "System can create mentions"
  ON mentions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own mentions"
  ON mentions FOR UPDATE
  USING (mentioned_user_id = auth.uid());

-- Activity Feed Policies
CREATE POLICY "Users can view organization activity"
  ON activity_feed FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
    AND (
      is_public = true
      OR auth.uid() = ANY(visible_to_user_ids)
    )
  );

CREATE POLICY "System can create activity"
  ON activity_feed FOR INSERT
  WITH CHECK (true);

-- Document Versions Policies
CREATE POLICY "Users can view versions in their organization"
  ON document_versions FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "System can create versions"
  ON document_versions FOR INSERT
  WITH CHECK (true);

-- Realtime Presence Policies
CREATE POLICY "Users can view presence in their organization"
  ON realtime_presence FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their own presence"
  ON realtime_presence FOR ALL
  USING (user_id = auth.uid());

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to extract @mentions from text
CREATE OR REPLACE FUNCTION extract_mentions(text_content TEXT)
RETURNS UUID[] AS $$
DECLARE
  mention_pattern TEXT := '@\[([^\]]+)\]\(([a-f0-9-]+)\)';
  user_ids UUID[];
BEGIN
  -- Extract user IDs from @[Name](uuid) format
  SELECT ARRAY_AGG(DISTINCT (regexp_matches(text_content, mention_pattern, 'g'))[2]::UUID)
  INTO user_ids;

  RETURN COALESCE(user_ids, ARRAY[]::UUID[]);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to create mention notifications
CREATE OR REPLACE FUNCTION create_mention_notifications()
RETURNS TRIGGER AS $$
DECLARE
  mentioned_id UUID;
  org_id UUID;
BEGIN
  -- Get organization_id
  org_id := NEW.organization_id;

  -- Create mention record for each mentioned user
  FOREACH mentioned_id IN ARRAY NEW.mentioned_user_ids
  LOOP
    INSERT INTO mentions (
      organization_id,
      mentioned_user_id,
      mentioning_user_id,
      mention_type,
      entity_type,
      entity_id,
      context,
      url
    ) VALUES (
      org_id,
      mentioned_id,
      NEW.user_id,
      'comment',
      NEW.entity_type,
      NEW.entity_id,
      LEFT(NEW.content, 200),
      '/dashboard/' || NEW.entity_type || 's/' || NEW.entity_id
    );
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create mentions when comments are created
CREATE TRIGGER create_mentions_on_comment
  AFTER INSERT ON comments
  FOR EACH ROW
  WHEN (array_length(NEW.mentioned_user_ids, 1) > 0)
  EXECUTE FUNCTION create_mention_notifications();

-- Function to create activity feed entries
CREATE OR REPLACE FUNCTION log_activity()
RETURNS TRIGGER AS $$
DECLARE
  action TEXT;
  actor_name_val TEXT;
BEGIN
  -- Determine action type
  IF TG_OP = 'INSERT' THEN
    action := 'created';
  ELSIF TG_OP = 'UPDATE' THEN
    action := 'updated';
  ELSIF TG_OP = 'DELETE' THEN
    action := 'deleted';
  END IF;

  -- Get actor name
  SELECT full_name INTO actor_name_val
  FROM profiles
  WHERE id = COALESCE(NEW.user_id, OLD.user_id);

  -- Insert activity
  INSERT INTO activity_feed (
    organization_id,
    actor_user_id,
    actor_name,
    action_type,
    entity_type,
    entity_id,
    entity_name
  ) VALUES (
    COALESCE(NEW.organization_id, OLD.organization_id),
    COALESCE(NEW.user_id, OLD.user_id),
    actor_name_val,
    action,
    TG_TABLE_NAME::TEXT,
    COALESCE(NEW.id, OLD.id),
    COALESCE(NEW.content, OLD.content, '')::TEXT
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for comments updated_at
CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Clean up old presence records (> 5 minutes inactive)
CREATE OR REPLACE FUNCTION cleanup_stale_presence()
RETURNS void AS $$
BEGIN
  DELETE FROM realtime_presence
  WHERE last_active_at < NOW() - INTERVAL '5 minutes';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- HELPFUL QUERIES (for reference)
-- =====================================================

-- Get comments for an entity with user info
-- SELECT
--   c.*,
--   p.full_name as user_name,
--   p.avatar_url as user_avatar
-- FROM comments c
-- JOIN profiles p ON c.user_id = p.id
-- WHERE c.entity_type = 'document'
--   AND c.entity_id = 'ENTITY_UUID'
--   AND c.parent_comment_id IS NULL
-- ORDER BY c.created_at DESC;

-- Get unread mentions for a user
-- SELECT
--   m.*,
--   p.full_name as mentioning_user_name
-- FROM mentions m
-- JOIN profiles p ON m.mentioning_user_id = p.id
-- WHERE m.mentioned_user_id = 'USER_UUID'
--   AND m.is_read = false
-- ORDER BY m.created_at DESC;

-- Get activity feed for organization
-- SELECT * FROM activity_feed
-- WHERE organization_id = 'ORG_UUID'
--   AND (is_public = true OR 'USER_UUID' = ANY(visible_to_user_ids))
-- ORDER BY created_at DESC
-- LIMIT 50;

-- Get who's currently viewing an entity
-- SELECT
--   rp.*,
--   p.full_name as user_name,
--   p.avatar_url as user_avatar
-- FROM realtime_presence rp
-- JOIN profiles p ON rp.user_id = p.id
-- WHERE rp.entity_type = 'document'
--   AND rp.entity_id = 'ENTITY_UUID'
--   AND rp.last_active_at > NOW() - INTERVAL '2 minutes';
-- =====================================================
-- EMAIL INTELLIGENCE SCHEMA
-- For Gmail/Outlook integration with AI triage
-- =====================================================

-- Email accounts table (stores OAuth tokens)
CREATE TABLE IF NOT EXISTS email_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  provider TEXT NOT NULL, -- 'gmail', 'outlook'
  provider_account_id TEXT NOT NULL,
  email_address TEXT NOT NULL,

  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,

  sync_enabled BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  sync_cursor TEXT, -- For incremental syncing (historyId for Gmail)

  settings JSONB DEFAULT '{}', -- User preferences for this account

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, provider, provider_account_id)
);

-- Emails table
CREATE TABLE IF NOT EXISTS emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_account_id UUID NOT NULL REFERENCES email_accounts(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Email identifiers
  provider_message_id TEXT NOT NULL,
  provider_thread_id TEXT,
  provider TEXT NOT NULL,

  -- Email metadata
  subject TEXT,
  from_email TEXT NOT NULL,
  from_name TEXT,
  to_emails TEXT[] NOT NULL,
  cc_emails TEXT[],
  bcc_emails TEXT[],

  -- Content
  body_text TEXT,
  body_html TEXT,
  snippet TEXT, -- Short preview

  -- Gmail labels / categories
  labels TEXT[],
  category TEXT, -- 'primary', 'social', 'promotions', 'updates', 'forums'

  -- Flags
  is_read BOOLEAN DEFAULT false,
  is_starred BOOLEAN DEFAULT false,
  is_important BOOLEAN DEFAULT false,
  is_draft BOOLEAN DEFAULT false,

  -- Timestamps
  sent_at TIMESTAMPTZ NOT NULL,
  received_at TIMESTAMPTZ DEFAULT NOW(),

  -- Attachments
  has_attachments BOOLEAN DEFAULT false,
  attachments JSONB, -- Array of attachment metadata

  -- AI-enhanced fields
  ai_priority_score FLOAT, -- 0.0 to 1.0 importance score
  ai_category TEXT, -- 'urgent', 'important', 'newsletter', 'spam', 'personal'
  ai_summary TEXT, -- AI-generated summary
  ai_action_items JSONB, -- Extracted action items
  ai_sentiment TEXT, -- 'positive', 'negative', 'neutral'
  ai_entities JSONB, -- Extracted entities (people, companies, dates)

  -- Response tracking
  requires_response BOOLEAN DEFAULT false,
  response_deadline TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,

  -- Threading
  in_reply_to TEXT,
  references TEXT[], -- Message-ID references for threading

  -- Raw data
  raw_headers JSONB,
  raw_data JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(email_account_id, provider_message_id)
);

-- Email drafts table (AI-generated drafts awaiting approval)
CREATE TABLE IF NOT EXISTS email_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_account_id UUID NOT NULL REFERENCES email_accounts(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Draft metadata
  in_reply_to_email_id UUID REFERENCES emails(id) ON DELETE SET NULL,
  provider_draft_id TEXT, -- If synced to Gmail drafts

  -- Content
  to_emails TEXT[] NOT NULL,
  cc_emails TEXT[],
  bcc_emails TEXT[],
  subject TEXT NOT NULL,
  body_text TEXT,
  body_html TEXT,

  -- AI generation metadata
  ai_generated BOOLEAN DEFAULT false,
  ai_prompt TEXT, -- What the user asked for
  ai_model TEXT, -- Which model generated it
  generation_context JSONB, -- Context used for generation

  -- Status
  status TEXT DEFAULT 'draft', -- 'draft', 'approved', 'sent', 'rejected'
  approved_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email rules table (auto-triage rules)
CREATE TABLE IF NOT EXISTS email_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_account_id UUID REFERENCES email_accounts(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  description TEXT,

  -- Conditions (JSON query structure)
  conditions JSONB NOT NULL,
  -- Example: {"from": "boss@company.com", "subject_contains": "urgent"}

  -- Actions
  actions JSONB NOT NULL,
  -- Example: {"mark_important": true, "add_label": "urgent", "ai_priority": 1.0}

  enabled BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0, -- Order of execution

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email analytics table (for insights)
CREATE TABLE IF NOT EXISTS email_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  date DATE NOT NULL,

  -- Counts
  emails_received INTEGER DEFAULT 0,
  emails_sent INTEGER DEFAULT 0,
  emails_read INTEGER DEFAULT 0,

  -- Response metrics
  avg_response_time_hours FLOAT,
  response_rate FLOAT,

  -- AI metrics
  ai_triaged_count INTEGER DEFAULT 0,
  ai_drafts_generated INTEGER DEFAULT 0,
  ai_drafts_sent INTEGER DEFAULT 0,

  -- Time saved estimate
  time_saved_minutes INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, date)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_accounts_user ON email_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_email_accounts_org ON email_accounts(organization_id);

CREATE INDEX IF NOT EXISTS idx_emails_account ON emails(email_account_id);
CREATE INDEX IF NOT EXISTS idx_emails_user ON emails(user_id);
CREATE INDEX IF NOT EXISTS idx_emails_org ON emails(organization_id);
CREATE INDEX IF NOT EXISTS idx_emails_thread ON emails(provider_thread_id);
CREATE INDEX IF NOT EXISTS idx_emails_sent_at ON emails(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_emails_category ON emails(ai_category);
CREATE INDEX IF NOT EXISTS idx_emails_priority ON emails(ai_priority_score DESC);
CREATE INDEX IF NOT EXISTS idx_emails_unread ON emails(is_read) WHERE NOT is_read;
CREATE INDEX IF NOT EXISTS idx_emails_requires_response ON emails(requires_response) WHERE requires_response;

CREATE INDEX IF NOT EXISTS idx_email_drafts_account ON email_drafts(email_account_id);
CREATE INDEX IF NOT EXISTS idx_email_drafts_user ON email_drafts(user_id);
CREATE INDEX IF NOT EXISTS idx_email_drafts_status ON email_drafts(status);

CREATE INDEX IF NOT EXISTS idx_email_rules_user ON email_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_email_rules_account ON email_rules(email_account_id);

-- RLS Policies
ALTER TABLE email_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_analytics ENABLE ROW LEVEL SECURITY;

-- Email accounts policies
CREATE POLICY "Users can view their own email accounts"
  ON email_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own email accounts"
  ON email_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own email accounts"
  ON email_accounts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own email accounts"
  ON email_accounts FOR DELETE
  USING (auth.uid() = user_id);

-- Emails policies
CREATE POLICY "Users can view emails in their organization"
  ON emails FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.organization_id = emails.organization_id
    )
  );

CREATE POLICY "Users can insert emails in their organization"
  ON emails FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.organization_id = emails.organization_id
    )
  );

CREATE POLICY "Users can update their own emails"
  ON emails FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own emails"
  ON emails FOR DELETE
  USING (auth.uid() = user_id);

-- Email drafts policies
CREATE POLICY "Users can view their own drafts"
  ON email_drafts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own drafts"
  ON email_drafts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own drafts"
  ON email_drafts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own drafts"
  ON email_drafts FOR DELETE
  USING (auth.uid() = user_id);

-- Email rules policies
CREATE POLICY "Users can manage their own email rules"
  ON email_rules FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Email analytics policies
CREATE POLICY "Users can view their own analytics"
  ON email_analytics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert analytics"
  ON email_analytics FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update analytics"
  ON email_analytics FOR UPDATE
  USING (true);

-- Triggers for updated_at
CREATE TRIGGER update_email_accounts_updated_at
  BEFORE UPDATE ON email_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_emails_updated_at
  BEFORE UPDATE ON emails
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_drafts_updated_at
  BEFORE UPDATE ON email_drafts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_rules_updated_at
  BEFORE UPDATE ON email_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- EMAIL TEMPLATES TABLE
-- Reusable email templates with variable substitution
-- =====================================================
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- NULL for org-wide templates

  -- Template details
  name TEXT NOT NULL,
  description TEXT,
  category TEXT, -- 'sales', 'support', 'marketing', 'internal', 'follow_up', 'introduction', 'thank_you'

  -- Email content
  subject TEXT NOT NULL,
  body_html TEXT,
  body_text TEXT NOT NULL,

  -- Variables/placeholders
  variables JSONB DEFAULT '[]'::jsonb, -- ["firstName", "company", "amount"]

  -- Template settings
  is_shared BOOLEAN DEFAULT false, -- Shared with organization
  is_ai_generated BOOLEAN DEFAULT false,

  -- Usage stats
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_template_category CHECK (category IN ('sales', 'support', 'marketing', 'internal', 'custom', 'follow_up', 'introduction', 'thank_you'))
);

-- =====================================================
-- EMAIL TRACKING TABLE
-- Track email opens and link clicks
-- =====================================================
CREATE TABLE IF NOT EXISTS email_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_id UUID NOT NULL REFERENCES emails(id) ON DELETE CASCADE,

  -- Event details
  event_type TEXT NOT NULL, -- 'opened', 'clicked', 'bounced', 'unsubscribed'

  -- Click tracking
  link_url TEXT, -- For click events
  link_position INTEGER, -- Which link was clicked

  -- Context
  user_agent TEXT,
  ip_address INET,
  location JSONB, -- {city, country, timezone}

  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_tracking_event_type CHECK (event_type IN ('opened', 'clicked', 'bounced', 'unsubscribed', 'complained'))
);

-- Add scheduled sending and direction support to emails table
ALTER TABLE emails ADD COLUMN IF NOT EXISTS direction TEXT DEFAULT 'inbound';
ALTER TABLE emails ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ;
ALTER TABLE emails ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'received';
ALTER TABLE emails ALTER COLUMN sent_at DROP NOT NULL;

-- Add constraints for new columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'valid_email_direction'
  ) THEN
    ALTER TABLE emails ADD CONSTRAINT valid_email_direction
      CHECK (direction IN ('inbound', 'outbound'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'valid_email_status'
  ) THEN
    ALTER TABLE emails ADD CONSTRAINT valid_email_status
      CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'delivered', 'failed', 'received'));
  END IF;
END $$;

-- Indexes for email templates
CREATE INDEX IF NOT EXISTS idx_templates_org ON email_templates(organization_id);
CREATE INDEX IF NOT EXISTS idx_templates_user ON email_templates(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_templates_category ON email_templates(category);
CREATE INDEX IF NOT EXISTS idx_templates_shared ON email_templates(is_shared) WHERE is_shared = true;

-- Indexes for email tracking
CREATE INDEX IF NOT EXISTS idx_tracking_email ON email_tracking(email_id);
CREATE INDEX IF NOT EXISTS idx_tracking_event ON email_tracking(event_type, created_at DESC);

-- Indexes for scheduled emails
CREATE INDEX IF NOT EXISTS idx_emails_scheduled ON emails(scheduled_at) WHERE scheduled_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_emails_direction ON emails(direction);
CREATE INDEX IF NOT EXISTS idx_emails_status ON emails(status);

-- RLS Policies for email templates
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view templates in their organization"
  ON email_templates FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
    AND (is_shared = true OR user_id = auth.uid())
  );

CREATE POLICY "Users can manage their own templates"
  ON email_templates FOR ALL
  USING (user_id = auth.uid());

-- RLS Policies for email tracking
ALTER TABLE email_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tracking for their emails"
  ON email_tracking FOR SELECT
  USING (
    email_id IN (
      SELECT id FROM emails WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can create tracking events"
  ON email_tracking FOR INSERT
  WITH CHECK (true);

-- Triggers for updated_at
CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON email_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to process scheduled emails
CREATE OR REPLACE FUNCTION process_scheduled_emails()
RETURNS void AS $$
BEGIN
  -- Update emails that are due to be sent
  UPDATE emails
  SET status = 'sending'
  WHERE status = 'scheduled'
    AND scheduled_at <= NOW()
    AND scheduled_at > NOW() - INTERVAL '1 hour'; -- Safety check
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- DONE! Email intelligence schema is ready
-- Run this SQL in Supabase SQL Editor
-- =====================================================
-- Advanced Search & Saved Searches Schema
-- This schema supports advanced search filters and user-saved searches

-- Saved Searches Table
-- Stores user-defined search queries with filters
CREATE TABLE IF NOT EXISTS saved_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Search configuration
  name TEXT NOT NULL,
  description TEXT,
  query TEXT NOT NULL,

  -- Filters (stored as JSONB for flexibility)
  filters JSONB DEFAULT '{}'::jsonb,
  -- Example filters structure:
  -- {
  --   "types": ["document", "email"],
  --   "dateRange": {"start": "2024-01-01", "end": "2024-12-31"},
  --   "authors": ["user-id-1", "user-id-2"],
  --   "status": ["completed", "in_progress"],
  --   "priority": ["high", "medium"],
  --   "tags": ["important", "project-x"],
  --   "categories": ["work", "personal"]
  -- }

  -- Metadata
  is_pinned BOOLEAN DEFAULT false,
  is_shared BOOLEAN DEFAULT false, -- Share with organization
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,

  -- Notifications (optional: notify when new results match)
  notifications_enabled BOOLEAN DEFAULT false,
  notification_frequency TEXT DEFAULT 'instant', -- instant, daily, weekly

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_saved_searches_user ON saved_searches(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_searches_org ON saved_searches(organization_id);
CREATE INDEX IF NOT EXISTS idx_saved_searches_pinned ON saved_searches(is_pinned) WHERE is_pinned = true;
CREATE INDEX IF NOT EXISTS idx_saved_searches_shared ON saved_searches(is_shared) WHERE is_shared = true;
CREATE INDEX IF NOT EXISTS idx_saved_searches_filters ON saved_searches USING gin(filters);

-- Row Level Security
ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;

-- Users can view their own saved searches or shared searches in their org
CREATE POLICY "Users can view own and shared saved searches"
  ON saved_searches FOR SELECT
  USING (
    auth.uid() = user_id
    OR (is_shared = true AND organization_id IN (
      SELECT organization_id FROM user_profiles WHERE user_id = auth.uid()
    ))
  );

-- Users can create their own saved searches
CREATE POLICY "Users can create own saved searches"
  ON saved_searches FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own saved searches
CREATE POLICY "Users can update own saved searches"
  ON saved_searches FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own saved searches
CREATE POLICY "Users can delete own saved searches"
  ON saved_searches FOR DELETE
  USING (auth.uid() = user_id);

-- Search History Table (optional: track recent searches)
CREATE TABLE IF NOT EXISTS search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  query TEXT NOT NULL,
  filters JSONB DEFAULT '{}'::jsonb,
  results_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_search_history_user ON search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_search_history_created ON search_history(created_at DESC);

-- RLS for search history
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own search history"
  ON search_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own search history"
  ON search_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_saved_search_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS saved_searches_updated_at ON saved_searches;
CREATE TRIGGER saved_searches_updated_at
  BEFORE UPDATE ON saved_searches
  FOR EACH ROW
  EXECUTE FUNCTION update_saved_search_updated_at();

-- Function to increment usage count and update last_used_at
CREATE OR REPLACE FUNCTION increment_saved_search_usage(search_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE saved_searches
  SET
    usage_count = usage_count + 1,
    last_used_at = NOW()
  WHERE id = search_id;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old search history (keep last 100 per user)
CREATE OR REPLACE FUNCTION cleanup_old_search_history()
RETURNS void AS $$
BEGIN
  DELETE FROM search_history
  WHERE id IN (
    SELECT id FROM (
      SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as row_num
      FROM search_history
    ) sub
    WHERE row_num > 100
  );
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE saved_searches IS 'Stores user-defined search queries with advanced filters for quick re-use';
COMMENT ON COLUMN saved_searches.filters IS 'JSONB object containing search filters (types, date ranges, authors, status, priority, tags, categories)';
COMMENT ON COLUMN saved_searches.is_shared IS 'When true, search is visible to all members of the organization';
COMMENT ON COLUMN saved_searches.notifications_enabled IS 'When true, user receives notifications when new items match this search';

COMMENT ON TABLE search_history IS 'Tracks recent searches for autocomplete and analytics';
COMMENT ON FUNCTION cleanup_old_search_history() IS 'Keeps only the 100 most recent searches per user to prevent table bloat';
-- =====================================================
-- SMART NOTIFICATIONS SCHEMA
-- =====================================================
-- Run this in your Supabase SQL Editor
-- Tables: notifications, notification_preferences, notification_digests
-- =====================================================

-- Notification types enum
CREATE TYPE notification_type AS ENUM (
  'task_due',
  'task_assigned',
  'email_important',
  'email_mention',
  'calendar_event',
  'calendar_reminder',
  'document_shared',
  'document_comment',
  'whatsapp_message',
  'system_alert',
  'ai_insight',
  'usage_limit'
);

-- Notification priority enum
CREATE TYPE notification_priority AS ENUM ('low', 'medium', 'high', 'urgent');

-- Notification status enum
CREATE TYPE notification_status AS ENUM ('unread', 'read', 'archived', 'snoozed');

-- =====================================================
-- 1. NOTIFICATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Notification details
  type notification_type NOT NULL,
  priority notification_priority DEFAULT 'medium',
  status notification_status DEFAULT 'unread',

  -- Content
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  action_url TEXT, -- Link to relevant page
  action_label TEXT, -- Button text (e.g., "View Task", "Read Email")

  -- AI scoring
  ai_priority_score DECIMAL(3, 2), -- 0.00 to 1.00
  ai_urgency_reason TEXT, -- Why AI thinks this is important

  -- Related entities
  related_entity_type TEXT, -- 'task', 'email', 'calendar_event', etc.
  related_entity_id UUID,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Delivery
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ,
  snoozed_until TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. NOTIFICATION PREFERENCES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Channel preferences
  enable_in_app BOOLEAN DEFAULT true,
  enable_email BOOLEAN DEFAULT true,
  enable_push BOOLEAN DEFAULT false,

  -- Type preferences (which notification types to receive)
  enable_task_due BOOLEAN DEFAULT true,
  enable_task_assigned BOOLEAN DEFAULT true,
  enable_email_important BOOLEAN DEFAULT true,
  enable_email_mention BOOLEAN DEFAULT true,
  enable_calendar_event BOOLEAN DEFAULT true,
  enable_calendar_reminder BOOLEAN DEFAULT true,
  enable_document_shared BOOLEAN DEFAULT true,
  enable_document_comment BOOLEAN DEFAULT true,
  enable_whatsapp_message BOOLEAN DEFAULT true,
  enable_system_alert BOOLEAN DEFAULT true,
  enable_ai_insight BOOLEAN DEFAULT true,
  enable_usage_limit BOOLEAN DEFAULT true,

  -- Smart features
  enable_ai_prioritization BOOLEAN DEFAULT true,
  enable_smart_digest BOOLEAN DEFAULT true,
  digest_frequency TEXT DEFAULT 'daily', -- 'hourly', 'daily', 'weekly'
  quiet_hours_start TIME, -- e.g., '22:00'
  quiet_hours_end TIME, -- e.g., '08:00'

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT notification_preferences_user_unique UNIQUE (user_id)
);

-- =====================================================
-- 3. NOTIFICATION DIGESTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS notification_digests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Digest details
  digest_type TEXT NOT NULL, -- 'daily', 'weekly'
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,

  -- Content
  notification_count INTEGER DEFAULT 0,
  high_priority_count INTEGER DEFAULT 0,
  summary TEXT, -- AI-generated summary

  -- Delivery
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_org ON notifications(organization_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON notifications(priority);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_status ON notifications(user_id, status);
CREATE INDEX IF NOT EXISTS idx_notifications_snoozed ON notifications(snoozed_until) WHERE snoozed_until IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_notification_prefs_user ON notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_digests_user ON notification_digests(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_digests_sent ON notification_digests(sent_at);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_digests ENABLE ROW LEVEL SECURITY;

-- Notifications policies
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- Preferences policies
CREATE POLICY "Users can view own preferences"
  ON notification_preferences FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage own preferences"
  ON notification_preferences FOR ALL
  USING (user_id = auth.uid());

-- Digests policies
CREATE POLICY "Users can view own digests"
  ON notification_digests FOR SELECT
  USING (user_id = auth.uid());

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-create preferences on user creation
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_user_notification_preferences
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_notification_preferences();

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Get unread notification count
CREATE OR REPLACE FUNCTION get_unread_notification_count(usr_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM notifications
    WHERE user_id = usr_id
      AND status = 'unread'
      AND (snoozed_until IS NULL OR snoozed_until < NOW())
  );
END;
$$ LANGUAGE plpgsql;

-- Mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(notif_id UUID, usr_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE notifications
  SET status = 'read',
      read_at = NOW()
  WHERE id = notif_id
    AND user_id = usr_id
    AND status = 'unread';

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Mark all notifications as read
CREATE OR REPLACE FUNCTION mark_all_notifications_read(usr_id UUID)
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE notifications
  SET status = 'read',
      read_at = NOW()
  WHERE user_id = usr_id
    AND status = 'unread';

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- Snooze notification
CREATE OR REPLACE FUNCTION snooze_notification(
  notif_id UUID,
  usr_id UUID,
  snooze_duration INTERVAL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE notifications
  SET status = 'snoozed',
      snoozed_until = NOW() + snooze_duration
  WHERE id = notif_id
    AND user_id = usr_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Un-snooze notifications that are due
CREATE OR REPLACE FUNCTION unsnooze_due_notifications()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE notifications
  SET status = 'unread',
      snoozed_until = NULL
  WHERE status = 'snoozed'
    AND snoozed_until < NOW();

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- Archive old read notifications (cleanup)
CREATE OR REPLACE FUNCTION archive_old_notifications(days_old INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
  archived_count INTEGER;
BEGIN
  UPDATE notifications
  SET status = 'archived',
      archived_at = NOW()
  WHERE status = 'read'
    AND read_at < NOW() - (days_old || ' days')::INTERVAL;

  GET DIAGNOSTICS archived_count = ROW_COUNT;
  RETURN archived_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE notifications IS 'Smart notifications with AI prioritization';
COMMENT ON TABLE notification_preferences IS 'User notification preferences and settings';
COMMENT ON TABLE notification_digests IS 'Daily/weekly notification digests';
COMMENT ON COLUMN notifications.ai_priority_score IS 'AI-calculated priority score (0.00 to 1.00)';
COMMENT ON FUNCTION get_unread_notification_count IS 'Get count of unread notifications for a user';
COMMENT ON FUNCTION unsnooze_due_notifications IS 'Automatically un-snooze notifications that are due';
-- =====================================================
-- STRIPE BILLING & SUBSCRIPTIONS SCHEMA
-- =====================================================
-- Run this in your Supabase SQL Editor
-- Tables: subscriptions, usage_tracking, invoices
-- =====================================================

-- Subscription plans enum
CREATE TYPE subscription_plan AS ENUM ('free', 'starter', 'pro', 'premium', 'team', 'enterprise');
CREATE TYPE subscription_status AS ENUM ('active', 'canceled', 'past_due', 'trialing', 'incomplete', 'incomplete_expired', 'unpaid');

-- =====================================================
-- 1. SUBSCRIPTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Stripe data
  stripe_customer_id TEXT UNIQUE NOT NULL,
  stripe_subscription_id TEXT UNIQUE,
  stripe_price_id TEXT,

  -- Plan details
  plan subscription_plan NOT NULL DEFAULT 'free',
  status subscription_status NOT NULL DEFAULT 'active',

  -- Billing cycle
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMPTZ,

  -- Trial
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT subscriptions_organization_unique UNIQUE (organization_id)
);

-- =====================================================
-- 2. USAGE TRACKING TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Usage metrics (monthly reset)
  month TEXT NOT NULL, -- Format: YYYY-MM

  -- AI usage
  ai_messages_count INTEGER DEFAULT 0,
  ai_tokens_used INTEGER DEFAULT 0,

  -- Document usage
  documents_stored INTEGER DEFAULT 0,
  storage_bytes BIGINT DEFAULT 0,

  -- Email usage
  emails_synced INTEGER DEFAULT 0,
  email_ai_actions INTEGER DEFAULT 0,

  -- WhatsApp usage
  whatsapp_messages INTEGER DEFAULT 0,

  -- Calendar usage
  calendar_events INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT usage_tracking_org_month_unique UNIQUE (organization_id, month)
);

-- =====================================================
-- 3. INVOICES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Stripe data
  stripe_invoice_id TEXT UNIQUE NOT NULL,
  stripe_payment_intent_id TEXT,

  -- Invoice details
  amount_due INTEGER NOT NULL, -- In cents
  amount_paid INTEGER DEFAULT 0,
  currency TEXT DEFAULT 'usd',
  status TEXT NOT NULL, -- 'draft', 'open', 'paid', 'void', 'uncollectible'

  -- Dates
  invoice_date TIMESTAMPTZ,
  due_date TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,

  -- Links
  invoice_pdf TEXT,
  hosted_invoice_url TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 4. PLAN LIMITS REFERENCE TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS plan_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan subscription_plan NOT NULL UNIQUE,

  -- Limits
  ai_messages_per_month INTEGER,
  documents_limit INTEGER,
  storage_gb INTEGER,
  team_members_limit INTEGER,

  -- Features
  advanced_ai BOOLEAN DEFAULT false,
  priority_support BOOLEAN DEFAULT false,
  custom_integrations BOOLEAN DEFAULT false,
  sso_enabled BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default plan limits
INSERT INTO plan_limits (plan, ai_messages_per_month, documents_limit, storage_gb, team_members_limit, advanced_ai, priority_support, custom_integrations, sso_enabled) VALUES
  ('free', 150, 10, 1, 1, false, false, false, false), -- 5 AI requests/day = ~150/month
  ('starter', 500, 100, 2, 2, false, false, false, false),
  ('pro', -1, -1, 10, 5, true, false, false, false), -- -1 = unlimited
  ('premium', -1, -1, 50, 10, true, true, false, false),
  ('team', -1, -1, 100, -1, true, true, false, false), -- Per-user pricing
  ('enterprise', -1, -1, 200, -1, true, true, true, true)
ON CONFLICT (plan) DO NOTHING;

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_subscriptions_organization ON subscriptions(organization_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan ON subscriptions(plan);

CREATE INDEX IF NOT EXISTS idx_usage_tracking_org ON usage_tracking(organization_id);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_month ON usage_tracking(month);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_org_month ON usage_tracking(organization_id, month);

CREATE INDEX IF NOT EXISTS idx_invoices_organization ON invoices(organization_id);
CREATE INDEX IF NOT EXISTS idx_invoices_stripe ON invoices(stripe_invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_limits ENABLE ROW LEVEL SECURITY;

-- Subscriptions policies
CREATE POLICY "Users can view own organization subscription"
  ON subscriptions FOR SELECT
  USING (
    user_id = auth.uid() OR
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "System can manage subscriptions"
  ON subscriptions FOR ALL
  USING (true)
  WITH CHECK (true);

-- Usage tracking policies
CREATE POLICY "Users can view own organization usage"
  ON usage_tracking FOR SELECT
  USING (
    user_id = auth.uid() OR
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "System can manage usage tracking"
  ON usage_tracking FOR ALL
  USING (true)
  WITH CHECK (true);

-- Invoices policies
CREATE POLICY "Users can view own organization invoices"
  ON invoices FOR SELECT
  USING (
    user_id = auth.uid() OR
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Plan limits policies (read-only for all authenticated users)
CREATE POLICY "Authenticated users can view plan limits"
  ON plan_limits FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_usage_tracking_updated_at
  BEFORE UPDATE ON usage_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Get current usage for organization
CREATE OR REPLACE FUNCTION get_current_usage(org_id UUID)
RETURNS TABLE (
  month TEXT,
  ai_messages_count INTEGER,
  ai_tokens_used INTEGER,
  documents_stored INTEGER,
  storage_bytes BIGINT,
  emails_synced INTEGER,
  email_ai_actions INTEGER,
  whatsapp_messages INTEGER,
  calendar_events INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.month,
    u.ai_messages_count,
    u.ai_tokens_used,
    u.documents_stored,
    u.storage_bytes,
    u.emails_synced,
    u.email_ai_actions,
    u.whatsapp_messages,
    u.calendar_events
  FROM usage_tracking u
  WHERE u.organization_id = org_id
    AND u.month = TO_CHAR(NOW(), 'YYYY-MM')
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Check if organization has reached usage limit
CREATE OR REPLACE FUNCTION check_usage_limit(org_id UUID, limit_type TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  current_usage INTEGER;
  limit_value INTEGER;
  current_plan subscription_plan;
BEGIN
  -- Get current plan
  SELECT plan INTO current_plan
  FROM subscriptions
  WHERE organization_id = org_id;

  -- Get limit for plan
  CASE limit_type
    WHEN 'ai_messages' THEN
      SELECT ai_messages_per_month INTO limit_value
      FROM plan_limits
      WHERE plan = current_plan;

      SELECT ai_messages_count INTO current_usage
      FROM usage_tracking
      WHERE organization_id = org_id
        AND month = TO_CHAR(NOW(), 'YYYY-MM');

    WHEN 'documents' THEN
      SELECT documents_limit INTO limit_value
      FROM plan_limits
      WHERE plan = current_plan;

      SELECT documents_stored INTO current_usage
      FROM usage_tracking
      WHERE organization_id = org_id
        AND month = TO_CHAR(NOW(), 'YYYY-MM');

    ELSE
      RETURN false;
  END CASE;

  -- -1 means unlimited
  IF limit_value = -1 THEN
    RETURN false;
  END IF;

  -- Check if limit reached
  RETURN COALESCE(current_usage, 0) >= limit_value;
END;
$$ LANGUAGE plpgsql;

-- Increment usage counter
CREATE OR REPLACE FUNCTION increment_usage(
  org_id UUID,
  usr_id UUID,
  usage_type TEXT,
  increment_by INTEGER DEFAULT 1
)
RETURNS VOID AS $$
DECLARE
  current_month TEXT;
BEGIN
  current_month := TO_CHAR(NOW(), 'YYYY-MM');

  -- Insert or update usage tracking
  INSERT INTO usage_tracking (organization_id, user_id, month)
  VALUES (org_id, usr_id, current_month)
  ON CONFLICT (organization_id, month) DO NOTHING;

  -- Increment the specific counter
  CASE usage_type
    WHEN 'ai_messages' THEN
      UPDATE usage_tracking
      SET ai_messages_count = ai_messages_count + increment_by
      WHERE organization_id = org_id AND month = current_month;

    WHEN 'documents' THEN
      UPDATE usage_tracking
      SET documents_stored = documents_stored + increment_by
      WHERE organization_id = org_id AND month = current_month;

    WHEN 'emails' THEN
      UPDATE usage_tracking
      SET emails_synced = emails_synced + increment_by
      WHERE organization_id = org_id AND month = current_month;

    WHEN 'whatsapp' THEN
      UPDATE usage_tracking
      SET whatsapp_messages = whatsapp_messages + increment_by
      WHERE organization_id = org_id AND month = current_month;

    WHEN 'calendar' THEN
      UPDATE usage_tracking
      SET calendar_events = calendar_events + increment_by
      WHERE organization_id = org_id AND month = current_month;
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE subscriptions IS 'Stripe subscription data for organizations';
COMMENT ON TABLE usage_tracking IS 'Monthly usage metrics for billing and limits';
COMMENT ON TABLE invoices IS 'Stripe invoice records';
COMMENT ON TABLE plan_limits IS 'Plan limits and features configuration';
-- =====================================================
-- CALENDAR & EVENTS SCHEMA
-- For Google Calendar, Outlook sync and meeting intelligence
-- =====================================================

-- Calendar accounts table (stores OAuth tokens)
CREATE TABLE IF NOT EXISTS calendar_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  provider TEXT NOT NULL, -- 'google', 'outlook', 'apple'
  provider_account_id TEXT NOT NULL, -- email or account ID from provider
  access_token TEXT, -- Encrypted in production
  refresh_token TEXT, -- Encrypted in production
  token_expires_at TIMESTAMPTZ,
  calendar_list JSONB, -- List of calendars from this account
  sync_enabled BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider, provider_account_id)
);

-- Calendar events table
CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  calendar_account_id UUID NOT NULL REFERENCES calendar_accounts(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Event details from provider
  provider_event_id TEXT NOT NULL,
  provider TEXT NOT NULL, -- 'google', 'outlook', 'apple'
  calendar_id TEXT NOT NULL, -- Which calendar this event belongs to

  -- Event information
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  all_day BOOLEAN DEFAULT false,
  timezone TEXT,

  -- Participants
  organizer_email TEXT,
  organizer_name TEXT,
  attendees JSONB, -- Array of {email, name, response_status}

  -- Meeting links
  meeting_url TEXT, -- Zoom, Meet, Teams link
  conference_data JSONB, -- Full conference details

  -- Status
  status TEXT DEFAULT 'confirmed', -- 'confirmed', 'cancelled', 'tentative'
  response_status TEXT, -- user's response: 'accepted', 'declined', 'tentative', 'needsAction'

  -- AI-enhanced fields
  ai_summary TEXT, -- AI-generated summary
  ai_briefing TEXT, -- Pre-meeting briefing
  ai_action_items JSONB, -- Extracted action items post-meeting
  meeting_transcript TEXT, -- If recorded
  meeting_recording_url TEXT,

  -- Metadata
  is_recurring BOOLEAN DEFAULT false,
  recurrence_rule TEXT,
  raw_data JSONB, -- Full event data from provider

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(calendar_account_id, provider_event_id)
);

-- Meeting transcripts table (for detailed transcription storage)
CREATE TABLE IF NOT EXISTS meeting_transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  calendar_event_id UUID NOT NULL REFERENCES calendar_events(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Transcript details
  full_transcript TEXT,
  speaker_segments JSONB, -- Array of {speaker, text, timestamp}
  summary TEXT,
  action_items JSONB,
  key_points JSONB,

  -- Recording info
  recording_url TEXT,
  recording_duration_seconds INT,

  -- Processing status
  status TEXT DEFAULT 'processing', -- 'processing', 'completed', 'failed'
  processed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_calendar_accounts_user ON calendar_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_accounts_org ON calendar_accounts(organization_id);

CREATE INDEX IF NOT EXISTS idx_calendar_events_user ON calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_org ON calendar_events(organization_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_time ON calendar_events(start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_calendar_events_account ON calendar_events(calendar_account_id);

CREATE INDEX IF NOT EXISTS idx_meeting_transcripts_event ON meeting_transcripts(calendar_event_id);
CREATE INDEX IF NOT EXISTS idx_meeting_transcripts_org ON meeting_transcripts(organization_id);

-- RLS Policies
ALTER TABLE calendar_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_transcripts ENABLE ROW LEVEL SECURITY;

-- Calendar accounts policies
CREATE POLICY "Users can view their own calendar accounts"
  ON calendar_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own calendar accounts"
  ON calendar_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own calendar accounts"
  ON calendar_accounts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own calendar accounts"
  ON calendar_accounts FOR DELETE
  USING (auth.uid() = user_id);

-- Calendar events policies
CREATE POLICY "Users can view events in their organization"
  ON calendar_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.organization_id = calendar_events.organization_id
    )
  );

CREATE POLICY "Users can create events in their organization"
  ON calendar_events FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.organization_id = calendar_events.organization_id
    )
  );

CREATE POLICY "Users can update their own events"
  ON calendar_events FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own events"
  ON calendar_events FOR DELETE
  USING (auth.uid() = user_id);

-- Meeting transcripts policies
CREATE POLICY "Users can view transcripts in their organization"
  ON meeting_transcripts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.organization_id = meeting_transcripts.organization_id
    )
  );

CREATE POLICY "Users can create transcripts in their organization"
  ON meeting_transcripts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.organization_id = meeting_transcripts.organization_id
    )
  );

-- =====================================================
-- DONE! Calendar schema is ready
-- Now run this SQL in Supabase SQL Editor
-- =====================================================
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
-- =====================================================
-- TASK MANAGEMENT SCHEMA
-- For action items, todos, and project management
-- =====================================================

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Task details
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'todo', -- 'todo', 'in_progress', 'completed', 'cancelled'
  priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'

  -- Assignment
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Dates
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  reminder_at TIMESTAMPTZ,

  -- Source tracking (where did this task come from?)
  source_type TEXT, -- 'chat', 'email', 'calendar', 'manual'
  source_id UUID, -- ID of the chat message, email, or calendar event
  source_reference TEXT, -- Additional context

  -- AI extraction metadata
  ai_extracted BOOLEAN DEFAULT false,
  ai_confidence FLOAT, -- 0.0 to 1.0
  ai_context TEXT, -- Original text that generated this task

  -- Project/grouping
  project_name TEXT,
  tags TEXT[], -- Array of tags for categorization

  -- External integrations
  external_provider TEXT, -- 'asana', 'linear', 'jira', null
  external_id TEXT, -- ID in external system
  external_url TEXT, -- Link to external task

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Task comments/notes
CREATE TABLE IF NOT EXISTS task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  content TEXT NOT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Task reminders/notifications
CREATE TABLE IF NOT EXISTS task_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  reminder_time TIMESTAMPTZ NOT NULL,
  reminder_type TEXT DEFAULT 'notification', -- 'notification', 'email', 'sms'
  sent BOOLEAN DEFAULT false,
  sent_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_user ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_org ON tasks(organization_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_source ON tasks(source_type, source_id);

CREATE INDEX IF NOT EXISTS idx_task_comments_task ON task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_reminders_task ON task_reminders(task_id);
CREATE INDEX IF NOT EXISTS idx_task_reminders_time ON task_reminders(reminder_time) WHERE NOT sent;

-- RLS Policies
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_reminders ENABLE ROW LEVEL SECURITY;

-- Tasks policies
CREATE POLICY "Users can view tasks in their organization"
  ON tasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.organization_id = tasks.organization_id
    )
  );

CREATE POLICY "Users can create tasks in their organization"
  ON tasks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.organization_id = tasks.organization_id
    )
  );

CREATE POLICY "Users can update tasks in their organization"
  ON tasks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.organization_id = tasks.organization_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.organization_id = tasks.organization_id
    )
  );

CREATE POLICY "Users can delete tasks they created or are assigned"
  ON tasks FOR DELETE
  USING (
    user_id = auth.uid()
    OR assigned_to = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.organization_id = tasks.organization_id
      AND p.role = 'admin'
    )
  );

-- Task comments policies
CREATE POLICY "Users can view comments in their organization"
  ON task_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.organization_id = task_comments.organization_id
    )
  );

CREATE POLICY "Users can create comments in their organization"
  ON task_comments FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.organization_id = task_comments.organization_id
    )
  );

-- Task reminders policies
CREATE POLICY "Users can view their own reminders"
  ON task_reminders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own reminders"
  ON task_reminders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reminders"
  ON task_reminders FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_task_comments_updated_at
  BEFORE UPDATE ON task_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- DONE! Task management schema is ready
-- Run this SQL in Supabase SQL Editor
-- =====================================================
