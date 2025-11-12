# Autonomous Task Execution System

## Overview

This system transforms tasks from **passive tracking** (AI finds tasks) to **active execution** (AI completes tasks autonomously).

### Current State → Future State

**Before (Passive):**
- User: "Draft email to customer about product delay"
- AI: *Creates task* "Draft email..."
- User: *Manually drafts email*

**After (Autonomous):**
- User: "Draft email to customer about product delay"
- AI: *Creates task, recognizes it's executable, drafts the email, marks complete*
- User: *Reviews and sends*

## Architecture

### Three-Tier System

```
┌─────────────┐
│   TASKS     │  Simple, atomic work items
└──────┬──────┘
       │ assigned_to
┌──────▼──────┐
│  WORKFLOWS  │  Multi-step automation (email drafting, report generation)
└──────┬──────┘
       │ uses
┌──────▼──────┐
│   AGENTS    │  AI with tools (browser, APIs, integrations)
└─────────────┘
```

### Phase 1: Enhanced Task System (✅ COMPLETE)

**Database Schema** (`supabase/migrations/20250112_enhanced_task_execution.sql`):

New columns added to `tasks` table:
- `execution_type`: manual | semi_automated | fully_automated
- `execution_status`: pending | queued | in_progress | paused | blocked | completed | failed
- `assigned_to_type`: user | agent | workflow
- `assigned_to_id`: UUID reference
- `workflow_id`: Links to workflow (Phase 2)
- `agent_id`: Links to AI agent (Phase 3)
- `execution_log`: JSONB array of execution events
- `automation_rules`: JSONB conditions for auto-execution
- `ai_confidence`: 0.0-1.0 score from extraction
- `ai_context`: Text explanation
- `parent_task_id`: For task decomposition
- `started_at`, `blocked_at`, `failed_at`: Timestamps
- `blocked_reason`, `failure_reason`: Text explanations
- `retry_count`, `max_retries`: Failure handling
- `estimated_duration_minutes`, `actual_duration_minutes`: Effort tracking

**Helper Functions:**
- `add_execution_log_entry(task_id, log_entry)`: Append to execution history
- `get_executable_tasks(org_id, execution_type)`: Find tasks ready for AI
- `start_task_execution(task_id, executor_id, executor_type)`: Mark started
- `complete_task_execution(task_id, result_data)`: Mark completed with result
- `fail_task_execution(task_id, error, should_retry)`: Handle failures
- `block_task_execution(task_id, reason)`: Block tasks needing human input
- `create_subtask(parent_id, ...)`: Decompose complex tasks

**API Updates** (`app/api/tasks/route.ts`, `lib/tasks/extractor.ts`):
- Updated to support all new fields
- AI extraction now saves `ai_confidence` and `ai_context`
- Tasks created with `execution_log` tracking
- Retry logic built in

**TypeScript Types** (`types/task.ts`):
- Complete type definitions for enhanced schema
- `Task`, `CreateTaskInput`, `UpdateTaskInput` interfaces
- `ExecutionLogEntry`, `AutomationRule` types

### Phase 2: Workflows (✅ DEMONSTRATION COMPLETE)

**Execution API** (`app/api/tasks/execute/route.ts`):

**POST /api/tasks/execute**
- Takes `taskId`
- AI analyzes if task is executable
- Three execution strategies:
  1. **Immediate**: AI can do it now (draft email, create outline, summarize notes)
  2. **Decompose**: Break into subtasks (complex projects → smaller tasks)
  3. **Blocked**: Needs human action (purchases, calendar access)
- Logs all execution events
- Handles retries automatically

**GET /api/tasks/execute**
- Returns all executable tasks for organization
- Filters by `execution_status: pending/queued`
- Prioritizes by urgency

**Example Usage:**

```typescript
// Execute a single task
const response = await fetch('/api/tasks/execute', {
  method: 'POST',
  body: JSON.stringify({ taskId: '123...' })
});

// Result for immediate execution:
{
  success: true,
  strategy: "immediate",
  result: "Subject: Update on Product Delivery\n\nDear Customer...",
  message: "Task executed successfully"
}

// Result for decomposition:
{
  success: true,
  strategy: "decompose",
  subtasks: [
    { title: "Research competitors", execution_type: "manual" },
    { title: "Create budget spreadsheet", execution_type: "semi_automated" },
    { title: "Draft campaign outline", execution_type: "fully_automated" }
  ],
  message: "Task decomposed into 3 subtasks"
}

// Result for blocked:
{
  success: false,
  strategy: "blocked",
  reason: "Requires access to payment system",
  message: "Task blocked - requires human action"
}
```

### Phase 3: AI Agents with Tools (🚧 TODO)

**Planned Features:**
- Browser automation (Playwright/Puppeteer)
- API integrations:
  - Gmail: Send emails
  - Slack: Post messages
  - Calendar: Schedule meetings
  - CRM: Update records
- Multi-step reasoning
- Tool use with function calling

