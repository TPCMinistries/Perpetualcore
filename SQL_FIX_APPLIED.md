# ✅ Intelligence Schema SQL - Fixed!

## Problem
The SQL was trying to create RLS policies that already existed, causing this error:
```
ERROR: 42710: policy "Users can view insights in their organization" for table "ai_insights" already exists
```

## Solution
I've updated the SQL to check if policies exist before creating them. Now it's safe to run even if some policies already exist.

## Updated File
**New file on Desktop:** `INTELLIGENCE_SCHEMA_FIXED.sql`

This version:
- ✅ Checks if policies exist before creating
- ✅ Safe to run multiple times
- ✅ Won't error if policies already exist
- ✅ Will create missing policies

## How to Use

1. **In Supabase SQL Editor:**
   - Open the file `INTELLIGENCE_SCHEMA_FIXED.sql` from Desktop
   - Copy the entire contents
   - Paste into SQL Editor
   - Click "Run"

2. **Or use the updated file in project:**
   - The file in `supabase/INTELLIGENCE_SCHEMA.sql` has been updated
   - You can use either version

## What Changed

All `CREATE POLICY` statements are now wrapped in `DO $$ ... END $$` blocks that check if the policy exists first:

```sql
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'ai_insights'
    AND policyname = 'Users can view insights in their organization'
  ) THEN
    CREATE POLICY "Users can view insights in their organization"
      ...
  END IF;
END $$;
```

This makes the SQL idempotent (safe to run multiple times).

---

**Try running the fixed version now! It should work without errors.** ✅



