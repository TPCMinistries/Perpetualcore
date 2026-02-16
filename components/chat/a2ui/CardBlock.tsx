"use client";

import { useState } from "react";
import type { A2UIBlock } from "@/lib/a2ui/types";
import type { CardBlockData, CardGridBlockData } from "@/lib/a2ui/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface CardBlockProps {
  block: A2UIBlock;
}

function SingleCard({
  card,
  className,
}: {
  card: CardBlockData;
  className?: string;
}) {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const handleAction = async (callbackId: string) => {
    setLoadingAction(callbackId);
    try {
      await fetch("/api/a2ui/callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callbackId, action: "click" }),
      });
    } catch {
      // Silently handle errors for now
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div
      className={cn(
        "rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden",
        className
      )}
    >
      {card.image && (
        <div className="h-32 overflow-hidden">
          <img
            src={card.image}
            alt={card.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="p-3">
        <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          {card.title}
        </h4>
        {card.subtitle && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {card.subtitle}
          </p>
        )}
        {card.description && (
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 line-clamp-3">
            {card.description}
          </p>
        )}
        {card.badges && card.badges.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {card.badges.map((badge) => (
              <Badge
                key={badge}
                variant="secondary"
                className="text-[10px] px-1.5 py-0"
              >
                {badge}
              </Badge>
            ))}
          </div>
        )}
        {card.actions && card.actions.length > 0 && (
          <div className="flex gap-2 mt-3">
            {card.actions.map((action) => (
              <Button
                key={action.callbackId}
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                disabled={loadingAction === action.callbackId}
                onClick={() => handleAction(action.callbackId)}
              >
                {loadingAction === action.callbackId ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  action.label
                )}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CardBlock({ block }: CardBlockProps) {
  const card = block.data as CardBlockData;
  return <SingleCard card={card} />;
}

export function CardGridBlock({ block }: CardBlockProps) {
  const data = block.data as CardGridBlockData;
  const cols = data.columns || 2;

  return (
    <div
      className={cn(
        "grid gap-3",
        cols === 1 && "grid-cols-1",
        cols === 2 && "grid-cols-1 sm:grid-cols-2",
        cols >= 3 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
      )}
    >
      {data.cards.map((card, i) => (
        <SingleCard key={i} card={card} />
      ))}
    </div>
  );
}
