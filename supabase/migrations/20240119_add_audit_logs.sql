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
