-- Partner/Affiliate Program Infrastructure
-- Enables recurring commission tracking with multi-tier structure

-- Create partners table
CREATE TABLE IF NOT EXISTS partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Partner details
  partner_name TEXT NOT NULL,
  partner_email TEXT NOT NULL,
  partner_type TEXT NOT NULL CHECK (partner_type IN ('individual', 'agency', 'reseller')),

  -- Commission tier
  tier TEXT NOT NULL DEFAULT 'affiliate' CHECK (tier IN ('affiliate', 'partner', 'enterprise')),
  commission_rate DECIMAL(5, 2) NOT NULL DEFAULT 20.00, -- Percentage
  commission_duration_months INTEGER NOT NULL DEFAULT 12, -- How long commissions paid

  -- Referral tracking
  referral_code TEXT NOT NULL UNIQUE,
  referral_link TEXT NOT NULL,

  -- Stats
  total_referrals INTEGER DEFAULT 0,
  active_referrals INTEGER DEFAULT 0,
  total_earnings DECIMAL(10, 2) DEFAULT 0,
  pending_payout DECIMAL(10, 2) DEFAULT 0,

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'terminated')),
  approved_at TIMESTAMPTZ,
  suspended_reason TEXT,

  -- Payout details
  payout_method TEXT DEFAULT 'stripe' CHECK (payout_method IN ('stripe', 'paypal', 'wire')),
  payout_email TEXT,
  stripe_account_id TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create partner_referrals table
CREATE TABLE IF NOT EXISTS partner_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,

  -- Customer details
  customer_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  customer_email TEXT NOT NULL,

  -- Subscription details
  subscription_id TEXT, -- Stripe subscription ID
  plan_name TEXT NOT NULL,
  plan_price DECIMAL(10, 2) NOT NULL,

  -- Commission details
  commission_rate DECIMAL(5, 2) NOT NULL, -- Rate at time of referral
  commission_duration_months INTEGER NOT NULL, -- Locked in at referral time
  commission_start_date TIMESTAMPTZ NOT NULL,
  commission_end_date TIMESTAMPTZ NOT NULL,

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'churned', 'refunded')),
  activated_at TIMESTAMPTZ,
  churned_at TIMESTAMPTZ,

  -- Tracking
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  landing_page TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create partner_commissions table
CREATE TABLE IF NOT EXISTS partner_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  referral_id UUID NOT NULL REFERENCES partner_referrals(id) ON DELETE CASCADE,

  -- Period
  billing_period_start TIMESTAMPTZ NOT NULL,
  billing_period_end TIMESTAMPTZ NOT NULL,

  -- Commission details
  subscription_revenue DECIMAL(10, 2) NOT NULL,
  commission_rate DECIMAL(5, 2) NOT NULL,
  commission_amount DECIMAL(10, 2) NOT NULL,

  -- Payment tracking
  payout_id UUID REFERENCES partner_payouts(id) ON DELETE SET NULL,

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'cancelled')),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint
  UNIQUE(referral_id, billing_period_start)
);

-- Create partner_payouts table
CREATE TABLE IF NOT EXISTS partner_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,

  -- Payout details
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',

  -- Period covered
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,

  -- Commissions included
  commission_ids UUID[] NOT NULL,

  -- Payment method
  payout_method TEXT NOT NULL CHECK (payout_method IN ('stripe', 'paypal', 'wire')),
  payout_email TEXT,

  -- Stripe/PayPal tracking
  stripe_transfer_id TEXT,
  paypal_transaction_id TEXT,

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  failure_reason TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Create partner_tier_requirements table
CREATE TABLE IF NOT EXISTS partner_tier_requirements (
  tier TEXT PRIMARY KEY CHECK (tier IN ('affiliate', 'partner', 'enterprise')),

  -- Requirements
  min_monthly_referrals INTEGER NOT NULL,
  min_arr DECIMAL(10, 2) NOT NULL,

  -- Benefits
  commission_rate DECIMAL(5, 2) NOT NULL,
  commission_duration_months INTEGER NOT NULL,

  -- Features
  priority_support BOOLEAN DEFAULT false,
  co_marketing BOOLEAN DEFAULT false,
  white_label BOOLEAN DEFAULT false,
  dedicated_manager BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default tier requirements
INSERT INTO partner_tier_requirements (tier, min_monthly_referrals, min_arr, commission_rate, commission_duration_months, priority_support, co_marketing, white_label, dedicated_manager)
VALUES
  ('affiliate', 0, 0, 20.00, 12, false, false, false, false),
  ('partner', 5, 5000, 25.00, 24, true, true, false, false),
  ('enterprise', 10, 50000, 30.00, 36, true, true, true, true)
ON CONFLICT (tier) DO NOTHING;

-- Create indexes
CREATE INDEX idx_partners_user ON partners(user_id);
CREATE INDEX idx_partners_referral_code ON partners(referral_code);
CREATE INDEX idx_partners_tier ON partners(tier);
CREATE INDEX idx_partners_status ON partners(status);

CREATE INDEX idx_partner_referrals_partner ON partner_referrals(partner_id);
CREATE INDEX idx_partner_referrals_customer ON partner_referrals(customer_user_id);
CREATE INDEX idx_partner_referrals_status ON partner_referrals(status);
CREATE INDEX idx_partner_referrals_created ON partner_referrals(created_at DESC);

CREATE INDEX idx_partner_commissions_partner ON partner_commissions(partner_id);
CREATE INDEX idx_partner_commissions_referral ON partner_commissions(referral_id);
CREATE INDEX idx_partner_commissions_status ON partner_commissions(status);
CREATE INDEX idx_partner_commissions_period ON partner_commissions(billing_period_start);

CREATE INDEX idx_partner_payouts_partner ON partner_payouts(partner_id);
CREATE INDEX idx_partner_payouts_status ON partner_payouts(status);
CREATE INDEX idx_partner_payouts_period ON partner_payouts(period_start);

-- Create updated_at triggers
CREATE TRIGGER partners_updated_at
  BEFORE UPDATE ON partners
  FOR EACH ROW
  EXECUTE FUNCTION update_api_updated_at();

CREATE TRIGGER partner_referrals_updated_at
  BEFORE UPDATE ON partner_referrals
  FOR EACH ROW
  EXECUTE FUNCTION update_api_updated_at();

CREATE TRIGGER partner_commissions_updated_at
  BEFORE UPDATE ON partner_commissions
  FOR EACH ROW
  EXECUTE FUNCTION update_api_updated_at();

CREATE TRIGGER partner_tier_requirements_updated_at
  BEFORE UPDATE ON partner_tier_requirements
  FOR EACH ROW
  EXECUTE FUNCTION update_api_updated_at();

-- RLS Policies
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_tier_requirements ENABLE ROW LEVEL SECURITY;

-- Partners policies
CREATE POLICY "Partners can view their own profile"
  ON partners
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Partners can update their own profile"
  ON partners
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Referrals policies
CREATE POLICY "Partners can view their referrals"
  ON partner_referrals
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM partners
      WHERE partners.id = partner_referrals.partner_id
      AND partners.user_id = auth.uid()
    )
  );

