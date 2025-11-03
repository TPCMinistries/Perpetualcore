-- Training System for AI OS Platform
-- Enables organizations to create training modules, track progress, and certify completion

-- Training Modules (Courses/Programs)
CREATE TABLE IF NOT EXISTS training_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Module details
  title TEXT NOT NULL,
  description TEXT,
  category TEXT, -- e.g., "Onboarding", "Compliance", "Product Training", "Sales Enablement"
  difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  estimated_duration_minutes INTEGER, -- Total estimated time

  -- Module configuration
  is_mandatory BOOLEAN DEFAULT false,
  requires_completion BOOLEAN DEFAULT true, -- Must complete all lessons
  passing_score_percentage INTEGER DEFAULT 80, -- For assessments
  certificate_enabled BOOLEAN DEFAULT true,

  -- Visibility and access
  is_published BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT false, -- Available to all in org
  assigned_roles TEXT[], -- Only specific roles can access

  -- Module content
  cover_image_url TEXT,
  tags TEXT[],

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ
);

-- Training Lessons (Individual units within modules)
CREATE TABLE IF NOT EXISTS training_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES training_modules(id) ON DELETE CASCADE,

  -- Lesson details
  title TEXT NOT NULL,
  description TEXT,
  lesson_order INTEGER NOT NULL, -- Order within module
  content_type TEXT NOT NULL CHECK (content_type IN ('document', 'video', 'quiz', 'interactive', 'external_link')),

  -- Content
  document_id UUID REFERENCES documents(id) ON DELETE SET NULL, -- Link to document
  content_url TEXT, -- External video, link, etc.
  content_text TEXT, -- Rich text content

  -- Lesson configuration
  estimated_duration_minutes INTEGER,
  is_required BOOLEAN DEFAULT true,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Training Enrollments (User assignments to modules)
CREATE TABLE IF NOT EXISTS training_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES training_modules(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Enrollment details
  enrolled_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Who assigned it
  enrollment_type TEXT NOT NULL CHECK (enrollment_type IN ('self_enrolled', 'assigned', 'mandatory')),

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('not_started', 'in_progress', 'completed', 'expired')),
  progress_percentage INTEGER DEFAULT 0,

  -- Dates
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  due_date TIMESTAMPTZ,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  UNIQUE(module_id, user_id)
);

-- Training Progress (Lesson completion tracking)
CREATE TABLE IF NOT EXISTS training_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES training_enrollments(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES training_lessons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Progress tracking
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'skipped')),
  completion_percentage INTEGER DEFAULT 0,
  time_spent_seconds INTEGER DEFAULT 0,

  -- Assessment results (if lesson has quiz)
  score_percentage INTEGER,
  passed BOOLEAN,
  attempts INTEGER DEFAULT 0,

  -- Timestamps
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  last_accessed_at TIMESTAMPTZ,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  UNIQUE(enrollment_id, lesson_id)
);

-- Training Assessments (Quizzes/Tests - optional)
CREATE TABLE IF NOT EXISTS training_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES training_lessons(id) ON DELETE CASCADE,

  -- Assessment details
  title TEXT NOT NULL,
  description TEXT,
  passing_score_percentage INTEGER DEFAULT 80,
  max_attempts INTEGER, -- NULL = unlimited
  time_limit_minutes INTEGER,

  -- Questions (stored as JSON)
  questions JSONB NOT NULL, -- Array of question objects

  -- Configuration
  randomize_questions BOOLEAN DEFAULT false,
  show_correct_answers BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Training Certificates (Completion certificates)
