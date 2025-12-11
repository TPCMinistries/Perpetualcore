-- Stripe Webhook Idempotency Table
-- Tracks processed webhook events to prevent duplicate processing

CREATE TABLE IF NOT EXISTS stripe_webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id TEXT UNIQUE NOT NULL,  -- Stripe event ID (e.g., evt_xxx)
    event_type TEXT NOT NULL,        -- Event type (e.g., checkout.session.completed)
    status TEXT NOT NULL DEFAULT 'processed', -- processed, failed
    error_message TEXT,              -- Error details if failed
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookups by event_id
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_event_id
ON stripe_webhook_events(event_id);

-- Index for querying by status (useful for monitoring/retry logic)
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_status
ON stripe_webhook_events(status, processed_at DESC);

-- Clean up old events after 30 days (optional, run via cron job)
-- This keeps the table small while maintaining sufficient audit history
-- DELETE FROM stripe_webhook_events WHERE processed_at < NOW() - INTERVAL '30 days';

-- RLS policies
ALTER TABLE stripe_webhook_events ENABLE ROW LEVEL SECURITY;

-- Only service role can access this table (no user access needed)
CREATE POLICY "Service role only for webhook events"
ON stripe_webhook_events
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

COMMENT ON TABLE stripe_webhook_events IS 'Tracks processed Stripe webhook events for idempotency';
COMMENT ON COLUMN stripe_webhook_events.event_id IS 'Stripe event ID from webhook payload';
COMMENT ON COLUMN stripe_webhook_events.event_type IS 'Type of Stripe event (e.g., checkout.session.completed)';
COMMENT ON COLUMN stripe_webhook_events.status IS 'Processing status: processed or failed';
