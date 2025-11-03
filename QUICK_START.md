# Quick Start Guide

## Immediate Next Steps

### 1. Set Up Supabase Database

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be provisioned
3. Go to **SQL Editor** in the Supabase dashboard
4. Open `supabase/schema.sql` in this project
5. Copy the entire content and paste it into the SQL Editor
6. Click **Run** to execute the schema
7. Go to **Database > Extensions** and enable `vector` extension if not already enabled

### 2. Get API Keys

**Supabase** (Settings > API):
- Project URL
- Anon/Public key
- Service Role key (keep secret!)

**Anthropic** ([console.anthropic.com](https://console.anthropic.com)):
- API key for Claude Sonnet 4

**OpenAI** ([platform.openai.com](https://platform.openai.com)):
- API key for GPT-4o

**Google AI** ([ai.google.dev](https://ai.google.dev)):
- API key for Gemini Pro

### 3. Configure Environment

```bash
cp .env.local.example .env.local
```

Fill in at minimum:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
ANTHROPIC_API_KEY=your_anthropic_key
OPENAI_API_KEY=your_openai_key
GOOGLE_AI_API_KEY=your_google_ai_key
```

### 4. Start Development

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Feature Development Order

Now that the foundation is ready, implement features in this order:

### Phase 1: Core Authentication (Next Priority)
- [ ] Sign up / Sign in pages
- [ ] Organization creation flow
- [ ] User profile management
- [ ] Protected route middleware

### Phase 2: AI Chat Interface
- [ ] Multi-model AI router (Claude/GPT/Gemini)
- [ ] Chat UI with conversation history
- [ ] Message streaming
- [ ] Model selection

### Phase 3: Document Intelligence (RAG)
- [ ] Document upload to Supabase Storage
- [ ] Text extraction (PDF, DOCX, TXT)
- [ ] Embedding generation (OpenAI)
- [ ] Vector search implementation
- [ ] RAG pipeline integration with chat

### Phase 4: Productivity Features
- [ ] Task management UI
- [ ] Task auto-extraction from conversations
- [ ] Calendar integration (Google Calendar)
- [ ] Email integration (Gmail API)
- [ ] Draft-approve-send workflow

### Phase 5: Communications
- [ ] WhatsApp integration (Twilio)
- [ ] Message history
- [ ] Auto-responses

### Phase 6: Automation & Billing
- [ ] N8N webhook setup
- [ ] Usage tracking
- [ ] Stripe subscription setup
- [ ] Pricing tiers

## Key Files to Know

### Configuration
- `next.config.mjs` - Next.js configuration
- `tailwind.config.ts` - TailwindCSS setup
- `tsconfig.json` - TypeScript config
- `.env.local` - Environment variables (create this!)

### Database
- `supabase/schema.sql` - Complete database schema with RLS
- `types/index.ts` - TypeScript types matching database
- `lib/supabase/client.ts` - Browser Supabase client
- `lib/supabase/server.ts` - Server Supabase client
- `middleware.ts` - Auth middleware

### Core App
- `app/layout.tsx` - Root layout
- `app/page.tsx` - Landing page
- `app/globals.css` - Global styles with CSS variables

### Utilities
- `lib/utils.ts` - Helper functions (cn, formatDate, etc.)

### Components
- `components/ui/` - Reusable UI components (Button, Input, Card)

## Common Commands

```bash
# Development
npm run dev

# Type checking
npm run type-check

# Linting
npm run lint

# Production build
npm run build

# Start production server
npm start
```

## Testing Locally

1. Start the dev server: `npm run dev`
2. Visit http://localhost:3000
3. You should see the landing page
4. Click "Get Started" to begin signup flow (once auth is built)

## Deployment Checklist

When ready to deploy to ai.lorenzodc.com:

- [ ] Push code to GitHub
- [ ] Create Vercel project
- [ ] Add all environment variables
- [ ] Deploy
- [ ] Configure custom domain
- [ ] Update OAuth redirect URLs
- [ ] Update webhook URLs (Stripe, Twilio)
- [ ] Test production deployment

## Getting Help

- Next.js 14 docs: https://nextjs.org/docs
- Supabase docs: https://supabase.com/docs
- LangChain.js docs: https://js.langchain.com/docs
- Shadcn/ui docs: https://ui.shadcn.com

## Architecture Decisions

**Why Next.js 14 App Router?**
- Server and client components for optimal performance
- Built-in API routes
- Easy deployment to Vercel

**Why Supabase?**
- PostgreSQL with Row Level Security for multi-tenancy
- Built-in authentication
- Real-time subscriptions
- Object storage
- pgvector for embeddings

**Why Multiple AI Models?**
- Different models excel at different tasks
- Cost optimization
- Fallback options
- User choice

**Why LangChain?**
- Abstraction over multiple AI providers
- Built-in RAG support
- Vector store integrations
- Memory management
