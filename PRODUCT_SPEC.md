# PRODUCT SPEC: Perpetual Core
## AI-Powered Operating System for Knowledge Workers
### Version 1.0 | January 2026

---

## 1. PRODUCT OVERVIEW

### Vision
The AI operating system that thinks with you, works for you, and grows smarter over time.

### Mission
Replace fragmented productivity tools with a unified AI-powered platform that manages knowledge, automates workflows, and provides intelligent assistance across all aspects of work.

### Problem Statement
Knowledge workers today use 10-20 different apps (email, calendar, docs, CRM, tasks, etc.) that don't talk to each other. Context is lost. Time is wasted switching. Nothing learns from your behavior.

### Solution
A single platform where:
- All your information lives in one searchable brain (RAG)
- AI agents handle routine tasks automatically
- Every interaction makes the system smarter
- You work in natural language, not forms and buttons

### Tagline
"Your AI-Powered Second Brain"

---

## 2. TARGET USERS

### Primary: Founders & Executives
- Running multiple ventures
- Information overload
- Need leverage, not more work
- Willing to pay for time savings

**Persona: Lorenzo (Founder)**
- Manages 12+ projects
- 200+ emails/day
- Back-to-back meetings
- Needs briefings, not busywork

### Secondary: Knowledge Teams
- Consultants, coaches, agencies
- Heavy document/client work
- Need collaboration + AI
- Team-based pricing

**Persona: Sarah (Executive Coach)**
- 15 coaching clients
- Session notes, follow-ups
- Wants AI to prep her for sessions
- Needs CRM + AI combined

### Tertiary: Ministries & Nonprofits
- Resource-constrained
- Volunteer management
- Communication overload
- Mission-driven efficiency

---

## 3. CORE FEATURES

### MVP (Current Build)

#### 3.1 AI Chat Interface
- Multi-model support (Claude, GPT, Gemini)
- Streaming responses
- Conversation history
- Context-aware (uses your data)

#### 3.2 Document Intelligence
- Upload any document (PDF, DOCX, etc.)
- Automatic chunking and embedding
- RAG retrieval in chat
- Document summaries
- Search across all documents

#### 3.3 Email Intelligence
- Gmail OAuth integration
- AI categorization (urgent, FYI, etc.)
- Priority detection
- Draft generation
- Draft-approve-send workflow

#### 3.4 Calendar Integration
- Google Calendar sync
- Upcoming events display
- Meeting context retrieval
- Pre-meeting briefings (via n8n)

#### 3.5 Task Management
- Tasks auto-extracted from conversations
- Priority levels
- Due dates
- Status tracking

#### 3.6 Contact Management
- Contact profiles
- Interaction history
- Relationship scoring
- Birthday reminders (via n8n)

### Phase 2 (Building)

#### 3.7 Agent System
- Daily Digest Agent
- Email Monitor Agent
- Task Manager Agent
- Calendar Monitor Agent
- Document Analyzer Agent

#### 3.8 Workflow Automation
- Visual workflow builder
- n8n integration
- Custom triggers
- Multi-step automations

#### 3.9 Bot Builder
- Conversational AI bots
- Custom personas
- Telegram/WhatsApp deployment
- Knowledge base integration

### Phase 3 (Planned)

#### 3.10 Team Collaboration
- Shared workspaces
- Team knowledge bases
- Role-based access
- Activity feeds

#### 3.11 Marketplace
- Agent templates
- Workflow templates
- Community contributions
- Premium add-ons

#### 3.12 White Label
- Custom branding
- Custom domains
- Reseller program

---

## 4. USER FLOWS

### Flow 1: Daily Briefing
```
User wakes up
  → Receives email/Telegram with briefing
  → Reviews: emails, meetings, tasks, priorities
  → Takes action or acknowledges
  → System learns preferences
```

### Flow 2: Document Q&A
```
User uploads document
  → System chunks and embeds
  → User asks question in chat
  → RAG retrieves relevant chunks
  → AI generates answer with citations
  → User follows up or saves insight
```

### Flow 3: Email Processing
```
Email arrives
  → System categorizes automatically
  → High priority → notification
  → User reviews in dashboard
  → Clicks "Draft Reply"
  → AI generates response
  → User edits and sends
```

### Flow 4: Meeting Prep
```
15 min before meeting
  → System identifies meeting
  → Retrieves context (past emails, docs, notes)
  → Generates briefing
  → Sends to user via Telegram
  → User arrives prepared
```

### Flow 5: Task Creation
```
User has conversation with AI
  → AI identifies action items
  → Proposes tasks
  → User confirms
  → Tasks appear in dashboard
  → (Optional) Auto-assigned via agent
```

---

## 5. TECHNICAL ARCHITECTURE

