-- Migration: Add summary fields to documents table
-- Date: 2025-01-24
-- Purpose: Enable AI-generated summaries and document insights

-- Add summary fields to documents table
ALTER TABLE documents ADD COLUMN IF NOT EXISTS summary TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS key_points JSONB;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS document_type TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS summary_generated_at TIMESTAMPTZ;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS summary_tokens_used INTEGER;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS summary_cost_usd DECIMAL(10, 4);

-- Add index for searching by document type
CREATE INDEX IF NOT EXISTS idx_documents_document_type ON documents(document_type);

-- Add index for filtering documents with summaries
CREATE INDEX IF NOT EXISTS idx_documents_has_summary ON documents(summary_generated_at) WHERE summary_generated_at IS NOT NULL;

-- Add comment explaining the columns
COMMENT ON COLUMN documents.summary IS 'AI-generated summary of the document (3-4 sentences)';
COMMENT ON COLUMN documents.key_points IS 'Array of key points extracted from the document';
COMMENT ON COLUMN documents.document_type IS 'Detected document type (e.g., Legal Contract, Research Paper, Email)';
COMMENT ON COLUMN documents.summary_generated_at IS 'Timestamp when the summary was generated';
COMMENT ON COLUMN documents.summary_tokens_used IS 'Number of tokens used to generate the summary';
COMMENT ON COLUMN documents.summary_cost_usd IS 'Estimated cost in USD for generating the summary';
