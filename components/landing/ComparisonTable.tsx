import { Check, X, Minus } from "lucide-react";

type CellValue = {
  text: string;
  highlight?: boolean;
  icon?: "check" | "x" | "minus";
};

type ComparisonRow = {
  feature: string;
  perpetualCore: CellValue;
  chatgpt: CellValue;
  others: CellValue;
};

const rows: ComparisonRow[] = [
  {
    feature: "Conversation Memory",
    perpetualCore: { text: "Infinite — never forgets", highlight: true, icon: "check" },
    chatgpt: { text: "~200 messages then resets", icon: "x" },
    others: { text: "Session-based", icon: "x" },
  },
  {
    feature: "AI Models",
    perpetualCore: { text: "GPT-4, Claude, Gemini, DeepSeek", highlight: true, icon: "check" },
    chatgpt: { text: "GPT-4 only", icon: "minus" },
    others: { text: "Single model", icon: "minus" },
  },
  {
    feature: "Document Search (RAG)",
    perpetualCore: { text: "Full RAG with vector search", highlight: true, icon: "check" },
    chatgpt: { text: "Limited file upload", icon: "minus" },
    others: { text: "No document search", icon: "x" },
  },
  {
    feature: "AI Agents",
    perpetualCore: { text: "30+ pre-built + custom", highlight: true, icon: "check" },
    chatgpt: { text: "Basic GPTs", icon: "minus" },
    others: { text: "Limited or none", icon: "x" },
  },
  {
    feature: "Team Collaboration",
    perpetualCore: { text: "Shared knowledge bases", highlight: true, icon: "check" },
    chatgpt: { text: "Individual only", icon: "x" },
    others: { text: "Varies", icon: "minus" },
  },
  {
    feature: "Enterprise Security",
    perpetualCore: { text: "RLS, SSO ready, audit logs", highlight: true, icon: "check" },
    chatgpt: { text: "Basic", icon: "minus" },
    others: { text: "Varies", icon: "minus" },
  },
  {
    feature: "Pricing",
    perpetualCore: { text: "From $49/mo (all models)", highlight: true, icon: "check" },
    chatgpt: { text: "$20/mo (GPT-4 only)", icon: "minus" },
    others: { text: "$20–100/mo per model", icon: "x" },
  },
];

function CellIcon({ type }: { type: "check" | "x" | "minus" }) {
  if (type === "check") {
    return (
      <span className="inline-flex h-5 w-5 rounded-full bg-green-500 items-center justify-center flex-shrink-0">
        <Check className="h-3 w-3 text-white" strokeWidth={3} />
      </span>
    );
  }
  if (type === "x") {
    return (
      <span className="inline-flex h-5 w-5 rounded-full bg-red-400/80 items-center justify-center flex-shrink-0">
        <X className="h-3 w-3 text-white" strokeWidth={3} />
      </span>
    );
  }
  return (
    <span className="inline-flex h-5 w-5 rounded-full bg-muted-foreground/30 items-center justify-center flex-shrink-0">
      <Minus className="h-3 w-3 text-muted-foreground" strokeWidth={3} />
    </span>
  );
}

export function ComparisonTable() {
  return (
    <section className="container mx-auto px-4 py-20 animate-on-scroll">
      <div className="max-w-5xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-gray-900 via-primary to-purple-600 dark:from-white dark:via-primary dark:to-purple-400 bg-clip-text text-transparent">
            How Perpetual Core Compares
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            See why teams choose Perpetual Core over paying for multiple separate AI subscriptions
          </p>
        </div>

        {/* Table Wrapper — Horizontal Scroll on Mobile */}
        <div className="overflow-x-auto rounded-2xl border-2 border-border shadow-2xl">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-primary/10 via-purple-500/10 to-primary/10 border-b-2 border-border">
                <th className="px-6 py-4 text-left font-semibold text-muted-foreground w-[30%]">Feature</th>
                <th className="px-6 py-4 text-center font-bold text-primary w-[25%]">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-base">Perpetual Core</span>
                    <span className="text-xs font-normal text-primary/70 bg-primary/10 px-2 py-0.5 rounded-full">
                      Recommended
                    </span>
                  </div>
                </th>
                <th className="px-6 py-4 text-center font-semibold text-muted-foreground w-[22.5%]">ChatGPT Plus</th>
                <th className="px-6 py-4 text-center font-semibold text-muted-foreground w-[22.5%]">Other AI Tools</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((row, i) => (
                <tr
                  key={row.feature}
                  className={`transition-colors hover:bg-muted/30 ${i % 2 === 0 ? "bg-background" : "bg-muted/10"}`}
                >
                  {/* Feature Name */}
                  <td className="px-6 py-4 font-semibold text-foreground">{row.feature}</td>

                  {/* Perpetual Core — Highlighted */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 justify-center">
                      {row.perpetualCore.icon && <CellIcon type={row.perpetualCore.icon} />}
                      <span className="font-bold text-foreground text-center leading-tight">
                        {row.perpetualCore.text}
                      </span>
                    </div>
                  </td>

                  {/* ChatGPT */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 justify-center">
                      {row.chatgpt.icon && <CellIcon type={row.chatgpt.icon} />}
                      <span className="text-muted-foreground text-center leading-tight">{row.chatgpt.text}</span>
                    </div>
                  </td>

                  {/* Others */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 justify-center">
                      {row.others.icon && <CellIcon type={row.others.icon} />}
                      <span className="text-muted-foreground text-center leading-tight">{row.others.text}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <CellIcon type="check" />
            <span>Full support</span>
          </div>
          <div className="flex items-center gap-2">
            <CellIcon type="minus" />
            <span>Partial / limited</span>
          </div>
          <div className="flex items-center gap-2">
            <CellIcon type="x" />
            <span>Not available</span>
          </div>
        </div>
      </div>
    </section>
  );
}
