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
