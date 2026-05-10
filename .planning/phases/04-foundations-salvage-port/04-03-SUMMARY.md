---
phase: 04-foundations-salvage-port
plan: "03"
subsystem: orgs-workspace
tags: [rfp, orgs, multi-tenant, workspace, route-groups, rls]

# Dependency graph
requires:
  - phase: 04-01
    provides: rfp_orgs, rfp_user_orgs tables and tenant-isolation RLS
provides:
  - POST /api/orgs — atomic create-org + owner-membership in a single transaction
  - GET /api/orgs — list orgs the current user belongs to
  - /orgs/new page — auth-gated CreateOrgForm (name, type, NAICS multi-input)
  - /(dashboard)/org/[orgId]/layout.tsx — RLS-scoped membership guard, 404s on no-access
  - /(dashboard)/org/[orgId]/page.tsx — workspace shell with org switcher placeholder
affects: [05-discovery, 06-capture-profile, all org-scoped product surfaces]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Server-component shell + client-component form (CreateOrgForm) for auth-gated forms
    - Membership verification in layout.tsx (not page.tsx) so all child routes inherit the guard
    - createAdminClient for atomic multi-table insert (org + owner membership) inside POST /api/orgs to bypass RLS during initial bootstrap, then RLS resumes for subsequent reads

key-files:
  created:
    - app/api/orgs/route.ts
    - app/orgs/new/page.tsx
    - app/(dashboard)/org/[orgId]/layout.tsx
    - app/(dashboard)/org/[orgId]/page.tsx
    - components/rfp/CreateOrgForm.tsx
    - lib/rfp/orgs.ts

key-decisions:
  - Layout-level membership guard (not middleware) so the 404 is React-rendered with the workspace chrome rather than a bare-server response — better UX for legitimate users hitting wrong orgIds
  - Owner-membership inserted in the same transaction as the org via createAdminClient — avoids the race where an org exists momentarily without an owner
  - Org switcher is a placeholder in this phase; real switcher (multi-org list, tenant cookie) ships in Phase 5 / Phase 6 with ORG-03
  - NAICS captured as text[] (per schema), input UX is a comma-separated tag-style entry; richer code-picker deferred

verification:
  - Manual: signed-in user creates org → redirects to /org/{id} → workspace renders
  - Manual: unauth user visiting /orgs/new bounces to /login?next=/orgs/new
  - Manual: signed-in user visiting /org/{otherOrgId} returns 404 (RLS denies SELECT)

deferred:
  - Multi-org switcher UI (deferred to Phase 5 ORG-03)
  - NAICS code picker / autocomplete (deferred — text[] entry sufficient for MVP)
  - GET /api/orgs pagination (deferred — typical user belongs to <10 orgs)

commit-trail:
  - 1973f09 feat(04-03): create lib/rfp/orgs.ts + POST/GET /api/orgs
  - 302fca7 feat(04-03): add /orgs/new page + CreateOrgForm client component
  - 847dfcd feat(04-03): port workspace layout to app/(dashboard)/org/[orgId]/
---