**Example Agent:**
```typescript
interface Agent {
  id: string;
  name: string;
  capabilities: string[];  // ['email', 'browser', 'slack']
  system_instructions: string;
  tools: Tool[];
}

interface Tool {
  name: string;
  description: string;
  parameters: JSONSchema;
  execute: (params: any) => Promise<any>;
}
```

### Phase 4: Autonomous Loop (🚧 TODO)

**Planned Features:**
- Agents create tasks proactively
- Self-improving through feedback
- Fully autonomous work cycles

**Example Flow:**
1. Agent monitors calendar
2. Detects meeting tomorrow with no agenda
3. Creates task: "Draft meeting agenda"
4. Executes task: Generates agenda from context
5. Creates follow-up task: "Send agenda to attendees"
6. Executes task: Emails agenda
7. All done without human intervention

## Execution Types

### Manual
- Human executes entirely
- AI just tracks the task
- Example: "Call customer about complaint"

### Semi-Automated
- AI assists, human approves
- AI drafts, human reviews and sends
- Example: "Draft response to customer email"

### Fully Automated
- AI executes entirely
- Human reviews afterwards
- Example: "Extract action items from meeting notes"

## Execution Statuses

| Status | Description | Next States |
|--------|-------------|-------------|
| `pending` | Not started yet | `queued`, `in_progress` |
| `queued` | Waiting for agent/workflow | `in_progress` |
| `in_progress` | Currently executing | `completed`, `failed`, `paused`, `blocked` |
| `paused` | Temporarily stopped | `in_progress`, `completed`, `failed` |
| `blocked` | Waiting for dependency/approval | `in_progress`, `failed` |
| `completed` | Successfully finished | (final state) |
| `failed` | Error occurred, retries exhausted | (final state) |

## Execution Log

Every state change is logged in `execution_log` JSONB field:

```json
[
  {
    "event": "started",
    "executor_id": "uuid",
    "executor_type": "workflow",
    "timestamp": "2025-01-12T10:00:00Z"
  },
  {
    "event": "completed",
    "result": {
      "strategy": "immediate",
      "output": "Email draft: Subject...",
      "confidence": 0.95
    },
    "timestamp": "2025-01-12T10:00:15Z"
  }
]
```

## Integration with Existing Features

### AI Chat
- Extracts tasks from conversations
- Marks executable tasks as `semi_automated` or `fully_automated`
- Queues for autonomous execution

### Calendar
- Extracts meeting action items
- Auto-creates follow-up tasks
- Drafts meeting summaries

### Email
- Extracts tasks from emails
- Drafts responses automatically
- Queues for review/send

## Killer Features

1. **Smart Task Routing**
   - Manual: Human does it
   - Semi-auto: AI drafts, human approves
   - Fully-auto: AI completes, human reviews

2. **Autonomous Execution**
   - AI decides if it can execute
   - Breaks down complex tasks
   - Handles failures gracefully

3. **Proactive Creation**
   - AI notices missing tasks
   - Creates and executes without asking
   - Example: Pre-meeting prep, post-meeting follow-up

4. **Learning Loop**
   - Tracks confidence scores
   - Learns from user feedback
   - Improves execution over time

## Example Scenarios

### Scenario 1: Simple Email Draft
```
User: "Draft email to john@example.com thanking him for the meeting"
→ AI creates task with execution_type: fully_automated
→ AI recognizes: "I can draft this email"
→ AI executes: Generates professional thank-you email
→ Status: completed
→ User reviews and sends (or AI sends if approved)
```

### Scenario 2: Complex Project
```
User: "Plan Q4 marketing campaign"
→ AI creates task with execution_type: semi_automated
→ AI recognizes: "This is too complex for one task"
→ AI decomposes into:
   - Research competitor campaigns (manual)
   - Create budget spreadsheet (semi_automated)
   - Draft campaign outline (fully_automated)
   - Design mockups (manual)
→ AI executes automated subtasks
→ User handles manual subtasks
```

### Scenario 3: Blocked Task
```
User: "Order new office chairs"
→ AI creates task with execution_type: manual
→ AI recognizes: "I don't have access to purchasing system"
→ Status: blocked
→ Reason: "Requires access to procurement portal"
→ User takes over
```

## Next Steps

### Immediate (This Week)
1. ✅ Phase 1: Enhanced schema deployed
2. ✅ Demonstration API built
3. ⏳ UI updates to show execution status
4. ⏳ Test with real tasks

### Short-term (Next 2 Weeks)
1. Build simple workflows:
   - Email drafting
   - Report generation
   - Meeting summarization
2. Add execution UI:
   - "Execute Task" button
   - Execution log viewer
   - Subtask visualization

### Medium-term (Next Month)
1. Phase 3: Build AI agents with tools
2. Gmail integration for sending emails
3. Slack integration for posting messages
4. Browser automation for web tasks

### Long-term (Next Quarter)
1. Phase 4: Autonomous loop
2. Proactive task creation
3. Self-improving agents
4. Full autonomous work cycles

## Technical Debt
- Need to add RLS policies for agent/workflow access
- Need to create `workflows` and `agents` tables
- Need to build tool execution framework
- Need to add feedback/rating system for AI executions
