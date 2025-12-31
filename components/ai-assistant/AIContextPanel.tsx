"use client";

import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  MapPin,
  FileText,
  CheckSquare,
  Database,
} from "lucide-react";
import { AIContext } from "@/hooks/useAIAssistant";

interface AIContextPanelProps {
  context: AIContext;
}

export function AIContextPanel({ context }: AIContextPanelProps) {
  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Current Context
          </h3>
          <div className="space-y-3">
            {/* Route */}
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Page</p>
                <p className="text-sm font-medium">{context.route}</p>
              </div>
            </div>

            {/* Page Type */}
            <div className="flex items-start gap-2">
              <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Type</p>
                <Badge variant="secondary" className="text-xs">
                  {context.pageType}
                </Badge>
              </div>
            </div>

            {/* Selected Items */}
            {context.selectedItems.length > 0 && (
              <div className="flex items-start gap-2">
                <CheckSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Selected</p>
                  <p className="text-sm font-medium">
                    {context.selectedItems.length} item{context.selectedItems.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            )}

            {/* Page Data */}
            {Object.keys(context.pageData).length > 0 && (
              <div className="flex items-start gap-2">
                <Database className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Page Data</p>
                  <div className="mt-1 space-y-1">
                    {Object.entries(context.pageData).map(([key, value]) => (
                      <div key={key} className="text-xs">
                        <span className="text-muted-foreground">{key}:</span>{" "}
                        <span className="font-medium">
                          {typeof value === "object"
                            ? JSON.stringify(value).slice(0, 30) + "..."
                            : String(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* What AI knows */}
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            What I Know
          </h3>
          <p className="text-xs text-muted-foreground">
            {getContextDescription(context)}
          </p>
        </div>
      </div>
    </ScrollArea>
  );
}

function getContextDescription(context: AIContext): string {
  const descriptions: Record<string, string> = {
    inbox: "I can see your messages, filter by type, help compose replies, and summarize conversations.",
    documents: "I can analyze documents, extract key information, summarize content, and find similar files.",
    tasks: "I can help prioritize tasks, break them down, estimate time, and suggest next actions.",
    automation: "I can explain execution results, debug failures, and suggest optimizations.",
    contacts: "I can show interaction history, draft communications, and suggest follow-ups.",
    calendar: "I can help with meeting prep, suggest times, and summarize upcoming events.",
    projects: "I can overview project status, identify blockers, and suggest next steps.",
    chat: "I can help with any question or task you have.",
    home: "I can summarize your day, priorities, and suggest what to focus on.",
    general: "I can help with navigation, answer questions, and perform actions across the platform.",
  };

  return descriptions[context.pageType] || descriptions.general;
}
