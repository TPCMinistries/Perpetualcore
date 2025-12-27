"use client";

import { useState } from "react";
import { MessageSquare, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { OutreachMessageGenerator } from "./OutreachMessageGenerator";
import { cn } from "@/lib/utils";

interface ReachOutButtonProps {
  contactId: string;
  contactName: string;
  contactEmail?: string;
  variant?: "default" | "outline" | "ghost" | "icon";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  showLabel?: boolean;
}

export function ReachOutButton({
  contactId,
  contactName,
  contactEmail,
  variant = "outline",
  size = "sm",
  className,
  showLabel = true,
}: ReachOutButtonProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  if (variant === "icon" || !showLabel) {
    return (
      <>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn("h-8 w-8", className)}
                onClick={() => setDialogOpen(true)}
              >
                <MessageSquare className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Reach out with AI</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <OutreachMessageGenerator
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          contactId={contactId}
          contactName={contactName}
          contactEmail={contactEmail}
        />
      </>
    );
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={cn("gap-2", className)}
        onClick={() => setDialogOpen(true)}
      >
        <Sparkles className="h-4 w-4" />
        Reach Out
      </Button>

      <OutreachMessageGenerator
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        contactId={contactId}
        contactName={contactName}
        contactEmail={contactEmail}
      />
    </>
  );
}
