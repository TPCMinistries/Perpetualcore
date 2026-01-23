# Project: Perpetual Core

## Quick Reference
- **Tier:** CORE
- **Phase:** Production (Live)
- **Database:** LDC Brain AI (220 tables)
- **URL:** perpetualcore.com
- **Port (local):** 3000

## Current Status
**Last Updated:** January 23, 2026
**Last Session:** Ecosystem organization, MCP setup

## Active Work
- [ ] Activate coded agents (daily-digest, email-monitor, task-manager, calendar-monitor, document-analyzer)
- [ ] Connect n8n workflows to agent system
- [ ] RAG system debugging
- [ ] User onboarding flow

## Blockers
- Coded agents exist but aren't executing
- n8n workflows active but not all connected to Perpetual Core

## Dependencies
- **Depends on:** LDC Brain AI (Supabase), n8n instance
- **Depended on by:** All other projects (this is the brain)

## Key Files
- `lib/agents/` - 5 coded agents
- `lib/intelligence/` - AI processing layer
- `lib/n8n/` - n8n integration
- `lib/workflow-engine.ts` - Execution engine
- `lib/bots/` - Bot system
- `app/api/` - 100+ API routes
- `app/dashboard/` - Full dashboard UI

## n8n Workflows Connected
- Perpetual Core API Gateway v2
- Perpetual Core - Knowledge Sync
- Perpetual Core - Work Item Stage Handler
- Gmail to Perpetual Core Sync
- Document to Knowledge Pipeline
- (24 total active, 76 inactive)

## Environment Variables Needed
- SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
- ANTHROPIC_API_KEY, OPENAI_API_KEY, GOOGLE_AI_API_KEY
- STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
- GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
- TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN

## Quick Commands
```bash
npm run dev      # Start development (localhost:3000)
npm run build    # Build for production
npm run lint     # Run linter
```

## Architecture Notes
This is the AI Operating System. Everything flows through here:
- Multi-model AI (Claude, GPT, Gemini)
- RAG with pgvector embeddings
- Workflow execution engine
- Bot/agent system
- SaaS-ready with Stripe billing

## Notes for Next Session
1. Debug why coded agents aren't running
2. Create cron job or trigger for daily-digest
3. Test the n8n ↔ Perpetual Core API gateway
4. Verify RAG search is working
