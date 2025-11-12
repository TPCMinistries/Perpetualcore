-- Add "Onboard New Employee" workflow template
-- This demonstrates Phase 4: Complex multi-step business workflows

INSERT INTO workflow_templates (
  name,
  description,
  category,
  icon,
  trigger_type,
  trigger_config,
  actions
) VALUES (
  'Onboard New Employee',
  'Complete employee onboarding process with automated and manual steps',
  'HR',
  '👥',
  'manual',
  '{}'::jsonb,
  '[
    {
      "type": "create_task",
      "config": {
        "title": "Create employee accounts (IT systems, email, Slack)",
        "description": "Set up all necessary IT accounts for the new employee",
        "priority": "high",
        "execution_type": "manual",
        "estimated_duration_minutes": 30
      }
    },
    {
      "type": "create_task",
      "config": {
        "title": "Send welcome email with first-day information",
        "description": "Email the new hire with start time, dress code, parking, and what to bring",
        "priority": "high",
        "execution_type": "fully_automated",
        "estimated_duration_minutes": 5
      }
    },
    {
      "type": "create_task",
      "config": {
        "title": "Schedule orientation meeting with HR",
        "description": "Book 1-hour orientation session to cover benefits, policies, and paperwork",
        "priority": "high",
        "execution_type": "semi_automated",
        "estimated_duration_minutes": 15
      }
    },
    {
      "type": "create_task",
      "config": {
        "title": "Assign onboarding buddy from their team",
        "description": "Match new employee with an experienced team member for mentorship",
        "priority": "medium",
        "execution_type": "manual",
        "estimated_duration_minutes": 10
      }
    },
    {
      "type": "create_task",
      "config": {
        "title": "Order equipment (laptop, monitor, peripherals)",
        "description": "Submit IT request for all necessary hardware",
        "priority": "high",
        "execution_type": "manual",
        "estimated_duration_minutes": 20
      }
    },
    {
      "type": "create_task",
      "config": {
        "title": "Enroll in required training modules",
        "description": "Sign up new hire for compliance training, security awareness, and role-specific courses",
        "priority": "medium",
        "execution_type": "semi_automated",
        "estimated_duration_minutes": 15
      }
    },
    {
      "type": "create_task",
      "config": {
        "title": "Set up first week check-in meeting",
        "description": "Schedule 30-min 1:1 with manager to discuss progress and answer questions",
        "priority": "medium",
        "execution_type": "fully_automated",
        "estimated_duration_minutes": 5
      }
    },
    {
      "type": "create_task",
      "config": {
        "title": "Add to team communication channels",
        "description": "Add employee to relevant Slack channels, email lists, and project boards",
        "priority": "medium",
        "execution_type": "manual",
        "estimated_duration_minutes": 10
      }
    }
  ]'::jsonb
)
ON CONFLICT DO NOTHING;
