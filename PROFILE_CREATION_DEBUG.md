# 🔍 Profile Creation Error - Debugging

## Current Error
**"Failed to create profile"** - 500 Internal Server Error

## What I Just Fixed

1. **Better Error Handling:**
   - Now shows detailed error (message, code, hint)
   - Logs the data being inserted
   - Handles organization creation

2. **Organization Handling:**
   - Creates organization if user has org name in metadata
   - Links profile to organization if available
   - Works without organization if none exists

3. **Minimal Required Fields:**
   - Only inserts required fields
   - Handles optional fields gracefully

---

## 🔍 Next Steps to Debug

### Step 1: Check Server Logs
**Look at terminal where `npm run dev` is running:**
- You should see: `"Profile not found, creating one..."`
- Then: `"Error creating profile:"` with details
- And: `"Profile data attempted:"` showing what was tried

**Share those logs!**

### Step 2: Check Database Schema
Run in Supabase SQL Editor:
```sql
-- Check profiles table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;
```

### Step 3: Check RLS Policies
```sql
-- Check if RLS is blocking inserts
SELECT * FROM pg_policies WHERE tablename = 'profiles';
```

### Step 4: Test Manual Insert
```sql
-- Try to manually create profile (replace with your user ID)
INSERT INTO profiles (id, email, full_name)
VALUES (
  auth.uid(),
  (SELECT email FROM auth.users WHERE id = auth.uid()),
  'Test User'
);
```

---

## 🐛 Common Issues

### Issue 1: RLS Policy Blocking
**Symptom:** Insert fails with permission error  
**Fix:** Check RLS policies allow inserts for authenticated users

### Issue 2: Missing Required Field
**Symptom:** Insert fails with "column X is required"  
**Fix:** Check table schema, add missing field

### Issue 3: Foreign Key Constraint
**Symptom:** Insert fails with FK violation  
**Fix:** Ensure organization exists or make it nullable

### Issue 4: Unique Constraint
**Symptom:** Insert fails with duplicate key  
**Fix:** Profile might already exist (check first)

---

## 📋 What to Share

1. **Server logs** (from terminal)
2. **Database schema** (from SQL query above)
3. **RLS policies** (from SQL query above)
4. **Error details** (from browser console)

---

**Check the server logs first - they'll show exactly what's failing!** 🔍



