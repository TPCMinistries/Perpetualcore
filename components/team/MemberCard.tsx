"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Crown, Shield, Circle } from "lucide-react";

interface MemberCardProps {
  member: {
    id: string;
    full_name: string | null;
    email: string;
    avatar_url: string | null;
    role: string;
    is_online?: boolean;
    last_active_at?: string | null;
    job_title?: string | null;
    department?: string | null;
    expertise?: string[] | null;
  };
  showStatus?: boolean;
  onClick?: () => void;
}

export default function MemberCard({ member, showStatus = true, onClick }: MemberCardProps) {
  function getInitials(name: string) {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  function getRoleBadgeColor(role: string) {
    switch (role) {
      case "owner":
        return "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300";
      case "admin":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300";
      case "manager":
        return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300";
      default:
        return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
    }
  }

  function getRoleIcon(role: string) {
    switch (role) {
      case "owner":
        return <Crown className="h-3 w-3" />;
      case "admin":
        return <Shield className="h-3 w-3" />;
      default:
        return null;
    }
  }

  function formatLastActive(timestamp: string | null) {
    if (!timestamp) return "Never";
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }

  return (
    <Card
      className={`hover:bg-muted/50 transition-colors ${onClick ? "cursor-pointer" : ""}`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="relative">
            <Avatar className="h-14 w-14">
              <AvatarImage src={member.avatar_url || undefined} />
              <AvatarFallback className="bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400">
                {getInitials(member.full_name || member.email)}
              </AvatarFallback>
            </Avatar>
            {showStatus && member.is_online !== undefined && (
              <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-background flex items-center justify-center">
                <Circle
                  className={`h-3 w-3 ${
                    member.is_online
                      ? "fill-green-500 text-green-500"
                      : "fill-slate-300 text-slate-300"
                  }`}
                />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold truncate">
                {member.full_name || "Unnamed User"}
              </h3>
              <Badge variant="outline" className={getRoleBadgeColor(member.role)}>
                <span className="flex items-center gap-1">
                  {getRoleIcon(member.role)}
                  {member.role}
                </span>
              </Badge>
            </div>

            <p className="text-sm text-muted-foreground truncate mb-2">
              {member.email}
            </p>

            {member.job_title && (
              <p className="text-sm font-medium text-foreground mb-1">
                {member.job_title}
              </p>
            )}

            {member.department && (
              <p className="text-xs text-muted-foreground mb-2">
                {member.department}
              </p>
            )}

            {member.expertise && member.expertise.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {member.expertise.slice(0, 3).map((skill, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {skill}
                  </Badge>
                ))}
                {member.expertise.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{member.expertise.length - 3}
                  </Badge>
                )}
              </div>
            )}

            {showStatus && member.last_active_at && (
              <p className="text-xs text-muted-foreground">
                {member.is_online ? "Online now" : `Last active ${formatLastActive(member.last_active_at)}`}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
