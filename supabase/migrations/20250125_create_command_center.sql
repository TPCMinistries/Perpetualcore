-- Command Center: Exception-based management system
-- "Stop managing tasks. Start managing exceptions." - BOS 2.0

-- ============================================================================
-- EXCEPTIONS TABLE
-- Failed operations requiring human intervention
-- ============================================================================
CREATE TABLE IF NOT EXISTS exceptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Source of the exception
  source_type TEXT NOT NULL CHECK (source_type IN ('agent', 'workflow', 'integration', 'webhook', 'work_item', 'system')),
  source_id UUID, -- Reference to the source entity (agent_activity, work_item, etc.)
  source_name TEXT, -- Human-readable name of the source

  -- Exception details
  title TEXT NOT NULL,
  description TEXT,
  error_message TEXT,
  error_code TEXT,
  stack_trace TEXT,

  -- Severity and status
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'acknowledged', 'in_progress', 'resolved', 'dismissed')),

  -- Assignment
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,

  -- AI assistance
  ai_suggested_resolution TEXT,
  ai_confidence_score DECIMAL(3,2),

  -- Resolution
  resolution_notes TEXT,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,

  -- Retry capability
  can_retry BOOLEAN DEFAULT false,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  last_retry_at TIMESTAMPTZ,
  retry_payload JSONB,

  -- Metadata
  metadata JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  acknowledged_at TIMESTAMPTZ
);

-- ============================================================================
-- EXCEPTION EVENTS TABLE
-- Audit log for exception handling
-- ============================================================================
CREATE TABLE IF NOT EXISTS exception_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exception_id UUID NOT NULL REFERENCES exceptions(id) ON DELETE CASCADE,

  event_type TEXT NOT NULL CHECK (event_type IN (
    'created', 'acknowledged', 'assigned', 'status_changed',
    'retried', 'resolved', 'dismissed', 'reopened', 'commented', 'escalated'
  )),

  -- Event details
  from_status TEXT,
  to_status TEXT,
  comment TEXT,

  -- Who performed the action
  performed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  performed_by_system BOOLEAN DEFAULT false,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- SYSTEM HEALTH TABLE
-- Periodic snapshots of system health
-- ============================================================================
CREATE TABLE IF NOT EXISTS system_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Health area
  area TEXT NOT NULL CHECK (area IN ('agents', 'workflows', 'integrations', 'webhooks', 'database', 'api')),

  -- Status
  status TEXT NOT NULL CHECK (status IN ('healthy', 'degraded', 'unhealthy')),

  -- Metrics
  total_operations INTEGER DEFAULT 0,
  successful_operations INTEGER DEFAULT 0,
  failed_operations INTEGER DEFAULT 0,
  pending_operations INTEGER DEFAULT 0,

  -- Details
  details JSONB DEFAULT '{}',
  last_error TEXT,
  last_success_at TIMESTAMPTZ,
  last_failure_at TIMESTAMPTZ,

  -- Timestamp
  recorded_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(organization_id, area, recorded_at)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Exceptions indexes
