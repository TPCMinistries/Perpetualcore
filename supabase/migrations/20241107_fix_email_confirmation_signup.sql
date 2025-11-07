-- Function to handle new user signup (called after email confirmation)
CREATE OR REPLACE FUNCTION handle_new_user_signup()
RETURNS TRIGGER AS $$
DECLARE
  v_beta_code TEXT;
  v_organization_name TEXT;
  v_beta_tier TEXT;
  v_full_name TEXT;
  v_organization_id UUID;
  v_beta_code_record RECORD;
  v_org_slug TEXT;
BEGIN
  -- Extract metadata from user
  v_full_name := NEW.raw_user_meta_data->>'full_name';
  v_beta_code := NEW.raw_user_meta_data->>'beta_code';
  v_organization_name := NEW.raw_user_meta_data->>'organization_name';
  v_beta_tier := NEW.raw_user_meta_data->>'beta_tier';

  RAISE LOG 'Processing new user: %, beta_code: %, org_name: %, beta_tier: %',
    NEW.email, v_beta_code, v_organization_name, v_beta_tier;

  -- Handle beta user signup
  IF v_beta_tier IS NOT NULL THEN
    -- Find admin organization
    SELECT id INTO v_organization_id
    FROM organizations
    ORDER BY created_at ASC
    LIMIT 1;

    RAISE LOG 'Beta user - using org: %', v_organization_id;

    -- Create profile for beta tester
    INSERT INTO profiles (
      id,
      email,
      full_name,
      organization_id,
      beta_tester,
      beta_tier
    ) VALUES (
      NEW.id,
      NEW.email,
      v_full_name,
      v_organization_id,
      true,
      v_beta_tier
    );

    -- Handle beta code redemption if code was provided
    IF v_beta_code IS NOT NULL AND v_beta_code != '' THEN
      -- Get the beta code record
      SELECT * INTO v_beta_code_record
      FROM beta_invite_codes
      WHERE code = UPPER(v_beta_code);

      IF FOUND THEN
        -- Record redemption
        INSERT INTO code_redemptions (code_id, user_id)
        VALUES (v_beta_code_record.id, NEW.id);

        -- Increment uses count
        UPDATE beta_invite_codes
        SET uses_count = uses_count + 1
        WHERE id = v_beta_code_record.id;

        RAISE LOG 'Beta code redeemed: %', v_beta_code;
      END IF;
    END IF;

  -- Handle regular user signup
  ELSIF v_organization_name IS NOT NULL AND v_organization_name != '' THEN
    -- Create organization slug
    v_org_slug := regexp_replace(lower(v_organization_name), '[^a-z0-9]+', '-', 'g') || '-' || extract(epoch from now())::bigint;

    RAISE LOG 'Regular user - creating org: % with slug: %', v_organization_name, v_org_slug;

    -- Use the existing RPC function to create org and profile
    SELECT create_organization_and_profile(
      NEW.id,
      NEW.email,
      v_organization_name,
      v_org_slug
    ) INTO v_organization_id;

    -- Update profile with full name
    UPDATE profiles
    SET full_name = v_full_name
    WHERE id = NEW.id;

    RAISE LOG 'Organization created: %', v_organization_id;
  ELSE
    RAISE LOG 'No beta code or org name - skipping profile creation';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger that fires after user is created and confirmed
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  WHEN (NEW.email_confirmed_at IS NOT NULL OR NEW.phone_confirmed_at IS NOT NULL)
  EXECUTE FUNCTION handle_new_user_signup();

-- Also create trigger for when email gets confirmed later
CREATE OR REPLACE FUNCTION handle_email_confirmation()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process if email was just confirmed
  IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
    -- Check if profile already exists
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = NEW.id) THEN
      -- Call the signup handler
      PERFORM handle_new_user_signup_internal(NEW);
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function for update trigger
CREATE OR REPLACE FUNCTION handle_new_user_signup_internal(user_record auth.users)
RETURNS VOID AS $$
DECLARE
  v_beta_code TEXT;
  v_organization_name TEXT;
  v_beta_tier TEXT;
  v_full_name TEXT;
  v_organization_id UUID;
  v_beta_code_record RECORD;
  v_org_slug TEXT;
BEGIN
  -- Extract metadata from user
  v_full_name := user_record.raw_user_meta_data->>'full_name';
  v_beta_code := user_record.raw_user_meta_data->>'beta_code';
  v_organization_name := user_record.raw_user_meta_data->>'organization_name';
  v_beta_tier := user_record.raw_user_meta_data->>'beta_tier';

  RAISE LOG 'Processing confirmed user: %, beta_tier: %', user_record.email, v_beta_tier;

  -- Handle beta user signup
  IF v_beta_tier IS NOT NULL THEN
    -- Find admin organization
    SELECT id INTO v_organization_id
    FROM organizations
    ORDER BY created_at ASC
    LIMIT 1;

    -- Create profile for beta tester
    INSERT INTO profiles (
      id,
      email,
      full_name,
      organization_id,
      beta_tester,
      beta_tier
    ) VALUES (
      user_record.id,
      user_record.email,
      v_full_name,
      v_organization_id,
      true,
      v_beta_tier
    );

    -- Handle beta code redemption if code was provided
    IF v_beta_code IS NOT NULL AND v_beta_code != '' THEN
      SELECT * INTO v_beta_code_record
      FROM beta_invite_codes
      WHERE code = UPPER(v_beta_code);

      IF FOUND THEN
        INSERT INTO code_redemptions (code_id, user_id)
        VALUES (v_beta_code_record.id, user_record.id);

        UPDATE beta_invite_codes
        SET uses_count = uses_count + 1
        WHERE id = v_beta_code_record.id;
      END IF;
    END IF;

  ELSIF v_organization_name IS NOT NULL AND v_organization_name != '' THEN
    v_org_slug := regexp_replace(lower(v_organization_name), '[^a-z0-9]+', '-', 'g') || '-' || extract(epoch from now())::bigint;

    SELECT create_organization_and_profile(
      user_record.id,
      user_record.email,
      v_organization_name,
      v_org_slug
    ) INTO v_organization_id;

    UPDATE profiles
    SET full_name = v_full_name
    WHERE id = user_record.id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing update trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;

-- Create trigger for email confirmation updates
CREATE TRIGGER on_auth_user_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_email_confirmation();
