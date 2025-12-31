"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Bot,
  Plus,
  Search,
  MoreVertical,
  Play,
  Pause,
  Edit,
  Trash2,
  Copy,
  Store,
  Activity,
  Loader2,
  Workflow,
  Clock,
  Zap,
  Star,
  Download,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { formatDistanceToNow } from "date-fns";

interface BotItem {
  id: string;
  name: string;
  description: string;
  type: string;
  is_active: boolean;
  execution_count: number;
  last_executed_at: string | null;
  created_at: string;
}

interface MarketplaceBot {
  id: string;
  name: string;
  description: string;
  short_description: string;
  category: string;
  icon: string;
  price: number;
  is_free: boolean;
  install_count: number;
  rating: number;
  rating_count: number;
  author_name: string;
  author_verified: boolean;
}

export default function BotsPage() {
  const [loading, setLoading] = useState(true);
  const [myBots, setMyBots] = useState<BotItem[]>([]);
  const [marketplaceBots, setMarketplaceBots] = useState<MarketplaceBot[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteBot, setDeleteBot] = useState<BotItem | null>(null);
  const [installingBot, setInstallingBot] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      await Promise.all([loadMyBots(), loadMarketplaceBots()]);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load bots");
    } finally {
      setLoading(false);
    }
  }

  async function loadMyBots() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) return;

    const { data, error } = await supabase
      .from("ai_agents")
      .select("id, name, description, type, is_active, created_at")
      .eq("organization_id", profile.organization_id)
      .in("type", ["custom_bot", "automation"])
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Get execution stats
    const agentIds = data?.map((b) => b.id) || [];
    const { data: executions } = await supabase
      .from("bot_executions")
      .select("agent_id, created_at")
      .in("agent_id", agentIds);

    const executionMap = new Map<string, { count: number; lastExec: string | null }>();
    (executions || []).forEach((e: any) => {
      const current = executionMap.get(e.agent_id) || { count: 0, lastExec: null };
      executionMap.set(e.agent_id, {
        count: current.count + 1,
        lastExec: !current.lastExec || new Date(e.created_at) > new Date(current.lastExec)
          ? e.created_at
          : current.lastExec,
      });
    });

    setMyBots(
      (data || []).map((b) => ({
        ...b,
        execution_count: executionMap.get(b.id)?.count || 0,
        last_executed_at: executionMap.get(b.id)?.lastExec || null,
      }))
    );
  }

  async function loadMarketplaceBots() {
    const response = await fetch("/api/bots/marketplace?featured=true&limit=12");
    if (!response.ok) return;
    const data = await response.json();
    setMarketplaceBots(data.bots || []);
  }

  async function handleToggleActive(bot: BotItem) {
    const supabase = createClient();
    const { error } = await supabase
      .from("ai_agents")
      .update({ is_active: !bot.is_active })
      .eq("id", bot.id);

    if (error) {
      toast.error("Failed to update bot status");
      return;
    }

    toast.success(bot.is_active ? "Bot paused" : "Bot activated");
    loadMyBots();
  }

  async function handleDeleteBot() {
    if (!deleteBot) return;

    const supabase = createClient();
    const { error } = await supabase
      .from("ai_agents")
      .delete()
      .eq("id", deleteBot.id);

    if (error) {
      toast.error("Failed to delete bot");
      return;
    }

    toast.success("Bot deleted successfully");
    setDeleteBot(null);
    loadMyBots();
  }

  async function handleInstallBot(botId: string) {
    setInstallingBot(botId);
    try {
      const response = await fetch("/api/bots/marketplace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ marketplace_id: botId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to install bot");
      }

      toast.success("Bot installed successfully!");
      loadMyBots();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setInstallingBot(null);
    }
  }

  async function handleExecuteBot(botId: string) {
    try {
      const response = await fetch(`/api/bots/${botId}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input_data: {} }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to execute bot");
      }

      const result = await response.json();
      if (result.success) {
        toast.success("Bot executed successfully");
      } else {
        toast.error(result.error || "Execution failed");
      }
      loadMyBots();
    } catch (error: any) {
      toast.error(error.message);
    }
  }

  const filteredBots = myBots.filter(
    (bot) =>
      bot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bot.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 dark:from-violet-950/20 dark:via-purple-950/20 dark:to-fuchsia-950/20 border border-violet-100 dark:border-violet-900/20 p-8 shadow-lg">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
              <Bot className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-900 via-purple-800 to-fuchsia-900 dark:from-violet-100 dark:via-purple-100 dark:to-fuchsia-100 bg-clip-text text-transparent">
                Bot Builder
              </h1>
              <p className="text-violet-700 dark:text-violet-300 mt-1">
                Create and manage automated workflows
              </p>
            </div>
          </div>
          <Button
            asChild
            className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-md"
          >
            <Link href="/dashboard/bots/builder">
              <Plus className="h-4 w-4 mr-2" />
              Create Bot
            </Link>
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="my-bots">
        <TabsList>
          <TabsTrigger value="my-bots" className="gap-2">
            <Workflow className="h-4 w-4" />
            My Bots
          </TabsTrigger>
          <TabsTrigger value="marketplace" className="gap-2">
            <Store className="h-4 w-4" />
            Marketplace
          </TabsTrigger>
        </TabsList>

        {/* My Bots Tab */}
        <TabsContent value="my-bots" className="space-y-4 mt-4">
          {/* Search */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search bots..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Bot Grid */}
          {filteredBots.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold mb-2">No bots yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Create your first bot to automate workflows
                  </p>
                  <Button asChild>
                    <Link href="/dashboard/bots/builder">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Bot
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredBots.map((bot) => (
                <Card key={bot.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                          <Workflow className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{bot.name}</CardTitle>
                          <CardDescription className="text-xs line-clamp-1">
                            {bot.description || "No description"}
                          </CardDescription>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/bots/builder?id=${bot.id}`}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Flow
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleExecuteBot(bot.id)}>
                            <Play className="h-4 w-4 mr-2" />
                            Execute
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleActive(bot)}>
                            {bot.is_active ? (
                              <>
                                <Pause className="h-4 w-4 mr-2" />
                                Pause
                              </>
                            ) : (
                              <>
                                <Play className="h-4 w-4 mr-2" />
                                Activate
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setDeleteBot(bot)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-4">
                        <Badge variant={bot.is_active ? "default" : "secondary"}>
                          {bot.is_active ? "Active" : "Paused"}
                        </Badge>
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Activity className="h-3 w-3" />
                          {bot.execution_count} runs
                        </span>
                      </div>
                      {bot.last_executed_at && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(bot.last_executed_at), { addSuffix: true })}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Marketplace Tab */}
        <TabsContent value="marketplace" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Pre-built bots from the community
            </p>
            <Button variant="outline" asChild>
              <Link href="/dashboard/bots/marketplace">
                View All
                <ExternalLink className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>

          {marketplaceBots.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <Store className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold mb-2">Marketplace Coming Soon</h3>
                  <p className="text-sm text-muted-foreground">
                    Pre-built bots will be available here
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {marketplaceBots.map((bot) => (
                <Card key={bot.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-2xl">
                          {bot.icon || "🤖"}
                        </div>
                        <div>
                          <CardTitle className="text-base flex items-center gap-2">
                            {bot.name}
                            {bot.author_verified && (
                              <Badge variant="outline" className="text-xs">
                                Verified
                              </Badge>
                            )}
                          </CardTitle>
                          <CardDescription className="text-xs line-clamp-1">
                            by {bot.author_name}
                          </CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {bot.short_description || bot.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Download className="h-3 w-3" />
                          {bot.install_count}
                        </span>
                        {bot.rating > 0 && (
                          <span className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                            {bot.rating.toFixed(1)}
                          </span>
                        )}
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleInstallBot(bot.id)}
                        disabled={installingBot === bot.id}
                      >
                        {installingBot === bot.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : bot.is_free ? (
                          "Install"
                        ) : (
                          `$${bot.price}`
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteBot} onOpenChange={() => setDeleteBot(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Bot</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteBot?.name}"? This action cannot be undone and will remove all associated data and execution history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteBot}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
