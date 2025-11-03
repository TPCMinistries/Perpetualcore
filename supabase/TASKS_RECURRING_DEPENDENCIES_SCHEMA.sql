-- =====================================================
-- RECURRING TASKS & DEPENDENCIES SCHEMA
-- Extends the base tasks schema with recurrence and dependency features
-- =====================================================

-- Add recurrence fields to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurrence_pattern JSONB;
-- recurrence_pattern structure:
-- {
--   "frequency": "daily" | "weekly" | "monthly" | "yearly",
--   "interval": 1, // every N days/weeks/months
--   "daysOfWeek": [0, 1, 2, 3, 4, 5, 6], // for weekly (0=Sunday)
--   "dayOfMonth": 15, // for monthly
--   "monthOfYear": 6, // for yearly
--   "endDate": "2024-12-31", // optional end date
--   "endAfterOccurrences": 10, // optional max occurrences
--   "skipWeekends": false
-- }

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurrence_parent_id UUID REFERENCES tasks(id) ON DELETE CASCADE;
-- If this is an instance of a recurring task, points to the parent template

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurrence_instance_date DATE;
-- The specific date this recurring instance is for

-- Task Dependencies table
CREATE TABLE IF NOT EXISTS task_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Dependency relationship
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  -- The task that depends on another

  depends_on_task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  -- The task that must be completed first

  dependency_type TEXT DEFAULT 'finish_to_start',
  -- Types: 'finish_to_start', 'start_to_start', 'finish_to_finish', 'start_to_finish'

  lag_days INTEGER DEFAULT 0,
  -- Optional lag/lead time in days (can be negative for lead time)

  is_hard BOOLEAN DEFAULT true,
  -- Hard dependency (blocks start) vs soft dependency (just a warning)

  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Prevent circular dependencies
  CONSTRAINT no_self_dependency CHECK (task_id != depends_on_task_id),
  -- Prevent duplicate dependencies
  CONSTRAINT unique_dependency UNIQUE (task_id, depends_on_task_id)
);

-- Recurring Task Templates table
-- Stores the master template for recurring tasks
CREATE TABLE IF NOT EXISTS recurring_task_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Template details
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'medium',
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  project_name TEXT,
  tags TEXT[],

  -- Recurrence configuration
  recurrence_pattern JSONB NOT NULL,

  -- When this template is active
  start_date DATE NOT NULL,
  end_date DATE, -- Optional end date

  -- Task generation settings
  generate_days_ahead INTEGER DEFAULT 30,
  -- How many days in advance to generate instances

  is_active BOOLEAN DEFAULT true,
  last_generated_date DATE,
  -- Track when we last generated instances

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Track generated recurring task instances
CREATE TABLE IF NOT EXISTS recurring_task_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES recurring_task_templates(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  instance_date DATE NOT NULL,

  -- If user skipped this instance
  is_skipped BOOLEAN DEFAULT false,
  skip_reason TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_instance UNIQUE (template_id, instance_date)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tasks_recurring ON tasks(is_recurring) WHERE is_recurring = true;
CREATE INDEX IF NOT EXISTS idx_tasks_recurrence_parent ON tasks(recurrence_parent_id) WHERE recurrence_parent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_task_dependencies_task ON task_dependencies(task_id);
CREATE INDEX IF NOT EXISTS idx_task_dependencies_depends_on ON task_dependencies(depends_on_task_id);
CREATE INDEX IF NOT EXISTS idx_recurring_templates_active ON recurring_task_templates(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_recurring_instances_template ON recurring_task_instances(template_id);
CREATE INDEX IF NOT EXISTS idx_recurring_instances_task ON recurring_task_instances(task_id);

-- RLS Policies
ALTER TABLE task_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_task_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_task_instances ENABLE ROW LEVEL SECURITY;

-- Task dependencies policies
CREATE POLICY "Users can view dependencies in their org"
  ON task_dependencies FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles p
      WHERE p.user_id = auth.uid()
      AND p.organization_id = task_dependencies.organization_id
    )
  );

CREATE POLICY "Users can create dependencies in their org"
  ON task_dependencies FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles p
      WHERE p.user_id = auth.uid()
      AND p.organization_id = task_dependencies.organization_id
    )
  );

CREATE POLICY "Users can delete dependencies in their org"
  ON task_dependencies FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles p
      WHERE p.user_id = auth.uid()
      AND p.organization_id = task_dependencies.organization_id
    )
  );

-- Recurring templates policies
CREATE POLICY "Users can view recurring templates in their org"
  ON recurring_task_templates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles p
      WHERE p.user_id = auth.uid()
      AND p.organization_id = recurring_task_templates.organization_id
    )
  );

CREATE POLICY "Users can create their own recurring templates"
  ON recurring_task_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recurring templates"
  ON recurring_task_templates FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recurring templates"
  ON recurring_task_templates FOR DELETE
  USING (auth.uid() = user_id);

-- Recurring instances policies
CREATE POLICY "Users can view recurring instances in their org"
  ON recurring_task_instances FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM recurring_task_templates t
      JOIN user_profiles p ON p.organization_id = t.organization_id
      WHERE t.id = recurring_task_instances.template_id
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create recurring instances"
  ON recurring_task_instances FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM recurring_task_templates t
      JOIN user_profiles p ON p.organization_id = t.organization_id
      WHERE t.id = recurring_task_instances.template_id
      AND p.user_id = auth.uid()
    )
  );

