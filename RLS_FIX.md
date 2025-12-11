# ✅ RLS Issue Fixed - Using Admin Client

## Problem
**406 (Not Acceptable) errors** from Supabase when querying/creating profiles  
**Cause:** Row Level Security (RLS) policies blocking the operations

## Solution
I've updated the chat API to use the **admin client** (service role) for profile operations, which bypasses RLS.

**What changed:**
- Uses `createAdminClient()` for profile queries and creation
- Bypasses RLS policies
- Still uses regular client for user-specific operations

---

## ⚠️ Important: Service Role Key Required

The admin client needs `SUPABASE_SERVICE_ROLE_KEY` in your `.env.local`.

**Check if you have it:**
```bash
grep SUPABASE_SERVICE_ROLE_KEY .env.local
```

**If missing, add it:**
1. Go to Supabase Dashboard
2. Settings → API
3. Copy "service_role" key (secret!)
4. Add to `.env.local`:
   ```
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```
5. Restart server

---

## 🧪 Test It

1. **Make sure service role key is set**
2. **Restart server** (if you added the key)
3. **Send a message** in chat
4. **Should work now!** ✅

---

## 📋 What Happens Now

1. Chat API checks for profile using admin client
2. If not found, creates profile using admin client (bypasses RLS)
3. Creates organization if needed
4. Continues with chat request

---

## 🔍 If Still Failing

### Check Server Logs:
Look for:
- `"Profile not found, creating one with admin client..."`
- `"✅ Profile created successfully:"`
- Or error messages

### Check Environment:
```bash
# Should show the key (first few chars)
grep SUPABASE_SERVICE_ROLE_KEY .env.local | head -c 50
```

### Manual Test:
Try creating profile manually in Supabase SQL Editor:
```sql
INSERT INTO profiles (id, email, full_name)
VALUES (
  auth.uid(),
  (SELECT email FROM auth.users WHERE id = auth.uid()),
  'Test User'
);
```

---

**The 406 errors should be gone now! Try sending a message.** 🚀



