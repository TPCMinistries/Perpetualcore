-- Create user_profiles as a view of profiles for backwards compatibility
-- This fixes the inconsistency where some code references user_profiles
-- but the actual table is called profiles

-- Create view
CREATE OR REPLACE VIEW user_profiles AS
SELECT * FROM profiles;

-- Create instead-of triggers to make the view writable
CREATE OR REPLACE FUNCTION user_profiles_insert()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, avatar_url, organization_id, created_at, updated_at)
  VALUES (NEW.id, NEW.email, NEW.full_name, NEW.avatar_url, NEW.organization_id, NEW.created_at, NEW.updated_at);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION user_profiles_update()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET
    email = NEW.email,
    full_name = NEW.full_name,
    avatar_url = NEW.avatar_url,
    organization_id = NEW.organization_id,
    updated_at = NEW.updated_at
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION user_profiles_delete()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM profiles WHERE id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS user_profiles_insert_trigger ON user_profiles;
DROP TRIGGER IF EXISTS user_profiles_update_trigger ON user_profiles;
DROP TRIGGER IF EXISTS user_profiles_delete_trigger ON user_profiles;

-- Create triggers
CREATE TRIGGER user_profiles_insert_trigger
  INSTEAD OF INSERT ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION user_profiles_insert();

CREATE TRIGGER user_profiles_update_trigger
  INSTEAD OF UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION user_profiles_update();

CREATE TRIGGER user_profiles_delete_trigger
  INSTEAD OF DELETE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION user_profiles_delete();

-- Add helpful comment
COMMENT ON VIEW user_profiles IS 'Compatibility view for profiles table. Use profiles table directly in new code.';
