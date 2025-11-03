# Database Migrations

## How to Apply Migrations

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase project: https://hgxxxmtfmvguotkowxbu.supabase.co
2. Navigate to **SQL Editor**
3. Copy the contents of `20250124_add_document_summary_fields.sql`
4. Paste into the SQL Editor
5. Click **Run**

### Option 2: Command Line (if you have Supabase CLI)

```bash
supabase db push
```

## Pending Migrations

- ✅ `20250124_add_document_summary_fields.sql` - Adds AI summary fields to documents table

## What This Migration Does

Adds the following fields to the `documents` table:
- `summary` (TEXT) - AI-generated 3-4 sentence summary
- `key_points` (JSONB) - Array of extracted key points
- `document_type` (TEXT) - Detected document type (e.g., "Legal Contract", "Research Paper")
- `summary_generated_at` (TIMESTAMPTZ) - When the summary was created
- `summary_tokens_used` (INTEGER) - Number of tokens used
- `summary_cost_usd` (DECIMAL) - Estimated cost in USD

This enables on-demand AI summarization of uploaded documents!
