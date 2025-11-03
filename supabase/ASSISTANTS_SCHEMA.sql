-- CUSTOM AI ASSISTANTS SCHEMA
-- This schema manages custom AI assistants with specific roles and personalities

-- =====================================================
-- TABLE: ai_assistants
-- Stores custom AI assistants created by users
-- =====================================================
CREATE TABLE IF NOT EXISTS ai_assistants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Assistant details
  name TEXT NOT NULL,
  description TEXT,
  role TEXT NOT NULL, -- 'marketing', 'research', 'code_review', 'writing', 'data_analysis', 'customer_support', 'project_management', 'custom'
  avatar_emoji TEXT DEFAULT '🤖',

  -- Personality & Behavior
  personality_traits JSONB DEFAULT '[]'::jsonb, -- Array of traits like ["professional", "concise", "friendly"]
  tone TEXT DEFAULT 'professional', -- 'professional', 'casual', 'friendly', 'formal', 'creative'
  verbosity TEXT DEFAULT 'balanced', -- 'concise', 'balanced', 'detailed'

  -- Instructions & Context
  system_instructions TEXT NOT NULL, -- Core instructions for the assistant
  context_knowledge TEXT, -- Additional context/knowledge base
  example_interactions JSONB DEFAULT '[]'::jsonb, -- Array of example Q&A pairs

  -- Capabilities
  capabilities JSONB DEFAULT '[]'::jsonb, -- Array of capabilities like ["web_search", "code_generation", "data_analysis"]
  tools_enabled JSONB DEFAULT '{}'::jsonb, -- Enabled tools/integrations

  -- Settings
  model_preference TEXT DEFAULT 'gpt-4', -- AI model to use
  temperature DECIMAL(3,2) DEFAULT 0.7,
  max_tokens INTEGER DEFAULT 2000,
  enabled BOOLEAN DEFAULT true,

  -- Sharing
  is_public BOOLEAN DEFAULT false, -- Can be shared with organization
  is_featured BOOLEAN DEFAULT false, -- Featured in marketplace

  -- Usage stats
  total_conversations INTEGER DEFAULT 0,
  total_messages INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_role CHECK (role IN ('marketing', 'research', 'code_review', 'writing', 'data_analysis', 'customer_support', 'project_management', 'sales', 'hr', 'finance', 'legal', 'custom')),
  CONSTRAINT valid_tone CHECK (tone IN ('professional', 'casual', 'friendly', 'formal', 'creative', 'empathetic')),
  CONSTRAINT valid_verbosity CHECK (verbosity IN ('concise', 'balanced', 'detailed'))
);

-- =====================================================
-- TABLE: assistant_conversations
-- Stores conversations with AI assistants
-- =====================================================
CREATE TABLE IF NOT EXISTS assistant_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assistant_id UUID NOT NULL REFERENCES ai_assistants(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Conversation details
  title TEXT, -- Auto-generated or user-provided
  status TEXT DEFAULT 'active', -- 'active', 'archived'

  -- Context
  context_data JSONB DEFAULT '{}'::jsonb, -- Additional context for this conversation

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_status CHECK (status IN ('active', 'archived'))
);

-- =====================================================
-- TABLE: assistant_messages
-- Stores individual messages in conversations
-- =====================================================
CREATE TABLE IF NOT EXISTS assistant_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES assistant_conversations(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Message details
  role TEXT NOT NULL, -- 'user', 'assistant', 'system'
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb, -- Model used, tokens, etc.

  -- Attachments
  attachments JSONB DEFAULT '[]'::jsonb, -- Array of file references

  -- Feedback
  rating INTEGER, -- 1-5 stars
  feedback TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_role CHECK (role IN ('user', 'assistant', 'system')),
  CONSTRAINT valid_rating CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5))
);

