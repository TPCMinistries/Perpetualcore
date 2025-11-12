-- Migration: Enhanced Task Execution System
-- Transforms tasks from passive tracking to active autonomous execution
-- Phase 1: Foundation for Workflows and AI Agents

-- Add new columns for execution tracking
ALTER TABLE tasks
  -- Execution type determines automation level
  ADD COLUMN execution_type TEXT DEFAULT 'manual' CHECK (execution_type IN ('manual', 'semi_automated', 'fully_automated')),

  -- Agent/workflow assignment
  ADD COLUMN assigned_to_type TEXT CHECK (assigned_to_type IN ('user', 'agent', 'workflow')),
  ADD COLUMN assigned_to_id UUID,
  ADD COLUMN assigned_by UUID REFERENCES auth.users(id),

  -- Enhanced status for execution tracking
  ADD COLUMN execution_status TEXT DEFAULT 'pending' CHECK (execution_status IN ('pending', 'queued', 'in_progress', 'paused', 'blocked', 'completed', 'failed')),

  -- Execution metadata
  ADD COLUMN workflow_id UUID, -- Will reference workflows table (to be created)
  ADD COLUMN agent_id UUID,    -- Will reference agents table (to be created)
  ADD COLUMN execution_log JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN automation_rules JSONB,

  -- AI extraction confidence (restore from comments)
  ADD COLUMN ai_confidence NUMERIC(3,2) CHECK (ai_confidence >= 0 AND ai_confidence <= 1),
  ADD COLUMN ai_context TEXT,

  -- Task relationships for decomposition
  ADD COLUMN parent_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,

  -- Execution timing
  ADD COLUMN started_at TIMESTAMPTZ,
  ADD COLUMN blocked_at TIMESTAMPTZ,
  ADD COLUMN blocked_reason TEXT,
  ADD COLUMN failed_at TIMESTAMPTZ,
  ADD COLUMN failure_reason TEXT,
  ADD COLUMN retry_count INTEGER DEFAULT 0,
  ADD COLUMN max_retries INTEGER DEFAULT 3,

  -- Estimated effort (for AI to decide if it can execute)
  ADD COLUMN estimated_duration_minutes INTEGER,
  ADD COLUMN actual_duration_minutes INTEGER;

-- Create index for parent-child relationships
CREATE INDEX idx_tasks_parent_task_id ON tasks(parent_task_id);

-- Create index for agent/workflow queries
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to_id, assigned_to_type);
CREATE INDEX idx_tasks_workflow_id ON tasks(workflow_id);
CREATE INDEX idx_tasks_agent_id ON tasks(agent_id);

-- Create index for execution status queries
CREATE INDEX idx_tasks_execution_status ON tasks(execution_status);
CREATE INDEX idx_tasks_execution_type ON tasks(execution_type);

-- Add execution log helper function
CREATE OR REPLACE FUNCTION add_execution_log_entry(
  task_id UUID,
  log_entry JSONB
) RETURNS void AS $$
BEGIN
  UPDATE tasks
  SET execution_log = execution_log || jsonb_build_array(
    log_entry || jsonb_build_object('timestamp', NOW())
  )
  WHERE id = task_id;
END;
$$ LANGUAGE plpgsql;

-- Add function to get executable tasks (ready for AI agents)
CREATE OR REPLACE FUNCTION get_executable_tasks(
  for_organization_id UUID,
  execution_type_filter TEXT DEFAULT NULL
) RETURNS SETOF tasks AS $$
BEGIN
  RETURN QUERY
  SELECT t.*
  FROM tasks t
  WHERE t.organization_id = for_organization_id
    AND t.execution_status IN ('pending', 'queued')
    AND (execution_type_filter IS NULL OR t.execution_type = execution_type_filter)
    AND (t.due_date IS NULL OR t.due_date >= NOW())
    AND t.assigned_to_type IN ('agent', 'workflow')
  ORDER BY
    CASE t.priority
      WHEN 'urgent' THEN 1
      WHEN 'high' THEN 2
      WHEN 'medium' THEN 3
      WHEN 'low' THEN 4
    END,
    t.created_at ASC;
END;
$$ LANGUAGE plpgsql;

-- Add function to mark task as started by agent/workflow
CREATE OR REPLACE FUNCTION start_task_execution(
  task_id UUID,
  executor_id UUID,
  executor_type TEXT
) RETURNS void AS $$
BEGIN
  UPDATE tasks
  SET
    execution_status = 'in_progress',
    started_at = NOW(),
    assigned_to_id = executor_id,
    assigned_to_type = executor_type,
    execution_log = execution_log || jsonb_build_array(
      jsonb_build_object(
        'event', 'started',
        'executor_id', executor_id,
        'executor_type', executor_type,
        'timestamp', NOW()
      )
    )
  WHERE id = task_id;
END;
$$ LANGUAGE plpgsql;

-- Add function to complete task execution
CREATE OR REPLACE FUNCTION complete_task_execution(
  task_id UUID,
  result_data JSONB DEFAULT NULL
) RETURNS void AS $$
DECLARE
  task_started_at TIMESTAMPTZ;
