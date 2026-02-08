/**
 * Agent Plan Decomposer
 *
 * Uses Claude Sonnet to decompose a high-level goal into an ordered
 * list of executable steps, each mapped to an existing tool in the registry.
 */

import Anthropic from "@anthropic-ai/sdk";
import { PlanStep, SENSITIVE_TOOLS, MAX_PLAN_STEPS } from "./types";
import { CORE_TOOLS } from "@/lib/ai/tools/registry";

const anthropic = new Anthropic();

/**
 * Decompose a goal into a list of executable plan steps.
 *
 * @param goal - The high-level goal to accomplish
 * @param stepsHint - Optional hints about what steps to include
 * @param availableToolNames - Names of all tools available to the user
 * @returns Ordered array of PlanStep objects
 */
export async function decomposeGoal(
  goal: string,
  stepsHint?: string[],
  availableToolNames?: string[]
): Promise<{ steps: PlanStep[]; estimatedCost: number }> {
  const toolNames = availableToolNames || CORE_TOOLS.map((t) => t.name);
  const toolDescriptions = CORE_TOOLS.map(
    (t) => `- ${t.name}: ${t.description}\n  Parameters: ${JSON.stringify(t.parameters.properties)}`
  ).join("\n");

  const hintsSection = stepsHint?.length
    ? `\nThe user suggested these steps:\n${stepsHint.map((h, i) => `${i + 1}. ${h}`).join("\n")}`
    : "";

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2000,
    messages: [
      {
        role: "user",
        content: `You are a planning agent. Decompose this goal into executable steps.

GOAL: ${goal}
${hintsSection}

AVAILABLE TOOLS:
${toolDescriptions}

Additional skill tools available: ${toolNames.filter((n) => !CORE_TOOLS.find((t) => t.name === n)).join(", ") || "none"}

RULES:
1. Each step must use exactly one tool from the available tools list.
2. Steps execute sequentially. Step N can reference results from steps 1..N-1.
3. Maximum ${MAX_PLAN_STEPS} steps.
4. Keep it minimal - don't add unnecessary steps.
5. For args that depend on previous step output, use placeholder: "{{step_N.output}}" where N is the step number.
6. Mark steps that modify external state (send email, create events, post messages) as requires_approval: true.

Respond with ONLY a JSON array of steps, no other text:
[
  {
    "tool": "tool_name",
    "args": { "param1": "value1" },
    "description": "What this step does",
    "depends_on": [],
    "requires_approval": false
  }
]`,
      },
    ],
  });

  const content = response.content[0];
  if (content.type !== "text") {
    throw new Error("Planner returned non-text response");
  }

  // Parse the JSON response
  let rawSteps: any[];
  try {
    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = content.text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("No JSON array found");
    rawSteps = JSON.parse(jsonMatch[0]);
  } catch (e) {
    throw new Error(`Failed to parse planner response: ${content.text.slice(0, 200)}`);
  }

  // Validate and normalize steps
  const steps: PlanStep[] = rawSteps.slice(0, MAX_PLAN_STEPS).map((raw, index) => {
    const stepId = `step_${index + 1}`;

    // Auto-detect sensitive tools
    const isSensitive =
      raw.requires_approval === true || SENSITIVE_TOOLS.has(raw.tool);

    return {
      id: stepId,
      tool: raw.tool,
      args: raw.args || {},
      description: raw.description || `Execute ${raw.tool}`,
      status: "pending" as const,
      depends_on: (raw.depends_on || []).map((d: string) =>
        d.startsWith("step_") ? d : `step_${d}`
      ),
      requires_approval: isSensitive,
    };
  });

  // Estimate cost: ~$0.003 for planning + ~$0.0004 per step
  const estimatedCost = 0.003 + steps.length * 0.0004;

  return { steps, estimatedCost };
}
