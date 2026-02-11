// Chat types for the redesigned AI hub

export interface ToolActivity {
  name: string;
  status: "running" | "complete" | "error";
  result?: string;
}

export interface Message {
  role: "user" | "assistant";
  content: string;
  attachments?: FileAttachment[];
  id?: string;
  feedback?: "helpful" | "not_helpful" | null;
  toolActivity?: ToolActivity[];
}

export interface FileAttachment {
  file: File;
  type: "document" | "image";
  preview?: string;
}

export interface Advisor {
  id: string;
  name: string;
  emoji: string;
  role: string;
  description: string;
  systemPrompt: string;
}

export interface DailyBriefing {
  greeting: string;
  date: string;
  summary: string;
  highlights: BriefingHighlight[];
  suggestion: string;
}

export interface BriefingHighlight {
  type: "meeting" | "task" | "agent" | "email";
  text: string;
  time?: string;
  priority?: "high" | "medium" | "low";
}

export interface AIMemory {
  documents: { count: number; lastAdded: string };
  conversations: { count: number; insights: number };
  contacts: { count: number; withContext: number };
  agents: { active: number; actionsToday: number };
}

export interface SmartSuggestion {
  text: string;
  source: "calendar" | "task" | "contact" | "document" | "pattern";
  confidence: number;
}

export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  model?: string;
}

export interface ChatState {
  messages: Message[];
  input: string;
  isLoading: boolean;
  conversationId?: string;
  currentAdvisor: Advisor | null;
  ragInfo: { used: boolean; documentsCount: number } | null;
  currentModel: { name: string; reason: string; model: string } | null;
}

// Default general AI advisor
export const DEFAULT_ADVISOR: Advisor = {
  id: "general",
  name: "General AI",
  emoji: "🧠",
  role: "Assistant",
  description: "Your helpful AI assistant",
  systemPrompt: "",
};
