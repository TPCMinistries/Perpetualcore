"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Bot,
  Plus,
  MessageSquare,
  Settings,
  Trash2,
  Star,
  TrendingUp,
  Users,
  Sparkles,
  Search,
  Filter,
  LayoutGrid,
  List as ListIcon,
  Zap,
  XCircle,
  Wand2,
  Briefcase,
  Heart,
  Code,
  BarChart3,
  CheckCircle2,
  Clock,
  Brain,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Assistant {
  id: string;
  name: string;
  description: string;
  role: string;
  avatar_emoji: string;
  tone: string;
  enabled: boolean;
  total_conversations: number;
  total_messages: number;
  is_public: boolean;
  created_at: string;
}

interface Stats {
  total: number;
  active: number;
  total_conversations: number;
  total_messages: number;
}

// AI-powered assistant suggestions
const assistantSuggestions = [
  {
    name: "Marketing Maven",
    role: "marketing",
    emoji: "🎯",
    description: "Create compelling campaigns and analyze market trends",
    tone: "energetic",
  },
  {
    name: "Code Reviewer Pro",
    role: "code_review",
    emoji: "👨‍💻",
    description: "Review code quality, suggest improvements, and catch bugs",
    tone: "analytical",
  },
  {
    name: "Customer Success Hero",
    role: "customer_support",
    emoji: "🦸",
    description: "Provide exceptional customer support with empathy",
    tone: "friendly",
  },
];

// Role icons mapping
const roleIcons: { [key: string]: any } = {
  marketing: Sparkles,
  sales: TrendingUp,
  research: Search,
  code_review: Code,
  writing: MessageSquare,
  customer_support: Heart,
  project_management: Briefcase,
  data_analysis: BarChart3,
};

