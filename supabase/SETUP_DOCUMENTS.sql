-- =====================================================
-- COMPLETE DOCUMENTS/RAG SETUP FOR SUPABASE
-- Run this entire script in Supabase SQL Editor
-- =====================================================

-- 1. Add missing columns to documents table
-- =====================================================
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS file_size INTEGER;

ALTER TABLE documents
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'completed'
CHECK (status IN ('processing', 'completed', 'failed'));

ALTER TABLE documents
ADD COLUMN IF NOT EXISTS error_message TEXT;

ALTER TABLE documents
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Update existing documents
UPDATE documents SET status = 'completed' WHERE status IS NULL;

-- 2. Create documents storage bucket
-- =====================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- 3. Set up storage policies for documents bucket
-- =====================================================

-- Allow users to upload to their own folder
CREATE POLICY "Users can upload documents" ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to read their own documents
CREATE POLICY "Users can read documents" ON storage.objects
FOR SELECT
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own documents
CREATE POLICY "Users can delete documents" ON storage.objects
FOR DELETE
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. Verify setup
-- =====================================================
-- Check if columns exist
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'documents'
AND column_name IN ('file_size', 'status', 'error_message');

-- Check if storage bucket exists
SELECT * FROM storage.buckets WHERE id = 'documents';

-- =====================================================
-- SETUP COMPLETE!
-- =====================================================
