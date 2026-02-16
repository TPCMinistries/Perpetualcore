"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Puzzle, Share2, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface SharedSkill {
  id: string;
  skillId: string;
  skillName: string;
  sharedBy: string;
  sharedByName: string;
  config: Record<string, any>;
  createdAt: string;
}

export default function TeamSharedSkillsPage() {
  const [skills, setSkills] = useState<SharedSkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState("");
  const [sharing, setSharing] = useState(false);

  const availableSkills = [
    { id: "notion", name: "Notion" },
    { id: "github", name: "GitHub" },
    { id: "trello", name: "Trello" },
    { id: "slack", name: "Slack" },
    { id: "linear", name: "Linear" },
    { id: "todoist", name: "Todoist" },
  ];

  useEffect(() => {
    fetchSharedSkills();
  }, []);

  async function fetchSharedSkills() {
    try {
      const res = await fetch("/api/teams/current/skills");
      if (res.ok) {
        const data = await res.json();
        setSkills(data.skills || []);
      }
    } catch {
      // Silently handle — empty state shown
    } finally {
      setLoading(false);
    }
  }

  async function handleShareSkill() {
    if (!selectedSkill) return;
    setSharing(true);
    try {
      const res = await fetch("/api/teams/current/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skillId: selectedSkill }),
      });

      if (res.ok) {
        toast.success("Skill shared with team");
        setShareDialogOpen(false);
        setSelectedSkill("");
        fetchSharedSkills();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to share skill");
      }
    } catch {
      toast.error("Failed to share skill");
    } finally {
      setSharing(false);
    }
  }

  async function handleUnshareSkill(skillId: string) {
    try {
      const res = await fetch(`/api/teams/current/skills?skillId=${skillId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setSkills(skills.filter((s) => s.skillId !== skillId));
        toast.success("Skill removed from team");
      } else {
        toast.error("Failed to remove skill");
      }
    } catch {
      toast.error("Failed to remove skill");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Shared Skills</h1>
          <p className="text-muted-foreground">
            Skills shared across your team with shared credentials
          </p>
        </div>
        <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Share2 className="h-4 w-4 mr-2" />
              Share Skill
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Share Skill with Team</DialogTitle>
              <DialogDescription>
                Team members will be able to use this skill with shared
                credentials.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Select value={selectedSkill} onValueChange={setSelectedSkill}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a skill..." />
                </SelectTrigger>
                <SelectContent>
                  {availableSkills.map((skill) => (
                    <SelectItem key={skill.id} value={skill.id}>
                      {skill.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShareDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleShareSkill}
                disabled={!selectedSkill || sharing}
              >
                {sharing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sharing...
                  </>
                ) : (
                  "Share"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : skills.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Puzzle className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-30" />
            <p className="text-muted-foreground">
              No skills shared with this team yet.
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Share a skill to let all team members use it with shared
              credentials.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {skills.map((skill) => (
            <Card key={skill.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{skill.skillName}</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleUnshareSkill(skill.skillId)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <CardDescription>
                  Shared by {skill.sharedByName}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Active</Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(skill.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
