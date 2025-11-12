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
      {/* Premium Header */}
      <div className="relative overflow-hidden border border-slate-200 dark:border-slate-800 rounded-2xl bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
        <div className="absolute inset-0 bg-grid-slate-200/50 dark:bg-grid-slate-700/50 [mask-image:linear-gradient(0deg,transparent,black)]"></div>
        <div className="relative p-8">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-5">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/50">
                <Users className="h-8 w-8 text-white" />
              </div>
              <div className="max-w-2xl">
                <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                  Your AI Executive Suite
                </h1>
                <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
                  Build your dream team with 14 executive-level AI specialists. Get instant access to world-class expertise in strategy, sales, marketing, operations, legal, HR, and more—without the $2M+ annual cost of hiring a full C-suite.
                </p>
                <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span>Available 24/7</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span>Zero onboarding time</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span>Infinite scalability</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Button
                onClick={seedStarterAssistants}
                disabled={actionLoading === "seed"}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/30 min-w-[200px]"
                size="lg"
              >
                <Sparkles className="mr-2 h-5 w-5" />
                {actionLoading === "seed" ? "Building Your Team..." : "Build Your Executive Team"}
              </Button>
              <Button
                asChild
                variant="outline"
                className="border-slate-200 dark:border-slate-800"
                size="lg"
              >
                <Link href="/dashboard/assistants/browse">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Custom Role
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Professional Disclaimer */}
      <Card className="p-6 border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <AlertCircle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">
                Important Professional Disclaimer
              </h3>
              <p className="text-sm text-amber-800 dark:text-amber-200 leading-relaxed">
                Our AI Executive Suite provides general guidance, strategic insights, and educational information to help you make informed business decisions. However, these AI advisors are not substitutes for licensed professionals.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-4 text-xs text-amber-700 dark:text-amber-300">
              <div className="flex items-start gap-2">
                <div className="flex-shrink-0 mt-0.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-amber-600 dark:bg-amber-400"></div>
                </div>
                <div>
                  <span className="font-medium">Legal Matters:</span> The Legal & Contracts Advisor provides general legal information and guidance. For binding legal advice, contract review, or representation, consult a licensed attorney in your jurisdiction.
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="flex-shrink-0 mt-0.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-amber-600 dark:bg-amber-400"></div>
                </div>
                <div>
                  <span className="font-medium">HR & Employment:</span> The HR Director offers general guidance on people operations. For employment law compliance, workplace investigations, or complex employee matters, consult qualified HR professionals and employment attorneys.
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="flex-shrink-0 mt-0.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-amber-600 dark:bg-amber-400"></div>
                </div>
                <div>
                  <span className="font-medium">Financial Decisions:</span> The Strategic Business Advisor provides business strategy and financial planning insights. For tax advice, accounting, investment decisions, or financial planning, consult certified accountants and financial advisors.
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="flex-shrink-0 mt-0.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-amber-600 dark:bg-amber-400"></div>
                </div>
                <div>
                  <span className="font-medium">Verify Critical Decisions:</span> Always verify important business decisions with qualified professionals in the relevant field. AI advisors should augment—not replace—professional judgment and expertise.
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Team Members</p>
              <p className="text-3xl font-semibold text-slate-900 dark:text-slate-100 mt-1">{stats.total}</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center">
              <Users className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Active Executives</p>
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
              <p className="text-sm text-slate-600 dark:text-slate-400">Strategic Sessions</p>
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
              <p className="text-sm text-slate-600 dark:text-slate-400">Expert Insights</p>
              <p className="text-3xl font-semibold text-slate-900 dark:text-slate-100 mt-1">{stats.total_messages}</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center">
              <Brain className="h-5 w-5 text-orange-600 dark:text-orange-400" />
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
          icon={Users}
          title="Build Your AI Executive Team"
          description="Get instant access to 14 world-class executives—CEO, CFO, CMO, Legal, HR, Operations, and more. Replace $2M+ in annual salaries with AI expertise available 24/7."
          action={{
            label: actionLoading === "seed" ? "Building Your Team..." : "Build Your Executive Team",
            onClick: seedStarterAssistants,
          }}
          secondaryAction={{
            label: "Create Custom Role",
            href: "/dashboard/assistants/browse",
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
