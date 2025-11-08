# 🔧 FIX RAG VECTOR SEARCH NOW

## The Problem
Your RAG search returns 0 results because the database function has only 4 parameters, but your TypeScript code calls it with 8 parameters.

## The Solution
Apply the migration to update the database function.

---

## Option 1: Run via Supabase Dashboard (EASIEST - 2 minutes)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/hgxxxmtfmvguotkowxbu
2. Click "SQL Editor" in the left sidebar
3. Click "New query"
4. Copy the entire contents of this file:
   ```
   supabase/migrations/20241107_fix_rag_search_function.sql
   ```
5. Paste into the SQL Editor
6. Click "Run" (or press Cmd+Enter)
7. Wait for completion - you should see "✅ SUCCESS: Enhanced RAG search is working!"

---

## Option 2: Run via CLI (if you have supabase CLI installed)

```bash
cd /Users/lorenzodaughtry-chambers/ai-brain/ai-os-platform
supabase db push
```

---

## Option 3: Run via Node Script

```bash
cd /Users/lorenzodaughtry-chambers/ai-brain/ai-os-platform
npm install @supabase/supabase-js  # if not already installed
npx tsx scripts/apply-rag-fix.ts
```

---

## What This Does

1. **Drops old function** - Removes the 4-parameter version
2. **Creates new function** - Adds 8-parameter version with:
   - Context-aware search (personal, team, organization scopes)
   - Conversation context tracking
   - Team spaces support
   - SECURITY DEFINER (bypasses RLS issues)
3. **Fixes RLS policies** - Ensures proper access control
4. **Creates indexes** - Optimizes vector search performance
5. **Tests automatically** - Verifies it works

---

## Verification

After running, test by:

1. Upload a document at: https://perpetualcore.com/dashboard/knowledge
2. Ask AI a question about the document content
3. Check browser console - you should see:
   ```
   🔍 [RAG] RPC call succeeded. Results: 5
   ✅ [RAG] First result: {...}
   ```

---

## If It Still Doesn't Work

Check these:

1. **Documents exist?**
   ```sql
   SELECT COUNT(*) FROM documents WHERE status = 'completed';
   ```

2. **Embeddings generated?**
   ```sql
   SELECT COUNT(*) FROM document_chunks WHERE embedding IS NOT NULL;
   ```

3. **Function exists?**
   ```sql
   SELECT routine_name, security_type
   FROM information_schema.routines
   WHERE routine_name = 'search_document_chunks';
   ```

4. **Test directly:**
   ```sql
   SELECT * FROM search_document_chunks(
     (SELECT embedding FROM document_chunks LIMIT 1),
     (SELECT organization_id FROM documents LIMIT 1),
     (SELECT user_id FROM documents LIMIT 1),
     0.0,
     5,
     'all',
     NULL,
     NULL
   );
   ```

---

## Next Steps After Fix

1. ✅ RAG working - AI can access documents
2. Configure email (RESEND_API_KEY)
3. Add encryption key for 2FA
4. Configure Stripe
5. Update Google OAuth URL
