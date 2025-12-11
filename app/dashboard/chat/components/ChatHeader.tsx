"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MessageSquare, Presentation, FileText, File } from "lucide-react";
import { AIModel } from "@/types";
import { AI_MODELS } from "@/lib/ai/config";

interface ChatHeaderProps {
  selectedModel: AIModel;
  onModelChange: (model: AIModel) => void;
  hasMessages: boolean;
  isVoiceMode: boolean;
  exportingAs: string | null;
  onToggleSidebar: () => void;
  onNewConversation: () => void;
  onExport: (type: "powerpoint" | "pdf" | "excel" | "word") => void;
}

export function ChatHeader({
  selectedModel,
  onModelChange,
  hasMessages,
  isVoiceMode,
  exportingAs,
  onToggleSidebar,
  onNewConversation,
  onExport,
}: ChatHeaderProps) {
  return (
    <div className="border-b border-slate-200/50 dark:border-slate-800/50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm sticky top-0 z-10">
      <div className="max-w-3xl mx-auto px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleSidebar}
            className="h-9 px-3 border-slate-300 dark:border-slate-700"
            title="View past conversations"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            <span className="text-sm">History</span>
          </Button>
          <div className="h-6 w-px bg-slate-300 dark:bg-slate-700" />
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">Model:</span>
            <Select
              value={selectedModel}
              onValueChange={(value) => onModelChange(value as AIModel)}
              disabled={hasMessages || isVoiceMode}
            >
              <SelectTrigger className="border border-slate-300 dark:border-slate-700 h-9 px-3 text-sm font-medium bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 min-w-[180px]">
                <SelectValue placeholder="Select model" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(AI_MODELS).map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    <div className="flex items-center gap-2">
                      <span>{model.icon}</span>
                      <span>{model.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasMessages && (
            <div className="flex items-center gap-1 border-r border-slate-300 dark:border-slate-700 pr-2 mr-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onExport("powerpoint")}
                disabled={exportingAs !== null}
                className="h-8 px-2 text-xs"
                title="Export as PowerPoint"
              >
                <Presentation className="h-3.5 w-3.5 mr-1.5" />
                PPT
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onExport("pdf")}
                disabled={exportingAs !== null}
                className="h-8 px-2 text-xs"
                title="Export as PDF"
              >
                <FileText className="h-3.5 w-3.5 mr-1.5" />
                PDF
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onExport("word")}
                disabled={exportingAs !== null}
                className="h-8 px-2 text-xs"
                title="Export as Word"
              >
                <File className="h-3.5 w-3.5 mr-1.5" />
                Word
              </Button>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onNewConversation}
            className="h-9 text-sm px-3"
          >
            New chat
          </Button>
        </div>
      </div>
    </div>
  );
}