-- =====================================================
-- TABLE: assistant_role_templates
-- Pre-configured templates for different assistant roles
-- =====================================================
CREATE TABLE IF NOT EXISTS assistant_role_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Template info
  name TEXT NOT NULL,
  description TEXT,
  role TEXT NOT NULL,
  avatar_emoji TEXT DEFAULT '🤖',
  category TEXT, -- 'business', 'creative', 'technical', 'support'

  -- Default configuration
  default_instructions TEXT NOT NULL,
  default_personality JSONB DEFAULT '[]'::jsonb,
  default_tone TEXT DEFAULT 'professional',
  default_verbosity TEXT DEFAULT 'balanced',
  default_capabilities JSONB DEFAULT '[]'::jsonb,

  -- Example use cases
  use_cases JSONB DEFAULT '[]'::jsonb, -- Array of example use cases
  example_prompts JSONB DEFAULT '[]'::jsonb, -- Array of example prompts to try

  -- Template metadata
  is_popular BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX idx_ai_assistants_org ON ai_assistants(organization_id);
CREATE INDEX idx_ai_assistants_user ON ai_assistants(user_id);
CREATE INDEX idx_ai_assistants_role ON ai_assistants(role);
CREATE INDEX idx_ai_assistants_enabled ON ai_assistants(enabled) WHERE enabled = true;
CREATE INDEX idx_ai_assistants_public ON ai_assistants(is_public) WHERE is_public = true;

CREATE INDEX idx_conversations_assistant ON assistant_conversations(assistant_id);
CREATE INDEX idx_conversations_user ON assistant_conversations(user_id);
CREATE INDEX idx_conversations_org ON assistant_conversations(organization_id);
CREATE INDEX idx_conversations_status ON assistant_conversations(status);

CREATE INDEX idx_messages_conversation ON assistant_messages(conversation_id);
CREATE INDEX idx_messages_created ON assistant_messages(created_at DESC);

CREATE INDEX idx_role_templates_category ON assistant_role_templates(category);
CREATE INDEX idx_role_templates_popular ON assistant_role_templates(is_popular) WHERE is_popular = true;

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================
ALTER TABLE ai_assistants ENABLE ROW LEVEL SECURITY;
ALTER TABLE assistant_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE assistant_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE assistant_role_templates ENABLE ROW LEVEL SECURITY;

-- AI Assistants Policies
CREATE POLICY "Users can view their organization's assistants"
  ON ai_assistants FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
    OR (is_public = true AND organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    ))
  );

CREATE POLICY "Users can create assistants in their organization"
  ON ai_assistants FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
    AND user_id = auth.uid()
  );

CREATE POLICY "Users can update their own assistants"
  ON ai_assistants FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own assistants"
  ON ai_assistants FOR DELETE
  USING (user_id = auth.uid());

-- Conversations Policies
CREATE POLICY "Users can view their own conversations"
  ON assistant_conversations FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create conversations"
  ON assistant_conversations FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own conversations"
  ON assistant_conversations FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own conversations"
  ON assistant_conversations FOR DELETE
  USING (user_id = auth.uid());

-- Messages Policies
CREATE POLICY "Users can view messages from their conversations"
  ON assistant_messages FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM assistant_conversations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert messages"
  ON assistant_messages FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their messages"
  ON assistant_messages FOR UPDATE
  USING (
    conversation_id IN (
      SELECT id FROM assistant_conversations WHERE user_id = auth.uid()
    )
  );

-- Role Templates Policies (public read)
CREATE POLICY "Anyone can view role templates"
  ON assistant_role_templates FOR SELECT
  USING (true);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to update conversation timestamp
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE assistant_conversations
  SET
    last_message_at = NEW.created_at,
    updated_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update conversation timestamp on new message
CREATE TRIGGER update_conversation_on_message
  AFTER INSERT ON assistant_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_timestamp();

