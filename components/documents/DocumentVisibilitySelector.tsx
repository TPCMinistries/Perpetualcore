"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Lock, Users, Building2, Globe } from "lucide-react";
import { toast } from "sonner";

interface VisibilityOption {
  value: "personal" | "team" | "organization" | "public";
  label: string;
  icon: typeof Lock;
  description: string;
  color: string;
}

const VISIBILITY_OPTIONS: VisibilityOption[] = [
  {
    value: "personal",
    label: "Personal",
    icon: Lock,
    description: "Only you can see this document",
    color: "text-blue-600 dark:text-blue-400",
  },
  {
    value: "team",
    label: "Team",
    icon: Users,
    description: "Shared with specific teams or workspaces",
    color: "text-purple-600 dark:text-purple-400",
  },
  {
    value: "organization",
    label: "Organization",
    icon: Building2,
    description: "Everyone in your organization can see this",
    color: "text-green-600 dark:text-green-400",
  },
  {
    value: "public",
    label: "Public",
    icon: Globe,
    description: "Publicly accessible (marketplace/templates)",
    color: "text-orange-600 dark:text-orange-400",
  },
];

interface DocumentVisibilitySelectorProps {
  documentId: string;
  currentVisibility: "personal" | "team" | "organization" | "public";
  onChange?: () => void;
  size?: "sm" | "md" | "lg";
}

export function DocumentVisibilitySelector({
  documentId,
  currentVisibility,
  onChange,
  size = "md",
}: DocumentVisibilitySelectorProps) {
  const [visibility, setVisibility] = useState(currentVisibility);
  const [isUpdating, setIsUpdating] = useState(false);

  async function handleVisibilityChange(
    newVisibility: "personal" | "team" | "organization" | "public"
  ) {
    if (newVisibility === visibility) return;

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/documents/${documentId}/visibility`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visibility: newVisibility }),
      });

      if (!response.ok) {
        throw new Error("Failed to update visibility");
      }

      setVisibility(newVisibility);
      toast.success(`Document visibility changed to ${newVisibility}`);
      onChange?.();
    } catch (error) {
      console.error("Error updating visibility:", error);
      toast.error("Failed to update document visibility");
      // Revert on error
      setVisibility(visibility);
    } finally {
      setIsUpdating(false);
    }
  }

  const currentOption = VISIBILITY_OPTIONS.find((opt) => opt.value === visibility);
  const Icon = currentOption?.icon || Lock;

  const sizeClasses = {
    sm: "h-8 text-xs",
    md: "h-10 text-sm",
    lg: "h-12 text-base",
  };

  return (
    <Select
      value={visibility}
      onValueChange={(value) =>
        handleVisibilityChange(value as "personal" | "team" | "organization" | "public")
      }
      disabled={isUpdating}
    >
      <SelectTrigger
        className={`${sizeClasses[size]} backdrop-blur-xl bg-background/50 border-border hover:bg-accent transition-colors`}
      >
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${currentOption?.color}`} />
          <SelectValue />
        </div>
      </SelectTrigger>
      <SelectContent>
        {VISIBILITY_OPTIONS.map((option) => {
          const OptionIcon = option.icon;
          return (
            <SelectItem key={option.value} value={option.value}>
              <div className="flex items-start gap-3 py-1">
                <OptionIcon className={`h-5 w-5 mt-0.5 ${option.color}`} />
                <div className="flex-1">
                  <div className="font-medium text-foreground">{option.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {option.description}
                  </div>
                </div>
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
