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
  Users,
  Sparkles,
  Search,
  LayoutGrid,
  List as ListIcon,
  Zap,
  XCircle,
  CheckCircle2,
  Clock,
  TrendingUp,
  AlertCircle,
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

// Role icons mapping
const roleIcons: { [key: string]: any } = {
  marketing: TrendingUp,
  sales: TrendingUp,
  research: Search,
  code_review: Bot,
  writing: MessageSquare,
  customer_support: MessageSquare,
  project_management: CheckCircle2,
  data_analysis: TrendingUp,
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
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

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
        toast.success(`Created ${data.count} executive assistants!`);
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
      marketing: "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-0",
      sales: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-0",
      research: "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-0",
      code_review: "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-400 border-0",
      writing: "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-0",
      customer_support: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-0",
      project_management: "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-0",
      data_analysis: "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-0",
      custom: "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-400 border-0",
    };

    const RoleIcon = roleIcons[role] || Bot;

    return (
      <Badge variant="outline" className={colors[role] || colors.custom}>
        <RoleIcon className="h-3 w-3 mr-1" />
        {role.replace("_", " ")}
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

    return matchesSearch && matchesRole && matchesStatus;
  });

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-32 bg-slate-100 dark:bg-slate-800 rounded-xl"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-slate-100 dark:bg-slate-800 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardContent className="p-8">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">
                  Executive Suite
                </h1>
                <p className="text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
                  Build your AI executive team with 15 specialist advisors across strategy, sales, marketing, operations, legal, HR, and more.
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Button
                onClick={seedStarterAssistants}
                disabled={actionLoading === "seed" || assistants.length > 0}
                className="bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                {actionLoading === "seed" ? "Building Team..." : "Build Executive Team"}
              </Button>
              <Button
                asChild
                variant="outline"
                className="border-slate-200 dark:border-slate-800"
              >
                <Link href="/dashboard/assistants/browse">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Custom
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Team Members</p>
                <p className="text-3xl font-semibold text-slate-900 dark:text-slate-100 mt-1">{stats.total}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Active</p>
                <p className="text-3xl font-semibold text-slate-900 dark:text-slate-100 mt-1">{stats.active}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Conversations</p>
                <p className="text-3xl font-semibold text-slate-900 dark:text-slate-100 mt-1">{stats.total_conversations}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Messages</p>
                <p className="text-3xl font-semibold text-slate-900 dark:text-slate-100 mt-1">{stats.total_messages}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                <Zap className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      {assistants.length > 0 && (
        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search executives..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 border-slate-200 dark:border-slate-800"
                  />
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Select value={filterRole} onValueChange={setFilterRole}>
                  <SelectTrigger className="w-[150px] border-slate-200 dark:border-slate-800">
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
                  <SelectTrigger className="w-[130px] border-slate-200 dark:border-slate-800">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex gap-1 border border-slate-200 dark:border-slate-800 rounded-md p-1">
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                    className={viewMode === "grid" ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900" : ""}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                    className={viewMode === "list" ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900" : ""}
                  >
                    <ListIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Assistants Grid/List */}
      {assistants.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Build Your Executive Team"
          description="Get instant access to 15 executive-level AI specialists—CEO, CFO, Legal, HR, Sales, Marketing, Social Media, Operations, and more."
          action={{
            label: actionLoading === "seed" ? "Building Team..." : "Build Executive Team",
            onClick: seedStarterAssistants,
          }}
          secondaryAction={{
            label: "Create Custom",
            href: "/dashboard/assistants/browse",
          }}
        />
      ) : filteredAssistants.length === 0 ? (
        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="p-12">
            <div className="text-center">
              <Search className="h-12 w-12 mx-auto text-slate-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-slate-900 dark:text-slate-100">No assistants found</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Try adjusting your search or filters
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              {filteredAssistants.length} Executive{filteredAssistants.length !== 1 ? "s" : ""} on Your Team
            </h2>
          </div>

          <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
            {filteredAssistants.map((assistant) => {
              const RoleIcon = getRoleIcon(assistant.role);
              const isActive = assistant.enabled;

              return (
                <Card
                  key={assistant.id}
                  className={`border-slate-200 dark:border-slate-800 hover:shadow-md transition-all ${
                    isActive ? "" : "opacity-60"
                  }`}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="text-4xl">{assistant.avatar_emoji}</div>
                        <div className="flex-1">
                          <CardTitle className="text-lg text-slate-900 dark:text-slate-100">
                            {assistant.name}
                          </CardTitle>
                          <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mt-1">
                            {assistant.description}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {getRoleBadge(assistant.role)}
                      {isActive ? (
                        <Badge className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-0">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-0 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          Disabled
                        </Badge>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Stats */}
                    {assistant.total_messages > 0 && (
                      <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          {assistant.total_conversations}
                        </span>
                        <span className="flex items-center gap-1">
                          <Zap className="h-3 w-3" />
                          {assistant.total_messages}
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
                        className="flex-1 bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
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
                        className="border-slate-200 dark:border-slate-800 text-slate-600 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400"
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

      {/* Professional Disclaimer - Moved to bottom */}
      {assistants.length > 0 && (
        <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 space-y-2">
                <h3 className="font-semibold text-amber-900 dark:text-amber-100 text-sm">
                  Important Professional Disclaimer
                </h3>
                <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
                  Our AI Executive Suite provides general guidance, strategic insights, and educational information to help you make informed business decisions. However, these AI advisors are not substitutes for licensed professionals. For legal matters, consult a licensed attorney. For HR and employment issues, consult qualified HR professionals and employment attorneys. For financial decisions, tax advice, accounting, or investment planning, consult certified accountants and financial advisors. Always verify critical business decisions with qualified professionals in the relevant field.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