-- Function to update assistant usage stats
CREATE OR REPLACE FUNCTION update_assistant_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.role = 'user' THEN
      UPDATE ai_assistants
      SET
        total_messages = total_messages + 1,
        last_used_at = NEW.created_at,
        updated_at = NEW.created_at
      WHERE id = (
        SELECT assistant_id FROM assistant_conversations WHERE id = NEW.conversation_id
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update assistant stats
CREATE TRIGGER update_assistant_stats_trigger
  AFTER INSERT ON assistant_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_assistant_stats();

-- =====================================================
-- SEED DATA: Role Templates
-- =====================================================
INSERT INTO assistant_role_templates (name, description, role, avatar_emoji, category, default_instructions, default_personality, default_tone, default_verbosity, default_capabilities, use_cases, example_prompts, is_popular) VALUES

-- Business Category
(
  'Marketing Assistant',
  'Expert in marketing strategy, content creation, and campaign planning',
  'marketing',
  '📢',
  'business',
  'You are a marketing expert with deep knowledge of digital marketing, content strategy, SEO, social media, and campaign planning. Help users create effective marketing materials, develop strategies, and optimize their marketing efforts. Be creative yet data-driven in your recommendations.',
  '["creative", "strategic", "data-driven", "persuasive"]'::jsonb,
  'professional',
  'balanced',
  '["content_creation", "strategy_planning", "data_analysis", "trend_analysis"]'::jsonb,
  '["Create marketing campaigns", "Write ad copy", "Develop content calendars", "Analyze marketing metrics", "Plan social media strategy"]'::jsonb,
  '["Help me create a marketing campaign for our new product", "Write compelling ad copy for Facebook ads", "Develop a content calendar for Q1"]'::jsonb,
  true
),

(
  'Sales Assistant',
  'Helps with sales strategy, pitch creation, and customer communication',
  'sales',
  '💼',
  'business',
  'You are a sales professional who helps craft compelling pitches, handle objections, develop sales strategies, and improve customer communication. Focus on understanding customer needs and providing value-driven solutions.',
  '["persuasive", "empathetic", "goal-oriented", "strategic"]'::jsonb,
  'professional',
  'balanced',
  '["pitch_creation", "objection_handling", "strategy_planning", "crm_integration"]'::jsonb,
  '["Create sales pitches", "Handle customer objections", "Develop sales scripts", "Analyze sales pipeline", "Improve closing rates"]'::jsonb,
  '["Help me create a pitch for enterprise clients", "How should I handle price objections?", "Write a follow-up email after demo"]'::jsonb,
  true
),

(
  'Project Management Assistant',
  'Helps plan, organize, and track projects effectively',
  'project_management',
  '📋',
  'business',
  'You are an experienced project manager who helps with project planning, task breakdown, timeline creation, risk management, and team coordination. Use proven methodologies like Agile, Scrum, and Waterfall appropriately.',
  '["organized", "detail-oriented", "proactive", "strategic"]'::jsonb,
  'professional',
  'detailed',
  '["task_planning", "timeline_creation", "risk_assessment", "resource_allocation"]'::jsonb,
  '["Create project plans", "Break down complex projects", "Manage timelines", "Assess risks", "Coordinate teams"]'::jsonb,
  '["Help me create a project plan for a new feature", "Break down this project into sprints", "What are the risks in this timeline?"]'::jsonb,
  true
),

-- Technical Category
(
  'Code Review Assistant',
  'Reviews code for quality, security, and best practices',
  'code_review',
  '👨‍💻',
  'technical',
  'You are a senior software engineer who reviews code for quality, security vulnerabilities, performance issues, and adherence to best practices. Provide constructive feedback with specific suggestions for improvement. Focus on maintainability, readability, and scalability.',
  '["detail-oriented", "analytical", "constructive", "knowledgeable"]'::jsonb,
  'professional',
  'detailed',
  '["code_analysis", "security_audit", "performance_optimization", "best_practices"]'::jsonb,
  '["Review code quality", "Identify security issues", "Suggest performance improvements", "Check for best practices", "Provide refactoring suggestions"]'::jsonb,
  '["Review this React component for issues", "Check this API endpoint for security vulnerabilities", "How can I optimize this database query?"]'::jsonb,
  true
),

(
  'Data Analysis Assistant',
  'Helps analyze data, create visualizations, and extract insights',
  'data_analysis',
  '📊',
  'technical',
  'You are a data analyst who helps interpret data, create meaningful visualizations, perform statistical analysis, and extract actionable insights. Explain complex data concepts in simple terms and recommend appropriate analysis methods.',
  '["analytical", "detail-oriented", "clear", "insightful"]'::jsonb,
  'professional',
  'detailed',
  '["data_analysis", "visualization", "statistical_analysis", "insight_extraction"]'::jsonb,
  '["Analyze datasets", "Create visualizations", "Perform statistical tests", "Extract insights", "Build dashboards"]'::jsonb,
  '["Help me analyze this sales data", "What visualization would work best for this data?", "Perform a statistical analysis of customer trends"]'::jsonb,
  true
),

(
  'Research Assistant',
  'Conducts thorough research and synthesizes information',
  'research',
  '🔍',
  'technical',
  'You are a research specialist who helps gather information, analyze sources, synthesize findings, and present comprehensive research summaries. Be thorough, cite sources when possible, and provide balanced perspectives on topics.',
  '["thorough", "analytical", "objective", "organized"]'::jsonb,
  'professional',
  'detailed',
  '["research", "source_analysis", "synthesis", "fact_checking"]'::jsonb,
  '["Conduct market research", "Analyze competitors", "Summarize academic papers", "Research industry trends", "Gather data on topics"]'::jsonb,
  '["Research our top 5 competitors", "Summarize the latest trends in AI", "Find data on market size for SaaS products"]'::jsonb,
  true
),

-- Creative Category
(
  'Content Writing Assistant',
  'Creates engaging written content for various purposes',
  'writing',
  '✍️',
  'creative',
  'You are a skilled content writer who creates engaging, well-structured content for blogs, articles, social media, emails, and more. Adapt your writing style to match the audience and purpose. Focus on clarity, engagement, and SEO best practices.',
  '["creative", "engaging", "clear", "adaptable"]'::jsonb,
  'friendly',
  'balanced',
  '["content_creation", "copywriting", "editing", "seo_optimization"]'::jsonb,
  '["Write blog posts", "Create social media content", "Draft emails", "Write product descriptions", "Edit and improve content"]'::jsonb,
  '["Write a blog post about productivity tips", "Create engaging LinkedIn posts", "Draft an email announcement for new feature"]'::jsonb,
  true
),

(
  'Creative Brainstorming Assistant',
  'Generates creative ideas and solutions',
  'custom',
  '💡',
  'creative',
  'You are a creative thinking partner who helps generate innovative ideas, explore possibilities, and think outside the box. Use techniques like brainstorming, mind mapping, and lateral thinking to help users discover creative solutions.',
  '["creative", "open-minded", "energetic", "inspiring"]'::jsonb,
  'creative',
  'balanced',
  '["brainstorming", "ideation", "creative_thinking", "problem_solving"]'::jsonb,
  '["Generate product ideas", "Brainstorm campaign concepts", "Explore solutions to problems", "Create naming ideas", "Develop creative strategies"]'::jsonb,
  '["Help me brainstorm names for my new app", "Generate creative marketing campaign ideas", "What are some innovative features we could add?"]'::jsonb,
  false
),

-- Support Category
(
  'Customer Support Assistant',
  'Helps handle customer inquiries and support tickets',
  'customer_support',
  '🎧',
  'support',
  'You are a customer support specialist who helps craft empathetic, helpful responses to customer inquiries. Focus on understanding customer needs, providing clear solutions, and maintaining a positive tone even in difficult situations.',
  '["empathetic", "patient", "helpful", "clear"]'::jsonb,
  'empathetic',
  'balanced',
  '["support_tickets", "faq_creation", "response_templates", "escalation_handling"]'::jsonb,
  '["Draft support responses", "Create FAQ content", "Handle escalations", "Improve response templates", "Analyze support trends"]'::jsonb,
  '["Help me respond to this customer complaint", "Create an FAQ for common issues", "Draft an apology email for service disruption"]'::jsonb,
  true
),

(
  'HR & People Assistant',
  'Assists with HR tasks, team management, and employee communication',
  'hr',
  '👥',
  'business',
  'You are an HR professional who helps with recruitment, employee communication, policy guidance, and people management. Provide advice that is fair, compliant with best practices, and focused on creating a positive work environment.',
  '["empathetic", "fair", "professional", "supportive"]'::jsonb,
  'professional',
  'balanced',
  '["recruitment", "communication", "policy_guidance", "team_building"]'::jsonb,
  '["Draft job descriptions", "Create onboarding plans", "Handle employee communications", "Develop team-building activities", "Provide policy guidance"]'::jsonb,
  '["Help me write a job description for a senior developer", "Create an onboarding checklist", "Draft an announcement about policy changes"]'::jsonb,
  false
),

(
  'Finance & Budgeting Assistant',
  'Helps with financial planning, budgeting, and analysis',
  'finance',
  '💰',
  'business',
  'You are a financial advisor who helps with budgeting, financial planning, expense analysis, and basic financial modeling. Provide clear, actionable financial advice while noting when professional financial consultation is recommended.',
  '["analytical", "detail-oriented", "prudent", "clear"]'::jsonb,
  'professional',
  'detailed',
  '["budget_planning", "expense_analysis", "financial_modeling", "forecasting"]'::jsonb,
  '["Create budgets", "Analyze expenses", "Build financial models", "Forecast revenue", "Optimize spending"]'::jsonb,
  '["Help me create a marketing budget for Q1", "Analyze our monthly expenses", "Build a revenue forecast model"]'::jsonb,
  false
),

(
  'Legal Document Assistant',
  'Helps draft and review legal documents and contracts',
  'legal',
  '⚖️',
  'business',
  'You are a legal assistant who helps draft and review documents, contracts, and policies. Provide general guidance but always recommend consulting qualified legal professionals for important legal matters. Focus on clarity and standard best practices.',
  '["precise", "thorough", "careful", "clear"]'::jsonb,
  'formal',
  'detailed',
  '["document_drafting", "contract_review", "policy_creation", "legal_research"]'::jsonb,
  '["Draft contracts", "Review agreements", "Create policies", "Summarize legal documents", "Provide general legal guidance"]'::jsonb,
  '["Help me draft an NDA template", "Review this service agreement", "Create a privacy policy outline"]'::jsonb,
  false
);

-- =====================================================
-- HELPFUL QUERIES (for reference)
-- =====================================================

-- Get most popular assistants
-- SELECT * FROM ai_assistants
-- WHERE is_public = true
-- ORDER BY total_messages DESC, total_conversations DESC
-- LIMIT 10;

-- Get user's active conversations with message count
-- SELECT
--   c.id,
--   c.title,
--   a.name as assistant_name,
--   COUNT(m.id) as message_count,
--   MAX(m.created_at) as last_message
-- FROM assistant_conversations c
-- JOIN ai_assistants a ON c.assistant_id = a.id
-- LEFT JOIN assistant_messages m ON c.id = m.conversation_id
-- WHERE c.user_id = 'USER_ID' AND c.status = 'active'
-- GROUP BY c.id, c.title, a.name
-- ORDER BY last_message DESC;

-- Get conversation with full message history
-- SELECT
--   m.id,
--   m.role,
--   m.content,
--   m.created_at,
--   m.rating
-- FROM assistant_messages m
-- WHERE m.conversation_id = 'CONVERSATION_ID'
-- ORDER BY m.created_at ASC;
