import { selectBestModel } from "../lib/ai/model-router";

type Scenario = {
  name: string;
  message: string;
  context?: Parameters<typeof selectBestModel>[1];
};

const scenarios: Scenario[] = [
  {
    name: "General chit-chat",
    message: "Morning! Can you recap our plans for today?",
  },
  {
    name: "Deep reasoning",
    message:
      "We need a comprehensive go-to-market strategy for our healthcare vertical. Outline risks, compliance constraints, and phased rollout options.",
  },
  {
    name: "Code review",
    message:
      "Here's a TypeScript function throwing a race condition. Help me refactor it for thread safety and add tests.",
  },
  {
    name: "Image analysis",
    message: "Describe everything happening in the attached screenshot.",
    context: {
      attachments: [{ type: "image", size: 250_000 }],
    },
  },
  {
    name: "Massive PDF",
    message:
      "Summarize the key terms inside this 180 page contract and highlight risky clauses for legal review.",
    context: {
      attachments: [{ type: "document", size: 2_500_000 }],
      conversationTokens: 4_000,
    },
  },
  {
    name: "Real-time request",
    message:
      "What were the most important AI announcements from today’s OpenAI DevDay? Cite sources.",
  },
  {
    name: "Finance spreadsheet math",
    message:
      "We have quarterly revenue data. Calculate CAGR, identify anomalies, and produce a forecast.",
  },
  {
    name: "Fast brainstorm",
    message: "Need 3 catchy taglines for a productivity AI app.",
  },
];

console.log("🔬 Model Router Sanity Check");
console.log("================================\n");

for (const scenario of scenarios) {
  const result = selectBestModel(scenario.message, scenario.context);
  console.log(`Scenario: ${scenario.name}`);
  console.log(`Message : ${scenario.message}`);
  console.log(
    `Selected: ${result.displayName} (${result.model}) — ${result.reason}\n`
  );
}
