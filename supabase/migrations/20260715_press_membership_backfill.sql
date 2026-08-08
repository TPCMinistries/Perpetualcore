-- Press requires explicit organization membership for every tenant-scoped action.
-- Older Perpetual Core accounts stored the relationship only on profiles.
-- Backfill that relationship once without weakening Press authorization checks.

CREATE UNIQUE INDEX IF NOT EXISTS organization_members_org_user_idx
  ON public.organization_members (organization_id, user_id);

INSERT INTO public.organization_members (organization_id, user_id, role, status)
SELECT
  profile.organization_id,
  profile.id,
  CASE
    WHEN COALESCE(profile.is_super_admin, false) OR COALESCE(profile.is_admin, false)
      THEN 'owner'
    WHEN lower(COALESCE(profile.role, profile.user_role, '')) IN ('owner', 'admin')
      THEN lower(COALESCE(profile.role, profile.user_role))
    ELSE 'member'
  END,
  'active'
FROM public.profiles AS profile
WHERE profile.organization_id IS NOT NULL
ON CONFLICT (organization_id, user_id) DO NOTHING;

COMMENT ON INDEX public.organization_members_org_user_idx IS
  'One explicit membership per user and organization; required by Press tenant authorization.';
