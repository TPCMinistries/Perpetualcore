"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users, Search, Mail, Activity, Calendar } from "lucide-react";
import { toast } from "sonner";

interface BetaTester {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  beta_tier: string;
  created_at: string;
  total_activities: number;
  active_days: number;
  last_active: string | null;
  login_count: number;
  chat_count: number;
  document_count: number;
}

export default function BetaTestersPage() {
  const [testers, setTesters] = useState<BetaTester[]>([]);
  const [filteredTesters, setFilteredTesters] = useState<BetaTester[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchBetaTesters();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = testers.filter(
        (tester) =>
          tester.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tester.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredTesters(filtered);
    } else {
      setFilteredTesters(testers);
    }
  }, [searchQuery, testers]);

  async function fetchBetaTesters() {
    setIsLoading(true);
    try {
      const response = await fetch("/api/beta/testers");
      if (!response.ok) throw new Error("Failed to fetch");

      const data = await response.json();
      setTesters(data.testers || []);
      setFilteredTesters(data.testers || []);
    } catch (error) {
      console.error("Error fetching beta testers:", error);
      toast.error("Failed to load beta testers");
    } finally {
      setIsLoading(false);
    }
  }

  async function sendFollowUpToOne(tester: BetaTester) {
    try {
      const response = await fetch("/api/beta/resend-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: tester.email,
          code: "FOLLOWUP",
          betaTier: tester.beta_tier,
        }),
      });

      if (!response.ok) throw new Error("Failed to send");

      toast.success(`Follow-up email sent to ${tester.email}`);
    } catch (error) {
      console.error("Error sending follow-up:", error);
      toast.error(`Failed to send email to ${tester.email}`);
    }
  }

  function getTierBadgeColor(tier: string) {
    switch (tier) {
      case "unlimited":
        return "bg-purple-500 text-white";
      case "premium":
        return "bg-blue-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  }

  function getActivityStatus(tester: BetaTester) {
    if (!tester.last_active) return "Never Active";

    const daysSince = Math.floor(
      (Date.now() - new Date(tester.last_active).getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSince === 0) return "Active Today";
    if (daysSince === 1) return "Active Yesterday";
    if (daysSince < 7) return `Active ${daysSince} days ago`;
    return "Inactive";
  }

  function getActivityColor(tester: BetaTester) {
    if (!tester.last_active) return "text-red-500";

    const daysSince = Math.floor(
      (Date.now() - new Date(tester.last_active).getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSince < 3) return "text-green-500";
    if (daysSince < 7) return "text-yellow-500";
    return "text-red-500";
  }

  const stats = {
    total: testers.length,
    active: testers.filter((t) => {
      if (!t.last_active) return false;
      const daysSince = Math.floor(
        (Date.now() - new Date(t.last_active).getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysSince < 7;
    }).length,
    inactive: testers.filter((t) => {
      if (!t.last_active) return true;
      const daysSince = Math.floor(
        (Date.now() - new Date(t.last_active).getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysSince >= 7;
    }).length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Beta Testers</h1>
        <p className="text-muted-foreground">
          Monitor and manage all beta testers in your organization
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Beta Testers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active (7 days)</CardTitle>
            <Activity className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive</CardTitle>
            <Activity className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.inactive}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>All Beta Testers</CardTitle>
          <CardDescription>
            View and manage all users with beta access
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading beta testers...</p>
            </div>
          ) : filteredTesters.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No beta testers found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Activity</TableHead>
                  <TableHead>Stats</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTesters.map((tester) => (
                  <TableRow key={tester.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={tester.avatar_url || undefined} />
                          <AvatarFallback>
                            {tester.full_name
                              ?.split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase() || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{tester.full_name || "No name"}</p>
                          <p className="text-sm text-muted-foreground">{tester.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getTierBadgeColor(tester.beta_tier)}>
                        {tester.beta_tier}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className={getActivityColor(tester)}>
                        {getActivityStatus(tester)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm space-y-1">
                        <div>{tester.total_activities} activities</div>
                        <div className="text-muted-foreground">
                          {tester.login_count} logins, {tester.chat_count} chats
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(tester.created_at).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => sendFollowUpToOne(tester)}
                      >
                        <Mail className="h-4 w-4 mr-2" />
                        Send Email
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
