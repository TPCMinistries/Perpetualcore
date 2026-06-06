---
phase: 04-foundations-salvage-port
plan: "04"
subsystem: org-invites
tags: [rfp, orgs, invites, rls, auth-trigger, single-use-tokens]

# Dependency graph
requires:
  - phase: 04-01
    provides: rfp_user_orgs membership table and rfp_my_org_ids() RLS helper
  - phase: 04-03
    provides: rfp_orgs creation flow and owner-membership pattern
provides:
  - rfp_org_invites table with single-use tokens, RLS scoped to org owners
  - Auto-accept trigger on auth.users insert (matches pending invite by email, creates rfp_user_orgs row)
  - POST /api/orgs/[orgId]/invites — owner issues invite (email + role)
  - GET /api/orgs/invites/validate?token=… — preview without consuming
  - POST /api/orgs/invites/accept — consumes invite for current user, idempotent
  - /(auth)/accept-invite page — server-component shell + AcceptInviteForm client
affects: [05-discovery (multi-user orgs), 06-capture-profile, agency tier (multi-client invites)]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Single-use token via crypto.randomUUID() persisted to rfp_org_invites.token (UNIQUE constraint)
    - RLS recursion-safe invite policy using rfp_my_org_ids() SECURITY DEFINER helper from 04-01
    - Auto-accept on signup: trigger on auth.users INSERT matches by email, creates membership atomically — handles "invited then signed up" flow without a separate API hop
    - Idempotent accept: re-POSTing same token after acceptance returns the existing membership rather than 409

key-files:
  created:
    - supabase/migrations/20260509_rfp_org_invites.sql
    - app/api/orgs/[orgId]/invites/route.ts
    - app/api/orgs/invites/validate/route.ts
    - app/api/orgs/invites/accept/route.ts
    - app/(auth)/accept-invite/page.tsx
    - components/rfp/AcceptInviteForm.tsx
    - lib/rfp/invites.ts

key-decisions:
  - Trigger-based auto-accept on signup (not API-based) — invite email tells user to "sign up with this email," and the trigger reconciles. Removes a class of "I signed up but the invite didn't apply" support tickets.
  - Validate endpoint is a GET that does NOT consume the token — accept page can preview "You're invited to {orgName} as {role} by {inviterName}" before user clicks Accept
  - Tokens expire after 14 days (DEFAULT now() + interval '14 days') — covers most real-world reply latency without leaving zombie invites forever
  - Idempotent accept (returns existing membership rather than erroring on re-POST) — handles double-clicks and the "user already accepted via the auth-trigger path" race

verification:
  - Manual: owner POSTs invite → row created with token + status='pending'
  - Manual: visiting /accept-invite?token=… as unauth user → preview renders → sign in → membership row appears
  - Manual: visiting /accept-invite with expired token → clear error, no membership created
  - Manual: non-owner POST to /api/orgs/{orgId}/invites returns 403 (RLS denies INSERT)

deferred:
  - Email delivery via Resend (currently the API returns the token in the response body for manual sharing) — Phase 5 or 11 (Launch)
  - Bulk invite (CSV upload) — deferred indefinitely; agency-tier need only
  - Invite revocation UI — API supports it (status='revoked'); UI deferred

commit-trail:
  - b24e7f1 feat(04-04): add rfp_org_invites migration with RLS and auto-accept trigger
  - da74644 feat(04-04): add lib/rfp/invites.ts + three invite API routes
  - 65ca868 feat(04-04): add accept-invite page + AcceptInviteForm client component
---
