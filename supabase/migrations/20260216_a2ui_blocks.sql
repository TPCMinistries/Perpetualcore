-- A2UI Blocks: Add blocks column to messages table for inline rich UI components
-- Phase 1 of OpenClaw Competitive Upgrade

ALTER TABLE messages ADD COLUMN IF NOT EXISTS blocks JSONB DEFAULT NULL;

-- Index for efficiently finding messages with A2UI blocks in a conversation
CREATE INDEX IF NOT EXISTS idx_messages_has_blocks
  ON messages(conversation_id)
  WHERE blocks IS NOT NULL;

-- Comment for documentation
COMMENT ON COLUMN messages.blocks IS 'A2UI block data (charts, tables, forms, cards, etc.) rendered inline in chat';
