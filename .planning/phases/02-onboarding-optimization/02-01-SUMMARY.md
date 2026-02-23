---
phase: 02-onboarding-optimization
plan: 01
subsystem: onboarding-chat-bridge
tags: [onboarding, chat, aha-moment, personalization, guided-flow]
dependency_graph:
  requires: []
  provides: [guided-first-chat-flow, personalized-empty-state, first-conversation-context-injection]
  affects: [components/onboarding/OnboardingFlowV3.tsx, components/chat/EmptyState.tsx, app/dashboard/chat/page.tsx, app/api/chat/route.ts]
tech_stack:
  added: []
  patterns: [url-search-params-guided-flag, profile-context-api-extension, system-prompt-injection]
key_files:
  created:
    - lib/onboarding/guided-chat.ts
  modified:
    - components/onboarding/OnboardingFlowV3.tsx
    - components/chat/EmptyState.tsx
    - app/dashboard/chat/page.tsx
    - app/api/chat/route.ts
    - app/api/profile/context/route.ts
decisions:
  - "Use guided=true URL param as the signal between onboarding completion and first-chat experience — zero DB state required"
  - "10-minute window for first-conversation context injection — long enough for completion, prevents stale injection"
  - "isGuidedFirstChat only activates when messages.length === 0 — transitions away as soon as user sends first message"
  - "EmptyState fetches onboarding profile client-side when isGuidedFirstChat=true — no prop drilling required"
metrics:
  duration: 9 min
  completed_date: "2026-02-23"
  tasks: 2
  files: 5
---

# Phase 2 Plan 1: Guided First-Chat Aha Moment Summary

**One-liner:** Post-onboarding redirect to `/dashboard/chat?guided=true` with personalized EmptyState and system prompt context injection that greets users by name and references their role and goals.

## What Was Built

### lib/onboarding/guided-chat.ts (new)
Two named exports that power the personalized first-chat experience:

- **`buildFirstChatPrompt(profile)`** — Returns a natural-language first message: `"Hi! I'm [name], a [role]. I'm looking to [goal]. What can you help me with?"` Maps role IDs (professional, entrepreneur, creative, technical, student_educator, researcher) and goal IDs to human-readable labels.

- **`getFirstChatSuggestions(userRole, primaryGoals)`** — Returns 4 personalized quick-action prompts matched to the user's role and top goals. Role-goal lookup table covers all 6 roles × all goal combinations. Falls back to generic prompts if no match found.

### components/onboarding/OnboardingFlowV3.tsx (modified)
- `completeOnboarding()` now calls `router.push("/dashboard/chat?guided=true")` after the modal closes — both in the success and error path
- `handleActionClick()` appends `?guided=true` when the destination is `/dashboard/chat`
- CompleteStep CTA text changed from "Start Using My AI Brain" to "Start Your First Conversation"

### components/chat/EmptyState.tsx (modified)
- New `isGuidedFirstChat?: boolean` prop added to `EmptyStateProps`
- When `isGuidedFirstChat=true`, renders a completely different guided layout:
  - Personalized heading: "Welcome to your AI brain, [name]!"
  - Subheading reinforces persistent memory awareness
  - Prominent "Send your first message" card with pre-built prompt from `buildFirstChatPrompt` — clicking auto-sends
  - Personalized suggestions from `getFirstChatSuggestions` instead of generic `QUICK_PROMPTS`
  - No activity section, no recent conversations (user has none yet)
- Client-side fetch to `/api/profile/context` when in guided mode to get name/role/goals for prompt building
- Loading skeleton shown while profile data loads

### app/dashboard/chat/page.tsx (modified)
- Imports `useSearchParams` from `next/navigation`
- Reads `guided` search param at the top of the component
- Passes `isGuidedFirstChat={searchParams.get("guided") === "true" && messages.length === 0}` to EmptyState — the `messages.length === 0` guard ensures guided mode clears automatically once the user sends their first message

### app/api/chat/route.ts (modified)
New "First-Conversation Context Injection" block added after the memory context injection:
- Checks: new conversation (no `conversationId`), onboarding completed, within 10-minute window of `onboarding_completed_at`, has `preferred_name` + `user_role` + `primary_goals`
- When all conditions met, appends `FIRST CONVERSATION CONTEXT` section to system prompt with explicit instructions to:
  - Greet user by `preferred_name`
  - Reference their role in the response
  - Proactively mention their goals and how to help
  - Example opener provided to model for tone calibration

### app/api/profile/context/route.ts (modified)
- GET endpoint now returns `primary_goals` and `onboarding_completed_at` in addition to existing fields — needed by EmptyState for prompt building and by chat route for first-conversation detection

## Deviations from Plan

None — plan executed exactly as written.

## Success Criteria Verified

- [x] OnboardingFlowV3 completion redirects to `/dashboard/chat?guided=true`
- [x] First-time chat EmptyState shows personalized welcome with pre-built prompt when `guided=true`
- [x] AI's first response will demonstrate persistent memory (name, role, goals injected into system prompt)
- [x] After sending first message, `messages.length > 0` clears the guided state automatically
- [x] `npm run build` — zero errors (373/373 pages generated)
- [x] `npx tsc --noEmit` — no type errors

## Self-Check: PASSED

All created files exist on disk. Both task commits verified in git log (5c0369b, b1bc77a). Build passed with 373/373 pages generated. TypeScript reports zero errors.
