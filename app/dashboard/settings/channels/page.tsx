"use client";

/**
 * Unified Channel Management Settings Page
 *
 * Displays all messaging channels with connection status, configuration,
 * and connect/disconnect actions. Users can manage their Telegram, Slack,
 * WhatsApp, Discord, Email, and Teams connections from a single view.
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Settings,
  ExternalLink,
  Copy,
  Send,
  Hash,
  MessageSquare,
  Mail,
  Users,
  Radio,
  Link2,
  Shield,
  Unplug,
  RefreshCw,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

/** Channel configuration definition */
interface ChannelConfig {
  id: string;
  name: string;
  description: string;
  icon: typeof Send;
  color: string;
  bgColor: string;
  connected: boolean;
  channelUserId?: string;
  webhookUrl: string;
  setupInstructions: string[];
  envVars: string[];
}

/** Base URL for webhook endpoints */
const BASE_URL = typeof window !== "undefined" ? window.location.origin : "https://perpetualcore.com";

export default function ChannelsSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [channels, setChannels] = useState<ChannelConfig[]>([]);
  const [configDialog, setConfigDialog] = useState<{
    open: boolean;
    channel: ChannelConfig | null;
  }>({ open: false, channel: null });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadChannels();
  }, []);

  async function loadChannels() {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      // Fetch user's profile to check connected channels
      const { data: profile } = await supabase
        .from("profiles")
        .select(
          "telegram_chat_id, slack_user_id, whatsapp_number, discord_user_id, email, teams_user_id"
        )
        .eq("id", user.id)
        .single();

      const channelDefinitions: ChannelConfig[] = [
        {
          id: "telegram",
          name: "Telegram",
          description:
            "Chat with your AI agent via Telegram. Great for quick questions on mobile.",
          icon: Send,
          color: "text-blue-500",
          bgColor: "bg-blue-50 dark:bg-blue-950/30",
          connected: !!profile?.telegram_chat_id,
          channelUserId: profile?.telegram_chat_id || undefined,
          webhookUrl: `${BASE_URL}/api/channels/webhook?channel=telegram`,
          setupInstructions: [
            "Create a bot via @BotFather on Telegram",
            "Set TELEGRAM_BOT_TOKEN and TELEGRAM_WEBHOOK_SECRET in your environment",
            "Register the webhook URL with Telegram",
            "Send a message to your bot to pair your account",
          ],
          envVars: ["TELEGRAM_BOT_TOKEN", "TELEGRAM_WEBHOOK_SECRET"],
        },
        {
          id: "slack",
          name: "Slack",
          description:
            "Get AI assistance right in your Slack workspace. Supports threads and file sharing.",
          icon: Hash,
          color: "text-purple-600",
          bgColor: "bg-purple-50 dark:bg-purple-950/30",
          connected: !!profile?.slack_user_id,
          channelUserId: profile?.slack_user_id || undefined,
          webhookUrl: `${BASE_URL}/api/channels/webhook?channel=slack`,
          setupInstructions: [
            "Create a Slack app at api.slack.com",
            "Enable Event Subscriptions and point to the webhook URL",
            "Install the app to your workspace via OAuth",
            "Mention the bot in a channel to start chatting",
          ],
          envVars: ["SLACK_SIGNING_SECRET", "SLACK_BOT_TOKEN"],
        },
        {
          id: "whatsapp",
          name: "WhatsApp",
          description:
            "Communicate with your AI assistant on WhatsApp. Ideal for teams using WhatsApp Business.",
          icon: MessageSquare,
          color: "text-green-600",
          bgColor: "bg-green-50 dark:bg-green-950/30",
          connected: !!profile?.whatsapp_number,
          channelUserId: profile?.whatsapp_number || undefined,
          webhookUrl: `${BASE_URL}/api/channels/webhook?channel=whatsapp`,
          setupInstructions: [
            "Set up a Twilio account with WhatsApp sandbox or Business API",
            "Configure the webhook URL in your Twilio console",
            "Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_WHATSAPP_FROM",
            "Send a message from WhatsApp to pair your account",
          ],
          envVars: [
            "TWILIO_ACCOUNT_SID",
            "TWILIO_AUTH_TOKEN",
            "TWILIO_WHATSAPP_FROM",
          ],
        },
        {
          id: "discord",
          name: "Discord",
          description:
            "Add your AI agent to any Discord server. Supports slash commands, DMs, and channel messages.",
          icon: MessageSquare,
          color: "text-indigo-600",
          bgColor: "bg-indigo-50 dark:bg-indigo-950/30",
          connected: !!profile?.discord_user_id,
          channelUserId: profile?.discord_user_id || undefined,
          webhookUrl: `${BASE_URL}/api/channels/discord`,
          setupInstructions: [
            "Create a Discord application at discord.com/developers",
            "Create a bot user and copy the bot token",
            "Set DISCORD_BOT_TOKEN, DISCORD_PUBLIC_KEY, and DISCORD_APP_ID",
            "Set the Interactions Endpoint URL to the webhook URL above",
            "Invite the bot to your server using the OAuth2 URL generator",
            "Send a message or use a slash command to pair your account",
          ],
          envVars: [
            "DISCORD_BOT_TOKEN",
            "DISCORD_PUBLIC_KEY",
            "DISCORD_APP_ID",
          ],
        },
        {
          id: "email",
          name: "Email",
          description:
            "Get AI-powered email responses. Send an email and receive an intelligent reply.",
          icon: Mail,
          color: "text-red-500",
          bgColor: "bg-red-50 dark:bg-red-950/30",
          connected: !!profile?.email,
          channelUserId: profile?.email || undefined,
          webhookUrl: `${BASE_URL}/api/channels/email`,
          setupInstructions: [
            "Set up SendGrid Inbound Parse to forward emails to the webhook URL",
            "Or configure Gmail push notifications via Google Cloud Pub/Sub",
            "Ensure RESEND_API_KEY is configured for outbound responses",
            "Send an email to your configured address to start chatting",
          ],
          envVars: [
            "RESEND_API_KEY",
            "EMAIL_FROM_ADDRESS",
            "EMAIL_FROM_NAME",
          ],
        },
        {
          id: "teams",
          name: "Microsoft Teams",
          description:
            "Bring your AI assistant into Microsoft Teams. Perfect for enterprise environments.",
          icon: Users,
          color: "text-blue-700",
          bgColor: "bg-blue-50 dark:bg-blue-950/30",
          connected: !!profile?.teams_user_id,
          channelUserId: profile?.teams_user_id || undefined,
          webhookUrl: `${BASE_URL}/api/channels/teams`,
          setupInstructions: [
            "Register a bot at dev.botframework.com or Azure Bot Service",
            "Set the messaging endpoint to the webhook URL above",
            "Set TEAMS_APP_ID and TEAMS_APP_PASSWORD in your environment",
            "Install the bot in Teams via the Teams Admin Center or App Studio",
            "Send a message to the bot in Teams to pair your account",
          ],
          envVars: ["TEAMS_APP_ID", "TEAMS_APP_PASSWORD"],
        },
      ];

      setChannels(channelDefinitions);
    } catch (error) {
      console.error("Error loading channels:", error);
      toast.error("Failed to load channel settings");
    } finally {
      setLoading(false);
    }
  }

  async function handleDisconnect(channelId: string) {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Map channel ID to profile column
      const columnMap: Record<string, string> = {
        telegram: "telegram_chat_id",
        slack: "slack_user_id",
        whatsapp: "whatsapp_number",
        discord: "discord_user_id",
        teams: "teams_user_id",
      };

      const column = columnMap[channelId];
      if (!column) {
        toast.error("Cannot disconnect this channel type");
        return;
      }

      await supabase
        .from("profiles")
        .update({ [column]: null })
        .eq("id", user.id);

      setChannels(
        channels.map((c) =>
          c.id === channelId
            ? { ...c, connected: false, channelUserId: undefined }
            : c
        )
      );

      toast.success(`${channels.find((c) => c.id === channelId)?.name} disconnected`);
    } catch (error) {
      toast.error("Failed to disconnect channel");
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  }

  const connectedCount = channels.filter((c) => c.connected).length;

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
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50 dark:from-cyan-950/20 dark:via-blue-950/20 dark:to-indigo-950/20 border border-cyan-100 dark:border-cyan-900/20 p-8 shadow-lg">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg">
              <Radio className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-900 via-blue-800 to-indigo-900 dark:from-cyan-100 dark:via-blue-100 dark:to-indigo-100 bg-clip-text text-transparent">
                Channels
              </h1>
              <p className="text-cyan-700 dark:text-cyan-300 mt-1">
                Connect your AI agent to messaging platforms
              </p>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="text-right">
              <div className="text-3xl font-bold text-cyan-600 dark:text-cyan-400">
                {connectedCount}/{channels.length}
              </div>
              <p className="text-sm text-muted-foreground">Connected</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pairing Code Link */}
      <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-amber-600" />
              <div>
                <p className="font-medium text-amber-900 dark:text-amber-100">
                  Have a pairing code?
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  If you messaged the bot from an unlinked channel, enter your
                  6-digit code to connect.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              className="border-amber-300 dark:border-amber-700"
              onClick={() =>
                router.push("/dashboard/settings/channels/pair")
              }
            >
              <Link2 className="h-4 w-4 mr-2" />
              Enter Code
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Channel Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {channels.map((channel) => (
          <Card
            key={channel.id}
            className="hover:shadow-lg transition-all duration-300"
          >
            <CardContent className="pt-6">
              {/* Header */}
              <div className="flex items-start gap-4 mb-4">
                <div
                  className={`h-12 w-12 rounded-xl flex items-center justify-center ${channel.bgColor}`}
                >
                  <channel.icon className={`h-6 w-6 ${channel.color}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold">{channel.name}</h3>
                    {channel.connected ? (
                      <Badge className="bg-green-50 border-green-300 text-green-700 dark:bg-green-950/30 dark:border-green-700 dark:text-green-400">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Connected
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="bg-gray-50 border-gray-300 text-gray-700 dark:bg-gray-950/30 dark:border-gray-700 dark:text-gray-400"
                      >
                        <XCircle className="h-3 w-3 mr-1" />
                        Not Connected
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {channel.description}
                  </p>
                </div>
              </div>

              {/* Connected Info */}
              {channel.connected && channel.channelUserId && (
                <div className="mb-4 p-3 rounded-lg bg-muted/50 border">
                  <p className="text-xs font-medium mb-1">Connected as:</p>
                  <div className="flex items-center justify-between">
                    <code className="text-xs font-mono text-muted-foreground truncate max-w-[200px]">
                      {channel.channelUserId}
                    </code>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                      onClick={() =>
                        copyToClipboard(channel.channelUserId || "")
                      }
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                {channel.connected ? (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() =>
                        setConfigDialog({ open: true, channel })
                      }
                    >
                      <Settings className="h-4 w-4 mr-1" />
                      Details
                    </Button>
                    {channel.id !== "email" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDisconnect(channel.id)}
                      >
                        <Unplug className="h-4 w-4" />
                      </Button>
                    )}
                  </>
                ) : (
                  <Button
                    size="sm"
                    className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
                    onClick={() =>
                      setConfigDialog({ open: true, channel })
                    }
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Set Up
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Configuration / Setup Dialog */}
      <Dialog
        open={configDialog.open}
        onOpenChange={(open) =>
          setConfigDialog({ open, channel: open ? configDialog.channel : null })
        }
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {configDialog.channel && (
                <div
                  className={`h-8 w-8 rounded-lg flex items-center justify-center ${configDialog.channel.bgColor}`}
                >
                  <configDialog.channel.icon
                    className={`h-4 w-4 ${configDialog.channel.color}`}
                  />
                </div>
              )}
              {configDialog.channel?.connected ? "Channel Details" : "Set Up"}{" "}
              {configDialog.channel?.name}
            </DialogTitle>
            <DialogDescription>
              {configDialog.channel?.connected
                ? "View your channel configuration and webhook details."
                : "Follow these steps to connect this channel."}
            </DialogDescription>
          </DialogHeader>

          {configDialog.channel && (
            <div className="space-y-4 py-4">
              {/* Webhook URL */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Webhook URL</Label>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={configDialog.channel.webhookUrl}
                    className="font-mono text-xs"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      copyToClipboard(configDialog.channel?.webhookUrl || "")
                    }
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Required Environment Variables */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Required Environment Variables
                </Label>
                <div className="p-3 rounded-lg bg-muted/50 border space-y-1">
                  {configDialog.channel.envVars.map((envVar) => (
                    <div key={envVar} className="flex items-center gap-2">
                      <code className="text-xs font-mono text-muted-foreground">
                        {envVar}
                      </code>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Set these in your Vercel project settings or .env.local file.
                </p>
              </div>

              {/* Setup Instructions */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Setup Steps</Label>
                <ol className="space-y-2">
                  {configDialog.channel.setupInstructions.map(
                    (step, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <span className="flex-shrink-0 h-6 w-6 rounded-full bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 flex items-center justify-center text-xs font-semibold">
                          {index + 1}
                        </span>
                        <span className="text-sm text-muted-foreground pt-0.5">
                          {step}
                        </span>
                      </li>
                    )
                  )}
                </ol>
              </div>

              {/* Connection Status */}
              {configDialog.channel.connected && (
                <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800 dark:text-green-300">
                      This channel is connected and active
                    </span>
                  </div>
                  {configDialog.channel.channelUserId && (
                    <p className="text-xs text-green-700 dark:text-green-400 mt-1 ml-6">
                      ID: {configDialog.channel.channelUserId}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setConfigDialog({ open: false, channel: null })
              }
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
