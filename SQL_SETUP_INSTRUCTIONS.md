# 📋 SQL Setup Instructions - Run Both Files

## ✅ You Need to Run 2 SQL Files

### 1. Intelligence Schema (Run First)
**File:** `~/Desktop/INTELLIGENCE_SCHEMA.sql`  
**Size:** ~16KB  
**What it does:**
- Creates 6 intelligence tables:
  - `ai_insights` - Stores learned insights
  - `user_preferences` - Learned user preferences
  - `knowledge_graph` - Concept relationships
  - `recognized_patterns` - Recurring patterns
  - `predictive_suggestions` - AI-generated suggestions
  - `learning_events` - Tracks what AI learns from
- Sets up RLS policies
- Creates indexes for performance
- Adds helper functions

**Why:** Enables the intelligence system to learn and adapt

---

### 2. RAG Fix (Run Second)
**File:** `~/Desktop/FIX_RAG_VECTOR_SEARCH.sql`  
**Size:** ~7.2KB  
**What it does:**
- Fixes the vector search function (parameter mismatch)
- Updates RLS policies for document_chunks
- Creates performance indexes
- Tests the function automatically

**Why:** Fixes document search so RAG works

---

## 🚀 How to Run

### Step 1: Intelligence Schema
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Click "New query" or open existing
4. Copy contents of `INTELLIGENCE_SCHEMA.sql` from Desktop
5. Paste into editor
6. Click "Run" (Cmd+Enter)
7. Wait for success ✅

### Step 2: RAG Fix
1. In same SQL Editor (or new query)
2. Copy contents of `FIX_RAG_VECTOR_SEARCH.sql` from Desktop
3. Paste into editor
4. Click "Run" (Cmd+Enter)
5. Wait for success ✅

---

## ✅ After Running Both

### Test Intelligence System:
1. Have a conversation in chat
2. Go to `/dashboard/intelligence`
3. You should see:
   - Insights being extracted
   - Patterns recognized
   - Preferences learned
   - Suggestions generated

### Test RAG:
1. Upload a document
2. Ask AI about the document
3. AI should use document context in response

---

## ⚠️ Important Notes

- **Run Intelligence Schema FIRST** - Creates the tables
- **Then run RAG Fix** - Fixes the search function
- Both are safe to run multiple times (uses IF NOT EXISTS)
- No data will be lost
- Takes 2-3 minutes total

---

## 🎯 What Happens After

**Intelligence System:**
- ✅ Starts learning from conversations
- ✅ Extracts insights automatically
- ✅ Recognizes patterns
- ✅ Learns preferences
- ✅ Generates suggestions

**RAG System:**
- ✅ Document search works
- ✅ AI can access your documents
- ✅ Vector similarity search functional

---

**Run both files and let me know when done! Then we'll test everything together.** 🚀



