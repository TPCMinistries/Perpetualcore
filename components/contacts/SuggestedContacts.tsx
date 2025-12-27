"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Users,
  RefreshCw,
  ChevronRight,
  Star,
  Building2,
  Plus,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ContactMatch, RELATIONSHIP_STRENGTH_CONFIG } from "@/types/contacts";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface SuggestedContactsProps {
  projectId: string;
  projectName?: string;
  onLinkContact?: (contactId: string) => void;
  compact?: boolean;
}

export function SuggestedContacts({
  projectId,
  projectName,
  onLinkContact,
  compact = false,
}: SuggestedContactsProps) {
  const router = useRouter();
  const [matches, setMatches] = useState<ContactMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchMatches();
  }, [projectId]);

  const fetchMatches = async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);

    try {
      const response = await fetch("/api/contacts/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: projectId,
          max_results: compact ? 3 : 5,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMatches(data.matches || []);
      }
    } catch (error) {
      console.error("Error fetching contact matches:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleLinkContact = async (contactId: string) => {
    if (onLinkContact) {
      onLinkContact(contactId);
    } else {
      // Default: link contact to project via API
      try {
        const response = await fetch(`/api/contacts/${contactId}/projects`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            project_id: projectId,
            role: "AI Suggested",
          }),
        });

        if (response.ok) {
          toast.success("Contact linked to project");
          // Remove from suggestions
          setMatches(matches.filter((m) => m.contact_id !== contactId));
        }
      } catch (error) {
        console.error("Error linking contact:", error);
        toast.error("Failed to link contact");
      }
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <Skeleton className="h-5 w-32" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-24 mb-1" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (matches.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">Suggested Contacts</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fetchMatches(true)}
              disabled={refreshing}
            >
              <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No matching contacts found</p>
            <p className="text-xs mt-1">
              Add more details to contacts or this project for better matches
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">Suggested Contacts</CardTitle>
          </div>
          <div className="flex items-center gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => fetchMatches(true)}
                    disabled={refreshing}
                  >
                    <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Refresh suggestions</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        <CardDescription>
          People in your network who could help with this project
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {matches.map((match) => {
            const strengthConfig = RELATIONSHIP_STRENGTH_CONFIG[match.relationship_strength];

            return (
              <div
                key={match.contact_id}
                className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors group"
              >
                <Avatar
                  className="h-10 w-10 cursor-pointer"
                  onClick={() => router.push(`/dashboard/contacts/${match.contact_id}`)}
                >
                  <AvatarImage src={match.avatar_url || undefined} />
                  <AvatarFallback className={cn(strengthConfig.bgColor, strengthConfig.color)}>
                    {getInitials(match.full_name)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className="font-medium truncate cursor-pointer hover:underline"
                      onClick={() => router.push(`/dashboard/contacts/${match.contact_id}`)}
                    >
                      {match.full_name}
                    </span>
                    <Badge
                      variant="secondary"
                      className={cn("text-[10px] px-1.5", strengthConfig.bgColor, strengthConfig.color)}
                    >
                      {strengthConfig.label}
                    </Badge>
                  </div>

                  {match.company && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Building2 className="h-3 w-3" />
                      {match.company}
                    </p>
                  )}

                  {match.match_reasons.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {match.match_reasons.slice(0, 2).map((reason, i) => (
                        <span
                          key={i}
                          className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary"
                        >
                          {reason}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleLinkContact(match.contact_id)}
                        >
                          <UserPlus className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Add to project</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => router.push(`/dashboard/contacts/${match.contact_id}`)}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>View profile</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            );
          })}
        </div>

        {!compact && (
          <Button
            variant="ghost"
            className="w-full mt-3"
            onClick={() => router.push("/dashboard/contacts")}
          >
            View all contacts
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
