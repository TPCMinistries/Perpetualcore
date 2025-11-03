# Complete Database Setup Guide

## Your Supabase went down 2 days ago - this will rebuild EVERYTHING

## Step 1: Go to Supabase Dashboard

1. Open: https://hgxxxmtfmvguotkowxbu.supabase.co
2. Click **SQL Editor** in the left sidebar

## Step 2: Run the Master Schema

1. Click **New Query** button
2. Copy the ENTIRE contents of `supabase/COMPLETE_MASTER_SCHEMA.sql` (8,030 lines)
3. Paste it into the SQL editor
4. Click **RUN** (bottom right corner)
5. Wait 30-60 seconds for it to complete

## What This Creates

This single file sets up EVERYTHING:

### Core Tables
- ✅ organizations
- ✅ profiles
- ✅ conversations
- ✅ messages
- ✅ documents (with vector embeddings)
- ✅ document_chunks
- ✅ document_folders
- ✅ document_tags
- ✅ document_versions
- ✅ tasks (with AI extraction)
- ✅ usage_logs
- ✅ subscriptions

### AI Features
- ✅ ai_assistants (custom AI personalities)
- ✅ assistant_conversations
- ✅ assistant_messages
- ✅ assistant_role_templates (12 pre-built templates)
- ✅ ai_agents (autonomous agents)
- ✅ agent_activities
- ✅ agent_templates (8 pre-built templates)
- ✅ ai_suggestions
- ✅ workflows
- ✅ workflow_executions
- ✅ workflow_templates
- ✅ scheduled_jobs
- ✅ scheduled_job_executions

### Communication
- ✅ calendar_events
- ✅ calendar_accounts
- ✅ emails
- ✅ email_accounts
- ✅ email_drafts
- ✅ email_templates
- ✅ whatsapp_messages
- ✅ whatsapp_accounts

### Collaboration
- ✅ comments
- ✅ comment_reactions
- ✅ mentions
- ✅ activity_logs
- ✅ presence
- ✅ saved_searches
- ✅ notifications
- ✅ notification_preferences

### Security & Admin
- ✅ audit_logs
- ✅ roles (RBAC)
- ✅ role_permissions
- ✅ user_roles
- ✅ permissions
- ✅ two_factor_auth
- ✅ saml_connections (SSO)
- ✅ api_keys
- ✅ webhooks

### Marketplace & Partners
- ✅ marketplace_listings
- ✅ marketplace_purchases
- ✅ marketplace_reviews
- ✅ partner_accounts
- ✅ partner_referrals
- ✅ partner_commissions

### Functions
- ✅ create_organization_and_profile()
- ✅ search_documents() - Vector similarity search
- ✅ update_updated_at_column() - Auto-timestamp updates

### Extensions
- ✅ uuid-ossp
- ✅ vector (pgvector for embeddings)

### Row Level Security (RLS)
- ✅ All tables have RLS enabled
- ✅ Organization-based multi-tenancy
- ✅ User-scoped data access

## Step 3: Add Vector Search Function (CRITICAL FOR RAG)

1. Click **New Query** in SQL Editor
2. Copy the entire contents of `FIX_RAG_SEARCH.sql` from your Desktop
3. Paste and click **RUN**
4. This creates the `search_document_chunks` function needed for RAG

## Step 4: Enable Storage

1. In Supabase, go to **Storage** in the sidebar
2. Click **New Bucket**
3. Name it: `documents`
4. Set it to **Private**
5. Enable **RLS**
6. Click **Create Bucket**

## Step 5: Verify It Worked

Run this query to check tables were created:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

You should see ~60+ tables.

## Step 6: Test Auth

1. Go to http://localhost:3000/signup
2. Create an account with:
   - Full Name: "Test User"
   - Email: "test@example.com"
   - Password: "Test1234"
   - Organization: "Test Org"
3. Click "Sign up"

**Expected:** Either email confirmation message OR redirect to dashboard

## Step 7: Verify Database

After signup, check Supabase:

1. Go to **Table Editor** > `profiles`
   - Should see your user
2. Go to **Table Editor** > `organizations`
   - Should see "Test Org"
3. Verify `organization_id` is set in your profile

## Troubleshooting

### Error: "relation already exists"
This means some tables already exist. You have 2 options:

**Option A: Drop existing tables (NUCLEAR - loses all data)**
```sql
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
-- Then run COMPLETE_MASTER_SCHEMA.sql again
```

**Option B: Skip errors**
- Supabase will skip tables that already exist
- Check what's missing manually

### Error: "permission denied"
- Make sure you're using the **SQL Editor** (not client libraries)
- Make sure you're logged in as the project owner

### Chat not working
- Verify AI API keys in `.env.local`:
  - ANTHROPIC_API_KEY
  - OPENAI_API_KEY
  - GOOGLE_AI_API_KEY

### RAG not finding documents
- Upload a document first at `/dashboard/documents`
- Embeddings are created automatically
- Try asking: "What documents do I have about X?"

## What Works After This

✅ **Immediate:**
- Signup/Login
- AI Chat (GPT-4, Claude, Gemini)
- RAG (document Q&A)
- Task management
- Custom AI assistants
- Workflows & agents
- Beautiful dashboard

⏳ **Needs API Keys:**
- Gmail integration
- Calendar sync
- WhatsApp
- Stripe billing

## Next Steps

Once database is running:
1. Test signup ✅
2. Test chat ✅
3. Upload a test document ✅
4. Ask chat about the document (RAG test) ✅
5. Then configure integrations if needed

---

**Created:** $(date)
**Schema Version:** Complete (all migrations through 2025-01-27)
**Total Lines:** 8,030
**Total Tables:** ~65
