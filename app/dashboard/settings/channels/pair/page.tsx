"use client";

import { useState } from "react";
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
import {
  Loader2,
  Link2,
  CheckCircle2,
  XCircle,
  Shield,
  Send,
  Hash,
  MessageSquare,
  Mail,
} from "lucide-react";
import { toast } from "sonner";

const CHANNEL_ICONS: Record<string, typeof Send> = {
  telegram: Send,
  slack: Hash,
  whatsapp: MessageSquare,
  discord: MessageSquare,
  email: Mail,
};

export default function ChannelPairPage() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    channel_type?: string;
    message: string;
  } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const trimmed = code.trim();
    if (!/^\d{6}$/.test(trimmed)) {
      toast.error("Please enter a valid 6-digit pairing code");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/channels/pair", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: trimmed }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setResult({
          success: true,
          channel_type: data.channel_type,
          message: data.message,
        });
        setCode("");
        toast.success("Channel linked successfully!");
      } else {
        setResult({
          success: false,
          message: data.message || data.error || "Verification failed",
        });
        toast.error(data.message || "Invalid pairing code");
      }
    } catch (error) {
      console.error("Pairing error:", error);
      setResult({
        success: false,
        message: "Something went wrong. Please try again.",
      });
      toast.error("Failed to verify pairing code");
    } finally {
      setLoading(false);
    }
  }

  const ChannelIcon = result?.channel_type
    ? CHANNEL_ICONS[result.channel_type] || Link2
    : Link2;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-950/20 dark:via-teal-950/20 dark:to-cyan-950/20 border border-emerald-100 dark:border-emerald-900/20 p-8 shadow-lg">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="relative flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-900 via-teal-800 to-cyan-900 dark:from-emerald-100 dark:via-teal-100 dark:to-cyan-100 bg-clip-text text-transparent">
              Pair Channel
            </h1>
            <p className="text-emerald-700 dark:text-emerald-300 mt-1">
              Verify your identity to connect a messaging channel
            </p>
          </div>
        </div>
      </div>

      {/* Pairing Form */}
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Enter Pairing Code
          </CardTitle>
          <CardDescription>
            When you send a message from an unlinked channel, you will receive a
            6-digit pairing code. Enter it here to link your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pairing-code">6-Digit Code</Label>
              <Input
                id="pairing-code"
                type="text"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                placeholder="000000"
                value={code}
                onChange={(e) => {
                  // Only allow digits
                  const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                  setCode(value);
                }}
                className="text-center text-2xl tracking-[0.5em] font-mono"
                autoFocus
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading || code.length !== 6}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-2" />
              )}
              Verify Code
            </Button>
          </form>

          {/* Result */}
          {result && (
            <div
              className={`mt-6 p-4 rounded-lg border ${
                result.success
                  ? "bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800"
                  : "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800"
              }`}
            >
              <div className="flex items-start gap-3">
                {result.success ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                )}
                <div>
                  <p
                    className={`text-sm font-medium ${
                      result.success
                        ? "text-green-800 dark:text-green-300"
                        : "text-red-800 dark:text-red-300"
                    }`}
                  >
                    {result.success ? "Channel Linked!" : "Verification Failed"}
                  </p>
                  <p
                    className={`text-sm mt-1 ${
                      result.success
                        ? "text-green-700 dark:text-green-400"
                        : "text-red-700 dark:text-red-400"
                    }`}
                  >
                    {result.message}
                  </p>
                  {result.success && result.channel_type && (
                    <Badge className="mt-2 capitalize" variant="secondary">
                      <ChannelIcon className="h-3 w-3 mr-1" />
                      {result.channel_type}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* How it works */}
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-base">How Pairing Works</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 h-6 w-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 flex items-center justify-center text-xs font-semibold">
                1
              </span>
              <span>
                Send a message to your AI agent from Telegram, Slack, WhatsApp,
                or any connected channel.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 h-6 w-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 flex items-center justify-center text-xs font-semibold">
                2
              </span>
              <span>
                If the channel is not yet linked, you will receive a 6-digit
                pairing code in the chat.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 h-6 w-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 flex items-center justify-center text-xs font-semibold">
                3
              </span>
              <span>
                Enter the code above to verify your identity and link the
                channel to your account.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 h-6 w-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 flex items-center justify-center text-xs font-semibold">
                4
              </span>
              <span>
                Once linked, your AI agent will process all future messages from
                that channel automatically.
              </span>
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
