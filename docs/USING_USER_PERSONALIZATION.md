# How to Use User Personalization Data

The V3 onboarding captures rich user context. Here's how to leverage it throughout the platform.

## 📊 Data Captured

Every user now has:
- **preferred_name** - How they want to be addressed
- **user_role** - teacher | researcher | developer | business_owner | content_creator | student
- **industry** - education | technology | healthcare | legal | creative | finance
- **primary_goal** - Their main objective (role-specific)
- **team_context** - solo | team_member | team_lead | educator
- **content_types** - Array: documents, research_papers, code, videos, images, spreadsheets
- **ai_experience_level** - beginner | intermediate | advanced

## 🎯 Use Cases

### 1. Personalized AI Responses

Add user context to AI system prompts:

```typescript
// In your AI chat endpoint
const { data: profile } = await supabase
  .from('profiles')
  .select('user_role, industry, primary_goal, ai_experience_level')
  .eq('id', user.id)
  .single();

const systemPrompt = `You are an AI assistant helping a ${profile.user_role} in the ${profile.industry} industry.
Their main goal is: ${profile.primary_goal}.
Adjust your language complexity for ${profile.ai_experience_level} AI users.

${profile.user_role === 'teacher' ? 'Focus on educational applications and student engagement.' : ''}
${profile.user_role === 'researcher' ? 'Prioritize accuracy, citations, and academic rigor.' : ''}
${profile.user_role === 'developer' ? 'Include code examples and technical details.' : ''}`;
```

### 2. Personalized Dashboard

```typescript
// app/dashboard/page.tsx
const getPersonalizedWidgets = (profile) => {
  const widgets = ['recent-activity']; // Always show

  if (profile.user_role === 'teacher') {
    widgets.push('student-engagement', 'upcoming-lessons', 'assignment-tracker');
  } else if (profile.user_role === 'researcher') {
    widgets.push('recent-papers', 'citation-tracker', 'research-insights');
  } else if (profile.user_role === 'developer') {
    widgets.push('code-snippets', 'tech-docs', 'api-usage');
  }

  if (profile.team_context === 'team_lead' || profile.team_context === 'educator') {
    widgets.push('team-activity', 'shared-documents');
  }

  return widgets;
};
```

### 3. Feature Discoverability

Show relevant features based on goals:

```typescript
// components/FeatureSuggestions.tsx
const getRelevantFeatures = (profile) => {
  const features = [];

  // Based on primary_goal
  if (profile.primary_goal?.includes('organize')) {
    features.push({
      title: 'Smart Folders',
      description: 'Auto-organize your documents',
      href: '/dashboard/library',
    });
  }

  if (profile.primary_goal?.includes('collaborate')) {
    features.push({
      title: 'Team Conversations',
      description: 'Work together with AI assistance',
      href: '/dashboard/conversations',
    });
  }

  // Based on content_types
  if (profile.content_types?.includes('code')) {
    features.push({
      title: 'Code Analysis',
      description: 'AI-powered code review and documentation',
      href: '/dashboard/code-analyzer',
    });
  }

  return features;
};
```

### 4. Personalized Greetings

```typescript
// components/Dashboard Header.tsx
const getGreeting = (profile) => {
  const name = profile.preferred_name || profile.full_name?.split(' ')[0] || 'there';
  const timeOfDay = getTimeOfDay(); // morning, afternoon, evening

  const roleGreetings = {
    teacher: `Good ${timeOfDay}, ${name}! Ready to inspire minds?`,
    researcher: `Good ${timeOfDay}, ${name}! What will you discover today?`,
    developer: `Good ${timeOfDay}, ${name}! Let's build something amazing.`,
    student: `Good ${timeOfDay}, ${name}! Ready to learn?`,
    business_owner: `Good ${timeOfDay}, ${name}! Let's grow your business.`,
    content_creator: `Good ${timeOfDay}, ${name}! Time to create magic.`,
  };

  return roleGreetings[profile.user_role] || `Good ${timeOfDay}, ${name}!`;
};
```

### 5. Contextual Help & Documentation

```typescript
// components/HelpButton.tsx
const getHelpResources = (profile) => {
  const baseResources = ['Getting Started', 'FAQ'];

  if (profile.user_role === 'teacher') {
    return [
      ...baseResources,
      'Creating Course Materials',
      'Managing Student Access',
      'Grading with AI Assistance',
    ];
  } else if (profile.user_role === 'researcher') {
    return [
      ...baseResources,
      'Literature Review Best Practices',
      'Citation Management',
      'Data Analysis Tips',
    ];
  }

  return baseResources;
};
```

### 6. Adaptive UI Complexity

```typescript
// Based on ai_experience_level
const getUIComplexity = (profile) => {
  if (profile.ai_experience_level === 'beginner') {
    return {
      showAdvancedFeatures: false,
      showTooltips: true,
      showGuidedTours: true,
      modelSelection: 'auto', // Don't let them choose
    };
  } else if (profile.ai_experience_level === 'advanced') {
    return {
      showAdvancedFeatures: true,
      showTooltips: false,
      showGuidedTours: false,
      modelSelection: 'manual', // Let them choose specific models
    };
  }

  return { /* intermediate defaults */ };
};
```

### 7. Email Campaigns & Notifications

```typescript
// Segment users for targeted emails
const getEmailSegments = async () => {
  // Teachers who haven't invited students yet
  const { data: teachersNoTeam } = await supabase
    .from('profiles')
    .select('email, preferred_name')
    .eq('user_role', 'teacher')
    .eq('team_context', 'solo')
    .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

  // Send: "Invite your first student to unlock collaboration features"

  // Researchers who haven't uploaded papers
  const { data: researchersNoUploads } = await supabase
    .from('profiles')
    .select('email, preferred_name')
    .eq('user_role', 'researcher')
    .filter('content_types', 'cs', '{"research_papers"}')
    .gte('created_at', new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString());

  // Send: "Upload your first research paper for AI-powered analysis"
};
```

### 8. Product Analytics & Insights

```sql
-- User distribution by role
SELECT user_role, COUNT(*) as count
FROM profiles
WHERE onboarding_completed = true
GROUP BY user_role
ORDER BY count DESC;

