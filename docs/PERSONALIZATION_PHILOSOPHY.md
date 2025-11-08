# Personalization Philosophy: Guide, Don't Gate

## ❌ What NOT To Do

**Don't lock features based on role:**
```typescript
// BAD - This restricts exploration
if (userRole !== 'developer') {
  return null; // Hide code features completely
}
```

**Don't force them into a single path:**
```typescript
// BAD - This assumes they never change
if (userRole === 'student') {
  redirectTo('/student-dashboard'); // Locked into student view
}
```

**Don't make it hard to change:**
```typescript
// BAD - Buried in settings
"You can change your role in Settings > Advanced > User Profile > Edit"
```

## ✅ What TO Do

### 1. **Prioritize, Don't Hide**

```typescript
// GOOD - Show everything, order by relevance
const getFeatureOrder = (userRole) => {
  const allFeatures = ['chat', 'library', 'tasks', 'code', 'research', 'teaching'];

  const priorities = {
    developer: ['chat', 'code', 'library', 'tasks', 'research', 'teaching'],
    teacher: ['teaching', 'chat', 'library', 'tasks', 'research', 'code'],
    researcher: ['research', 'library', 'chat', 'tasks', 'code', 'teaching'],
  };

  return priorities[userRole] || allFeatures;
};

// Show all features, just reorder them
{getFeatureOrder(userRole).map(feature => <FeatureCard key={feature} {...feature} />)}
```

### 2. **Suggest, Don't Restrict**

```typescript
// GOOD - Show suggestions with "Explore All" option
<Dashboard>
  <SuggestedForYou role={userRole} />
  <Divider>Or explore everything</Divider>
  <AllFeatures />
</Dashboard>
```

### 3. **Easy to Switch**

```typescript
// GOOD - Prominent, easy to change
<DashboardHeader>
  <RoleSelector
    current={userRole}
    onChange={updateRole}
    tooltip="Change anytime to see different recommendations"
  />
</DashboardHeader>

// Or even better - contextual switching
<FeatureCard>
  <Badge>Recommended for Researchers</Badge>
  <Button onClick={() => viewAsRole('researcher')}>
    View as Researcher
  </Button>
</FeatureCard>
```

### 4. **Multiple Roles OK**

```typescript
// GOOD - Let them select multiple
const [roles, setRoles] = useState([]);

<Onboarding>
  <h2>What describes you? (Select all that apply)</h2>
  <MultiSelect
    options={['teacher', 'researcher', 'developer', 'student']}
    selected={roles}
    onChange={setRoles}
  />
</Onboarding>

// Then prioritize features for their PRIMARY role, but show ALL
```

### 5. **Learn from Behavior**

```typescript
// GOOD - Update preferences based on usage
const updateRoleFromBehavior = async () => {
  const usage = await getFeatureUsage(userId);

  // They said "student" but they're uploading research papers and using citation tools
  if (userRole === 'student' && usage.research_features > usage.student_features * 2) {
    showNotification({
      title: "Looks like you're doing research!",
      message: "Want to switch to Researcher mode for better recommendations?",
      actions: [
        { label: "Yes, switch", onClick: () => updateRole('researcher') },
        { label: "No thanks", onClick: dismiss }
      ]
    });
  }
};
```

### 6. **Progressive Disclosure**

```typescript
// GOOD - Start simple, reveal complexity as needed
const getUIComplexity = (aiExperience, actualUsage) => {
  // They said "beginner" but they're using advanced features
  if (aiExperience === 'beginner' && actualUsage.advanced_features > 10) {
    return 'intermediate'; // Automatically graduate them
  }

  return aiExperience;
};

// Show beginner UI initially, but add "Show advanced options" button
<ChatInterface>
  {complexity === 'beginner' && (
    <SimpleModelSelector />
  )}
  {complexity === 'advanced' && (
    <AdvancedModelSelector />
  )}
  <Button onClick={() => setComplexity('advanced')}>
    Show advanced options
  </Button>
</ChatInterface>
```

## 🎨 Redesigned Onboarding Approach

### Option 1: Flexible Multi-Select

```typescript
<OnboardingStep title="Tell us about yourself">
  <p>Select all that apply - you can change this anytime</p>

  <MultiSelect label="I am a...">
    {roles.map(role => (
      <Checkbox key={role.id} label={role.label} />
    ))}
  </MultiSelect>

  <MultiSelect label="I work with...">
    {industries.map(industry => (
      <Checkbox key={industry.id} label={industry.label} />
    ))}
  </MultiSelect>

  <p className="text-sm text-muted">
    💡 We'll prioritize relevant features, but you'll still have access to everything
  </p>
</OnboardingStep>
```

### Option 2: Primary + Secondary

