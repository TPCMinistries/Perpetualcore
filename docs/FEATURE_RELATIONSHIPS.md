# Feature Relationships: Tasks, AI Agents, and Workflows

## Overview

This document clarifies how **Tasks**, **AI Agents**, and **Workflows** work together in the platform. They're distinct features with clear roles that complement each other.

---

## The Three Features

### 1. **Tasks** (Foundation)
**Location**: Dashboard → Tasks
**What it is**: Your central to-do list and work tracker
**What it does**:
- Lists all work items across your organization
- Tracks status (todo, in_progress, completed)
- Supports manual or autonomous execution
- Each task can be executed with AI assistance via the "Execute Task" button

**Example Tasks**:
- "Draft email to customer about product delay"
- "Review quarterly financial report"
- "Call supplier about inventory issue"

**Key Point**: Tasks are the **work items** themselves - the things you need to do.

---

### 2. **AI Agents** (Task Creators)
**Location**: Dashboard → AI Tools → AI Agents
**What it is**: Proactive assistants that monitor your work
**What it does**:
- Monitors your emails, calendar, documents
- **Automatically creates tasks** when it notices something needs to be done
- Acts as your intelligent assistant that pays attention for you
- **Does NOT execute work** - it creates tasks that appear in your Tasks page

**Example Flow**:
```
1. Agent monitors your inbox
2. Detects urgent email from customer
3. Creates task: "Reply to urgent customer email from Acme Corp"
4. Task appears in your Tasks page
5. You (or AI) execute the task
```

**Key Point**: Agents are **proactive task creators**, not task executors. They notice what needs to be done and create tasks automatically.

---

### 3. **Workflows** (Multi-Step Recipes)
**Location**: Dashboard → AI Tools → Workflows
**What it is**: Pre-defined multi-step automation sequences
**What it does**:
- Orchestrates complex, multi-step processes
- Can be triggered by tasks or agents
- Breaks down complex work into ordered steps
- Example: "Onboard New Employee" workflow with 10 sequential steps

**Example Workflow**: Email Campaign Creation
```
Step 1: Research target audience
Step 2: Draft email copy
Step 3: Design email template
Step 4: Set up automation rules
Step 5: Schedule send
```

**Key Point**: Workflows are **multi-step recipes** that can be invoked when a task requires orchestration across multiple actions.

---

## How They Work Together

### Complete Flow Example:

```
AI AGENT monitors calendar
  ↓
Detects meeting tomorrow with no agenda
  ↓
CREATES TASK: "Draft meeting agenda for Q4 planning"
  ↓
Task appears in TASKS page
  ↓
User clicks "Execute Task" button
  ↓
AI analyzes task complexity
  ↓
Simple task → AI drafts agenda immediately
Complex task → AI triggers WORKFLOW to break into steps
  ↓
Task marked "completed" in TASKS page
  ↓
Execution log shows what happened
```

### Another Example: Email Response

```
AI AGENT monitors email
  ↓
Detects customer complaint
  ↓
CREATES TASK: "Respond to customer complaint from Jane Smith"
  ↓
Task appears in TASKS page with "semi_automated" execution type
  ↓
AI can execute immediately (drafts response for your review)
  OR
  You execute manually (write response yourself)
  ↓
Task marked "completed"
```

---

## Key Distinctions

| Feature | Role | Example |
|---------|------|---------|
| **Task** | The work item | "Draft Q4 report" |
| **Agent** | Creates tasks automatically | Monitors Slack, notices urgent request, creates task |
| **Workflow** | Multi-step orchestration | "Quarterly reporting" workflow (gather data → draft → review → publish) |

---

## Visual Hierarchy

```
┌─────────────┐
│  AI AGENTS  │  ← Monitors your work (proactive)
└──────┬──────┘
       │ creates
       ▼
┌─────────────┐
│    TASKS    │  ← Central list of all work
└──────┬──────┘
       │ may trigger
       ▼
┌─────────────┐
│  WORKFLOWS  │  ← Multi-step automation recipes
└─────────────┘
```

---

## Common Misconceptions

### ❌ WRONG: "Agents execute my tasks"
✅ CORRECT: Agents **create** tasks. Tasks are executed by you or AI via the "Execute Task" button.

### ❌ WRONG: "Workflows are the same as tasks"
✅ CORRECT: Workflows are multi-step recipes that can be **triggered by** tasks when complexity requires orchestration.

### ❌ WRONG: "I need agents to use tasks"
✅ CORRECT: Tasks work independently. You can create tasks manually, via AI chat extraction, or via agents.

---

## Current Implementation Status

### ✅ Phase 1 & 2: Enhanced Tasks (COMPLETE)
- Database schema with execution tracking
- `/api/tasks/execute` endpoint
- UI with "Execute Task" buttons
- Execution log viewer
- Task decomposition into subtasks
- Three execution strategies: immediate, decompose, blocked

### 🚧 Phase 3: AI Agents (IN PROGRESS)
- Basic agent infrastructure exists
- **TODO**: Connect agents to task creation
- **TODO**: Implement monitoring triggers (email, calendar, documents)
- **TODO**: Build agent action → task creation flow

### 🚧 Phase 4: Workflows (IN PROGRESS)
- Workflow list page exists
- **TODO**: Build workflow execution engine
- **TODO**: Connect workflows to task execution
- **TODO**: Create workflow templates (email campaigns, onboarding, reporting)

---

## For Developers

### Creating a Task Manually
```typescript
POST /api/tasks
{
  "title": "Review contract",
  "execution_type": "manual",
  "execution_status": "pending"
}
```

### Executing a Task with AI
```typescript
POST /api/tasks/execute
{
  "taskId": "abc123..."
}
// Returns: immediate result, subtasks, or blocked reason
```

### Agent Creating a Task (Future)
```typescript
// In agent logic:
const task = await createTask({
  title: "Respond to urgent email from customer",
  source_type: "agent",
  agent_id: agent.id,
  execution_type: "semi_automated",
  ai_context: "Customer reported bug in production"
});
```

---

## Summary

**Tasks** = Your to-do list (what needs to be done)
**Agents** = Proactive monitors (creates tasks automatically)
**Workflows** = Multi-step recipes (orchestrates complex execution)

All three work together to create a truly autonomous work system where:
1. Agents notice what needs to be done → create tasks
2. Tasks track all work → can be executed by AI or humans
3. Workflows orchestrate complex multi-step execution when needed

The foundation (Tasks + Execution) is complete. Agents and Workflows are being built to layer on top.
