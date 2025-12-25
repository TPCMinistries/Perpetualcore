"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TeamTemplate,
  TeamTemplateCategory,
  TRADITIONAL_TEAM_TEMPLATES,
  BOS_2_TEAM_TEMPLATES,
} from "@/types/work";
import { Sparkles, Building2, Check, Workflow } from "lucide-react";

interface TeamTemplatePickerProps {
  selectedTemplateId?: string;
  onSelect: (template: TeamTemplate) => void;
  className?: string;
}

export function TeamTemplatePicker({
  selectedTemplateId,
  onSelect,
  className,
}: TeamTemplatePickerProps) {
  const [activeCategory, setActiveCategory] = useState<TeamTemplateCategory>("bos_2");

  const templates = activeCategory === "traditional"
    ? TRADITIONAL_TEAM_TEMPLATES
    : BOS_2_TEAM_TEMPLATES;

  return (
    <div className={cn("space-y-4", className)}>
      <Tabs
        value={activeCategory}
        onValueChange={(v) => setActiveCategory(v as TeamTemplateCategory)}
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="bos_2" className="gap-2">
            <Sparkles className="h-4 w-4" />
            BOS 2.0 (AI-First)
          </TabsTrigger>
          <TabsTrigger value="traditional" className="gap-2">
            <Building2 className="h-4 w-4" />
            Traditional
          </TabsTrigger>
        </TabsList>

        <TabsContent value="bos_2" className="mt-4">
          <div className="mb-3">
            <p className="text-sm text-muted-foreground">
              AI-first teams with lifecycle workflows. Built for the &quot;Centaur&quot; model:
              AI does the work, humans orchestrate and verify.
            </p>
          </div>
          <TemplateGrid
            templates={BOS_2_TEAM_TEMPLATES}
            selectedTemplateId={selectedTemplateId}
            onSelect={onSelect}
          />
        </TabsContent>

        <TabsContent value="traditional" className="mt-4">
          <div className="mb-3">
            <p className="text-sm text-muted-foreground">
              Standard department teams with AI assistance.
              Familiar structure for teams transitioning to AI-augmented workflows.
            </p>
          </div>
          <TemplateGrid
            templates={TRADITIONAL_TEAM_TEMPLATES}
            selectedTemplateId={selectedTemplateId}
            onSelect={onSelect}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface TemplateGridProps {
  templates: TeamTemplate[];
  selectedTemplateId?: string;
  onSelect: (template: TeamTemplate) => void;
}

function TemplateGrid({ templates, selectedTemplateId, onSelect }: TemplateGridProps) {
  return (
    <ScrollArea className="h-[300px] pr-4">
      <div className="grid gap-3">
        {templates.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            isSelected={selectedTemplateId === template.id}
            onSelect={() => onSelect(template)}
          />
        ))}
      </div>
    </ScrollArea>
  );
}

interface TemplateCardProps {
  template: TeamTemplate;
  isSelected: boolean;
  onSelect: () => void;
}

function TemplateCard({ template, isSelected, onSelect }: TemplateCardProps) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "relative w-full text-left p-4 rounded-lg border-2 transition-all",
        "hover:border-primary/50 hover:bg-accent/50",
        isSelected
          ? "border-primary bg-primary/5"
          : "border-border bg-background"
      )}
    >
      {isSelected && (
        <div className="absolute top-3 right-3">
          <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
            <Check className="h-3 w-3 text-primary-foreground" />
          </div>
        </div>
      )}

      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0"
          style={{ backgroundColor: `${template.color}20` }}
        >
          {template.emoji}
        </div>

        <div className="flex-1 min-w-0 pr-6">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-sm">{template.name}</h4>
            {template.category === "bos_2" && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                AI-First
              </Badge>
            )}
          </div>

          <p className="text-xs text-muted-foreground line-clamp-2">
            {template.description}
          </p>

          {template.workflow_stages && template.workflow_stages.length > 0 && (
            <div className="mt-2 flex items-center gap-1.5">
              <Workflow className="h-3 w-3 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">
                {template.workflow_stages.length} lifecycle stages
              </span>
              <div className="flex gap-0.5 ml-1">
                {template.workflow_stages.slice(0, 5).map((stage, i) => (
                  <div
                    key={stage.id}
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: stage.color }}
                    title={stage.name}
                  />
                ))}
                {template.workflow_stages.length > 5 && (
                  <span className="text-[10px] text-muted-foreground ml-0.5">
                    +{template.workflow_stages.length - 5}
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="mt-2 flex flex-wrap gap-1">
            {template.ai_context.suggestions_focus.slice(0, 3).map((focus, i) => (
              <span
                key={i}
                className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
              >
                {focus}
              </span>
            ))}
          </div>
        </div>
      </div>
    </button>
  );
}

// Export a compact version for the dialog
export function TeamTemplatePickerCompact({
  selectedTemplateId,
  onSelect,
  className,
}: TeamTemplatePickerProps) {
  const [activeCategory, setActiveCategory] = useState<TeamTemplateCategory>("bos_2");

  const templates = activeCategory === "traditional"
    ? TRADITIONAL_TEAM_TEMPLATES
    : BOS_2_TEAM_TEMPLATES;

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex gap-2">
        <button
          onClick={() => setActiveCategory("bos_2")}
          className={cn(
            "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2",
            activeCategory === "bos_2"
              ? "bg-primary text-primary-foreground"
              : "bg-muted hover:bg-muted/80"
          )}
        >
          <Sparkles className="h-4 w-4" />
          BOS 2.0
        </button>
        <button
          onClick={() => setActiveCategory("traditional")}
          className={cn(
            "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2",
            activeCategory === "traditional"
              ? "bg-primary text-primary-foreground"
              : "bg-muted hover:bg-muted/80"
          )}
        >
          <Building2 className="h-4 w-4" />
          Traditional
        </button>
      </div>

      <ScrollArea className="h-[250px]">
        <div className="grid gap-2 pr-4">
          {templates.map((template) => (
            <button
              key={template.id}
              onClick={() => onSelect(template)}
              className={cn(
                "w-full text-left p-3 rounded-lg border transition-all flex items-center gap-3",
                "hover:border-primary/50 hover:bg-accent/50",
                selectedTemplateId === template.id
                  ? "border-primary bg-primary/5"
                  : "border-border"
              )}
            >
              <div
                className="w-8 h-8 rounded-md flex items-center justify-center text-base shrink-0"
                style={{ backgroundColor: `${template.color}20` }}
              >
                {template.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{template.name}</span>
                  {template.workflow_stages && (
                    <span className="text-[10px] text-muted-foreground">
                      {template.workflow_stages.length} stages
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {template.description}
                </p>
              </div>
              {selectedTemplateId === template.id && (
                <Check className="h-4 w-4 text-primary shrink-0" />
              )}
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
