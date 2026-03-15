-- Expand GHL provisioning log action types for admin management
ALTER TABLE ghl_provisioning_log DROP CONSTRAINT IF EXISTS ghl_provisioning_log_action_check;
ALTER TABLE ghl_provisioning_log ADD CONSTRAINT ghl_provisioning_log_action_check
  CHECK (action IN (
    'provisioned',
    'snapshot_applied',
    'deprovisioned',
    'error',
    'admin_linked',
    'admin_provisioned',
    'admin_unlinked',
    'admin_deleted'
  ));
