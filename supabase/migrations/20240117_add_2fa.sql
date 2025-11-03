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
