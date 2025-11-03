-- Add cost tracking columns to messages table
-- Run this in your Supabase SQL Editor

-- Step 1: Add columns for tracking usage and costs
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS model_used TEXT,
ADD COLUMN IF NOT EXISTS tokens_used INTEGER,
ADD COLUMN IF NOT EXISTS cost_usd NUMERIC(10, 6),
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- Step 2: Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_messages_cost_usd ON messages(cost_usd) WHERE cost_usd IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- Step 3: Verify the changes
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'messages'
AND column_name IN ('model_used', 'tokens_used', 'cost_usd', 'user_id')
ORDER BY column_name;
