-- Migration to add status and error_message columns to documents table

ALTER TABLE documents
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'completed'
CHECK (status IN ('processing', 'completed', 'failed'));

ALTER TABLE documents
ADD COLUMN IF NOT EXISTS error_message TEXT;

-- Update existing documents to have completed status
UPDATE documents SET status = 'completed' WHERE status IS NULL;