CREATE TABLE IF NOT EXISTS training_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES training_enrollments(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES training_modules(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Certificate details
  certificate_number TEXT UNIQUE NOT NULL,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- For recurring training

  -- Certificate data
  completion_data JSONB, -- Score, time taken, etc.
  certificate_url TEXT, -- Generated PDF URL

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_training_modules_organization_id ON training_modules(organization_id);
CREATE INDEX IF NOT EXISTS idx_training_modules_category ON training_modules(category);
CREATE INDEX IF NOT EXISTS idx_training_modules_is_published ON training_modules(is_published);

CREATE INDEX IF NOT EXISTS idx_training_lessons_module_id ON training_lessons(module_id);
CREATE INDEX IF NOT EXISTS idx_training_lessons_document_id ON training_lessons(document_id);
CREATE INDEX IF NOT EXISTS idx_training_lessons_order ON training_lessons(module_id, lesson_order);

CREATE INDEX IF NOT EXISTS idx_training_enrollments_user_id ON training_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_training_enrollments_module_id ON training_enrollments(module_id);
CREATE INDEX IF NOT EXISTS idx_training_enrollments_status ON training_enrollments(status);
CREATE INDEX IF NOT EXISTS idx_training_enrollments_due_date ON training_enrollments(due_date) WHERE due_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_training_progress_enrollment_id ON training_progress(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_training_progress_lesson_id ON training_progress(lesson_id);
CREATE INDEX IF NOT EXISTS idx_training_progress_user_id ON training_progress(user_id);

CREATE INDEX IF NOT EXISTS idx_training_certificates_user_id ON training_certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_training_certificates_module_id ON training_certificates(module_id);
CREATE INDEX IF NOT EXISTS idx_training_certificates_number ON training_certificates(certificate_number);

-- Enable Row Level Security
ALTER TABLE training_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_certificates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for training_modules
CREATE POLICY "Users can view modules in their organization"
  ON training_modules FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can create modules in their organization"
  ON training_modules FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update modules in their organization"
  ON training_modules FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete modules they created"
  ON training_modules FOR DELETE
  USING (created_by = auth.uid());

-- RLS Policies for training_lessons
CREATE POLICY "Users can view lessons for modules in their org"
  ON training_lessons FOR SELECT
  USING (
    module_id IN (
      SELECT id FROM training_modules WHERE organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Module creators can manage lessons"
  ON training_lessons FOR ALL
  USING (
    module_id IN (
      SELECT id FROM training_modules WHERE created_by = auth.uid()
    )
  );

-- RLS Policies for training_enrollments
CREATE POLICY "Users can view their own enrollments"
  ON training_enrollments FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can self-enroll in public modules"
  ON training_enrollments FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    enrollment_type = 'self_enrolled' AND
    module_id IN (SELECT id FROM training_modules WHERE is_public = true)
  );

CREATE POLICY "Users can update their own enrollments"
  ON training_enrollments FOR UPDATE
  USING (user_id = auth.uid());

-- RLS Policies for training_progress
CREATE POLICY "Users can view their own progress"
  ON training_progress FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own progress"
  ON training_progress FOR ALL
  USING (user_id = auth.uid());

-- RLS Policies for training_certificates
CREATE POLICY "Users can view their own certificates"
  ON training_certificates FOR SELECT
  USING (user_id = auth.uid());

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_training_modules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER training_modules_updated_at_trigger
  BEFORE UPDATE ON training_modules
  FOR EACH ROW
  EXECUTE FUNCTION update_training_modules_updated_at();

CREATE TRIGGER training_lessons_updated_at_trigger
  BEFORE UPDATE ON training_lessons
  FOR EACH ROW
  EXECUTE FUNCTION update_training_modules_updated_at();

-- Create view for module statistics
CREATE OR REPLACE VIEW training_module_stats AS
SELECT
  tm.id as module_id,
  tm.title,
  tm.category,
  COUNT(DISTINCT tl.id) as lesson_count,
  COUNT(DISTINCT te.id) as enrollment_count,
  COUNT(DISTINCT te.id) FILTER (WHERE te.status = 'completed') as completed_count,
  ROUND(AVG(te.progress_percentage), 2) as avg_progress_percentage,
  SUM(tl.estimated_duration_minutes) as total_duration_minutes
FROM training_modules tm
LEFT JOIN training_lessons tl ON tl.module_id = tm.id
LEFT JOIN training_enrollments te ON te.module_id = tm.id
GROUP BY tm.id, tm.title, tm.category;

-- Create function to auto-generate certificate numbers
CREATE OR REPLACE FUNCTION generate_certificate_number()
RETURNS TEXT AS $$
DECLARE
  cert_num TEXT;
BEGIN
  cert_num := 'CERT-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || UPPER(SUBSTRING(gen_random_uuid()::TEXT, 1, 8));
  RETURN cert_num;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE training_modules IS 'Training courses and programs';
COMMENT ON TABLE training_lessons IS 'Individual lessons within training modules';
COMMENT ON TABLE training_enrollments IS 'User enrollments and assignments to training modules';
COMMENT ON TABLE training_progress IS 'Detailed progress tracking for each lesson';
COMMENT ON TABLE training_assessments IS 'Quizzes and tests for training validation';
COMMENT ON TABLE training_certificates IS 'Completion certificates for training modules';