-- Commissions policies
CREATE POLICY "Partners can view their commissions"
  ON partner_commissions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM partners
      WHERE partners.id = partner_commissions.partner_id
      AND partners.user_id = auth.uid()
    )
  );

-- Payouts policies
CREATE POLICY "Partners can view their payouts"
  ON partner_payouts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM partners
      WHERE partners.id = partner_payouts.partner_id
      AND partners.user_id = auth.uid()
    )
  );

-- Tier requirements policies (read-only for all authenticated users)
CREATE POLICY "Anyone can view tier requirements"
  ON partner_tier_requirements
  FOR SELECT
  TO authenticated
  USING (true);

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate partner tier based on performance
CREATE OR REPLACE FUNCTION calculate_partner_tier(p_partner_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_monthly_referrals INTEGER;
  v_arr DECIMAL(10, 2);
  v_new_tier TEXT;
BEGIN
  -- Calculate monthly referrals (last 30 days)
  SELECT COUNT(*)
  INTO v_monthly_referrals
  FROM partner_referrals
  WHERE partner_id = p_partner_id
    AND status = 'active'
    AND activated_at >= NOW() - INTERVAL '30 days';

  -- Calculate ARR (annual recurring revenue from active referrals)
  SELECT COALESCE(SUM(plan_price * 12), 0)
  INTO v_arr
  FROM partner_referrals
  WHERE partner_id = p_partner_id
    AND status = 'active';

  -- Determine tier (check from highest to lowest)
  IF v_monthly_referrals >= 10 AND v_arr >= 50000 THEN
    v_new_tier := 'enterprise';
  ELSIF v_monthly_referrals >= 5 AND v_arr >= 5000 THEN
    v_new_tier := 'partner';
  ELSE
    v_new_tier := 'affiliate';
  END IF;

  RETURN v_new_tier;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate monthly commissions
CREATE OR REPLACE FUNCTION calculate_partner_commissions(
  p_period_start TIMESTAMPTZ,
  p_period_end TIMESTAMPTZ
)
RETURNS VOID AS $$
DECLARE
  r RECORD;
  v_commission_amount DECIMAL(10, 2);
BEGIN
  -- Loop through all active referrals that should generate commissions
  FOR r IN
    SELECT
      pr.id as referral_id,
      pr.partner_id,
      pr.plan_price,
      pr.commission_rate,
      pr.commission_start_date,
      pr.commission_end_date
    FROM partner_referrals pr
    WHERE pr.status = 'active'
      AND pr.commission_start_date <= p_period_end
      AND pr.commission_end_date >= p_period_start
  LOOP
    -- Calculate commission amount
    v_commission_amount := r.plan_price * (r.commission_rate / 100);

    -- Insert commission record
    INSERT INTO partner_commissions (
      partner_id,
      referral_id,
      billing_period_start,
      billing_period_end,
      subscription_revenue,
      commission_rate,
      commission_amount,
      status
    ) VALUES (
      r.partner_id,
      r.referral_id,
      p_period_start,
      p_period_end,
      r.plan_price,
      r.commission_rate,
      v_commission_amount,
      'approved'
    )
    ON CONFLICT (referral_id, billing_period_start) DO NOTHING;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE partners IS 'Partner/affiliate program members';
COMMENT ON TABLE partner_referrals IS 'Customers referred by partners';
COMMENT ON TABLE partner_commissions IS 'Monthly recurring commissions for partners';
COMMENT ON TABLE partner_payouts IS 'Partner payout records';
COMMENT ON TABLE partner_tier_requirements IS 'Partner tier definitions and requirements';
