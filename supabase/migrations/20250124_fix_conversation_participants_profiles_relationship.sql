-- Fix the relationship between conversation_participants and profiles
-- Change the foreign key from auth.users to profiles

-- Drop the existing foreign key constraint
ALTER TABLE conversation_participants
DROP CONSTRAINT IF EXISTS conversation_participants_user_id_fkey;

-- Add new foreign key constraint to profiles instead of auth.users
ALTER TABLE conversation_participants
ADD CONSTRAINT conversation_participants_user_id_fkey
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Do the same for conversation_messages
ALTER TABLE conversation_messages
DROP CONSTRAINT IF EXISTS conversation_messages_user_id_fkey;

ALTER TABLE conversation_messages
ADD CONSTRAINT conversation_messages_user_id_fkey
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL;

COMMENT ON CONSTRAINT conversation_participants_user_id_fkey ON conversation_participants
IS 'Links participants to user profiles for easy querying';

COMMENT ON CONSTRAINT conversation_messages_user_id_fkey ON conversation_messages
IS 'Links messages to user profiles for easy querying';
