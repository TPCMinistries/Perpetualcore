# Auth Setup Guide

## 1. Set Up Supabase Database

Go to your Supabase project dashboard: https://hgxxxmtfmvguotkowxbu.supabase.co

### Run the Main Schema

1. Go to **SQL Editor** in Supabase
2. Create a new query
3. Copy and paste the contents of `supabase/schema.sql`
4. Click **Run**

This will create:
- `organizations` table
- `profiles` table
- `conversations` and `messages` tables
- `documents` table with vector embeddings
- `tasks` table
- `calendar_events` and `emails` tables
- All necessary functions including `create_organization_and_profile`
- Row Level Security (RLS) policies

### Enable Email Auth

1. Go to **Authentication > Providers** in Supabase
2. Make sure **Email** provider is enabled
3. Configure email templates if desired

## 2. Test Auth Flow

### Test Signup

1. Go to http://localhost:3000/signup
2. Fill in:
   - Full Name: "Test User"
   - Email: "test@example.com"
   - Password: "Test1234" (must have uppercase, lowercase, number)
   - Organization: "Test Org"
3. Click "Sign up"

**Expected Result:**
- You should see a success message about email confirmation
- Check your email for confirmation link
- OR if email confirmation is disabled, you'll be redirected to `/dashboard`

### Test Login

1. Go to http://localhost:3000/login
2. Enter your email and password
3. Click "Sign in"

**Expected Result:**
- Redirect to `/dashboard`

## 3. Verify Database

After signup, check your Supabase database:

1. Go to **Table Editor**
2. Check `profiles` table - should have your user
3. Check `organizations` table - should have your org
4. Verify the `organization_id` is set in your profile

## 4. Next Steps

Once auth is working:
- ✅ Auth complete
- ⏭️ Build AI chat interface
- ⏭️ Connect to AI APIs

## Troubleshooting

### "Failed to create organization"
- Make sure you ran the full `schema.sql`
- Check that the `create_organization_and_profile` function exists
- Look at Supabase logs for detailed error

### "Email confirmation required"
- Go to Authentication > Settings in Supabase
- Disable "Enable email confirmations" for testing
- Or check your email for confirmation link

### Can't access dashboard after login
- Check middleware is running
- Verify session cookie is set
- Check browser console for errors
