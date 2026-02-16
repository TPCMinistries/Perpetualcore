"use client";

import { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronsUpDown, Plus, Users, Check } from "lucide-react";

interface Team {
  id: string;
  name: string;
  slug: string;
  member_count?: number;
}

interface TeamSwitcherProps {
  currentTeamId?: string;
  onTeamChange?: (teamId: string) => void;
}

export default function TeamSwitcher({
  currentTeamId,
  onTeamChange,
}: TeamSwitcherProps) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetchTeams();
  }, []);

  useEffect(() => {
    if (currentTeamId && teams.length > 0) {
      const team = teams.find((t) => t.id === currentTeamId);
      if (team) setSelectedTeam(team);
    }
  }, [currentTeamId, teams]);

  async function fetchTeams() {
    try {
      const res = await fetch("/api/teams");
      if (res.ok) {
        const data = await res.json();
        setTeams(data.teams || []);
        if (!currentTeamId && data.teams?.length > 0) {
          setSelectedTeam(data.teams[0]);
        }
      }
    } catch {
      // Silently handle
    }
  }

  function handleSelect(team: Team) {
    setSelectedTeam(team);
    setOpen(false);
    onTeamChange?.(team.id);
  }

  if (teams.length === 0) return null;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          <div className="flex items-center gap-2 truncate">
            <Users className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="truncate">
              {selectedTeam?.name || "Select team..."}
            </span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="start">
        <DropdownMenuLabel>Teams</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {teams.map((team) => (
          <DropdownMenuItem
            key={team.id}
            onSelect={() => handleSelect(team)}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>{team.name}</span>
            </div>
            <div className="flex items-center gap-2">
              {team.member_count && (
                <Badge variant="secondary" className="text-xs">
                  {team.member_count}
                </Badge>
              )}
              {selectedTeam?.id === team.id && (
                <Check className="h-4 w-4" />
              )}
            </div>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => {
            window.location.href = "/dashboard/settings/team";
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Team
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
