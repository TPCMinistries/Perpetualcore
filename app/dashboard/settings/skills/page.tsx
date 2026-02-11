"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CheckCircle2,
  XCircle,
  Settings,
  ExternalLink,
  Loader2,
  Search,
  RefreshCw,
  Sparkles,
  Zap,
  Plus,
  Pencil,
  Puzzle,
  Key,
  Cloud,
  Calendar,
  Mail,
  CheckSquare,
  GitBranch,
  Github,
  MessageSquare,
  FileText,
  Image,
  Globe,
  Cloudy,
  Database,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";

// Skill definitions matching registry
const SKILL_CATALOG = [
  {
    id: "google-calendar",
    name: "Google Calendar",
    description: "Manage your Google Calendar - view events, schedule meetings, find free time",
    icon: Calendar,
    color: "text-blue-500",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    category: "productivity",
    authType: "oauth",
    provider: "google_calendar",
    docsUrl: "https://calendar.google.com",
  },
  {
    id: "gmail",
    name: "Gmail",
    description: "AI-powered email management - search, compose, triage, and send emails",
    icon: Mail,
    color: "text-red-500",
    bgColor: "bg-red-50 dark:bg-red-950/30",
    category: "communication",
    authType: "oauth",
    provider: "google_gmail",
    docsUrl: "https://mail.google.com",
  },
  {
    id: "todoist",
    name: "Todoist",
    description: "Manage tasks and projects - create, complete, and organize your to-dos",
    icon: CheckSquare,
    color: "text-red-600",
    bgColor: "bg-red-50 dark:bg-red-950/30",
    category: "productivity",
    authType: "api_key",
    provider: "todoist",
    docsUrl: "https://todoist.com/app/settings/integrations/developer",
    keyPlaceholder: "Paste your Todoist API token",
    keyHelp: "Find your API token in Todoist Settings → Integrations → Developer",
  },
  {
    id: "linear",
    name: "Linear",
    description: "Manage issues and projects - create, update, and track engineering work",
    icon: GitBranch,
    color: "text-indigo-500",
    bgColor: "bg-indigo-50 dark:bg-indigo-950/30",
    category: "development",
    authType: "api_key",
    provider: "linear",
    docsUrl: "https://linear.app/settings/api",
    keyPlaceholder: "lin_api_...",
    keyHelp: "Create a Personal API Key in Linear Settings → API",
  },
  {
    id: "github",
    name: "GitHub",
    description: "Interact with repositories, issues, and pull requests",
    icon: Github,
    color: "text-slate-900 dark:text-white",
    bgColor: "bg-slate-100 dark:bg-slate-800",
    category: "development",
    authType: "oauth",
    provider: "github",
    docsUrl: "https://github.com/settings/tokens",
  },
  {
    id: "trello",
    name: "Trello",
    description: "Manage Trello boards, lists, and cards",
    icon: Database,
    color: "text-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    category: "productivity",
    authType: "api_key",
    provider: "trello",
    docsUrl: "https://trello.com/power-ups/admin",
    keyPlaceholder: "Your Trello API key",
    keyHelp: "Get your API key from Trello Power-Ups Admin",
  },
  {
    id: "notion",
    name: "Notion",
    description: "Search and manage Notion pages, databases, and workspaces",
    icon: FileText,
    color: "text-slate-800 dark:text-slate-200",
    bgColor: "bg-slate-100 dark:bg-slate-800",
    category: "productivity",
    authType: "api_key",
    provider: "notion",
    docsUrl: "https://www.notion.so/my-integrations",
    keyPlaceholder: "secret_...",
    keyHelp: "Create an integration at notion.so/my-integrations",
  },
  {
    id: "discord",
    name: "Discord",
    description: "Send messages and manage Discord servers",
    icon: MessageSquare,
    color: "text-indigo-600",
    bgColor: "bg-indigo-50 dark:bg-indigo-950/30",
    category: "communication",
    authType: "api_key",
    provider: "discord",
    docsUrl: "https://discord.com/developers/applications",
    keyPlaceholder: "Bot token",
    keyHelp: "Get your bot token from Discord Developer Portal",
  },
  {
    id: "weather",
    name: "Weather",
    description: "Get current weather and forecasts for any location",
    icon: Cloudy,
    color: "text-sky-500",
    bgColor: "bg-sky-50 dark:bg-sky-950/30",
    category: "utility",
    authType: "none",
    provider: "weather",
  },
  {
    id: "web-search",
    name: "Web Search",
    description: "Search the web for current information",
    icon: Globe,
    color: "text-green-500",
    bgColor: "bg-green-50 dark:bg-green-950/30",
    category: "utility",
    authType: "system",
    provider: "web_search",
  },
  {
    id: "pdf",
    name: "PDF Generator",
    description: "Generate PDF documents from text and data",
    icon: FileText,
    color: "text-red-700",
    bgColor: "bg-red-50 dark:bg-red-950/30",
    category: "utility",
    authType: "none",
    provider: "pdf",
  },
  {
    id: "image-gen",
    name: "Image Generation",
    description: "Generate images with AI (DALL-E, Stable Diffusion)",
    icon: Image,
    color: "text-purple-500",
    bgColor: "bg-purple-50 dark:bg-purple-950/30",
    category: "creative",
    authType: "system",
    provider: "image_gen",
  },
];

