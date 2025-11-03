-- Helper functions for Stripe webhook processing

-- Function to increment marketplace sales
CREATE OR REPLACE FUNCTION increment_marketplace_sales(
  p_item_id UUID,
  p_revenue DECIMAL(10, 2)
)
RETURNS VOID AS $$
BEGIN
  UPDATE marketplace_items
  SET
    total_sales = total_sales + 1,
    total_revenue = total_revenue + p_revenue,
    updated_at = NOW()
  WHERE id = p_item_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update partner earnings
CREATE OR REPLACE FUNCTION update_partner_earnings(
  p_partner_id UUID,
  p_amount DECIMAL(10, 2)
)
RETURNS VOID AS $$
BEGIN
  UPDATE partners
  SET
    total_earnings = total_earnings + p_amount,
    pending_payout = pending_payout + p_amount,
    updated_at = NOW()
  WHERE id = p_partner_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update marketplace item ratings
CREATE OR REPLACE FUNCTION update_marketplace_item_rating(
  p_item_id UUID
)
RETURNS VOID AS $$
DECLARE
  v_avg_rating DECIMAL(3, 2);
  v_review_count INTEGER;
BEGIN
  SELECT
    COALESCE(AVG(rating), 0),
    COUNT(*)
  INTO v_avg_rating, v_review_count
  FROM marketplace_reviews
  WHERE item_id = p_item_id
    AND status = 'published';

  UPDATE marketplace_items
  SET
    average_rating = v_avg_rating,
    review_count = v_review_count,
    updated_at = NOW()
  WHERE id = p_item_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update item ratings when reviews are added/updated
CREATE OR REPLACE FUNCTION trigger_update_item_rating()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM update_marketplace_item_rating(NEW.item_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER marketplace_reviews_rating_update
  AFTER INSERT OR UPDATE ON marketplace_reviews
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_item_rating();

-- Function to check partner tier eligibility and upgrade
CREATE OR REPLACE FUNCTION check_partner_tier_upgrades()
RETURNS VOID AS $$
DECLARE
  r RECORD;
  v_new_tier TEXT;
  v_tier_config RECORD;
BEGIN
  FOR r IN
    SELECT id, tier
    FROM partners
    WHERE status = 'active'
  LOOP
    -- Calculate new tier
    v_new_tier := calculate_partner_tier(r.id);

    -- If tier changed, update partner
    IF v_new_tier != r.tier THEN
      -- Get tier configuration
      SELECT *
      INTO v_tier_config
      FROM partner_tier_requirements
      WHERE tier = v_new_tier;

      -- Update partner
      UPDATE partners
      SET
        tier = v_new_tier,
        commission_rate = v_tier_config.commission_rate,
        commission_duration_months = v_tier_config.commission_duration_months,
        updated_at = NOW()
      WHERE id = r.id;

      -- Log tier upgrade
      INSERT INTO partner_tier_history (
        partner_id,
        old_tier,
        new_tier,
        upgraded_at
      ) VALUES (
        r.id,
        r.tier,
        v_new_tier,
        NOW()
      );
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create partner tier history table
CREATE TABLE IF NOT EXISTS partner_tier_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  old_tier TEXT NOT NULL,
  new_tier TEXT NOT NULL,
  upgraded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_partner_tier_history_partner ON partner_tier_history(partner_id);
CREATE INDEX idx_partner_tier_history_date ON partner_tier_history(upgraded_at DESC);

-- RLS for tier history
ALTER TABLE partner_tier_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partners can view their tier history"
  ON partner_tier_history
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM partners
      WHERE partners.id = partner_tier_history.partner_id
      AND partners.user_id = auth.uid()
    )
  );

-- Function to process monthly partner payouts
CREATE OR REPLACE FUNCTION process_partner_payouts(
  p_period_start TIMESTAMPTZ,
  p_period_end TIMESTAMPTZ,
  p_min_payout_amount DECIMAL(10, 2) DEFAULT 100.00
)
RETURNS INTEGER AS $$
DECLARE
  r RECORD;
  v_commission_ids UUID[];
  v_payout_id UUID;
  v_payouts_created INTEGER := 0;
BEGIN
  FOR r IN
    SELECT
      p.id as partner_id,
      p.payout_method,
      p.payout_email,
      SUM(pc.commission_amount) as total_amount,
      array_agg(pc.id) as commission_ids
    FROM partners p
    INNER JOIN partner_commissions pc ON pc.partner_id = p.id
    WHERE p.status = 'active'
      AND pc.status = 'approved'
      AND pc.payout_id IS NULL
      AND pc.billing_period_start >= p_period_start
      AND pc.billing_period_end <= p_period_end
    GROUP BY p.id, p.payout_method, p.payout_email
    HAVING SUM(pc.commission_amount) >= p_min_payout_amount
  LOOP
    -- Create payout record
    INSERT INTO partner_payouts (
      partner_id,
      amount,
      period_start,
      period_end,
      commission_ids,
      payout_method,
      payout_email,
      status
    ) VALUES (
      r.partner_id,
      r.total_amount,
      p_period_start,
      p_period_end,
      r.commission_ids,
      r.payout_method,
      r.payout_email,
      'pending'
    )
    RETURNING id INTO v_payout_id;

    -- Link commissions to payout
    UPDATE partner_commissions
    SET payout_id = v_payout_id
    WHERE id = ANY(r.commission_ids);

    -- Update partner pending payout
    UPDATE partners
    SET pending_payout = pending_payout - r.total_amount
    WHERE id = r.partner_id;

    v_payouts_created := v_payouts_created + 1;
  END LOOP;

  RETURN v_payouts_created;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON FUNCTION increment_marketplace_sales IS 'Increment sales counter and revenue for marketplace item';
COMMENT ON FUNCTION update_partner_earnings IS 'Update partner total earnings and pending payout';
COMMENT ON FUNCTION update_marketplace_item_rating IS 'Recalculate and update marketplace item average rating';
COMMENT ON FUNCTION check_partner_tier_upgrades IS 'Check all partners for tier upgrades based on performance';
COMMENT ON FUNCTION process_partner_payouts IS 'Create monthly payout records for partners';
