"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Sparkles,
  ChevronRight,
  Building2,
  FolderKanban,
  RefreshCw,
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
import { RELATIONSHIP_STRENGTH_CONFIG } from "@/types/contacts";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ProjectMatch {
  project_id: string;
  project_name: string;
  project_emoji?: string;
  contact_id: string;
  contact_name: string;
  contact_company?: string;
  contact_avatar?: string;
  relationship_strength: string;
  match_reasons: string[];
  relevance_score: number;
}

interface NetworkOpportunitiesProps {
  maxProjects?: number;
  onRefresh?: () => void;
}

export function NetworkOpportunities({
  maxProjects = 3,
  onRefresh,
}: NetworkOpportunitiesProps) {
  const router = useRouter();
  const [opportunities, setOpportunities] = useState<ProjectMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchOpportunities();
  }, []);

  const fetchOpportunities = async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);

    try {
      // Get active projects first
      const projectsRes = await fetch("/api/projects?status=active&limit=5");
      if (!projectsRes.ok) {
        setOpportunities([]);
        return;
      }

      const projectsData = await projectsRes.json();
      const projects = projectsData.projects || [];

      if (projects.length === 0) {
        setOpportunities([]);
        return;
      }

      // Get matches for each project (in parallel)
      const matchPromises = projects.slice(0, maxProjects).map(async (project: any) => {
        try {
          const matchRes = await fetch("/api/contacts/match", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              project_id: project.id,
              max_results: 2,
            }),
          });

          if (matchRes.ok) {
            const matchData = await matchRes.json();
            if (matchData.matches && matchData.matches.length > 0) {
              // Return the top match for this project
              const topMatch = matchData.matches[0];
              return {
                project_id: project.id,
                project_name: project.name,
                project_emoji: project.emoji,
                contact_id: topMatch.contact_id,
                contact_name: topMatch.full_name,
                contact_company: topMatch.company,
                contact_avatar: topMatch.avatar_url,
                relationship_strength: topMatch.relationship_strength,
                match_reasons: topMatch.match_reasons,
                relevance_score: topMatch.relevance_score,
              };
            }
          }
        } catch (e) {
          console.error("Error fetching matches for project:", project.id, e);
        }
        return null;
      });

      const results = await Promise.all(matchPromises);
      const validOpportunities = results.filter(Boolean) as ProjectMatch[];

      setOpportunities(validOpportunities);

      if (onRefresh) onRefresh();
    } catch (error) {
      console.error("Error fetching network opportunities:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleLinkContact = async (projectId: string, contactId: string) => {
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
        // Remove this opportunity from the list
        setOpportunities(opportunities.filter((o) =>
          !(o.project_id === projectId && o.contact_id === contactId)
        ));
      } else {
        const data = await response.json();
        if (data.error?.includes("already linked")) {
          toast.info("Contact already linked to this project");
          setOpportunities(opportunities.filter((o) =>
            !(o.project_id === projectId && o.contact_id === contactId)
          ));
        } else {
          toast.error("Failed to link contact");
        }
      }
    } catch (error) {
      console.error("Error linking contact:", error);
      toast.error("Failed to link contact");
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
            <Sparkles className="h-5 w-5 text-purple-500" />
            <Skeleton className="h-5 w-40" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-lg border">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (opportunities.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              <CardTitle className="text-base">Network Opportunities</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fetchOpportunities(true)}
              disabled={refreshing}
            >
              <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <Users className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm font-medium">No network opportunities found</p>
            <p className="text-xs mt-1">
              Add skills and interests to your contacts to unlock AI-powered suggestions
            </p>
            <Button
              variant="link"
              size="sm"
              className="mt-2"
              onClick={() => router.push("/dashboard/contacts")}
            >
              Manage Contacts
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-purple-200 dark:border-purple-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-purple-600" />
            </div>
            <div>
              <CardTitle className="text-base">Network Opportunities</CardTitle>
              <CardDescription>People who could help with your projects</CardDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fetchOpportunities(true)}
            disabled={refreshing}
          >
            <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {opportunities.map((opp) => {
            const strengthConfig = RELATIONSHIP_STRENGTH_CONFIG[opp.relationship_strength as keyof typeof RELATIONSHIP_STRENGTH_CONFIG] || RELATIONSHIP_STRENGTH_CONFIG.new;

            return (
              <div
                key={`${opp.project_id}-${opp.contact_id}`}
                className="flex items-start gap-3 p-3 rounded-lg border bg-gradient-to-r from-purple-50/50 to-transparent dark:from-purple-950/20 hover:shadow-sm transition-all group"
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={opp.contact_avatar || undefined} />
                  <AvatarFallback className={cn(strengthConfig.bgColor, strengthConfig.color)}>
                    {getInitials(opp.contact_name)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="font-medium cursor-pointer hover:underline"
                      onClick={() => router.push(`/dashboard/contacts/${opp.contact_id}`)}
                    >
                      {opp.contact_name}
                    </span>
                    <Badge
                      variant="secondary"
                      className={cn("text-[10px] px-1.5", strengthConfig.bgColor, strengthConfig.color)}
                    >
                      {strengthConfig.label}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <FolderKanban className="h-3 w-3" />
                    <span
                      className="cursor-pointer hover:underline"
                      onClick={() => router.push(`/dashboard/projects/${opp.project_id}`)}
                    >
                      {opp.project_emoji} {opp.project_name}
                    </span>
                  </div>

                  {opp.match_reasons.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {opp.match_reasons.slice(0, 2).map((reason, i) => (
                        <span
                          key={i}
                          className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
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
                          onClick={() => handleLinkContact(opp.project_id, opp.contact_id)}
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
                          onClick={() => router.push(`/dashboard/contacts/${opp.contact_id}`)}
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

        <Button
          variant="ghost"
          className="w-full mt-3"
          onClick={() => router.push("/dashboard/contacts")}
        >
          View All Contacts
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </CardContent>
    </Card>
  );
}