```typescript
<OnboardingStep title="What's your main focus?">
  <Select label="Primary role">
    <Option value="teacher">Teacher</Option>
    <Option value="researcher">Researcher</Option>
    {/* ... */}
  </Select>

  <MultiSelect label="I also..." optional>
    <Checkbox>Do research</Checkbox>
    <Checkbox>Teach or mentor</Checkbox>
    <Checkbox>Create content</Checkbox>
    <Checkbox>Manage a team</Checkbox>
  </MultiSelect>

  <p className="text-sm text-muted">
    ⚡ We'll optimize for your primary role, but keep other features accessible
  </p>
</OnboardingStep>
```

### Option 3: Industry-Based (Your Idea)

```typescript
<OnboardingStep title="What field are you in?">
  <p>This helps us show relevant examples and use cases</p>

  <Select label="Industry">
    <Option value="education">Education</Option>
    <Option value="technology">Technology</Option>
    <Option value="healthcare">Healthcare</Option>
    <Option value="research">Research & Academia</Option>
    <Option value="creative">Creative & Media</Option>
    <Option value="business">Business & Finance</Option>
    <Option value="legal">Legal</Option>
    <Option value="other">Other</Option>
  </Select>

  {/* Industry unlocks relevant templates, not features */}
  <p className="text-sm text-muted">
    💡 We'll suggest templates and examples from {selectedIndustry}
  </p>
</OnboardingStep>
```

## 🔄 Always Available: Quick Role Switch

Add to every page header:

```typescript
<Header>
  <RoleSwitcher
    current={userRole}
    quick={['teacher', 'researcher', 'developer', 'student']}
    onChange={updateRole}
  >
    <Button variant="ghost">
      <Users className="w-4 h-4" />
      Viewing as: {userRole}
    </Button>
  </RoleSwitcher>
</Header>
```

## 🎯 How to Use Personalization Data

### Use it for:
- ✅ **Feature ordering** (most relevant first)
- ✅ **Default settings** (auto-select best model for their use case)
- ✅ **Content suggestions** (relevant templates, examples)
- ✅ **Help articles** (show docs for their role first)
- ✅ **Onboarding tours** (role-specific quick start)
- ✅ **Email campaigns** (targeted content)
- ✅ **Analytics** (understand user segments)

### DON'T use it for:
- ❌ **Feature gating** (hiding features completely)
- ❌ **Restricting access** (unless it's a paid tier thing)
- ❌ **Forcing workflows** (let them explore)
- ❌ **Making assumptions** (they might wear multiple hats)

## 🧪 A/B Test Ideas

1. **Test role rigidity:**
   - A: Single role selection, locked
   - B: Multi-role selection, flexible
   - Measure: Feature adoption rate, time to activation

2. **Test personalization visibility:**
   - A: Silent personalization (just reorder features)
   - B: Explicit personalization ("Because you're a teacher...")
   - Measure: User satisfaction, perceived relevance

3. **Test changing preferences:**
   - A: Buried in settings
   - B: Prominent header switcher
   - Measure: How often users change roles, feature usage

## 💡 Recommended Approach

**For your use case (prosumer → team → enterprise via teaching):**

```typescript
<Onboarding>
  {/* Step 1: Flexible, non-committal */}
  <Step title="What brings you here?">
    <p>This helps us show you the most relevant features first</p>
    <Select>
      <Option>Teaching & Education</Option>
      <Option>Research & Learning</Option>
      <Option>Work & Projects</Option>
      <Option>Personal Knowledge</Option>
      <Option>Just exploring</Option>
    </Select>
    <p className="text-xs text-muted">
      Don't worry - you'll have access to everything
    </p>
  </Step>

  {/* Step 2: What they'll actually use */}
  <Step title="What will you upload?">
    <MultiSelect>
      <Checkbox>Course materials & lesson plans</Checkbox>
      <Checkbox>Research papers & articles</Checkbox>
      <Checkbox>Work documents & files</Checkbox>
      <Checkbox>Code & technical docs</Checkbox>
      <Checkbox>Not sure yet</Checkbox>
    </MultiSelect>
  </Step>

  {/* Step 3: Get them started */}
  <Step title="Ready to get started?">
    <SuggestedActions based={onboardingData} />
    <Divider />
    <AllActions label="Or start anywhere" />
  </Step>
</Onboarding>
```

## 🎯 Summary

**Guide users to value, don't restrict them from discovery.**

- Personalize the **journey**, not the **destination**
- Make switching contexts **easy and obvious**
- Let **behavior** override initial selections
- Use personalization for **suggestions**, not **restrictions**
- **Trust users** to know what they need

The goal: Users feel like the product "gets them" without feeling boxed in.
