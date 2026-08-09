-- The service-role-only workspace RPC must read auth.users while onboarding a
-- newly invited Press user. SECURITY INVOKER cannot read that protected schema
-- through PostgREST, even when auth.role() is service_role.

ALTER FUNCTION public.press_ensure_workspace(uuid) SECURITY DEFINER;
ALTER FUNCTION public.press_ensure_workspace(uuid) SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION public.press_ensure_workspace(uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.press_ensure_workspace(uuid) TO service_role;

COMMENT ON FUNCTION public.press_ensure_workspace(uuid) IS
  'Service-role-only onboarding that creates or restores a Press organization membership.';
