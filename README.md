# Perpetual Core

AI-powered knowledge platform with persistent memory, RAG, and multi-model intelligence. Built with Next.js 14, Supabase, and multiple AI providers.

## Features

- **Multi-tenant Architecture**: Secure organization-based access with Row Level Security
- **AI Chat Interface**: Support for Claude Sonnet 4, GPT-4o, and Gemini Pro
- **Document Intelligence**: Upload, process, and search documents with RAG (Retrieval Augmented Generation)
- **Calendar Integration**: Google Calendar API integration
- **Email Intelligence**: Gmail API with draft-approve-send workflow
- **Task Management**: Auto-extraction from conversations
- **WhatsApp Integration**: via Twilio
- **Automation**: N8N workflow automation
- **Usage Tracking & Billing**: Stripe integration

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, TailwindCSS, Shadcn/ui
- **Backend**: Next.js API Routes, LangChain.js
- **Database**: Supabase (PostgreSQL + pgvector + Auth + Storage)
- **AI Models**: Anthropic Claude, OpenAI GPT, Google Gemini
- **Payments**: Stripe
- **Messaging**: Twilio WhatsApp API

## Prerequisites

- Node.js 18+ and npm
- A Supabase account and project
- API keys for:
  - Anthropic (Claude)
  - OpenAI (GPT)
  - Google AI (Gemini)
  - Stripe
  - Twilio
  - Google Cloud (for Calendar & Gmail APIs)

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
cd perpetual-core
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to the SQL Editor in your Supabase dashboard
3. Copy the contents of `supabase/schema.sql` and run it to create all tables and policies
4. Enable the `vector` extension in Database > Extensions
5. Get your project URL and anon key from Settings > API

### 3. Configure Environment Variables

Copy the example environment file and fill in your values:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your credentials:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# AI APIs
ANTHROPIC_API_KEY=your_anthropic_api_key
OPENAI_API_KEY=your_openai_api_key
GOOGLE_AI_API_KEY=your_google_ai_api_key

# Google APIs
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

# Twilio WhatsApp
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# Stripe
STRIPE_SECRET_KEY=your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# App Config
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

### 5. Set Up Google APIs (Optional)

For Calendar and Gmail integration:

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select an existing one
3. Enable the Google Calendar API and Gmail API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs: `http://localhost:3000/api/auth/google/callback`
6. Add your credentials to `.env.local`

### 6. Set Up Twilio WhatsApp (Optional)

1. Sign up for a [Twilio account](https://www.twilio.com)
2. Get a WhatsApp-enabled phone number
3. Configure webhooks to point to your API endpoint
4. Add credentials to `.env.local`

### 7. Set Up Stripe (Optional)

1. Create a [Stripe account](https://stripe.com)
2. Get your API keys from the dashboard
3. Set up webhook endpoints for subscription events
4. Add credentials to `.env.local`

## Project Structure

```
perpetual-core/
├── app/                      # Next.js App Router
│   ├── api/                 # API routes
│   ├── auth/                # Authentication pages
│   ├── dashboard/           # Main dashboard
│   ├── globals.css          # Global styles
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Landing page
├── components/              # React components
│   ├── ui/                  # UI components (shadcn/ui)
│   ├── chat/                # Chat components
│   ├── documents/           # Document components
│   ├── calendar/            # Calendar components
│   ├── email/               # Email components
│   ├── tasks/               # Task components
│   └── layout/              # Layout components
├── lib/                     # Utility libraries
│   ├── supabase/            # Supabase clients
│   ├── ai/                  # AI model integrations
│   ├── utils/               # Helper functions
│   ├── hooks/               # React hooks
│   └── validations/         # Zod schemas
├── types/                   # TypeScript types
├── public/                  # Static assets
└── supabase/               # Database schema
```

## Database Schema

The platform uses a multi-tenant PostgreSQL database with Row Level Security. Key tables:

- `organizations` - Organization data
- `profiles` - User profiles linked to auth.users
- `documents` - Documents with vector embeddings
- `conversations` - AI chat conversations
- `messages` - Individual chat messages
- `tasks` - Task management
- `calendar_events` - Calendar integration
- `emails` - Email management
- `whatsapp_messages` - WhatsApp integration
- `usage_logs` - Usage tracking
- `subscriptions` - Stripe billing

## Development

### Type Checking

```bash
npm run type-check
```

### Linting

```bash
npm run lint
```

### Build

```bash
npm run build
```

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import the repository in [Vercel](https://vercel.com)
3. Add all environment variables
4. Deploy

### Custom Domain Setup

1. Add your domain (ai.lorenzodc.com) in Vercel
2. Update DNS records as instructed
3. Update `NEXT_PUBLIC_APP_URL` in environment variables
4. Update Google OAuth and Stripe webhook URLs

## Features Implementation Status

### Core Infrastructure ✅
- [x] Project initialization and structure
- [x] Database schema with multi-tenant RLS
- [x] Supabase configuration
- [x] UI component library (shadcn/ui)
- [x] Authentication system (Supabase Auth)
- [x] Multi-tenant organization setup

### AI & Chat ✅
- [x] Multi-model AI routing (Claude Sonnet 4, GPT-4o, Gemini 2.0 Flash)
- [x] Streaming chat interface
- [x] Conversation management
- [x] Complete usage tracking with cost calculation
- [x] Admin usage dashboard

### Document Intelligence ✅
- [x] Document upload and processing
- [x] RAG (Retrieval Augmented Generation)
- [x] Vector embeddings with pgvector
- [x] AI-powered document summaries
- [x] Document chat interface
- [x] Search and filtering

### Email Intelligence ✅
- [x] Gmail OAuth integration
- [x] AI email categorization
- [x] Priority detection
- [x] AI-generated draft emails
- [x] Draft-approve-send workflow

### Calendar Integration ✅
- [x] Google Calendar OAuth
- [x] Event syncing
- [x] Upcoming events display
- [x] Meeting details and links

### WhatsApp Integration ✅
- [x] Phone connection via Twilio
- [x] Message sending/receiving
- [x] AI auto-reply
- [x] Chat interface

### In Progress / Needs Testing ⚠️
- [ ] Task auto-extraction from conversations
- [ ] Universal semantic search
- [ ] Team member provisioning
- [ ] Advanced workflow automation

### Future Enhancements 📋
- [ ] N8N workflow integration
- [ ] Stripe billing and subscription management
- [ ] Usage quotas and alerts
- [ ] Advanced analytics and reporting

## Contributing

This is a private project. If you have access and want to contribute, please follow these guidelines:

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

Proprietary - All rights reserved
