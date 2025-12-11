# 🔍 Debug Steps - Internal Server Error

## What I Just Added

**Enhanced logging** to see exactly what's failing:
- Logs when chat API is called
- Logs admin client creation
- Logs profile query results
- Detailed error messages with stack traces

---

## 🔍 Next Steps

### Step 1: Check Server Terminal
**Look at the terminal where `npm run dev` is running.**

When you send a message, you should see:
```
📨 Chat API called
🔍 Checking for profile...
✅ Admin client created
🔍 Profile query result: { found: false, error: ..., userId: ... }
```

**OR error messages like:**
```
❌ Failed to create admin client: ...
❌ Chat API error: ...
```

**Share those logs!** They'll show exactly what's failing.

---

### Step 2: Check for Common Issues

#### Issue 1: Service Role Key Missing/Invalid
**Check:**
```bash
grep SUPABASE_SERVICE_ROLE_KEY .env.local
```

**Should show:** `SUPABASE_SERVICE_ROLE_KEY=sk-...`

**If missing or wrong:**
1. Go to Supabase Dashboard
2. Settings → API
3. Copy "service_role" key
4. Add to `.env.local`
5. Restart server

#### Issue 2: Import Error
**Check server logs for:**
- `Failed to create admin client`
- Import errors

#### Issue 3: Database Error
**Check server logs for:**
- SQL errors
- Connection errors
- RLS errors

---

### Step 3: Test Admin Client Manually

Run in Supabase SQL Editor:
```sql
-- Check if you can query profiles
SELECT * FROM profiles LIMIT 1;

-- Check if you can insert (replace with your user ID)
INSERT INTO profiles (id, email, full_name)
VALUES (
  'your-user-id-here',
  'test@example.com',
  'Test User'
)
ON CONFLICT (id) DO NOTHING;
```

---

## 📋 What to Share

1. **Server terminal logs** (the detailed ones I just added)
2. **Any error messages** you see
3. **Service role key status** (exists or not)

---

**Send a message in chat and check the server terminal - you'll see detailed logs showing exactly what's failing!** 🔍



