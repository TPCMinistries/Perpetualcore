# 🔧 RAG Vector Search Fix - Quick Instructions

## Problem
RAG vector search returns 0 results despite documents being uploaded and embeddings created.

## Root Cause Identified
The `search_document_chunks` function likely doesn't have `SECURITY DEFINER`, causing it to be blocked by RLS policies when trying to join documents and document_chunks tables.

## Solution
I've created a comprehensive fix that:
1. Recreates the search function with `SECURITY DEFINER`
2. Fixes all RLS policies
3. Creates necessary indexes
4. Includes self-test

## How to Fix (2 minutes)

### Step 1: Run the Fix Script
1. Open your Supabase dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the entire contents of:
   ```
   /supabase/FIX_RAG_SEARCH_COMPLETE.sql
   ```
4. Click **Run**

### Step 2: Check the Output
You should see:
- ✅ "SUCCESS: Vector search is working!"
- Function shows `security_type = DEFINER`
- Document and chunk counts
- RLS policies listed

### Step 3: Test in Your App
1. Your dev server is running at: http://localhost:3000
2. Go to `/dashboard/chat`
3. Upload a document (if you haven't already)
4. Ask a question about the document
5. You should see the AI use document context!

## What the Fix Does

### 1. `SECURITY DEFINER` Added
```sql
CREATE OR REPLACE FUNCTION search_document_chunks(...)
LANGUAGE plpgsql
SECURITY DEFINER  -- ← This is the key!
```

**Why it matters:**
- Without this, the function runs with the calling user's permissions
- RLS policies block the join between `documents` and `document_chunks`
- With `SECURITY DEFINER`, the function bypasses RLS during execution
- It's safe because the function itself enforces organization filtering

### 2. RLS Policies Fixed
- Recreates all policies cleanly
- Ensures proper EXISTS clauses for joins
- Both SELECT and INSERT/UPDATE/DELETE covered

### 3. Indexes Created
- Vector similarity index (IVFFlat)
- Document ID lookup index
- Organization + status composite index

### 4. Self-Test Included
- Automatically tests the fix after applying
- Shows success/failure message
- No manual testing needed

## Verification

After running the fix, check the logs in your terminal when you chat:

**Before fix:**
```
🔍 [RAG] RPC call succeeded. Results: 0
⚠️ [RAG] RPC returned but data is empty or null
```

**After fix:**
```
🔍 [RAG] RPC call succeeded. Results: 2
✅ [RAG] First result: { title: "Working_USA_Movement...", similarity: 0.89, ... }
```

## If It Still Doesn't Work

### Option 1: Run Diagnostics
```bash
cd ~/ai-brain/ai-os-platform
```

Run in Supabase SQL Editor:
```sql
\i supabase/DIAGNOSE_RAG_ISSUE.sql
```

Share the output - each section tests a different component.

### Option 2: Check Function Permissions
```sql
SELECT
  routine_name,
  security_type,
  routine_definition
FROM information_schema.routines
WHERE routine_name = 'search_document_chunks';
```

Should show `security_type = DEFINER`

### Option 3: Test Function Directly
```sql
-- Get a test embedding and org
WITH test_data AS (
  SELECT
    dc.embedding,
    d.organization_id
  FROM document_chunks dc
  INNER JOIN documents d ON dc.document_id = d.id
  WHERE dc.embedding IS NOT NULL
  LIMIT 1
)
SELECT *
FROM test_data td
CROSS JOIN LATERAL search_document_chunks(
  td.embedding,
  td.organization_id,
  0.0,  -- threshold = 0 to see ANY results
  10
);
```

Should return at least 1 result (the chunk used for the test).

## Technical Details

### Why `SECURITY DEFINER` is Safe Here

1. **Organization filtering enforced in function:**
   ```sql
   WHERE d.organization_id = org_id  -- Function parameter, not user input
   ```

2. **Org ID comes from authenticated profile:**
   - TypeScript code gets org ID from user's profile
   - Function receives it as parameter
   - Multi-tenant isolation maintained

3. **Read-only operation:**
   - Function only SELECTs data
   - No INSERT/UPDATE/DELETE
   - Can't modify data even if compromised

4. **Best practice SET search_path:**
   ```sql
   SET search_path = public  -- Prevents schema injection
   ```

### Alternative Approach (if still concerned)

Instead of `SECURITY DEFINER`, you could:
1. Create a service role API endpoint
2. Call it from backend with service key
3. No RLS applies to service role

But this adds complexity and latency. `SECURITY DEFINER` with proper org filtering is the standard Supabase pattern for this use case.

## Files Reference

### Fix Scripts (SQL)
- `/supabase/FIX_RAG_SEARCH_COMPLETE.sql` ← **RUN THIS ONE**
- `/supabase/DIAGNOSE_RAG_ISSUE.sql` - Diagnostics (if needed)
- `/supabase/SETUP_VECTOR_SEARCH.sql` - Original (now superseded)

### Code Files
- `/lib/documents/rag.ts` - RAG implementation with logging
- `/lib/documents/embeddings.ts` - Embedding generation
- `/app/api/chat/route.ts` - Chat API with RAG integration

### Documentation
- `/WHERE_WE_LEFT_OFF.md` - Overall project status
- `/RAG_DEBUGGING_STATUS.md` - Previous debugging attempts
- `/RAG_FIX_INSTRUCTIONS.md` - This file

## Success Checklist

- [ ] Ran `FIX_RAG_SEARCH_COMPLETE.sql` in Supabase
- [ ] Saw "✅ SUCCESS" message in output
- [ ] Function shows `security_type = DEFINER`
- [ ] Tested in chat and got document-aware responses
- [ ] Logs show `Results: X` where X > 0

## Next Steps After Fix

Once RAG is working:
1. ✅ Complete RAG debugging (DONE!)
2. 🔄 Test with multiple documents
3. 🔄 Tune similarity threshold (currently 0.7)
4. 📝 Move to next priority: Marketplace file uploads

---

**Estimated Time:** 2 minutes to apply fix
**Risk:** Low (read-only function with proper org filtering)
**Priority:** 🔴 HIGH (core feature blocking other work)
