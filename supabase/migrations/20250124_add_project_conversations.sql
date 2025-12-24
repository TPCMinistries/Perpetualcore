-- Add project_id to shared_conversations for project-scoped chats
ALTER TABLE shared_conversations
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL;

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_conversations_project ON shared_conversations(project_id);

-- Add comment
COMMENT ON COLUMN shared_conversations.project_id IS 'Optional project association for project-scoped conversations';
