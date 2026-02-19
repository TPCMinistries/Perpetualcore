"use client";

import { Bot } from "lucide-react";
import { AIModel } from "@/types";
import { AI_MODELS } from "@/lib/ai/config";

interface ChatEmptyStateProps {
  selectedModel: AIModel;
  onSuggestionClick: (prompt: string) => void;
}

const suggestions = [
  {
    icon: "💡",
    title: "Brainstorm ideas",
    prompt: "Help me brainstorm creative ideas for",
  },
  {
    icon: "📝",
    title: "Write content",
    prompt: "Help me write professional content about",
  },
  {
    icon: "🔍",
    title: "Analyze data",
    prompt: "Help me analyze and understand",
  },
  {
    icon: "📊",
    title: "Create presentation",
    prompt: "Help me create a presentation about",
  }
];

export function ChatEmptyState({ selectedModel, onSuggestionClick }: ChatEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center py-8">
      <div className="w-full space-y-6">
        {/* Hero Section */}
        <div className="py-8">
          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center mx-auto mb-6">
            <Bot className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-semibold mb-3 text-foreground dark:text-foreground">
            What can I help you with today?
          </h2>
          <p className="text-muted-foreground dark:text-muted-foreground text-base mb-2">
            {selectedModel === "auto"
              ? "I'll automatically select the best AI model for your question"
              : `Powered by ${AI_MODELS[selectedModel].name}`}
          </p>
          {selectedModel === "auto" && (
            <p className="text-sm text-muted-foreground dark:text-muted-foreground">
              GPT-4o Mini • Claude • GPT-4o • Gemini • Gamma
            </p>
          )}
        </div>

        {/* Quick Start Suggestions */}
        <div className="grid md:grid-cols-2 gap-3 mb-6">
          {suggestions.map((suggestion, idx) => (
            <button
              key={idx}
              onClick={() => onSuggestionClick(suggestion.prompt + " ")}
              className="group border border-border dark:border-border hover:border-border dark:hover:border-border rounded-lg p-5 text-left transition-all bg-card"
            >
              <div className="text-2xl mb-3">{suggestion.icon}</div>
              <h3 className="font-medium text-base mb-1 text-foreground dark:text-foreground group-hover:text-foreground dark:group-hover:text-muted-foreground transition-colors">
                {suggestion.title}
              </h3>
              <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                Click to start with a template
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
