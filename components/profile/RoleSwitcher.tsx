"use client";

import { useState } from "react";
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
import { GraduationCap, BookOpen, Code, Briefcase, Palette, Sparkles, Users, Check } from "lucide-react";
import { toast } from "sonner";

interface RoleSwitcherProps {
  currentRole?: string;
  onRoleChange?: (role: string) => void;
}

const ROLES = [
  { id: "teacher", label: "Teacher", icon: GraduationCap, color: "text-green-600" },
  { id: "researcher", label: "Researcher", icon: BookOpen, color: "text-purple-600" },
  { id: "developer", label: "Developer", icon: Code, color: "text-blue-600" },
  { id: "business_owner", label: "Business", icon: Briefcase, color: "text-orange-600" },
  { id: "content_creator", label: "Creator", icon: Palette, color: "text-pink-600" },
  { id: "student", label: "Student", icon: Sparkles, color: "text-indigo-600" },
  { id: "consultant", label: "Consultant", icon: Users, color: "text-teal-600" },
  { id: "freelancer", label: "Freelancer", icon: Sparkles, color: "text-yellow-600" },
];

export function RoleSwitcher({ currentRole, onRoleChange }: RoleSwitcherProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const currentRoleData = ROLES.find((r) => r.id === currentRole);

  const handleRoleChange = async (newRole: string) => {
    if (newRole === currentRole) return;

    setIsUpdating(true);
    try {
      const response = await fetch("/api/profile/context", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userRole: newRole }),
      });

      if (response.ok) {
        toast.success(`Switched to ${ROLES.find((r) => r.id === newRole)?.label} view`);
        if (onRoleChange) {
          onRoleChange(newRole);
        } else {
          // Reload to apply new role context
          window.location.reload();
        }
      } else {
        toast.error("Failed to switch role");
      }
    } catch (error) {
      console.error("Error switching role:", error);
      toast.error("Failed to switch role");
    } finally {
      setIsUpdating(false);
    }
  };

  if (!currentRole) {
    return null;
  }

  const CurrentIcon = currentRoleData?.icon || Users;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 border-slate-300 dark:border-slate-700"
          disabled={isUpdating}
        >
          <CurrentIcon className={`h-4 w-4 ${currentRoleData?.color}`} />
          <span className="hidden md:inline">{currentRoleData?.label || "Select Role"}</span>
          <Badge variant="secondary" className="ml-1 text-xs">
            Current
          </Badge>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Switch View
          <p className="text-xs text-muted-foreground font-normal mt-1">
            Changes feature order & suggestions
          </p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {ROLES.map((role) => {
          const Icon = role.icon;
          const isCurrent = role.id === currentRole;

          return (
            <DropdownMenuItem
              key={role.id}
              onClick={() => handleRoleChange(role.id)}
              className="cursor-pointer"
            >
              <Icon className={`h-4 w-4 mr-2 ${role.color}`} />
              <span className="flex-1">{role.label}</span>
              {isCurrent && <Check className="h-4 w-4 text-green-600" />}
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <a href="/dashboard/settings/profile" className="text-xs text-muted-foreground cursor-pointer">
            Edit full profile →
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
