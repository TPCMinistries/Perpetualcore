-- Add RPC used by middleware to evaluate organization IP allowlists.
-- Returns true when the supplied IP is contained in any enabled CIDR rule.

CREATE OR REPLACE FUNCTION public.check_ip_whitelist(check_ip text, org_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.ip_whitelist AS iw
    WHERE iw.organization_id = org_id
      AND iw.enabled = true
  ) THEN
    RETURN true;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.ip_whitelist AS iw
    WHERE iw.organization_id = org_id
      AND iw.enabled = true
      AND check_ip::inet <<= iw.ip_range
  );
EXCEPTION
  WHEN invalid_text_representation THEN
    RETURN false;
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_ip_whitelist(text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_ip_whitelist(text, uuid) TO service_role;
