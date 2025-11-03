-- Marketplace Infrastructure
-- Allows users to buy/sell custom AI agents and workflows
-- Platform takes 30% commission on all sales

-- Create marketplace_items table
CREATE TABLE IF NOT EXISTS marketplace_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Item details
  type TEXT NOT NULL CHECK (type IN ('agent', 'workflow')),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  long_description TEXT,

  -- Pricing
  pricing_type TEXT NOT NULL CHECK (pricing_type IN ('one_time', 'subscription')),
  price DECIMAL(10, 2) NOT NULL,
  subscription_interval TEXT CHECK (subscription_interval IN ('monthly', 'yearly')),

  -- Media
  thumbnail_url TEXT,
  images TEXT[] DEFAULT '{}',
  demo_video_url TEXT,

  -- Metadata
  category TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  features JSONB DEFAULT '[]'::jsonb,

  -- Configuration (stored as JSON)
  config JSONB NOT NULL,

  -- Stats
  total_sales INTEGER DEFAULT 0,
  total_revenue DECIMAL(10, 2) DEFAULT 0,
  average_rating DECIMAL(3, 2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,

  -- Status
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_review', 'approved', 'rejected', 'archived')),
  rejection_reason TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ,

  -- Indexes for search
  search_vector tsvector
);

-- Create marketplace_purchases table
CREATE TABLE IF NOT EXISTS marketplace_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES marketplace_items(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  buyer_organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Purchase details
  purchase_type TEXT NOT NULL CHECK (purchase_type IN ('one_time', 'subscription')),
  price_paid DECIMAL(10, 2) NOT NULL,
  platform_commission DECIMAL(10, 2) NOT NULL, -- 30%
  creator_payout DECIMAL(10, 2) NOT NULL, -- 70%

  -- Subscription info
  stripe_subscription_id TEXT,
  subscription_status TEXT CHECK (subscription_status IN ('active', 'canceled', 'expired')),
  subscription_end_date TIMESTAMPTZ,

  -- Status
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'refunded')),
  refund_reason TEXT,
  refunded_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create marketplace_reviews table
CREATE TABLE IF NOT EXISTS marketplace_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES marketplace_items(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  purchase_id UUID NOT NULL REFERENCES marketplace_purchases(id) ON DELETE CASCADE,

  -- Review content
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  comment TEXT,

  -- Response from creator
  creator_response TEXT,
  creator_responded_at TIMESTAMPTZ,

  -- Status
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'hidden', 'flagged')),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent duplicate reviews
  UNIQUE(item_id, reviewer_id)
);

-- Create marketplace_payouts table
CREATE TABLE IF NOT EXISTS marketplace_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Payout details
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',

  -- Period
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,

  -- Purchases included
  purchase_ids UUID[] NOT NULL,

  -- Stripe info
  stripe_transfer_id TEXT,
  stripe_payout_id TEXT,

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  failure_reason TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Create indexes
CREATE INDEX idx_marketplace_items_creator ON marketplace_items(creator_id);
CREATE INDEX idx_marketplace_items_status ON marketplace_items(status);
CREATE INDEX idx_marketplace_items_type ON marketplace_items(type);
CREATE INDEX idx_marketplace_items_category ON marketplace_items(category);
CREATE INDEX idx_marketplace_items_rating ON marketplace_items(average_rating DESC);
CREATE INDEX idx_marketplace_items_sales ON marketplace_items(total_sales DESC);
CREATE INDEX idx_marketplace_items_search ON marketplace_items USING gin(search_vector);

CREATE INDEX idx_marketplace_purchases_buyer ON marketplace_purchases(buyer_id);
CREATE INDEX idx_marketplace_purchases_item ON marketplace_purchases(item_id);
CREATE INDEX idx_marketplace_purchases_created ON marketplace_purchases(created_at DESC);

CREATE INDEX idx_marketplace_reviews_item ON marketplace_reviews(item_id);
CREATE INDEX idx_marketplace_reviews_rating ON marketplace_reviews(rating);

CREATE INDEX idx_marketplace_payouts_creator ON marketplace_payouts(creator_id);
CREATE INDEX idx_marketplace_payouts_status ON marketplace_payouts(status);

-- Create search vector update trigger
CREATE OR REPLACE FUNCTION update_marketplace_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW.tags, ' '), '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER marketplace_items_search_vector_update
  BEFORE INSERT OR UPDATE ON marketplace_items
  FOR EACH ROW
  EXECUTE FUNCTION update_marketplace_search_vector();

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_marketplace_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER marketplace_items_updated_at
  BEFORE UPDATE ON marketplace_items
  FOR EACH ROW
  EXECUTE FUNCTION update_marketplace_updated_at();

CREATE TRIGGER marketplace_purchases_updated_at
  BEFORE UPDATE ON marketplace_purchases
  FOR EACH ROW
  EXECUTE FUNCTION update_marketplace_updated_at();

CREATE TRIGGER marketplace_reviews_updated_at
  BEFORE UPDATE ON marketplace_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_marketplace_updated_at();

-- RLS Policies
ALTER TABLE marketplace_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_payouts ENABLE ROW LEVEL SECURITY;

-- Marketplace items policies
CREATE POLICY "Anyone can view approved marketplace items"
  ON marketplace_items
  FOR SELECT
  TO authenticated, anon
  USING (status = 'approved');

CREATE POLICY "Creators can view their own items"
  ON marketplace_items
  FOR SELECT
  TO authenticated
  USING (creator_id = auth.uid());

CREATE POLICY "Creators can create items"
  ON marketplace_items
  FOR INSERT
  TO authenticated
  WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Creators can update their own items"
  ON marketplace_items
  FOR UPDATE
  TO authenticated
  USING (creator_id = auth.uid())
  WITH CHECK (creator_id = auth.uid());

-- Purchase policies
CREATE POLICY "Buyers can view their purchases"
  ON marketplace_purchases
  FOR SELECT
  TO authenticated
  USING (buyer_id = auth.uid());

CREATE POLICY "Creators can view purchases of their items"
  ON marketplace_purchases
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM marketplace_items
      WHERE marketplace_items.id = marketplace_purchases.item_id
      AND marketplace_items.creator_id = auth.uid()
    )
  );

-- Review policies
CREATE POLICY "Anyone can view published reviews"
  ON marketplace_reviews
  FOR SELECT
  TO authenticated, anon
  USING (status = 'published');

CREATE POLICY "Buyers can create reviews for purchased items"
  ON marketplace_reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (
    reviewer_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM marketplace_purchases
      WHERE marketplace_purchases.id = purchase_id
      AND marketplace_purchases.buyer_id = auth.uid()
    )
  );

-- Payout policies
CREATE POLICY "Creators can view their payouts"
  ON marketplace_payouts
  FOR SELECT
  TO authenticated
  USING (creator_id = auth.uid());

-- Comments
COMMENT ON TABLE marketplace_items IS 'Marketplace listings for AI agents and workflows';
COMMENT ON TABLE marketplace_purchases IS 'Purchase history and subscription tracking';
COMMENT ON TABLE marketplace_reviews IS 'User reviews and ratings for marketplace items';
COMMENT ON TABLE marketplace_payouts IS 'Creator payout tracking (70% of sales after 30% platform commission)';
