-- Add scopes column to api_keys table for granular permission control
ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS scopes TEXT[] DEFAULT ARRAY['chat:write', 'search:read', 'documents:read', 'documents:write'];

-- Create or replace validate_api_key function
CREATE OR REPLACE FUNCTION validate_api_key(p_key_hash TEXT)
RETURNS TABLE (
  is_valid BOOLEAN,
  api_key_id UUID,
  organization_id UUID,
  user_id UUID,
  scopes TEXT[],
  rate_limit_per_minute INTEGER,
  error_message TEXT
) AS $$
DECLARE
  v_key RECORD;
BEGIN
  -- Look up the key
  SELECT k.* INTO v_key
  FROM api_keys k
  WHERE k.key_hash = p_key_hash;

  -- Key not found
  IF v_key IS NULL THEN
    RETURN QUERY SELECT
      FALSE::BOOLEAN,
      NULL::UUID,
      NULL::UUID,
      NULL::UUID,
      NULL::TEXT[],
      NULL::INTEGER,
      'API key not found'::TEXT;
    RETURN;
  END IF;

  -- Key revoked
  IF v_key.status = 'revoked' THEN
    RETURN QUERY SELECT
      FALSE::BOOLEAN,
      v_key.id,
      v_key.organization_id,
      v_key.user_id,
      NULL::TEXT[],
      NULL::INTEGER,
      'API key has been revoked'::TEXT;
    RETURN;
  END IF;

  -- Key expired
  IF v_key.expires_at IS NOT NULL AND v_key.expires_at < NOW() THEN
    RETURN QUERY SELECT
      FALSE::BOOLEAN,
      v_key.id,
      v_key.organization_id,
      v_key.user_id,
      NULL::TEXT[],
      NULL::INTEGER,
      'API key has expired'::TEXT;
    RETURN;
  END IF;

  -- Key is valid - update last_used_at
  UPDATE api_keys SET last_used_at = NOW() WHERE id = v_key.id;

  -- Return valid result
  RETURN QUERY SELECT
    TRUE::BOOLEAN,
    v_key.id,
    v_key.organization_id,
    v_key.user_id,
    COALESCE(v_key.scopes, ARRAY['chat:write', 'search:read', 'documents:read', 'documents:write'])::TEXT[],
    v_key.rate_limit_per_minute,
    NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION validate_api_key(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION validate_api_key(TEXT) TO anon;

-- Function to log API usage
CREATE OR REPLACE FUNCTION log_api_usage(
  p_api_key_id UUID,
  p_org_id UUID,
  p_endpoint TEXT,
  p_method TEXT,
  p_status INTEGER,
  p_response_time_ms INTEGER,
  p_tokens_used INTEGER DEFAULT 0,
  p_cost_usd DECIMAL DEFAULT 0,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_request_id TEXT DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Get user_id from api_key
  SELECT user_id INTO v_user_id FROM api_keys WHERE id = p_api_key_id;

  -- Insert usage record
  INSERT INTO api_usage (
    api_key_id,
    user_id,
    organization_id,
    endpoint,
    method,
    status_code,
    response_time_ms,
    total_tokens,
    cost_usd,
    ip_address,
    user_agent,
    request_metadata
  ) VALUES (
    p_api_key_id,
    v_user_id,
    p_org_id,
    p_endpoint,
    p_method,
    p_status,
    p_response_time_ms,
    p_tokens_used,
    p_cost_usd,
    p_ip_address::INET,
    p_user_agent,
    CASE WHEN p_request_id IS NOT NULL
      THEN jsonb_build_object('request_id', p_request_id)
      ELSE '{}'::jsonb
    END
  );

  -- Update total requests on api_key
  UPDATE api_keys
  SET total_requests = total_requests + 1
  WHERE id = p_api_key_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION log_api_usage(UUID, UUID, TEXT, TEXT, INTEGER, INTEGER, INTEGER, DECIMAL, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION log_api_usage(UUID, UUID, TEXT, TEXT, INTEGER, INTEGER, INTEGER, DECIMAL, TEXT, TEXT, TEXT) TO anon;
