-- Seed: Initial email provider config for upliftcommunities.com
-- Run this after applying the email_provider_configs migration
--
-- This inserts the default email configuration for the Uplift Communities organization
-- Using system Resend API key (from env vars) so no api_key_encrypted needed

-- First, find the organization ID for Uplift Communities
-- Option 1: If you know the organization name
INSERT INTO email_provider_configs (
  organization_id,
  provider,
  sending_domain,
  is_domain_verified,
  default_from_email,
  default_from_name,
  default_reply_to,
  email_signature_html,
  email_footer_html,
  primary_color,
  track_opens,
  track_clicks,
  daily_send_limit,
  is_active,
  is_primary
)
SELECT
  o.id as organization_id,
  'resend' as provider,
  'upliftcommunities.com' as sending_domain,
  true as is_domain_verified,
  'lorenzo@upliftcommunities.com' as default_from_email,
  'Lorenzo Daughtry-Chambers' as default_from_name,
  'lorenzo@upliftcommunities.com' as default_reply_to,
  '<div style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif;">
    <p style="margin: 0; color: #374151;"><strong>Lorenzo Daughtry-Chambers</strong></p>
    <p style="margin: 4px 0 0 0; color: #6b7280; font-size: 14px;">Uplift Communities</p>
  </div>' as email_signature_html,
  '<p style="color: #9ca3af; font-size: 12px; text-align: center;">
    Sent with ❤️ from Uplift Communities<br/>
    <a href="https://upliftcommunities.com" style="color: #6b7280;">upliftcommunities.com</a>
  </p>' as email_footer_html,
  '#3b82f6' as primary_color,
  true as track_opens,
  true as track_clicks,
  500 as daily_send_limit,
  true as is_active,
  true as is_primary
FROM organizations o
WHERE o.name ILIKE '%uplift%'
LIMIT 1
ON CONFLICT (organization_id, sending_domain)
DO UPDATE SET
  default_from_email = EXCLUDED.default_from_email,
  default_from_name = EXCLUDED.default_from_name,
  updated_at = NOW();

-- Alternative: Insert using a specific organization_id (uncomment and replace UUID)
-- INSERT INTO email_provider_configs (
--   organization_id,
--   provider,
--   sending_domain,
--   is_domain_verified,
--   default_from_email,
--   default_from_name,
--   is_active
-- ) VALUES (
--   'YOUR-ORGANIZATION-UUID-HERE',
--   'resend',
--   'upliftcommunities.com',
--   true,
--   'lorenzo@upliftcommunities.com',
--   'Lorenzo Daughtry-Chambers',
--   true
-- );
