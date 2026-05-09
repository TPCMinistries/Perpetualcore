-- =============================================================================
-- rfp_org_invites: invite a user (by email) to an rfp_orgs tenant with a role
-- Plan 04-04 — ORG-02 (second half of FOUND-02)
-- =============================================================================

CREATE TABLE rfp_org_invites (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid        NOT NULL REFERENCES rfp_orgs(id) ON DELETE CASCADE,
  email       text        NOT NULL,
  role        text        NOT NULL CHECK (role IN ('owner','writer','reviewer','viewer')),
  token       text        UNIQUE NOT NULL,
  invited_by  uuid        REFERENCES auth.users(id),
  status      text        DEFAULT 'pending' CHECK (status IN ('pending','accepted','expired','revoked')),
  expires_at  timestamptz NOT NULL,
  message     text,
  created_at  timestamptz DEFAULT now(),
  accepted_at timestamptz
);

-- Prevent two PENDING invites for the same email/org combo (case-insensitive)
CREATE UNIQUE INDEX idx_rfp_org_invites_pending_unique
  ON rfp_org_invites (org_id, lower(email))
  WHERE status = 'pending';

CREATE INDEX idx_rfp_org_invites_token ON rfp_org_invites (token);
CREATE INDEX idx_rfp_org_invites_email ON rfp_org_invites (lower(email));
CREATE INDEX idx_rfp_org_invites_org   ON rfp_org_invites (org_id);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE rfp_org_invites ENABLE ROW LEVEL SECURITY;

-- Owners of the org can manage all invites for it (create, read, revoke)
-- Uses rfp_my_owned_org_ids() SECURITY DEFINER helper from Plan 04-01 migration
-- to avoid self-referential recursion on rfp_user_orgs.
CREATE POLICY rfp_org_invites_owner_all ON rfp_org_invites
  FOR ALL
  USING   (org_id = ANY(rfp_my_owned_org_ids()))
  WITH CHECK (org_id = ANY(rfp_my_owned_org_ids()));

-- An authenticated invitee can read their own pending invite.
-- The validate endpoint uses the admin client (token-based lookup, no auth required);
-- this policy supports the accept flow where the user is already logged in.
CREATE POLICY rfp_org_invites_invitee_read ON rfp_org_invites
  FOR SELECT
  USING (
    status = 'pending'
    AND lower(email) = lower(coalesce(
      (SELECT au.email FROM auth.users au WHERE au.id = auth.uid()),
      ''
    ))
  );

-- =============================================================================
-- AUTO-ACCEPT TRIGGER
-- Fires on INSERT into auth.users; bulk-accepts all pending invites for that email.
-- Mirrors the salvage `handle_new_user_invites` pattern, adapted to rfp_* tables.
--
-- SECURITY DEFINER: necessary because the function runs in the context of the
-- newly-created user (who has zero privileges at signup time).
-- SET search_path = public: prevents the standard SECURITY DEFINER search_path
-- hijack attack vector.
-- =============================================================================

CREATE OR REPLACE FUNCTION rfp_handle_new_user_invites()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT id, org_id, role
    FROM   rfp_org_invites
    WHERE  lower(email) = lower(NEW.email)
      AND  status       = 'pending'
      AND  expires_at   > now()
  LOOP
    -- Insert membership; skip if user is already a member (e.g., re-invite edge case)
    INSERT INTO rfp_user_orgs (user_id, org_id, role)
    VALUES (NEW.id, rec.org_id, rec.role)
    ON CONFLICT (user_id, org_id) DO NOTHING;

    -- Mark invite accepted
    UPDATE rfp_org_invites
    SET    status      = 'accepted',
           accepted_at = now()
    WHERE  id = rec.id;
  END LOOP;

  RETURN NEW;
END;
$$;

-- Guard against duplicate trigger if migration is re-run
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'rfp_on_auth_user_created'
  ) THEN
    CREATE TRIGGER rfp_on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION rfp_handle_new_user_invites();
  END IF;
END $$;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE rfp_org_invites IS
  'Single-use token invites for org collaborators. Token is returned in the POST response body; email delivery deferred to Phase 5.';

COMMENT ON FUNCTION rfp_handle_new_user_invites IS
  'Auto-accepts pending rfp_org_invites when a new user signs up with a matching email. SECURITY DEFINER with fixed search_path to prevent hijack.';
