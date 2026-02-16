"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Puzzle, Lock, Unlock } from "lucide-react";

interface SharedSkillCardProps {
  skill: {
    id: string;
    skillId: string;
    skillName: string;
    sharedBy: string;
    hasCredential: boolean;
    createdAt: string;
  };
  canManage?: boolean;
  onRemove?: (skillId: string) => void;
}

export default function SharedSkillCard({
  skill,
  canManage = false,
  onRemove,
}: SharedSkillCardProps) {
  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Puzzle className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">{skill.skillName}</CardTitle>
          </div>
          {canManage && onRemove && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemove(skill.skillId)}
              className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive transition-opacity"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 mb-2">
          {skill.hasCredential ? (
            <Badge
              variant="outline"
              className="bg-green-50 border-green-300 text-green-700 dark:bg-green-950/30 dark:border-green-800 dark:text-green-400"
            >
              <Unlock className="h-3 w-3 mr-1" />
              Credential Shared
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="bg-yellow-50 border-yellow-300 text-yellow-700 dark:bg-yellow-950/30 dark:border-yellow-800 dark:text-yellow-400"
            >
              <Lock className="h-3 w-3 mr-1" />
              BYOK Required
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Shared by {skill.sharedBy} on{" "}
          {new Date(skill.createdAt).toLocaleDateString()}
        </p>
      </CardContent>
    </Card>
  );
}
