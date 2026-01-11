-- Email folders/labels system with AI categorization

-- Email folders table
CREATE TABLE IF NOT EXISTS email_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  color VARCHAR(7) DEFAULT '#6366f1', -- Hex color
  icon VARCHAR(50) DEFAULT 'folder', -- Lucide icon name

  -- Folder type
  folder_type VARCHAR(20) DEFAULT 'custom' CHECK (folder_type IN ('system', 'smart', 'custom')),

  -- For smart folders: AI-based auto-categorization rules
  is_smart BOOLEAN DEFAULT false,
  smart_rules JSONB, -- { keywords: [], senders: [], priority_min: 0.5, categories: [] }

  -- Ordering
  sort_order INTEGER DEFAULT 0,

  -- Stats (updated via trigger or cron)
  email_count INTEGER DEFAULT 0,
  unread_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, slug)
);

-- Email-to-folder association (many-to-many)
CREATE TABLE IF NOT EXISTS email_folder_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_id UUID NOT NULL REFERENCES emails(id) ON DELETE CASCADE,
  folder_id UUID NOT NULL REFERENCES email_folders(id) ON DELETE CASCADE,
  assigned_by VARCHAR(20) DEFAULT 'user' CHECK (assigned_by IN ('user', 'ai', 'rule')),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(email_id, folder_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_email_folders_user_id ON email_folders(user_id);
CREATE INDEX IF NOT EXISTS idx_email_folders_org_id ON email_folders(organization_id);
CREATE INDEX IF NOT EXISTS idx_email_folder_assignments_email ON email_folder_assignments(email_id);
CREATE INDEX IF NOT EXISTS idx_email_folder_assignments_folder ON email_folder_assignments(folder_id);

-- RLS Policies for email_folders
ALTER TABLE email_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own folders"
ON email_folders FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own folders"
ON email_folders FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own folders"
ON email_folders FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own folders"
ON email_folders FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- RLS Policies for email_folder_assignments
ALTER TABLE email_folder_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their folder assignments"
ON email_folder_assignments FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM email_folders f WHERE f.id = folder_id AND f.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create folder assignments"
ON email_folder_assignments FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM email_folders f WHERE f.id = folder_id AND f.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete folder assignments"
ON email_folder_assignments FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM email_folders f WHERE f.id = folder_id AND f.user_id = auth.uid()
  )
);

-- Function to create default folders for new users
CREATE OR REPLACE FUNCTION create_default_email_folders()
RETURNS TRIGGER AS $$
BEGIN
  -- Create default smart folders
  INSERT INTO email_folders (organization_id, user_id, name, slug, icon, color, folder_type, is_smart, smart_rules, sort_order)
  VALUES
    (NEW.organization_id, NEW.id, 'Priority', 'priority', 'alert-circle', '#ef4444', 'smart', true,
     '{"priority_min": 0.7, "categories": ["urgent", "important"]}', 1),
    (NEW.organization_id, NEW.id, 'Needs Reply', 'needs-reply', 'reply', '#f59e0b', 'smart', true,
     '{"requires_response": true}', 2),
    (NEW.organization_id, NEW.id, 'Newsletters', 'newsletters', 'newspaper', '#8b5cf6', 'smart', true,
     '{"categories": ["newsletter", "promotional"]}', 3),
    (NEW.organization_id, NEW.id, 'Clients', 'clients', 'users', '#10b981', 'custom', false, null, 4),
    (NEW.organization_id, NEW.id, 'Projects', 'projects', 'briefcase', '#3b82f6', 'custom', false, null, 5)
  ON CONFLICT (user_id, slug) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Note: Trigger would be created on profiles table if you want auto-creation
-- For now, we'll create folders on-demand via API
