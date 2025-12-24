"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Users,
  ChevronDown,
  Check,
  X,
  Building2,
  Briefcase,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Team } from "@/types/work";
import { cn } from "@/lib/utils";

interface TeamContextSwitcherProps {
  className?: string;
  showLabel?: boolean;
  size?: "sm" | "default" | "lg";
}

interface ActiveContext {
  teamId: string;
  teamName: string;
  teamEmoji?: string;
  teamColor: string;
  teamType: "department" | "project_team";
}

export function TeamContextSwitcher({
  className,
  showLabel = true,
  size = "default",
}: TeamContextSwitcherProps) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [activeContext, setActiveContext] = useState<ActiveContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Fetch teams and current context
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch teams and current context in parallel
      const [teamsRes, contextRes] = await Promise.all([
        fetch("/api/teams"),
        fetch("/api/context/switch"),
      ]);

      const teamsData = await teamsRes.json();
      const contextData = await contextRes.json();

      if (teamsData.teams) {
        setTeams(teamsData.teams);
      }

      if (contextData.activeContext) {
        setActiveContext(contextData.activeContext);
      }
    } catch (error) {
      console.error("Error fetching team context data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchContext = async (teamId: string | null) => {
    setSwitching(true);
    try {
      const response = await fetch("/api/context/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ team_id: teamId }),
      });

      if (response.ok) {
        const data = await response.json();
        setActiveContext(data.activeContext || null);
        setIsOpen(false);
      }
    } catch (error) {
      console.error("Error switching team context:", error);
    } finally {
      setSwitching(false);
    }
  };

  // Group teams by type
  const departments = teams.filter((t) => t.team_type === "department");
  const projectTeams = teams.filter((t) => t.team_type === "project_team");

  if (loading) {
    return (
      <Button
        variant="ghost"
        size={size}
        className={cn("opacity-50", className)}
        disabled
      >
        <Loader2 className="h-4 w-4 animate-spin" />
        {showLabel && <span className="ml-2">Loading...</span>}
      </Button>
    );
  }

  // Don't show if no teams
  if (teams.length === 0) {
    return null;
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={size}
          className={cn(
            "gap-2",
            activeContext && "border",
            className
          )}
          style={
            activeContext
              ? {
                  borderColor: activeContext.teamColor,
                  backgroundColor: `${activeContext.teamColor}10`,
                }
              : undefined
          }
        >
          {activeContext ? (
            <>
              <span className="text-base">{activeContext.teamEmoji || "👥"}</span>
              {showLabel && (
                <span
                  className="max-w-[120px] truncate font-medium"
                  style={{ color: activeContext.teamColor }}
                >
                  {activeContext.teamName}
                </span>
              )}
            </>
          ) : (
            <>
              <Users className="h-4 w-4" />
              {showLabel && <span>All Teams</span>}
            </>
          )}
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-wider">
          Context View
        </DropdownMenuLabel>

        {/* All Teams Option */}
        <DropdownMenuItem
          onClick={() => handleSwitchContext(null)}
          disabled={switching}
          className="cursor-pointer"
        >
          <div className="flex items-center gap-2 flex-1">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>All Teams</span>
          </div>
          {!activeContext && <Check className="h-4 w-4 text-primary" />}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Departments */}
        {departments.length > 0 && (
          <>
            <DropdownMenuLabel className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider">
              <Building2 className="h-3 w-3" />
              Departments
            </DropdownMenuLabel>
            {departments.map((team) => (
              <DropdownMenuItem
                key={team.id}
                onClick={() => handleSwitchContext(team.id)}
                disabled={switching}
                className="cursor-pointer"
              >
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-base">{team.emoji || "👥"}</span>
                  <span>{team.name}</span>
                  <div
                    className="w-2 h-2 rounded-full ml-auto"
                    style={{ backgroundColor: team.color }}
                  />
                </div>
                {activeContext?.teamId === team.id && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </DropdownMenuItem>
            ))}
          </>
        )}

        {/* Project Teams */}
        {projectTeams.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider">
              <Briefcase className="h-3 w-3" />
              Project Teams
            </DropdownMenuLabel>
            {projectTeams.map((team) => (
              <DropdownMenuItem
                key={team.id}
                onClick={() => handleSwitchContext(team.id)}
                disabled={switching}
                className="cursor-pointer"
              >
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-base">{team.emoji || "👥"}</span>
                  <span>{team.name}</span>
                  <div
                    className="w-2 h-2 rounded-full ml-auto"
                    style={{ backgroundColor: team.color }}
                  />
                </div>
                {activeContext?.teamId === team.id && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </DropdownMenuItem>
            ))}
          </>
        )}

        {/* Clear Context */}
        {activeContext && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => handleSwitchContext(null)}
              disabled={switching}
              className="cursor-pointer text-muted-foreground"
            >
              <X className="h-4 w-4 mr-2" />
              Clear Team Context
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Also export a hook for using team context in other components
export function useTeamContext() {
  const [activeContext, setActiveContext] = useState<ActiveContext | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/context/switch")
      .then((res) => res.json())
      .then((data) => {
        setActiveContext(data.activeContext || null);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const switchContext = useCallback(async (teamId: string | null) => {
    const response = await fetch("/api/context/switch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ team_id: teamId }),
    });

    if (response.ok) {
      const data = await response.json();
      setActiveContext(data.activeContext || null);
      return data.activeContext;
    }
    return null;
  }, []);

  return { activeContext, loading, switchContext };
}
