# User Acquisition & Retention Deployment Guide

## ✅ What's Been Completed

### 1. **New Onboarding Flow** (OnboardingFlowV2)
- **Location**: `components/onboarding/OnboardingFlowV2.tsx`
- **Philosophy**: Action-oriented, not explanation-oriented
- **Flow**:
  1. Welcome: "You just got an infinite memory AI brain"
  2. Use Case Selection: Work / Research / Teaching / Personal
  3. First Action: Contextual CTA (upload doc OR start conversation)
  4. Team Invite: Show viral/collaboration value
  5. Complete: Clear next steps

**Key Features**:
- Personalized based on use case (especially for teachers)
- Gets users to "aha moment" faster
- Natural team invite prompts
- Tracks user context for better experience

### 2. **Viral Share & Invite System**
- **Location**: `app/dashboard/share/page.tsx`
- **Features**:
  - Personal referral link with tracking
  - Direct email invites with custom message
  - Social sharing (Twitter, LinkedIn)
  - Collaboration benefits showcase
  - Stats dashboard

**Added to Navigation**:
- "Share & Invite" in sidebar (marked as core feature)
- Located right after Team settings

### 3. **Empty States Audit**
- ✅ All major features already have compelling empty states
- ✅ Chat page: Welcome screen with quick-start suggestions
- ✅ Conversations: Feature highlights and benefits
- ✅ Tasks: Clear "get started" prompts
- ✅ Documents/Library: Onboarding-style empty states

---

## ⚠️ Required: Database Migrations

The onboarding system needs database columns to track user progress AND user context for personalization.

### Run BOTH Migrations in Supabase SQL Editor

1. Go to your Supabase Dashboard: https://hgxxxmtfmvguotkowxbu.supabase.co
2. Navigate to **SQL Editor**
3. Run **Migration 1** (Onboarding tracking):

```sql
-- Add onboarding fields to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS onboarding_skipped BOOLEAN DEFAULT FALSE;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_completed ON profiles(onboarding_completed);
```

4. Then run **Migration 2** (User personalization):

```sql
-- Add user context fields for personalization
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS user_role TEXT, -- e.g., 'teacher', 'researcher', 'developer', 'student', 'business_owner', 'content_creator'
ADD COLUMN IF NOT EXISTS industry TEXT, -- e.g., 'education', 'technology', 'healthcare', 'legal', 'creative', 'finance'
ADD COLUMN IF NOT EXISTS primary_goal TEXT, -- What they want to achieve first
ADD COLUMN IF NOT EXISTS team_context TEXT, -- 'solo', 'team_member', 'team_lead', 'educator', 'student'
ADD COLUMN IF NOT EXISTS content_types TEXT[], -- Array of content types they'll work with
ADD COLUMN IF NOT EXISTS ai_experience_level TEXT DEFAULT 'beginner', -- 'beginner', 'intermediate', 'advanced'
ADD COLUMN IF NOT EXISTS preferred_name TEXT, -- How they want to be addressed
ADD COLUMN IF NOT EXISTS timezone TEXT, -- For scheduling and timestamps
ADD COLUMN IF NOT EXISTS use_case_tags TEXT[]; -- Flexible tags for filtering/segmentation

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_profiles_user_role ON profiles(user_role);
CREATE INDEX IF NOT EXISTS idx_profiles_industry ON profiles(industry);
CREATE INDEX IF NOT EXISTS idx_profiles_team_context ON profiles(team_context);
CREATE INDEX IF NOT EXISTS idx_profiles_ai_experience ON profiles(ai_experience_level);
```

### Option 2: Use Migration File

The migration file already exists at:
- `supabase/migrations/002_add_onboarding.sql`

If you have Supabase CLI set up:
```bash
supabase db push
```

### Verify Migrations

After running BOTH migrations, verify by checking the profiles table in Supabase Table Editor. You should see these new columns:

**Onboarding Tracking:**
- `onboarding_completed` (boolean)
- `onboarding_step` (integer)
- `onboarding_skipped` (boolean)

**User Personalization:**
- `user_role` (text)
- `industry` (text)
- `primary_goal` (text)
- `team_context` (text)
- `content_types` (text[])
- `ai_experience_level` (text)
- `preferred_name` (text)
- `timezone` (text)
- `use_case_tags` (text[])

---

## 🚀 Testing the New Flow

### Test New User Onboarding

1. **Create test account** or clear onboarding state:
   ```javascript
   // In browser console on dashboard
   localStorage.removeItem('onboarding-completed-v2');
   localStorage.removeItem('onboarding-step-v2');
   // Reload page
   ```

