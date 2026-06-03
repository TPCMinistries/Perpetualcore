# Supabase Paused Note: Client Handoff And Kickoff Tasks

Date: 2026-06-02

Perpetual Core's client handoff flow now has a browser fallback for periods when the Supabase project is paused or unreachable.

## What works without Supabase

- The secure handoff page still renders when the app can load.
- The client can fill out kickoff context fields.
- If the API cannot save to Supabase, the browser generates a copyable kickoff brief.
- The fallback brief includes suggested kickoff tasks:
  1. Confirm workflow owner, decision owner, and kickoff window.
  2. Map current workflow, source systems, users, and handoff points.
  3. Turn real examples into the assistant behavior brief.
  4. Define the first success metric and review checkpoint.
  5. Ship the first operating lane for review before expanding.

## What still requires Supabase

- Persisting `accountHandoffContext` into the lead's `ai_insights`.
- Logging `client_handoff_context` into `lead_activities`.
- Auto-creating or updating linked kickoff tasks in the account room.
- Showing submitted handoff context later inside `/dashboard/accounts/[leadId]`.

## Next DB-backed pass when Supabase is active

- Convert submitted handoff context into account tasks automatically.
- Upsert by stable task key so repeat submissions update existing kickoff tasks instead of duplicating them.
- Surface a "Generate from latest handoff context" action in the account room.
