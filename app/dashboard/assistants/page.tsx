"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
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
  CheckCircle2,
  Clock,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DashboardPageWrapper, DashboardHeader } from "@/components/ui/dashboard-header";
import { StatCard, StatCardGrid } from "@/components/ui/stat-card";
import { FilterPills } from "@/components/ui/filter-pills";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

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
  team_id?: string;
  advisor_type?: "standalone" | "dedicated" | "consulting";
  team?: {
    id: string;
    name: string;
    emoji?: string;
    color?: string;
  };
}

interface Stats {
  total: number;
  active: number;
  total_conversations: number;
  total_messages: number;
}

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

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.05,
      duration: 0.3,
      ease: "easeOut",
    },
  }),
};

type StatusFilter = "all" | "active" | "inactive";

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

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<StatusFilter>("all");
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
      marketing: "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400",
      sales: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
      research: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
      code_review: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400",
      writing: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
      customer_support: "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400",
      project_management: "bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400",
      data_analysis: "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400",
      custom: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400",
    };

    const RoleIcon = roleIcons[role] || Bot;

    return (
      <Badge variant="outline" className={cn("border-0", colors[role] || colors.custom)}>
        <RoleIcon className="h-3 w-3 mr-1" />
        {role.replace("_", " ")}
      </Badge>
    );
  }

  const filteredAssistants = assistants.filter((assistant) => {
    const matchesSearch = assistant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         assistant.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" ||
                         (filterStatus === "active" && assistant.enabled) ||
                         (filterStatus === "inactive" && !assistant.enabled);

    return matchesSearch && matchesStatus;
  });

  const statusOptions = [
    { key: "all" as StatusFilter, label: "All", count: assistants.length },
    { key: "active" as StatusFilter, label: "Active", count: stats.active },
    { key: "inactive" as StatusFilter, label: "Inactive", count: assistants.length - stats.active },
  ];

  if (loading) {
    return (
      <DashboardPageWrapper>
        <div className="space-y-6">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-16 rounded-xl" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-xl" />
            ))}
          </div>
        </div>
      </DashboardPageWrapper>
    );
  }

  return (
    <DashboardPageWrapper>
      <DashboardHeader
        title="AI Advisors"
        subtitle="Your AI advisor team - specialist advisors across strategy, sales, marketing, operations, and more"
        icon={Users}
        iconColor="violet"
        stats={[
          { label: "advisors", value: stats.total },
          { label: "active", value: stats.active },
          { label: "conversations", value: stats.total_conversations },
        ]}
        actions={[
          {
            label: "Create Custom",
            icon: Plus,
            href: "/dashboard/assistants/browse",
            variant: "outline",
          },
          {
            label: actionLoading === "seed" ? "Building..." : "Build Team",
            icon: Sparkles,
            onClick: seedStarterAssistants,
            variant: "primary",
          },
        ]}
      />

      {/* Stats Cards */}
      <motion.div
        custom={0}
        initial="hidden"
        animate="visible"
        variants={cardVariants}
      >
        <StatCardGrid columns={4} className="mb-6">
          <StatCard
            label="Team Members"
            value={stats.total}
            icon={Users}
            iconColor="violet"
            description="AI advisors on your team"
          />
          <StatCard
            label="Active"
            value={stats.active}
            icon={CheckCircle2}
            iconColor="emerald"
            description="Currently enabled"
          />
          <StatCard
            label="Conversations"
            value={stats.total_conversations}
            icon={MessageSquare}
            iconColor="blue"
            description="Total chat sessions"
          />
          <StatCard
            label="Messages"
            value={stats.total_messages}
            icon={Zap}
            iconColor="amber"
            description="Messages exchanged"
          />
        </StatCardGrid>
      </motion.div>

      {/* Filters */}
      {assistants.length > 0 && (
        <motion.div
          custom={1}
          initial="hidden"
          animate="visible"
          variants={cardVariants}
          className="mb-6"
        >
          <Card>
            <CardContent className="py-4">
              <div className="flex flex-col md:flex-row items-center gap-4">
                <div className="flex-1 w-full md:w-auto">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Search advisors..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 h-11 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                  <FilterPills
                    options={statusOptions}
                    value={filterStatus}
                    onChange={setFilterStatus}
                  />
                  <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={cn(
                        "p-2 rounded-md transition-colors",
                        viewMode === "grid"
                          ? "bg-white dark:bg-slate-700 shadow-sm"
                          : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                      )}
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      className={cn(
                        "p-2 rounded-md transition-colors",
                        viewMode === "list"
                          ? "bg-white dark:bg-slate-700 shadow-sm"
                          : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                      )}
                    >
                      <ListIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Assistants Grid/List */}
      {assistants.length === 0 ? (
        <motion.div
          custom={2}
          initial="hidden"
          animate="visible"
          variants={cardVariants}
        >
          <EmptyState
            icon={Users}
            title="Build Your Executive Team"
            description="Get instant access to executive-level AI specialists—CEO, CFO, Legal, HR, Sales, Marketing, Social Media, Operations, and more."
            action={{
              label: actionLoading === "seed" ? "Building Team..." : "Build Executive Team",
              onClick: seedStarterAssistants,
            }}
            secondaryAction={{
              label: "Create Custom",
              href: "/dashboard/assistants/browse",
            }}
          />
        </motion.div>
      ) : filteredAssistants.length === 0 ? (
        <motion.div
          custom={2}
          initial="hidden"
          animate="visible"
          variants={cardVariants}
        >
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 w-fit mx-auto mb-4">
                  <Search className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-slate-900 dark:text-white">No advisors found</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Try adjusting your search or filters
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              {filteredAssistants.length} Advisor{filteredAssistants.length !== 1 ? "s" : ""} on Your Team
            </h2>
          </div>

          <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
            {filteredAssistants.map((assistant, i) => {
              const isActive = assistant.enabled;

              return (
                <motion.div
                  key={assistant.id}
                  custom={i + 2}
                  initial="hidden"
                  animate="visible"
                  variants={cardVariants}
                >
                  <Card
                    className={cn(
                      "hover:shadow-lg transition-all hover:border-violet-300 dark:hover:border-violet-700",
                      !isActive && "opacity-60"
                    )}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start gap-3">
                        <div className="text-4xl p-2 rounded-xl bg-slate-100 dark:bg-slate-800">
                          {assistant.avatar_emoji}
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg text-slate-900 dark:text-white">
                            {assistant.name}
                          </CardTitle>
                          <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                            {assistant.description}
                          </p>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        {getRoleBadge(assistant.role)}
                        {isActive ? (
                          <Badge className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-0">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-0">
                            Disabled
                          </Badge>
                        )}
                        {assistant.team && (
                          <Link href={`/dashboard/teams/${assistant.team.id}`}>
                            <Badge className="bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 border-0 cursor-pointer hover:bg-violet-200 dark:hover:bg-violet-900/50">
                              <Users className="h-3 w-3 mr-1" />
                              {assistant.team.emoji && <span className="mr-1">{assistant.team.emoji}</span>}
                              {assistant.team.name}
                            </Badge>
                          </Link>
                        )}
                      </div>

                      {assistant.total_messages > 0 && (
                        <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            {assistant.total_conversations} chats
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

                      <div className="flex items-center gap-2 pt-2">
                        <Button
                          className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-lg shadow-violet-500/25"
                          onClick={() => router.push(`/dashboard/assistants/${assistant.id}/chat`)}
                        >
                          <MessageSquare className="mr-2 h-4 w-4" />
                          Chat
                        </Button>

                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => router.push(`/dashboard/assistants/${assistant.id}/settings`)}
                          className="h-10 w-10"
                        >
                          <Settings className="h-4 w-4" />
                        </Button>

                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => deleteAssistant(assistant.id, assistant.name)}
                          disabled={actionLoading === assistant.id}
                          className="h-10 w-10 text-slate-500 hover:text-rose-600 hover:border-rose-300 dark:hover:border-rose-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Professional Disclaimer */}
      {assistants.length > 0 && (
        <motion.div
          custom={filteredAssistants.length + 3}
          initial="hidden"
          animate="visible"
          variants={cardVariants}
          className="mt-6"
        >
          <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20">
            <CardContent className="py-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                  <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1 space-y-1">
                  <h3 className="font-semibold text-amber-900 dark:text-amber-100 text-sm">
                    Professional Disclaimer
                  </h3>
                  <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
                    Our AI advisors provide general guidance and educational information. They are not substitutes for licensed professionals. For legal, financial, HR, or specialized matters, always consult qualified professionals.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </DashboardPageWrapper>
  );
}