export default function AssistantsPage() {
  const router = useRouter();
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    active: 0,
    total_conversations: 0,
    total_messages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Filter and view states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterTone, setFilterTone] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showAISuggestions, setShowAISuggestions] = useState(true);

  useEffect(() => {
    fetchAssistants();
  }, []);

  async function fetchAssistants() {
    try {
      const response = await fetch("/api/assistants");
      if (response.ok) {
        const data = await response.json();
        setAssistants(data.assistants || []);
        calculateStats(data.assistants || []);
      }
    } catch (error) {
      console.error("Error fetching assistants:", error);
      toast.error("Failed to load assistants");
    } finally {
      setLoading(false);
    }
  }

  function calculateStats(assistantsList: Assistant[]) {
    const active = assistantsList.filter((a) => a.enabled).length;
    const totalConvos = assistantsList.reduce((sum, a) => sum + a.total_conversations, 0);
    const totalMsgs = assistantsList.reduce((sum, a) => sum + a.total_messages, 0);

    setStats({
      total: assistantsList.length,
      active,
      total_conversations: totalConvos,
      total_messages: totalMsgs,
    });
  }

  async function deleteAssistant(assistantId: string, name: string) {
    if (!confirm(`Delete "${name}"? All conversations will be deleted.`)) return;

    setActionLoading(assistantId);
    try {
      const response = await fetch(`/api/assistants/${assistantId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Assistant deleted");
        fetchAssistants();
      } else {
        toast.error("Failed to delete assistant");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setActionLoading(null);
    }
  }

  async function seedStarterAssistants() {
    setActionLoading("seed");
    try {
      const response = await fetch("/api/assistants/seed", {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`Created ${data.count} starter assistants!`);
        fetchAssistants();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to seed assistants");
      }
    } catch (error) {
      toast.error("An error occurred while seeding assistants");
    } finally {
      setActionLoading(null);
    }
  }

  function getRoleBadge(role: string) {
    const colors: { [key: string]: string } = {
      marketing: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
      sales: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      research: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      code_review: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      writing: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      customer_support: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      project_management: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
      data_analysis: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
    };

    const RoleIcon = roleIcons[role] || Bot;

    return (
      <Badge variant="outline" className={colors[role] || "bg-gray-100 text-gray-800"}>
        <RoleIcon className="h-3 w-3 mr-1" />
        {role.replace("_", " ")}
      </Badge>
    );
  }

  function getToneBadge(tone: string) {
    return (
      <Badge variant="secondary" className="text-xs">
        {tone}
      </Badge>
    );
  }

  function getRoleIcon(role: string) {
    return roleIcons[role] || Bot;
  }

  // Filter assistants
  const filteredAssistants = assistants.filter((assistant) => {
    const matchesSearch = assistant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         assistant.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === "all" || assistant.role === filterRole;
    const matchesStatus = filterStatus === "all" ||
                         (filterStatus === "active" && assistant.enabled) ||
                         (filterStatus === "inactive" && !assistant.enabled);
    const matchesTone = filterTone === "all" || assistant.tone === filterTone;

    return matchesSearch && matchesRole && matchesStatus && matchesTone;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-8 bg-white dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-slate-900 dark:bg-slate-100 flex items-center justify-center">
              <Brain className="h-6 w-6 text-white dark:text-slate-900" />
            </div>
            <div>
              <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">
                AI Assistants
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                Create custom AI assistants tailored to specific roles and tasks
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={seedStarterAssistants}
              disabled={actionLoading === "seed"}
              className="border-slate-200 dark:border-slate-800"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              {actionLoading === "seed" ? "Seeding..." : "Seed Starter Assistants"}
            </Button>
            <Button asChild className="bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900">
              <Link href="/dashboard/assistants/browse">
                <Plus className="mr-2 h-4 w-4" />
                Create Assistant
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Total Assistants</p>
              <p className="text-3xl font-semibold text-slate-900 dark:text-slate-100 mt-1">{stats.total}</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center">
              <Bot className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Active</p>
              <p className="text-3xl font-semibold text-slate-900 dark:text-slate-100 mt-1">{stats.active}</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-green-50 dark:bg-green-950/30 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Conversations</p>
              <p className="text-3xl font-semibold text-slate-900 dark:text-slate-100 mt-1">{stats.total_conversations}</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-purple-50 dark:bg-purple-950/30 flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Total Messages</p>
              <p className="text-3xl font-semibold text-slate-900 dark:text-slate-100 mt-1">{stats.total_messages}</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* AI Suggestions Panel */}
      {showAISuggestions && (
        <Card className="p-6 bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Wand2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              <h3 className="font-semibold text-purple-900 dark:text-purple-100">
                AI-Powered Assistant Suggestions
              </h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAISuggestions(false)}
            >
              <XCircle className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {assistantSuggestions.map((suggestion, idx) => (
              <Link key={idx} href="/dashboard/assistants/create" className="block">
                <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer group">
                  <div className="flex items-start gap-3">
                    <div className="text-3xl">{suggestion.emoji}</div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm mb-1 truncate text-slate-900 dark:text-slate-100">
                        {suggestion.name}
                      </h4>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                        {suggestion.description}
                      </p>
                      <div className="flex items-center gap-1">
                        {getRoleBadge(suggestion.role)}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      )}

      {/* Search and Filters */}
      {assistants.length > 0 && (
        <Card className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search assistants..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="sales">Sales</SelectItem>
                  <SelectItem value="research">Research</SelectItem>
                  <SelectItem value="code_review">Code Review</SelectItem>
                  <SelectItem value="writing">Writing</SelectItem>
                  <SelectItem value="customer_support">Support</SelectItem>
                  <SelectItem value="project_management">PM</SelectItem>
                  <SelectItem value="data_analysis">Analytics</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterTone} onValueChange={setFilterTone}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Tone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tones</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="friendly">Friendly</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                  <SelectItem value="formal">Formal</SelectItem>
                  <SelectItem value="energetic">Energetic</SelectItem>
                  <SelectItem value="analytical">Analytical</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex gap-1 border rounded-md p-1">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                >
                  <ListIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Assistants Grid */}
      {assistants.length === 0 ? (
        <EmptyState
          icon={Bot}
          title="No assistants yet"
          description="Create custom AI assistants tailored to your specific needs, or get started with our 8 pre-configured starter assistants"
          action={{
            label: "Create Your First Assistant",
            href: "/dashboard/assistants/create",
          }}
          secondaryAction={{
            label: actionLoading === "seed" ? "Creating..." : "Seed 8 Starter Assistants",
            onClick: seedStarterAssistants,
          }}
        />
      ) : filteredAssistants.length === 0 ? (
        <Card className="p-12">
          <div className="text-center">
            <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No assistants found</h3>
            <p className="text-sm text-muted-foreground">
              Try adjusting your search or filters
            </p>
          </div>
        </Card>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">
              {filteredAssistants.length} Assistant{filteredAssistants.length !== 1 ? "s" : ""}
            </h2>
          </div>

          <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
            {filteredAssistants.map((assistant) => {
              const RoleIcon = getRoleIcon(assistant.role);
              const isActive = assistant.enabled;

              return (
                <Card
                  key={assistant.id}
                  className={`transition-all hover:shadow-lg border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 ${
                    isActive
                      ? "border-l-4 border-l-green-500"
                      : "opacity-60 hover:opacity-100"
                  }`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between mb-3">
                      <div className="relative">
                        <div className="text-5xl">{assistant.avatar_emoji}</div>
                        {isActive && (
                          <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-900 animate-pulse"></div>
                        )}
                      </div>
                      <div className="flex flex-col gap-1 items-end">
                        {assistant.is_public && (
                          <Badge variant="outline" className="text-xs">
                            <Users className="h-3 w-3 mr-1" />
                            Shared
                          </Badge>
                        )}
                        {isActive ? (
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/50 dark:text-green-400 text-xs">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            Disabled
                          </Badge>
                        )}
                      </div>
                    </div>
                    <CardTitle className="text-xl flex items-center gap-2">
                      {assistant.name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {assistant.description}
                    </p>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Role & Tone */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {getRoleBadge(assistant.role)}
                      {getToneBadge(assistant.tone)}
                    </div>

                    {/* Stats */}
                    {assistant.total_messages > 0 && (
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          {assistant.total_conversations}
                        </span>
                        <span className="flex items-center gap-1">
                          <Zap className="h-3 w-3" />
                          {assistant.total_messages} msgs
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(assistant.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        className="flex-1 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900"
                        onClick={() => router.push(`/dashboard/assistants/${assistant.id}/chat`)}
                      >
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Chat
                      </Button>

                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => router.push(`/dashboard/assistants/${assistant.id}/settings`)}
                        className="border-slate-200 dark:border-slate-800"
                      >
                        <Settings className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => deleteAssistant(assistant.id, assistant.name)}
                        disabled={actionLoading === assistant.id}
                        className="border-slate-200 dark:border-slate-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
