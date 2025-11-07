# 🔧 Fix RAG Vector Search - Step by Step

## Problem Identified ✅

The RAG code is calling `search_document_chunks()` with 8 parameters, but the function may not be properly deployed in Supabase, or it has complex access control logic that's failing silently.

## Solution: Deploy Simplified Search Function

### Step 1: Open Supabase Dashboard

1. Go to: https://supabase.com/dashboard
2. Select your project (hgxxxmtfmvguotkowxbu)
3. Click on **SQL Editor** in the left sidebar

### Step 2: Deploy the Fixed Function

1. In Supabase SQL Editor, click **New Query**
2. Copy the ENTIRE contents of this file:
   ```
   /Users/lorenzodaughtry-chambers/ai-brain/ai-os-platform/supabase/FIX_RAG_SEARCH_SIMPLE.sql
   ```
3. Paste into the SQL Editor
4. Click **Run** (or press Cmd+Enter)
5. You should see: "Success. No rows returned"

### Step 3: Test the Function

1. Click **New Query** again
2. Copy the ENTIRE contents of this file:
   ```
   /Users/lorenzodaughtry-chambers/ai-brain/ai-os-platform/supabase/TEST_RAG_SIMPLE.sql
   ```
3. Paste into the SQL Editor
4. Click **Run**
5. Check the results:
   - **Step 3**: Should show `chunks_with_embeddings > 0` and `embedding_dimensions = 1536`
   - **Step 6**: Should show at least 1 search result with `similarity` close to 1.0

### Step 4: Test in Chat Interface

1. Make sure your dev server is running:
   ```bash
   cd ~/ai-brain/ai-os-platform
   npm run dev
   ```

2. Open http://localhost:3000/dashboard/chat

3. Upload a document (if you haven't already)

4. Ask a question about the document

5. Check the terminal logs for:
   ```
   ✅ [RAG] RPC call succeeded. Results: 1 (or more)
   ✅ [RAG] First result: ...
   ```

## What Was Fixed

### Before:
- Function signature mismatched between code and database
- Complex access control logic with knowledge_spaces and document_access tables
- Possible RLS conflicts

### After:
- Function signature matches code perfectly (8 parameters)
- Simplified access control (just checks organization_id)
- Returns same structure expected by code
- Uses `SECURITY DEFINER` to bypass RLS issues

## If It Still Doesn't Work

### Check these logs in terminal:
```
🔍 [RAG] Generating embedding for query: ...
🔍 [RAG] Embedding generated. Length: 1536 dimensions
🔍 [RAG] Calling enhanced search_document_chunks with params:
✅ [RAG] RPC call succeeded. Results: X
```

### If you see "Results: 0":
1. Verify documents are uploaded and have status='completed'
2. Run the diagnostic SQL again (TEST_RAG_SIMPLE.sql)
3. Check for any error messages in the Supabase logs

### If you see an error:
1. Copy the exact error message
2. Check if the function was created (look for the function in Supabase Database → Functions)
3. Make sure pgvector extension is enabled (Database → Extensions)

## Quick Reference

**Supabase Dashboard:** https://supabase.com/dashboard
**SQL Files Location:** `~/ai-brain/ai-os-platform/supabase/`
**Key Files:**
- `FIX_RAG_SEARCH_SIMPLE.sql` - The fix (run this first)
- `TEST_RAG_SIMPLE.sql` - The test (run this second)

## Next Steps After Fix

Once RAG is working, the next priorities are:
1. ✅ Test all 8 AI assistants
2. 📦 Complete marketplace file uploads (S3/Cloudinary)
3. 👨‍💼 Build admin approval panels
4. 📧 Integrate email notifications (SendGrid/Resend)
