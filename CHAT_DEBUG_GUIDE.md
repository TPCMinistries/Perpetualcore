# 🔍 Chat Error Debugging Guide

## ✅ What We Know

1. **API Keys Present:**
   - ✅ ANTHROPIC_API_KEY
   - ✅ OPENAI_API_KEY
   - ✅ DEEPSEEK_API_KEY
   - ✅ GOOGLE_AI_API_KEY
   - ✅ GAMMA_API_KEY

2. **Server Running:** ✅ Port 3004

3. **Error Message:** "Sorry, I encountered an error. Please try again."

---

## 🔍 How to Debug

### Step 1: Check Server Logs
**Look at the terminal where `npm run dev` is running.**

You should see error messages like:
- `❌ RAG search error: ...`
- `Error processing intelligence: ...`
- `Profile error: ...`
- `Error: ...`

**What to look for:**
- Red error messages
- Stack traces
- API key errors
- Database connection errors

### Step 2: Check Browser Console
1. Open browser DevTools (F12 or Cmd+Option+I)
2. Go to "Console" tab
3. Try sending a message in chat
4. Look for:
   - Red error messages
   - Network errors (404, 500, etc.)
   - Failed fetch requests

### Step 3: Check Network Tab
1. Open DevTools → "Network" tab
2. Try sending a message
3. Find the request to `/api/chat`
4. Click on it
5. Check:
   - **Status:** Should be 200 (not 500, 401, etc.)
   - **Response:** What does it say?
   - **Request Payload:** Is it correct?

### Step 4: Test API Directly
Run this in terminal:
```bash
cd ~/ai-brain/ai-os-platform
curl -X POST http://localhost:3004/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "Hello"}],
    "model": "gpt-4o-mini"
  }'
```

**Note:** This will fail with 401 (Unauthorized) because you need to be logged in, but it will show if the endpoint is accessible.

---

## 🐛 Common Issues

### Issue 1: Missing API Key
**Symptom:** Error about API key not found
**Fix:** Check `.env.local` has all keys

### Issue 2: Invalid API Key
**Symptom:** Error about authentication/unauthorized
**Fix:** Verify API keys are valid in provider dashboards

### Issue 3: Database Error
**Symptom:** Error about Supabase/PostgreSQL
**Fix:** Check Supabase connection, run migrations

### Issue 4: Model Not Available
**Symptom:** Error about model not found
**Fix:** Check model name matches config

### Issue 5: RAG Search Error
**Symptom:** Error about document search
**Fix:** Run RAG fix SQL (if not done yet)

---

## 🧪 Quick Test

### Test 1: Simple Message
Send: "Hello"
- Should get a response
- If error, check server logs

### Test 2: Check Model Selection
- Try different models in dropdown
- See if one works but others don't

### Test 3: Check Authentication
- Make sure you're logged in
- Check if session is valid

---

## 📋 What to Share

If you want help debugging, share:
1. **Server logs** (from terminal running `npm run dev`)
2. **Browser console errors** (F12 → Console)
3. **Network request details** (F12 → Network → click on `/api/chat` request)
4. **What you tried** (what message, what model)

---

## ✅ Quick Fixes to Try

1. **Restart server:**
   ```bash
   # Stop server (Ctrl+C)
   # Then restart:
   cd ~/ai-brain/ai-os-platform
   PORT=3004 npm run dev
   ```

2. **Check .env.local:**
   ```bash
   cat .env.local | grep API_KEY
   ```

3. **Clear browser cache:**
   - Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)

4. **Try different model:**
   - Switch from "GPT-4o Mini" to "Claude Sonnet 4"
   - See if one works

---

**Start with checking the server logs - that's where the real error will be!**