### Stack
- **Frontend:** Next.js 14 (App Router), TypeScript, TailwindCSS, Shadcn/ui
- **Backend:** Next.js API Routes, LangChain.js
- **Database:** Supabase (PostgreSQL + pgvector + Auth + Storage)
- **AI Models:** Anthropic Claude, OpenAI GPT, Google Gemini
- **Automation:** n8n (24 active workflows)
- **Payments:** Stripe
- **Messaging:** Telegram, WhatsApp (Twilio)

### Key Integrations
- Gmail API (email sync)
- Google Calendar API (calendar sync)
- Stripe (billing)
- Twilio (WhatsApp)
- n8n (automation)

### Data Architecture
- **Database:** LDC Brain AI (220 tables)
- **Vectors:** pgvector for embeddings
- **Storage:** Supabase Storage for files
- **Auth:** Supabase Auth (Google OAuth, email)

### API Structure
```
/api/
├── ai/              # AI chat, completions
├── agents/          # Agent endpoints
├── auth/            # Authentication
├── calendar/        # Calendar operations
├── chat/            # Conversation management
├── documents/       # Document CRUD
├── email/           # Email operations
├── knowledge/       # RAG operations
├── n8n/             # n8n webhooks
├── tasks/           # Task management
├── webhooks/        # External webhooks
└── ...100+ routes
```

---

## 6. DESIGN PRINCIPLES

### UX Principles
1. **AI-First:** Natural language over forms
2. **Proactive:** System suggests, user confirms
3. **Contextual:** Right info at right time
4. **Progressive:** Simple start, power when needed
5. **Trustworthy:** Transparent AI reasoning

### Visual Design
- Dark mode primary
- Clean, minimal interface
- Card-based layouts
- Clear hierarchy
- Subtle animations

### Brand Voice
- Intelligent but approachable
- Confident but not arrogant
- Professional but warm
- Technical but accessible

---

## 7. SUCCESS METRICS

### User Engagement
- Daily Active Users (DAU)
- Sessions per user per day
- Time in app
- Features used per session

### AI Effectiveness
- Chat messages per user
- Document uploads
- RAG query satisfaction
- Email drafts accepted vs edited

### Business Metrics
- Monthly Recurring Revenue (MRR)
- Customer Acquisition Cost (CAC)
- Lifetime Value (LTV)
- Churn rate

### Target KPIs (Month 3)
- 100 active users
- $5K MRR
- 80% DAU/MAU
- <5% monthly churn

---

## 8. CURRENT STATUS

### What's Built ✅
- Multi-model AI chat
- Document upload and RAG
- Gmail integration
- Calendar integration
- Task management
- Contact management
- Dashboard UI (full)
- n8n integration (API gateway)
- Stripe billing setup
- WhatsApp integration
- 220 database tables

### What's Not Working ⚠️
- 5 coded agents (built but not executing)
- RAG search (needs debugging)
- User onboarding flow
- Some API routes incomplete

### What's Missing ❌
- Agent activation triggers
- Workflow builder UI
- Bot builder UI
- Team features
- Marketplace
- White label

---

## 9. ROADMAP

### Q1 2026
- [ ] Activate all 5 agents
- [ ] Fix RAG search
- [ ] User onboarding flow
- [ ] Beta launch (50 users)

### Q2 2026
- [ ] Team workspaces
- [ ] Workflow builder UI
- [ ] Bot builder UI
- [ ] 500 users, $25K MRR

### Q3 2026
- [ ] Marketplace launch
- [ ] Mobile app (PWA)
- [ ] Enterprise features
- [ ] 2000 users, $100K MRR

### Q4 2026
- [ ] White label program
- [ ] API for developers
- [ ] International expansion
- [ ] $500K ARR target

---

## 10. PRICING

### Free Tier
- 50 AI messages/month
- 5 document uploads
- Basic email categorization
- 1 user

### Pro ($29/month)
- Unlimited AI messages
- Unlimited documents
- Full email intelligence
- Calendar integration
- 5 agents
- 1 user

### Team ($99/month)
- Everything in Pro
- 5 team members
- Shared knowledge base
- Team workflows
- Priority support

### Enterprise (Custom)
- Unlimited users
- Custom integrations
- White label option
- Dedicated support
- SLA guarantee

---

## 11. COMPETITIVE LANDSCAPE

### Direct Competitors
- Notion AI
- Mem.ai
- Reflect Notes
- Capacities

### Indirect Competitors
- Superhuman (email)
- Motion (calendar)
- Otter.ai (meetings)
- Zapier (automation)

### Differentiation
1. **All-in-one:** Not just notes or email, everything
2. **True AI agents:** Proactive, not just reactive
3. **n8n integration:** Real automation power
4. **Ministry focus:** Serves faith-based orgs too
5. **Open architecture:** Connect anything

---

## 12. RISKS & MITIGATIONS

| Risk | Mitigation |
|------|------------|
| AI costs too high | Usage limits, model selection |
| RAG quality poor | Better chunking, hybrid search |
| User overwhelm | Progressive disclosure, onboarding |
| Competition | Speed, niche focus, relationships |
| Data privacy concerns | Clear policies, encryption, compliance |

