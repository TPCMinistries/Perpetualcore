-- Give an authenticated user a tenant-safe Press workspace on first use.
-- This RPC is service-role only. The application resolves the authenticated
-- user before calling it; user metadata is display-only and never grants access.

CREATE OR REPLACE FUNCTION public.press_ensure_workspace(p_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid := p_user_id;
  v_email text;
  v_full_name text;
  v_requested_org_name text;
  v_org_name text;
  v_org_slug text;
  v_org_id uuid;
  v_role text;
BEGIN
  IF v_user_id IS NULL OR auth.role() IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'Service role required'
      USING ERRCODE = '42501';
  END IF;

  SELECT
    user_row.email,
    NULLIF(btrim(user_row.raw_user_meta_data ->> 'full_name'), ''),
    NULLIF(btrim(user_row.raw_user_meta_data ->> 'organization_name'), '')
  INTO v_email, v_full_name, v_requested_org_name
  FROM auth.users AS user_row
  WHERE user_row.id = v_user_id;

  IF v_email IS NULL THEN
    RAISE EXCEPTION 'Authenticated user record not found'
      USING ERRCODE = '42501';
  END IF;

  -- Existing membership is the only reusable organization authority.
  SELECT member.organization_id
  INTO v_org_id
  FROM public.organization_members AS member
  WHERE member.user_id = v_user_id
    AND (member.status IS NULL OR member.status = 'active')
  ORDER BY member.created_at ASC
  LIMIT 1;

  IF v_org_id IS NOT NULL THEN
    RETURN v_org_id;
  END IF;

  -- Do not trust profiles.organization_id here: users may edit their own profile,
  -- so using that value as an authorization source would permit tenant escalation.
  v_org_name := COALESCE(v_requested_org_name, 'My Press workspace');
  v_org_slug := trim(BOTH '-' FROM regexp_replace(lower(v_org_name), '[^a-z0-9]+', '-', 'g'))
    || '-' || substr(replace(v_user_id::text, '-', ''), 1, 8);

  INSERT INTO public.organizations (name, slug)
  VALUES (v_org_name, v_org_slug)
  ON CONFLICT (slug) DO UPDATE
    SET name = EXCLUDED.name
  RETURNING id INTO v_org_id;

  INSERT INTO public.profiles (id, email, full_name, organization_id)
  VALUES (v_user_id, v_email, v_full_name, v_org_id)
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name),
        organization_id = EXCLUDED.organization_id,
        updated_at = now();

  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Unable to resolve a Press workspace'
      USING ERRCODE = 'P0001';
  END IF;

  SELECT CASE
    WHEN EXISTS (
      SELECT 1
      FROM public.organization_members AS member
      WHERE member.organization_id = v_org_id
        AND member.role IN ('owner', 'admin')
        AND (member.status IS NULL OR member.status = 'active')
    ) THEN 'member'
    ELSE 'owner'
  END
  INTO v_role;

  INSERT INTO public.organization_members (organization_id, user_id, role, status)
  VALUES (v_org_id, v_user_id, v_role, 'active')
  ON CONFLICT (organization_id, user_id) DO UPDATE
    SET status = 'active';

  RETURN v_org_id;
END;
$$;

REVOKE ALL ON FUNCTION public.press_ensure_workspace(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.press_ensure_workspace(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.press_ensure_workspace(uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.press_ensure_workspace(uuid) TO service_role;

COMMENT ON FUNCTION public.press_ensure_workspace(uuid) IS
  'Creates or restores a Press organization membership for a server-authenticated user.';