-- Function to check for circular dependencies
CREATE OR REPLACE FUNCTION check_circular_dependency(
  p_task_id UUID,
  p_depends_on_task_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  visited_tasks UUID[];
  current_task UUID;
  dependent_tasks UUID[];
BEGIN
  -- Start with the task we're trying to add dependency to
  visited_tasks := ARRAY[p_task_id];
  current_task := p_depends_on_task_id;

  -- Follow the dependency chain
  LOOP
    -- If we've seen this task before, we have a cycle
    IF current_task = ANY(visited_tasks) THEN
      RETURN TRUE; -- Circular dependency found
    END IF;

    -- Add current task to visited
    visited_tasks := array_append(visited_tasks, current_task);

    -- Get tasks that current_task depends on
    SELECT array_agg(depends_on_task_id) INTO dependent_tasks
    FROM task_dependencies
    WHERE task_id = current_task;

    -- If no dependencies, we're done
    IF dependent_tasks IS NULL OR array_length(dependent_tasks, 1) IS NULL THEN
      RETURN FALSE; -- No circular dependency
    END IF;

    -- Continue with first dependency (simplified check)
    current_task := dependent_tasks[1];
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to generate recurring task instances
CREATE OR REPLACE FUNCTION generate_recurring_task_instances(
  p_template_id UUID,
  p_generate_until_date DATE DEFAULT CURRENT_DATE + INTERVAL '30 days'
) RETURNS INTEGER AS $$
DECLARE
  template RECORD;
  instance_date DATE;
  task_id UUID;
  instances_created INTEGER := 0;
  pattern JSONB;
  frequency TEXT;
  interval_val INTEGER;
BEGIN
  -- Get template
  SELECT * INTO template FROM recurring_task_templates WHERE id = p_template_id AND is_active = true;

  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  pattern := template.recurrence_pattern;
  frequency := pattern->>'frequency';
  interval_val := COALESCE((pattern->>'interval')::INTEGER, 1);

  instance_date := COALESCE(template.last_generated_date, template.start_date);

  -- Generate instances
  WHILE instance_date <= p_generate_until_date LOOP
    -- Check if instance already exists
    IF NOT EXISTS (
      SELECT 1 FROM recurring_task_instances
      WHERE template_id = p_template_id AND instance_date = instance_date
    ) THEN
      -- Create task instance
      INSERT INTO tasks (
        organization_id, user_id, title, description, status, priority,
        assigned_to, project_name, tags, due_date, is_recurring, recurrence_parent_id, recurrence_instance_date
      ) VALUES (
        template.organization_id, template.user_id, template.title, template.description,
        'todo', template.priority, template.assigned_to, template.project_name, template.tags,
        instance_date::TIMESTAMPTZ, true, p_template_id, instance_date
      ) RETURNING id INTO task_id;

      -- Track the instance
      INSERT INTO recurring_task_instances (template_id, task_id, instance_date)
      VALUES (p_template_id, task_id, instance_date);

      instances_created := instances_created + 1;
    END IF;

    -- Calculate next instance date based on frequency
    IF frequency = 'daily' THEN
      instance_date := instance_date + (interval_val || ' days')::INTERVAL;
    ELSIF frequency = 'weekly' THEN
      instance_date := instance_date + (interval_val || ' weeks')::INTERVAL;
    ELSIF frequency = 'monthly' THEN
      instance_date := instance_date + (interval_val || ' months')::INTERVAL;
    ELSIF frequency = 'yearly' THEN
      instance_date := instance_date + (interval_val || ' years')::INTERVAL;
    ELSE
      EXIT; -- Unknown frequency
    END IF;

    -- Stop if we've passed the template end date
    IF template.end_date IS NOT NULL AND instance_date > template.end_date THEN
      EXIT;
    END IF;
  END LOOP;

  -- Update last generated date
  UPDATE recurring_task_templates
  SET last_generated_date = p_generate_until_date
  WHERE id = p_template_id;

  RETURN instances_created;
END;
$$ LANGUAGE plpgsql;

-- Function to check if a task can start (all dependencies met)
CREATE OR REPLACE FUNCTION can_task_start(p_task_id UUID) RETURNS BOOLEAN AS $$
DECLARE
  dependency RECORD;
BEGIN
  -- Check all hard dependencies
  FOR dependency IN
    SELECT d.*, t.status as dep_status
    FROM task_dependencies d
    JOIN tasks t ON t.id = d.depends_on_task_id
    WHERE d.task_id = p_task_id AND d.is_hard = true
  LOOP
    -- For finish_to_start, dependent task must be completed
    IF dependency.dependency_type = 'finish_to_start' AND dependency.dep_status != 'completed' THEN
      RETURN FALSE;
    END IF;

    -- For start_to_start, dependent task must be started or completed
    IF dependency.dependency_type = 'start_to_start' AND dependency.dep_status = 'todo' THEN
      RETURN FALSE;
    END IF;
  END LOOP;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE task_dependencies IS 'Defines relationships between tasks for dependency management';
COMMENT ON TABLE recurring_task_templates IS 'Templates for generating recurring tasks automatically';
COMMENT ON TABLE recurring_task_instances IS 'Tracks individual instances of recurring tasks';
COMMENT ON FUNCTION check_circular_dependency IS 'Prevents circular task dependencies';
COMMENT ON FUNCTION generate_recurring_task_instances IS 'Generates task instances from a recurring template';
COMMENT ON FUNCTION can_task_start IS 'Checks if all hard dependencies are met for a task to start';
