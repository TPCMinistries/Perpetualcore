-- =====================================================
-- AUTOMATION TABLES FOR n8n INTEGRATION
-- Tables: expenses, reminders, telegram_interactions, automation_logs
-- =====================================================

-- Expenses Table (for Telegram expense tracking)
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  amount DECIMAL(12, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  category TEXT NOT NULL, -- food, transport, utilities, entertainment, business, personal, other
  description TEXT,
  merchant TEXT,

  date DATE DEFAULT CURRENT_DATE,
  receipt_url TEXT,

  source TEXT DEFAULT 'manual', -- manual, telegram, n8n, import
  source_message_id TEXT, -- Original Telegram message ID if from Telegram

  tags TEXT[] DEFAULT '{}',
  is_recurring BOOLEAN DEFAULT false,
  recurring_frequency TEXT, -- daily, weekly, monthly, yearly

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reminders Table (standalone reminders from Telegram)
CREATE TABLE IF NOT EXISTS reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  title TEXT NOT NULL,
  description TEXT,

  remind_at TIMESTAMPTZ NOT NULL,
  reminder_type TEXT DEFAULT 'once', -- once, daily, weekly, monthly

  status TEXT DEFAULT 'pending', -- pending, sent, snoozed, completed, cancelled
  snoozed_until TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  notification_channels TEXT[] DEFAULT ARRAY['telegram'], -- telegram, email, push

  source TEXT DEFAULT 'manual', -- manual, telegram, n8n, calendar
  source_message_id TEXT,

  priority TEXT DEFAULT 'medium', -- low, medium, high, urgent

  linked_task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  linked_event_id UUID REFERENCES calendar_events(id) ON DELETE SET NULL,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Telegram Interactions Table (logs all Telegram bot activity)
CREATE TABLE IF NOT EXISTS telegram_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  telegram_user_id TEXT NOT NULL,
  telegram_chat_id TEXT NOT NULL,
  telegram_message_id TEXT,

  message_text TEXT NOT NULL,
  message_type TEXT DEFAULT 'text', -- text, voice, photo, document, command

  detected_intent TEXT, -- task, idea, expense, reminder, search, chat, content, unknown
  intent_confidence DECIMAL(3, 2), -- 0.00 to 1.00

  ai_response TEXT,
  response_sent_at TIMESTAMPTZ,

  -- What was created from this interaction
  created_entity_type TEXT, -- task, idea, expense, reminder, content, document
  created_entity_id UUID,

  processing_time_ms INTEGER,
  workflow_execution_id TEXT, -- n8n execution ID

  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Automation Logs Table (tracks all automation executions)
CREATE TABLE IF NOT EXISTS automation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  automation_type TEXT NOT NULL, -- n8n, bot, workflow, scheduled_job, webhook
  automation_name TEXT NOT NULL,
  automation_id TEXT, -- n8n workflow ID or internal bot ID
  execution_id TEXT, -- n8n execution ID

  status TEXT NOT NULL, -- started, running, success, failed, cancelled
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,

  trigger_type TEXT, -- schedule, webhook, manual, event
  trigger_source TEXT, -- telegram, api, cron, user

  input_data JSONB,
  output_data JSONB,
  error_message TEXT,
  error_details JSONB,

  items_processed INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Content Queue Table (for content approval workflow)
CREATE TABLE IF NOT EXISTS content_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  title TEXT NOT NULL,
  content_type TEXT NOT NULL, -- social, blog, newsletter, video_script, email
  platform TEXT, -- linkedin, twitter, instagram, youtube, website, email

  draft_content TEXT,
  final_content TEXT,

  status TEXT DEFAULT 'draft', -- draft, review, approved, scheduled, posted, failed

  ai_generated BOOLEAN DEFAULT false,
  ai_prompt TEXT,
  ai_model TEXT,

  scheduled_for TIMESTAMPTZ,
  posted_at TIMESTAMPTZ,
  post_url TEXT,

  source TEXT DEFAULT 'manual', -- manual, telegram, n8n, ai
  source_idea_id UUID REFERENCES ideas(id) ON DELETE SET NULL,

  approval_requested_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,

  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_expenses_user ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_source ON expenses(source);

CREATE INDEX IF NOT EXISTS idx_reminders_user ON reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_remind_at ON reminders(remind_at);
CREATE INDEX IF NOT EXISTS idx_reminders_status ON reminders(status);

CREATE INDEX IF NOT EXISTS idx_telegram_interactions_user ON telegram_interactions(telegram_user_id);
CREATE INDEX IF NOT EXISTS idx_telegram_interactions_intent ON telegram_interactions(detected_intent);
CREATE INDEX IF NOT EXISTS idx_telegram_interactions_created ON telegram_interactions(created_at);

CREATE INDEX IF NOT EXISTS idx_automation_logs_org ON automation_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_automation_logs_status ON automation_logs(status);
CREATE INDEX IF NOT EXISTS idx_automation_logs_type ON automation_logs(automation_type);
CREATE INDEX IF NOT EXISTS idx_automation_logs_created ON automation_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_content_queue_user ON content_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_content_queue_status ON content_queue(status);
CREATE INDEX IF NOT EXISTS idx_content_queue_scheduled ON content_queue(scheduled_for);

-- Enable RLS
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE telegram_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policies for expenses
CREATE POLICY "Users can view their own expenses" ON expenses
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own expenses" ON expenses
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own expenses" ON expenses
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own expenses" ON expenses
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for reminders
CREATE POLICY "Users can view their own reminders" ON reminders
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own reminders" ON reminders
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own reminders" ON reminders
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own reminders" ON reminders
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for telegram_interactions
CREATE POLICY "Users can view their own telegram_interactions" ON telegram_interactions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service can insert telegram_interactions" ON telegram_interactions
  FOR INSERT WITH CHECK (true);

-- RLS Policies for automation_logs
CREATE POLICY "Users can view org automation_logs" ON automation_logs
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );
CREATE POLICY "Service can insert automation_logs" ON automation_logs
  FOR INSERT WITH CHECK (true);

-- RLS Policies for content_queue
CREATE POLICY "Users can view their own content_queue" ON content_queue
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own content_queue" ON content_queue
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own content_queue" ON content_queue
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own content_queue" ON content_queue
  FOR DELETE USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reminders_updated_at
  BEFORE UPDATE ON reminders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_queue_updated_at
  BEFORE UPDATE ON content_queue
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