-- Most common goals by role
SELECT user_role, primary_goal, COUNT(*) as count
FROM profiles
WHERE onboarding_completed = true
GROUP BY user_role, primary_goal
ORDER BY user_role, count DESC;

-- Team vs solo users
SELECT team_context, COUNT(*) as count
FROM profiles
GROUP BY team_context;

-- Content type popularity
SELECT
  unnest(content_types) as content_type,
  COUNT(*) as users
FROM profiles
WHERE content_types IS NOT NULL
GROUP BY content_type
ORDER BY users DESC;
```

### 9. Feature Flags & A/B Testing

```typescript
// Enable features based on user context
const getFeatureFlags = (profile) => {
  return {
    // Show code features only to developers
    codeAnalysis: profile.content_types?.includes('code'),

    // Show classroom features only to educators
    classroomMode: profile.user_role === 'teacher' || profile.team_context === 'educator',

    // Advanced features only for experienced users
    customModelSelection: profile.ai_experience_level === 'advanced',

    // Team features for team leads
    teamManagement: profile.team_context === 'team_lead',
  };
};
```

### 10. Pricing Page Personalization

```typescript
// Show relevant use cases on pricing page
const getPricingUseCase = (profile) => {
  const useCases = {
    teacher: {
      title: 'For Educators',
      features: ['Unlimited student seats', 'Course material organization', 'AI grading assistance'],
    },
    researcher: {
      title: 'For Researchers',
      features: ['Unlimited paper storage', 'Citation management', 'Literature review AI'],
    },
    business_owner: {
      title: 'For Business',
      features: ['Team collaboration', 'Document automation', 'Market intelligence'],
    },
  };

  return useCases[profile.user_role] || useCases.business_owner;
};
```

## 🎨 Example: Complete Personalized Experience

```typescript
// app/dashboard/page.tsx
export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return (
    <div>
      {/* Personalized greeting */}
      <h1>{getGreeting(profile)}</h1>

      {/* Relevant widgets based on role */}
      <WidgetGrid widgets={getPersonalizedWidgets(profile)} />

      {/* Feature suggestions based on goals */}
      <FeatureSuggestions features={getRelevantFeatures(profile)} />

      {/* Contextual help */}
      <HelpSection resources={getHelpResources(profile)} />
    </div>
  );
}
```

## 🔄 Updating User Context

Users can update their preferences anytime:

```typescript
// app/settings/preferences/page.tsx
const handleUpdatePreferences = async (updates) => {
  await fetch('/api/profile/context', {
    method: 'POST',
    body: JSON.stringify({
      ...currentContext,
      ...updates,
    }),
  });
};
```

## 📈 Growth Insights

Track which personas:
1. Have highest activation rates
2. Have longest retention
3. Convert to paid plans most
4. Invite the most team members
5. Use which features most

Use these insights to:
- Focus marketing on high-value personas
- Build features for engaged segments
- Optimize onboarding for each role
- Create targeted content/tutorials

## 🚀 Quick Wins to Implement First

1. **Personalized AI system prompts** - Immediate impact on response quality
2. **Personalized greetings** - Easy win, feels good
3. **Role-based feature suggestions** - Improves discoverability
4. **Segment email campaigns** - Better engagement
5. **Analytics dashboard** - Understand your users

## 💡 Pro Tips

- **Default to good experiences**: If user context is missing, provide a great default
- **Progressive disclosure**: Don't overwhelm beginners with advanced features
- **Learn over time**: Update user context based on their actual usage
- **Privacy first**: Make it clear why you're collecting this data and how it helps them
- **Easy to change**: Let users update their preferences easily

---

Your users aren't generic. Now your product doesn't have to be either. 🎯
