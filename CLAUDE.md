# CLAUDE.md - Perpetual Core

## Project Identity
**Name:** Perpetual Core
**Type:** AI Operating System Platform (SaaS)
**URL:** perpetualcore.com
**Location:** /Users/lorenzodaughtry-chambers/ai-brain/ai-os-platform

## Owner Context
**Organization:** Institute for Human Advancement (IHA)
**Founder:** Lorenzo Daughtry-Chambers
**Business Model:** The Perpetual Engine - 10% of profits fund nonprofit mission work

## What This Project Is
Perpetual Core is the flagship AI operating system that powers Lorenzo's multi-entity ecosystem. It's both:
1. **Lorenzo's personal second brain** - persistent memory, document processing, multi-model intelligence
2. **A SaaS product** - enterprise-grade AI infrastructure for other organizations

## Classification
**Priority:** MAIN (Primary delivery & revenue)
**Tier:** 1 - Mission Critical

## Tech Stack
- **Framework:** Next.js 14
- **Database:** Supabase with pgvector for embeddings
- **AI Models:** Claude (Anthropic), GPT-4o (OpenAI), Gemini (Google)
- **RAG:** LangChain for retrieval-augmented generation
- **Payments:** Stripe
- **Integrations:** Gmail, Google Calendar, WhatsApp

## Architecture Principles
1. **Multi-model routing** - Route queries to optimal AI based on task type
2. **Persistent memory** - Conversations and context persist across sessions
3. **Cost optimization** - GPT-4o Mini as default, upgrade for complex tasks
4. **Enterprise-ready** - Multi-tenant with workspace isolation

## Key Features
- [x] Multi-model AI chat interface
- [x] Intelligent model routing
- [x] Cost-optimized inference
- [ ] Document upload + RAG
- [ ] Voice conversation
- [ ] Calendar/email integration

## Revenue Target
$500K - $1M ARR within 18 months

## Development Commands
npm run dev        # Start development server
npm run build      # Production build
npm run lint       # Run linter

## Environment Variables Required
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
OPENAI_API_KEY
ANTHROPIC_API_KEY
GOOGLE_AI_API_KEY
STRIPE_SECRET_KEY

## Notes for Contributors
- Always use TypeScript strict mode
- Follow existing component patterns
- Use shadcn/ui for new UI components
- Test AI integrations with small payloads first

## ⚠️ CORE SYSTEM WARNING

**Database:** LDC Brain AI (shared hub)
**Role:** This is the BRAIN of the ecosystem - changes propagate everywhere
**Risk Level:** HIGH - core infrastructure

**RULES:**
- `/db-safe` active for all database work
- Changes here may affect Uplift Ops and other connected projects
- Test thoroughly before deployment
- Document all architectural decisions
- Coordinate with `/ecosystem` for cross-project awareness

## Recommended Skills for This Project
- `/db-safe` - Always active (core system)
- `/ecosystem` - CRITICAL (this affects everything)
- `/design` - SaaS-quality UI/UX
- `/deploy` - HIGH risk deployments
- `/content tech` - Product documentation and marketing
