"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Copy, Plus, RefreshCw, Mail, MoreVertical, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface BetaCode {
  id: string;
  code: string;
  max_uses: number;
  uses_count: number;
  beta_tier: string;
  expires_at: string | null;
  created_at: string;
  invited_email?: string | null;
}

interface BetaUserStats {
  user_id: string;
  email: string;
  beta_tester: boolean;
  beta_tier: string;
  total_activities: number;
  active_days: number;
  last_active: string | null;
  first_active: string | null;
  login_count: number;
  chat_count: number;
  document_count: number;
}

export default function BetaCodesPage() {
  const [codes, setCodes] = useState<BetaCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // Beta stats
  const [stats, setStats] = useState<BetaUserStats[]>([]);
  const [loadingStats, setLoadingStats] = useState(false);
  const [activeTab, setActiveTab] = useState<"codes" | "usage">("codes");

  // Form state
  const [count, setCount] = useState(10);
  const [tier, setTier] = useState("standard");
  const [maxUses, setMaxUses] = useState(1);
  const [expiresInDays, setExpiresInDays] = useState(90);

  // Individual code generation
  const [email, setEmail] = useState("");
  const [generatingSingle, setGeneratingSingle] = useState(false);
  const [sendingFollowUps, setSendingFollowUps] = useState(false);

  const fetchCodes = async () => {
    try {
      const response = await fetch("/api/beta/generate-codes");
      if (!response.ok) throw new Error("Failed to fetch codes");
      const data = await response.json();
      setCodes(data.codes || []);
    } catch (error) {
      console.error("Error fetching codes:", error);
      toast.error("Failed to load codes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCodes();
    if (activeTab === "usage") {
      fetchStats();
    }
  }, [activeTab]);

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const response = await fetch("/api/beta/stats");
      if (!response.ok) throw new Error("Failed to fetch stats");
      const data = await response.json();
      setStats(data.stats || []);
    } catch (error) {
      console.error("Error fetching stats:", error);
      toast.error("Failed to load usage stats");
    } finally {
      setLoadingStats(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const response = await fetch("/api/beta/generate-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          count,
          betaTier: tier,
          maxUses,
          expiresInDays,
        }),
      });

      if (!response.ok) throw new Error("Failed to generate codes");

      const data = await response.json();
      toast.success(`Generated ${data.codes.length} new codes!`);
      fetchCodes(); // Refresh the list
    } catch (error) {
      console.error("Error generating codes:", error);
      toast.error("Failed to generate codes");
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateSingle = async () => {
    if (!email.trim()) {
      toast.error("Please enter an email address");
      return;
    }

    setGeneratingSingle(true);
    try {
      const response = await fetch("/api/beta/generate-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          count: 1,
          betaTier: "standard",
          maxUses: 1,
          expiresInDays: 90,
          email: email.trim(),
        }),
      });

      if (!response.ok) throw new Error("Failed to generate code");

      const data = await response.json();
      const generatedCode = data.codes[0].code;

      // Copy to clipboard
      navigator.clipboard.writeText(generatedCode);

      toast.success(`Code generated and copied: ${generatedCode}`);
      setEmail(""); // Clear email field
      fetchCodes(); // Refresh the list
    } catch (error) {
      console.error("Error generating code:", error);
      toast.error("Failed to generate code");
    } finally {
      setGeneratingSingle(false);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Code copied to clipboard!");
  };

  const copyAllCodes = () => {
    const allCodes = codes.map((c) => c.code).join("\n");
    navigator.clipboard.writeText(allCodes);
    toast.success(`Copied ${codes.length} codes to clipboard!`);
  };

  const handleSendFollowUps = async () => {
    setSendingFollowUps(true);
    try {
      const response = await fetch("/api/beta/follow-up", {
        method: "POST",
      });

      if (!response.ok) throw new Error("Failed to send follow-up emails");

      const data = await response.json();
      toast.success(
        `Sent ${data.emailsSent} follow-up emails! ${
          data.emailsFailed > 0 ? `(${data.emailsFailed} failed)` : ""
        }`
      );
    } catch (error) {
      console.error("Error sending follow-ups:", error);
      toast.error("Failed to send follow-up emails");
    } finally {
      setSendingFollowUps(false);
    }
  };

  const handleResendEmail = async (code: BetaCode) => {
    if (!code.invited_email) {
      toast.error("No email address associated with this code");
      return;
    }

    try {
      const response = await fetch("/api/beta/resend-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: code.invited_email,
          code: code.code,
          betaTier: code.beta_tier,
        }),
      });

      if (!response.ok) throw new Error("Failed to resend email");

      toast.success(`Invitation email resent to ${code.invited_email}`);
    } catch (error) {
      console.error("Error resending email:", error);
      toast.error("Failed to resend invitation email");
    }
  };

  const handleDeleteCode = async (code: BetaCode) => {
    if (!confirm(`Are you sure you want to delete code ${code.code}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/beta/codes/${code.id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete code");

      toast.success("Code deleted successfully");
      fetchCodes(); // Refresh the list
    } catch (error) {
      console.error("Error deleting code:", error);
      toast.error("Failed to delete code");
    }
  };

  const getStatus = (code: BetaCode) => {
    const isExpired = code.expires_at && new Date(code.expires_at) < new Date();
    const isFullyUsed = code.uses_count >= code.max_uses;

    if (isExpired) return { label: "Expired", variant: "secondary" as const };
    if (isFullyUsed) return { label: "Used", variant: "secondary" as const };
    return { label: "Active", variant: "default" as const };
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Beta Invite Codes</h1>
        <p className="text-muted-foreground">
          Generate and manage invite codes for beta testers
        </p>

        {/* Tab Navigation */}
        <div className="flex gap-2 mt-4 border-b border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setActiveTab("codes")}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "codes"
                ? "text-slate-900 dark:text-slate-100 border-b-2 border-slate-900 dark:border-slate-100"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
            }`}
          >
            Codes
          </button>
          <button
            onClick={() => setActiveTab("usage")}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "usage"
                ? "text-slate-900 dark:text-slate-100 border-b-2 border-slate-900 dark:border-slate-100"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
            }`}
          >
            Usage Stats
          </button>
        </div>
      </div>

      {activeTab === "codes" && (
        <>
          {/* Individual Code Generation */}
          <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Generate Code for Individual
          </CardTitle>
          <CardDescription>
            Create a single invite code for a specific person
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <div className="flex-1">
              <Label htmlFor="email">Email Address (for tracking)</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleGenerateSingle();
                }}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleGenerateSingle} disabled={generatingSingle}>
                {generatingSingle ? "Generating..." : "Generate & Copy"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Generation Form */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Generate New Codes
          </CardTitle>
          <CardDescription>
            Create invite codes for your beta testers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <Label htmlFor="count">Number of Codes</Label>
              <Input
                id="count"
                type="number"
                min="1"
                max="100"
                value={count}
                onChange={(e) => setCount(parseInt(e.target.value))}
              />
            </div>

            <div>
              <Label htmlFor="tier">Beta Tier</Label>
              <Select value={tier} onValueChange={setTier}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="unlimited">Unlimited</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="maxUses">Max Uses Per Code</Label>
              <Input
                id="maxUses"
                type="number"
                min="1"
                max="100"
                value={maxUses}
                onChange={(e) => setMaxUses(parseInt(e.target.value))}
              />
            </div>

            <div>
              <Label htmlFor="expires">Expires In (Days)</Label>
              <Input
                id="expires"
                type="number"
                min="1"
                max="365"
                value={expiresInDays}
                onChange={(e) => setExpiresInDays(parseInt(e.target.value))}
              />
            </div>
          </div>

          <Button onClick={handleGenerate} disabled={generating}>
            {generating ? "Generating..." : `Generate ${count} Codes`}
          </Button>
        </CardContent>
      </Card>

      {/* Codes Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Generated Codes</CardTitle>
              <CardDescription>
                {codes.length} total codes
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={copyAllCodes}>
                <Copy className="h-4 w-4 mr-2" />
                Copy All
              </Button>
              <Button variant="outline" size="sm" onClick={fetchCodes}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading codes...
            </div>
          ) : codes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No codes generated yet. Create some above!
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Invited To</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Uses</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {codes.map((code) => {
                    const status = getStatus(code);
                    return (
                      <TableRow key={code.id}>
                        <TableCell className="font-mono font-bold">
                          {code.code}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {code.invited_email || "-"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{code.beta_tier}</Badge>
                        </TableCell>
                        <TableCell>
                          {code.uses_count} / {code.max_uses}
                        </TableCell>
                        <TableCell>
                          {code.expires_at
                            ? new Date(code.expires_at).toLocaleDateString()
                            : "Never"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={status.variant}>
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => copyCode(code.code)}>
                                <Copy className="h-4 w-4 mr-2" />
                                Copy Code
                              </DropdownMenuItem>
                              {code.invited_email && (
                                <DropdownMenuItem onClick={() => handleResendEmail(code)}>
                                  <Send className="h-4 w-4 mr-2" />
                                  Resend Invitation Email
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDeleteCode(code)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Code
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
        </>
      )}

      {/* Usage Stats Tab */}
      {activeTab === "usage" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Beta Tester Usage Stats</CardTitle>
                <CardDescription>
                  See how active your beta testers are
                </CardDescription>
              </div>
              <Button
                variant="default"
                onClick={handleSendFollowUps}
                disabled={sendingFollowUps}
              >
                <Mail className="h-4 w-4 mr-2" />
                {sendingFollowUps ? "Sending..." : "Send Follow-Up Emails"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading stats...
              </div>
            ) : stats.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No beta testers have signed up yet.
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Tier</TableHead>
                      <TableHead className="text-center">Total Activity</TableHead>
                      <TableHead className="text-center">Active Days</TableHead>
                      <TableHead className="text-center">Logins</TableHead>
                      <TableHead className="text-center">Chats</TableHead>
                      <TableHead>Last Active</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.map((stat) => (
                      <TableRow key={stat.user_id}>
                        <TableCell className="font-medium">
                          {stat.email}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{stat.beta_tier}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {stat.total_activities}
                        </TableCell>
                        <TableCell className="text-center">
                          {stat.active_days}
                        </TableCell>
                        <TableCell className="text-center">
                          {stat.login_count}
                        </TableCell>
                        <TableCell className="text-center">
                          {stat.chat_count}
                        </TableCell>
                        <TableCell>
                          {stat.last_active
                            ? new Date(stat.last_active).toLocaleString()
                            : "Never"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