CREATE INDEX IF NOT EXISTS idx_exceptions_org ON exceptions(organization_id);
CREATE INDEX IF NOT EXISTS idx_exceptions_status ON exceptions(status);
CREATE INDEX IF NOT EXISTS idx_exceptions_severity ON exceptions(severity);
CREATE INDEX IF NOT EXISTS idx_exceptions_source ON exceptions(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_exceptions_assigned ON exceptions(assigned_to);
CREATE INDEX IF NOT EXISTS idx_exceptions_created ON exceptions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_exceptions_open ON exceptions(organization_id, status) WHERE status IN ('open', 'acknowledged', 'in_progress');

-- Exception events indexes
CREATE INDEX IF NOT EXISTS idx_exception_events_exception ON exception_events(exception_id);
CREATE INDEX IF NOT EXISTS idx_exception_events_type ON exception_events(event_type);

-- System health indexes
CREATE INDEX IF NOT EXISTS idx_system_health_org ON system_health(organization_id);
CREATE INDEX IF NOT EXISTS idx_system_health_area ON system_health(organization_id, area);
CREATE INDEX IF NOT EXISTS idx_system_health_latest ON system_health(organization_id, area, recorded_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exception_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_health ENABLE ROW LEVEL SECURITY;

-- Exceptions policies
CREATE POLICY "Users can view exceptions in their organization"
  ON exceptions FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can create exceptions in their organization"
  ON exceptions FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update exceptions in their organization"
  ON exceptions FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete exceptions in their organization"
  ON exceptions FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Exception events policies
CREATE POLICY "Users can view exception events in their organization"
  ON exception_events FOR SELECT
  USING (
    exception_id IN (
      SELECT id FROM exceptions WHERE organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create exception events in their organization"
  ON exception_events FOR INSERT
  WITH CHECK (
    exception_id IN (
      SELECT id FROM exceptions WHERE organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

-- System health policies
CREATE POLICY "Users can view system health in their organization"
  ON system_health FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can create system health in their organization"
  ON system_health FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update timestamp trigger for exceptions
CREATE OR REPLACE FUNCTION update_exception_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_exceptions_timestamp
  BEFORE UPDATE ON exceptions
  FOR EACH ROW
  EXECUTE FUNCTION update_exception_timestamp();

-- Auto-create exception event on status change
CREATE OR REPLACE FUNCTION log_exception_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO exception_events (
      exception_id,
      event_type,
      from_status,
      to_status,
      performed_by
    ) VALUES (
      NEW.id,
      CASE
        WHEN NEW.status = 'resolved' THEN 'resolved'
        WHEN NEW.status = 'dismissed' THEN 'dismissed'
        WHEN NEW.status = 'acknowledged' THEN 'acknowledged'
        ELSE 'status_changed'
      END,
      OLD.status,
      NEW.status,
      NEW.resolved_by
    );

    -- Set acknowledged_at if newly acknowledged
    IF NEW.status = 'acknowledged' AND OLD.status = 'open' THEN
      NEW.acknowledged_at = NOW();
    END IF;

    -- Set resolved_at if resolved
    IF NEW.status = 'resolved' AND OLD.status != 'resolved' THEN
      NEW.resolved_at = NOW();
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_exception_changes
  BEFORE UPDATE ON exceptions
  FOR EACH ROW
  EXECUTE FUNCTION log_exception_status_change();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Get exception counts by status for an organization
CREATE OR REPLACE FUNCTION get_exception_counts(org_id UUID)
RETURNS TABLE (
  status TEXT,
  count BIGINT,
  critical_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.status,
    COUNT(*)::BIGINT as count,
    COUNT(*) FILTER (WHERE e.severity = 'critical')::BIGINT as critical_count
  FROM exceptions e
  WHERE e.organization_id = org_id
  GROUP BY e.status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get latest system health for all areas
CREATE OR REPLACE FUNCTION get_system_health_summary(org_id UUID)
RETURNS TABLE (
  area TEXT,
  status TEXT,
  total_operations INTEGER,
  failed_operations INTEGER,
  success_rate DECIMAL(5,2),
  last_failure_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ON (sh.area)
    sh.area,
    sh.status,
    sh.total_operations,
    sh.failed_operations,
    CASE
      WHEN sh.total_operations > 0
      THEN ROUND((sh.successful_operations::DECIMAL / sh.total_operations) * 100, 2)
      ELSE 100.00
    END as success_rate,
    sh.last_failure_at
  FROM system_health sh
  WHERE sh.organization_id = org_id
  ORDER BY sh.area, sh.recorded_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SEED DATA (Optional - for testing)
-- ============================================================================

-- This would be run separately if needed for demo purposes
-- INSERT INTO system_health (organization_id, area, status, total_operations, successful_operations, failed_operations)
-- VALUES
--   ('org-id-here', 'agents', 'healthy', 100, 98, 2),
--   ('org-id-here', 'workflows', 'healthy', 50, 50, 0),
--   ('org-id-here', 'integrations', 'degraded', 30, 25, 5);