const CATEGORIES = [
  { id: "all", label: "All Skills" },
  { id: "productivity", label: "Productivity" },
  { id: "communication", label: "Communication" },
  { id: "development", label: "Development" },
  { id: "utility", label: "Utility" },
  { id: "creative", label: "Creative" },
];

interface SkillStatus {
  skillId: string;
  enabled: boolean;
  hasCredential: boolean;
  credentialSource?: "user" | "organization" | "system";
  lastUsedAt?: string;
}

interface ConfigDialogState {
  open: boolean;
  skill: typeof SKILL_CATALOG[0] | null;
}

export default function SkillsSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [skillStatuses, setSkillStatuses] = useState<Record<string, SkillStatus>>({});
  const [customSkills, setCustomSkills] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [configDialog, setConfigDialog] = useState<ConfigDialogState>({ open: false, skill: null });
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);

  // Load skill statuses + custom skills on mount
  useEffect(() => {
    loadSkillStatuses();
    loadCustomSkills();
  }, []);

  async function loadSkillStatuses() {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Please sign in to manage skills");
        return;
      }

      // Get user's enabled skills
      const { data: userSkills } = await supabase
        .from("user_skills")
        .select("skill_id, enabled, last_used_at")
        .eq("user_id", user.id);

      // Get user's credentials
      const { data: credentials } = await supabase
        .from("skill_credentials")
        .select("provider, is_active")
        .eq("user_id", user.id);

      // Build status map
      const statuses: Record<string, SkillStatus> = {};

      for (const skill of SKILL_CATALOG) {
        const userSkill = userSkills?.find(s => s.skill_id === skill.id);
        const credential = credentials?.find(c => c.provider === skill.provider);

        // Determine if skill has working credentials
        let hasCredential = false;
        let credentialSource: "user" | "organization" | "system" | undefined;

        if (skill.authType === "none") {
          hasCredential = true;
        } else if (skill.authType === "system") {
          // System credentials - always available if configured server-side
          hasCredential = true;
          credentialSource = "system";
        } else if (credential?.is_active) {
          hasCredential = true;
          credentialSource = "user";
        }

        statuses[skill.id] = {
          skillId: skill.id,
          enabled: userSkill?.enabled ?? false,
          hasCredential,
          credentialSource,
          lastUsedAt: userSkill?.last_used_at,
        };
      }

      setSkillStatuses(statuses);
    } catch (error) {
      console.error("Failed to load skill statuses:", error);
      toast.error("Failed to load skills");
    } finally {
      setLoading(false);
    }
  }

  async function loadCustomSkills() {
    try {
      const res = await fetch("/api/skills/custom?mine=true");
      if (res.ok) {
        const data = await res.json();
        setCustomSkills(data.skills || []);
      }
    } catch (error) {
      console.error("Failed to load custom skills:", error);
    }
  }

  async function toggleSkill(skillId: string, enabled: boolean) {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      // Check if skill needs credentials
      const skill = SKILL_CATALOG.find(s => s.id === skillId);
      const status = skillStatuses[skillId];

      if (enabled && skill?.authType === "api_key" && !status?.hasCredential) {
        // Open config dialog instead
        setConfigDialog({ open: true, skill });
        return;
      }

      await supabase.from("user_skills").upsert({
        user_id: user.id,
        skill_id: skillId,
        enabled,
        installed_at: new Date().toISOString(),
      }, {
        onConflict: "user_id,skill_id",
      });

      setSkillStatuses(prev => ({
        ...prev,
        [skillId]: { ...prev[skillId], enabled },
      }));

      toast.success(enabled ? `${skill?.name} enabled` : `${skill?.name} disabled`);
    } catch (error) {
      console.error("Failed to toggle skill:", error);
      toast.error("Failed to update skill");
    }
  }

  async function saveApiKey() {
    if (!configDialog.skill || !apiKeyInput.trim()) return;

    setSaving(true);
    try {
      const response = await fetch("/api/skills/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: configDialog.skill.provider,
          apiKey: apiKeyInput.trim(),
          label: `${configDialog.skill.name} API Key`,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to save API key");
      }

      // Update status
      setSkillStatuses(prev => ({
        ...prev,
        [configDialog.skill!.id]: {
          ...prev[configDialog.skill!.id],
          hasCredential: true,
          credentialSource: "user",
        },
      }));

      // Also enable the skill
      await toggleSkill(configDialog.skill.id, true);

      toast.success(`${configDialog.skill.name} connected successfully!`);
      setConfigDialog({ open: false, skill: null });
      setApiKeyInput("");
    } catch (error: any) {
      console.error("Failed to save API key:", error);
      toast.error(error.message || "Failed to save API key");
    } finally {
      setSaving(false);
    }
  }

  async function testConnection() {
    if (!configDialog.skill || !apiKeyInput.trim()) return;

    setTestingConnection(true);
    try {
      const response = await fetch("/api/skills/credentials/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: configDialog.skill.provider,
          apiKey: apiKeyInput.trim(),
        }),
      });

      const result = await response.json();

      if (result.valid) {
        toast.success("Connection successful!");
      } else {
        toast.error(result.error || "Connection failed");
      }
    } catch (error) {
      toast.error("Failed to test connection");
    } finally {
      setTestingConnection(false);
    }
  }

  async function disconnectSkill(skill: typeof SKILL_CATALOG[0]) {
    try {
      const response = await fetch(`/api/skills/credentials?provider=${skill.provider}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to disconnect");
      }

      // Update status
      setSkillStatuses(prev => ({
        ...prev,
        [skill.id]: {
          ...prev[skill.id],
          hasCredential: false,
          credentialSource: undefined,
          enabled: false,
        },
      }));

      toast.success(`${skill.name} disconnected`);
    } catch (error) {
      toast.error("Failed to disconnect skill");
    }
  }

  // Filter skills
  const filteredSkills = SKILL_CATALOG.filter(skill => {
    const matchesSearch = skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      skill.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || skill.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Count by category
  const categoryCounts = CATEGORIES.map(cat => ({
    ...cat,
    count: cat.id === "all"
      ? SKILL_CATALOG.length
      : SKILL_CATALOG.filter(s => s.category === cat.id).length,
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-50 via-purple-50 to-violet-50 dark:from-indigo-950/20 dark:via-purple-950/20 dark:to-violet-950/20 border border-indigo-100 dark:border-indigo-900/20 p-8 shadow-lg">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="relative flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-900 via-purple-800 to-violet-900 dark:from-indigo-100 dark:via-purple-100 dark:to-violet-100 bg-clip-text text-transparent">
              AI Skills
            </h1>
            <p className="text-indigo-700 dark:text-indigo-300 mt-1">
              Connect your tools and supercharge your AI assistant
            </p>
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search skills..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" onClick={loadSkillStatuses}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={() => router.push("/dashboard/settings/skills/create")}>
              <Plus className="h-4 w-4 mr-2" />
              Create Custom Skill
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Category Tabs */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
          {categoryCounts.map((cat) => (
            <TabsTrigger key={cat.id} value={cat.id} className="text-xs sm:text-sm">
              {cat.label}
              <Badge variant="secondary" className="ml-2 hidden sm:inline-flex">
                {cat.count}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Skills Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredSkills.map((skill) => {
          const status = skillStatuses[skill.id];
          const IconComponent = skill.icon;

          return (
            <Card key={skill.id} className="hover:shadow-lg transition-all duration-300">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${skill.bgColor}`}>
                    <IconComponent className={`h-6 w-6 ${skill.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-slate-900 dark:text-white truncate">
                        {skill.name}
                      </h3>
                      {status?.hasCredential ? (
                        <Badge className="bg-green-50 border-green-300 text-green-700 dark:bg-green-950/30 dark:border-green-800 dark:text-green-400">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Connected
                        </Badge>
                      ) : skill.authType === "api_key" ? (
                        <Badge variant="outline" className="bg-amber-50 border-amber-300 text-amber-700 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-400">
                          <Key className="h-3 w-3 mr-1" />
                          Needs Key
                        </Badge>
                      ) : skill.authType === "oauth" ? (
                        <Badge variant="outline" className="bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-400">
                          <Cloud className="h-3 w-3 mr-1" />
                          OAuth
                        </Badge>
                      ) : null}
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                      {skill.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    {skill.authType === "api_key" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setConfigDialog({ open: true, skill });
                          setApiKeyInput("");
                        }}
                      >
                        <Settings className="h-4 w-4 mr-1" />
                        {status?.hasCredential ? "Update" : "Configure"}
                      </Button>
                    )}
                    {skill.authType === "oauth" && !status?.hasCredential && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          toast.info(`OAuth for ${skill.name} - configure in Integrations`);
                        }}
                      >
                        <Cloud className="h-4 w-4 mr-1" />
                        Connect
                      </Button>
                    )}
                    {skill.docsUrl && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(skill.docsUrl, "_blank")}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <Switch
                    checked={status?.enabled ?? false}
                    onCheckedChange={(checked) => toggleSkill(skill.id, checked)}
                    disabled={!status?.hasCredential && skill.authType === "api_key"}
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredSkills.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Sparkles className="h-12 w-12 mx-auto text-slate-400 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
              No skills found
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              Try adjusting your search or filter
            </p>
          </CardContent>
        </Card>
      )}

      {/* Custom Skills Section */}
      {customSkills.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Puzzle className="h-5 w-5 text-purple-500" />
            <h2 className="text-xl font-semibold">Your Custom Skills</h2>
            <Badge variant="secondary">{customSkills.length}</Badge>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {customSkills.map((skill) => (
              <Card key={skill.id} className="hover:shadow-lg transition-all duration-300">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="h-12 w-12 rounded-xl bg-purple-50 dark:bg-purple-950/30 flex items-center justify-center">
                      <Puzzle className="h-6 w-6 text-purple-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold truncate">{skill.name}</h3>
                        <Badge variant="outline" className="text-xs">
                          {skill.visibility}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {skill.description || "No description"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{skill.tools?.length || 0} tools</span>
                      <span>·</span>
                      <span>{skill.auth_type}</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/dashboard/settings/skills/${skill.id}/edit`)}
                    >
                      <Pencil className="h-3 w-3 mr-1" /> Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Configuration Dialog */}
      <Dialog open={configDialog.open} onOpenChange={(open) => {
        setConfigDialog({ open, skill: open ? configDialog.skill : null });
        if (!open) {
          setApiKeyInput("");
          setShowApiKey(false);
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {configDialog.skill && (
                <>
                  <configDialog.skill.icon className={`h-5 w-5 ${configDialog.skill.color}`} />
                  Configure {configDialog.skill.name}
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {configDialog.skill?.keyHelp || "Enter your API credentials to connect this skill."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <div className="relative">
                <Input
                  id="apiKey"
                  type={showApiKey ? "text" : "password"}
                  placeholder={configDialog.skill?.keyPlaceholder || "Enter API key"}
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? (
                    <EyeOff className="h-4 w-4 text-slate-500" />
                  ) : (
                    <Eye className="h-4 w-4 text-slate-500" />
                  )}
                </Button>
              </div>
              {configDialog.skill?.docsUrl && (
                <p className="text-xs text-slate-500">
                  <a
                    href={configDialog.skill.docsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:underline inline-flex items-center gap-1"
                  >
                    Get your API key here
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </p>
              )}
            </div>

            {skillStatuses[configDialog.skill?.id ?? ""]?.hasCredential && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-700 dark:text-green-400">
                    Currently connected
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => {
                    if (configDialog.skill) {
                      disconnectSkill(configDialog.skill);
                      setConfigDialog({ open: false, skill: null });
                    }
                  }}
                >
                  Disconnect
                </Button>
              </div>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={testConnection}
              disabled={!apiKeyInput.trim() || testingConnection}
            >
              {testingConnection ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Zap className="h-4 w-4 mr-2" />
              )}
              Test Connection
            </Button>
            <Button
              onClick={saveApiKey}
              disabled={!apiKeyInput.trim() || saving}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-2" />
              )}
              Save & Enable
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