BEGIN
  SELECT started_at INTO task_started_at
  FROM tasks
  WHERE id = task_id;

  UPDATE tasks
  SET
    execution_status = 'completed',
    status = 'completed',
    completed_at = NOW(),
    actual_duration_minutes = EXTRACT(EPOCH FROM (NOW() - task_started_at)) / 60,
    execution_log = execution_log || jsonb_build_array(
      jsonb_build_object(
        'event', 'completed',
        'result', result_data,
        'timestamp', NOW()
      )
    )
  WHERE id = task_id;
END;
$$ LANGUAGE plpgsql;

-- Add function to fail task execution
CREATE OR REPLACE FUNCTION fail_task_execution(
  task_id UUID,
  error_message TEXT,
  should_retry BOOLEAN DEFAULT TRUE
) RETURNS void AS $$
DECLARE
  current_retry_count INTEGER;
  max_retry_count INTEGER;
BEGIN
  SELECT retry_count, max_retries
  INTO current_retry_count, max_retry_count
  FROM tasks
  WHERE id = task_id;

  -- Decide if we should retry or permanently fail
  IF should_retry AND current_retry_count < max_retry_count THEN
    -- Retry: reset to queued
    UPDATE tasks
    SET
      execution_status = 'queued',
      retry_count = retry_count + 1,
      execution_log = execution_log || jsonb_build_array(
        jsonb_build_object(
          'event', 'failed_retrying',
          'error', error_message,
          'retry_count', current_retry_count + 1,
          'timestamp', NOW()
        )
      )
    WHERE id = task_id;
  ELSE
    -- Permanent failure
    UPDATE tasks
    SET
      execution_status = 'failed',
      failed_at = NOW(),
      failure_reason = error_message,
      execution_log = execution_log || jsonb_build_array(
        jsonb_build_object(
          'event', 'failed_permanently',
          'error', error_message,
          'timestamp', NOW()
        )
      )
    WHERE id = task_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Add function to block task execution (waiting for dependency/approval)
CREATE OR REPLACE FUNCTION block_task_execution(
  task_id UUID,
  reason TEXT
) RETURNS void AS $$
BEGIN
  UPDATE tasks
  SET
    execution_status = 'blocked',
    blocked_at = NOW(),
    blocked_reason = reason,
    execution_log = execution_log || jsonb_build_array(
      jsonb_build_object(
        'event', 'blocked',
        'reason', reason,
        'timestamp', NOW()
      )
    )
  WHERE id = task_id;
END;
$$ LANGUAGE plpgsql;

-- Add function to decompose task into subtasks
CREATE OR REPLACE FUNCTION create_subtask(
  parent_id UUID,
  subtask_title TEXT,
  subtask_description TEXT,
  subtask_priority TEXT DEFAULT 'medium',
  subtask_execution_type TEXT DEFAULT 'manual'
) RETURNS UUID AS $$
DECLARE
  parent_org_id UUID;
  parent_user_id UUID;
  new_task_id UUID;
BEGIN
  -- Get parent task's organization and user
  SELECT organization_id, user_id
  INTO parent_org_id, parent_user_id
  FROM tasks
  WHERE id = parent_id;

  -- Create subtask
  INSERT INTO tasks (
    organization_id,
    user_id,
    title,
    description,
    priority,
    execution_type,
    parent_task_id,
    source_type
  ) VALUES (
    parent_org_id,
    parent_user_id,
    subtask_title,
    subtask_description,
    subtask_priority,
    subtask_execution_type,
    parent_id,
    'automated'
  )
  RETURNING id INTO new_task_id;

  -- Log subtask creation on parent
  PERFORM add_execution_log_entry(
    parent_id,
    jsonb_build_object(
      'event', 'subtask_created',
      'subtask_id', new_task_id,
      'subtask_title', subtask_title
    )
  );

  RETURN new_task_id;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION add_execution_log_entry TO authenticated;
GRANT EXECUTE ON FUNCTION get_executable_tasks TO authenticated;
GRANT EXECUTE ON FUNCTION start_task_execution TO authenticated;
GRANT EXECUTE ON FUNCTION complete_task_execution TO authenticated;
GRANT EXECUTE ON FUNCTION fail_task_execution TO authenticated;
GRANT EXECUTE ON FUNCTION block_task_execution TO authenticated;
GRANT EXECUTE ON FUNCTION create_subtask TO authenticated;

-- Update RLS policies to allow agent access
-- Note: Will need to create service role policies for autonomous execution

COMMENT ON COLUMN tasks.execution_type IS 'manual: user executes, semi_automated: AI assists, fully_automated: AI executes autonomously';
COMMENT ON COLUMN tasks.execution_status IS 'pending: not started, queued: waiting for agent, in_progress: executing, paused: temporarily stopped, blocked: waiting for dependency, completed: done, failed: error';
COMMENT ON COLUMN tasks.execution_log IS 'Array of execution events with timestamps for audit trail';
COMMENT ON COLUMN tasks.automation_rules IS 'Conditions and triggers for automatic task execution';