2. **Walk through onboarding**:
   - Step 1: Should see "infinite memory AI brain" messaging
   - Step 2: Select a use case (try "Teaching" for teacher flow)
   - Step 3: Should get contextual CTA based on your selection
   - Step 4: Team invite prompt
   - Step 5: Completion with clear next steps

3. **Verify data persistence**:
   - Check Supabase `profiles` table
   - Should see `onboarding_completed = true` after completion

### Test Share & Invite System

1. Go to `/dashboard/share`
2. **Test features**:
   - Copy invite link (should copy to clipboard)
   - Enter email and send invite (check console for log)
   - Try social share buttons (should open Twitter/LinkedIn)
3. **Verify UI**:
   - Stats cards display correctly
   - Benefits section is clear
   - Link to Team Settings works

---

## 📊 Activation Metrics to Track

Now that the system is built, track these metrics:

### User Activation Metrics
- **Onboarding Completion Rate**: % of users who complete full flow
- **Time to First Action**: How long until first doc upload OR first chat
- **Use Case Distribution**: Work vs Research vs Teaching vs Personal
- **Team Invite Rate**: % of users who invite at least 1 person

### Viral Growth Metrics
- **Invite Clicks**: How many people click invite links
- **Invite Conversion**: % of invites that result in signups
- **Referral Attribution**: Track signups from `?ref=` parameter
- **Team Growth**: Average team size over time

### Implementation Ideas
Add these queries to your analytics dashboard:

```sql
-- Onboarding completion rate
SELECT
  COUNT(*) FILTER (WHERE onboarding_completed = true) * 100.0 / COUNT(*) as completion_rate
FROM profiles;

-- Use case distribution (need to add column to profiles)
SELECT
  use_case,
  COUNT(*) as count
FROM profiles
WHERE onboarding_completed = true
GROUP BY use_case;

-- Time to first action (need to track first_action_at)
SELECT
  AVG(EXTRACT(EPOCH FROM (first_action_at - created_at)) / 60) as avg_minutes_to_first_action
FROM profiles
WHERE first_action_at IS NOT NULL;
```

---

## 🎯 GTM Strategy Alignment

**Prosumer → Team → Enterprise Through Teaching**

### How This System Supports Your GTM:

1. **Prosumer Activation**:
   - New onboarding gets them to "aha moment" fast
   - Personalized flow based on use case
   - Clear value proposition: "infinite memory AI brain"

2. **Team Expansion**:
   - Viral Share & Invite system makes it easy
   - Onboarding prompts team collaboration (Step 4)
   - Benefits clearly explained (shared knowledge = smarter AI)

3. **Teaching Channel**:
   - Dedicated "Teaching" use case in onboarding
   - Share page perfect for inviting students
   - Emphasis on collaboration and shared materials

4. **Viral Mechanics**:
   ```
   New User → Value Experience → Invite Team → Team Experiences Value → They Invite Others
   ```

### Next Steps for Growth:

1. **Content Marketing**:
   - Create tutorial videos showing onboarding flow
   - Blog posts: "How I use my infinite memory AI brain for [work/research/teaching]"
   - Case studies from teachers using it with students

2. **Referral Incentives** (Future):
   - Track successful referrals in database
   - Reward system for bringing team members
   - Special benefits for educators bringing students

3. **Onboarding Optimization**:
   - A/B test different messaging in Step 1
   - Track where users drop off
   - Optimize CTAs based on use case

---

## 🐛 Troubleshooting

### Onboarding doesn't show up
- Check localStorage: `onboarding-completed-v2` should not be set
- Check database: `profiles.onboarding_completed` should be false
- Verify component is imported in `app/dashboard/layout.tsx`

### Database migration fails
- Check if columns already exist
- Use `IF NOT EXISTS` clause (included in migration)
- Check Supabase logs for errors

### Share page doesn't load
- Verify route exists at `app/dashboard/share/page.tsx`
- Check navigation config includes Share2 icon
- Browser console for any errors

---

## 📝 Summary

You now have a complete user acquisition and retention system:

✅ **Onboarding**: Gets users to value fast, personalized by use case
✅ **Viral Loop**: Share & Invite system makes growth easy
✅ **Empty States**: All major features have compelling empty states
✅ **Teaching Focus**: Special flows for educators (your main channel)

**Action Required**: Apply database migration (see above)

**Ready for Launch**: Once migration is applied, test with fresh account

**Track Success**: Monitor activation and viral metrics
