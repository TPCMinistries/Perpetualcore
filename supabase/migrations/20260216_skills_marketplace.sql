-- Skills Marketplace v2: Reviews, ratings, and security scanning pipeline
-- Phase 6 of OpenClaw Competitive Upgrade

-- Skill reviews and ratings
CREATE TABLE IF NOT EXISTS skill_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  skill_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(skill_id, user_id) -- One review per user per skill
);

CREATE INDEX idx_skill_reviews_skill
  ON skill_reviews(skill_id, rating);

CREATE INDEX idx_skill_reviews_user
  ON skill_reviews(user_id);

ALTER TABLE skill_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_reviews" ON skill_reviews
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "anyone_can_read_reviews" ON skill_reviews
  FOR SELECT USING (true);

CREATE POLICY "service_role_reviews" ON skill_reviews
  FOR ALL USING (auth.role() = 'service_role');

-- Skill submissions for marketplace review pipeline
CREATE TABLE IF NOT EXISTS skill_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  skill_id TEXT NOT NULL,
  submitter_id UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'approved', 'rejected')),
  skill_manifest JSONB DEFAULT '{}', -- Full skill definition for review
  reviewer_notes TEXT,
  security_scan_result JSONB DEFAULT '{}', -- Automated scan results
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

CREATE INDEX idx_skill_submissions_status
  ON skill_submissions(status, submitted_at);

CREATE INDEX idx_skill_submissions_submitter
  ON skill_submissions(submitter_id);

ALTER TABLE skill_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "submitters_own_submissions" ON skill_submissions
  FOR ALL USING (auth.uid() = submitter_id);

CREATE POLICY "service_role_submissions" ON skill_submissions
  FOR ALL USING (auth.role() = 'service_role');

-- Skill install tracking (for install counts and trending)
CREATE TABLE IF NOT EXISTS skill_installs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  skill_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  installed_at TIMESTAMPTZ DEFAULT NOW(),
  uninstalled_at TIMESTAMPTZ,
  UNIQUE(skill_id, user_id)
);

CREATE INDEX idx_skill_installs_skill
  ON skill_installs(skill_id)
  WHERE uninstalled_at IS NULL;

ALTER TABLE skill_installs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_installs" ON skill_installs
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "service_role_installs" ON skill_installs
  FOR ALL USING (auth.role() = 'service_role');

-- Aggregated skill stats view for marketplace display
CREATE OR REPLACE VIEW skill_stats AS
SELECT
  skill_id,
  COUNT(DISTINCT si.user_id) FILTER (WHERE si.uninstalled_at IS NULL) as install_count,
  COALESCE(AVG(sr.rating), 0) as avg_rating,
  COUNT(DISTINCT sr.id) as review_count
FROM skill_installs si
FULL OUTER JOIN skill_reviews sr USING (skill_id)
GROUP BY skill_id;

COMMENT ON TABLE skill_reviews IS 'User reviews and ratings for marketplace skills';
COMMENT ON TABLE skill_submissions IS 'Skills submitted for marketplace review with security scanning';
COMMENT ON TABLE skill_installs IS 'Track skill installations for trending and analytics';
