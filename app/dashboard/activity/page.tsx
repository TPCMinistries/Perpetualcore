"use client";

import { useState } from "react";
import { ActivityFeed } from "@/components/activity/ActivityFeed";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Activity,
  Filter,
  Download,
  Calendar,
  Users,
  FileText,
  CheckSquare,
  Mail,
  Bot,
  TrendingUp,
  MessageSquare,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ActivityPage() {
  const [filterType, setFilterType] = useState<string>("all");
  const [filterAction, setFilterAction] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("7days");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-8 bg-white dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-slate-900 dark:bg-slate-100 flex items-center justify-center">
              <Activity className="h-6 w-6 text-white dark:text-slate-900" />
            </div>
            <div>
              <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">
                Activity Feed
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                Track all team activity and collaboration in real-time
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            className="border-slate-200 dark:border-slate-800"
          >
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <Filter className="h-4 w-4 text-slate-600 dark:text-slate-400" />
              </div>
              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">Filters:</span>
            </div>

            {/* Entity Type Filter */}
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="document">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Documents
                  </div>
                </SelectItem>
                <SelectItem value="task">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="h-4 w-4" />
                    Tasks
                  </div>
                </SelectItem>
                <SelectItem value="workflow">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Workflows
                  </div>
                </SelectItem>
                <SelectItem value="email">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Emails
                  </div>
                </SelectItem>
                <SelectItem value="meeting">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Meetings
                  </div>
                </SelectItem>
                <SelectItem value="agent">
                  <div className="flex items-center gap-2">
                    <Bot className="h-4 w-4" />
                    AI Agents
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Action Type Filter */}
            <Select value={filterAction} onValueChange={setFilterAction}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="created">Created</SelectItem>
                <SelectItem value="updated">Updated</SelectItem>
                <SelectItem value="deleted">Deleted</SelectItem>
                <SelectItem value="commented">Commented</SelectItem>
                <SelectItem value="mentioned">Mentioned</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="shared">Shared</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
                <SelectItem value="restored">Restored</SelectItem>
              </SelectContent>
            </Select>

            {/* Date Range Filter */}
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Last 7 days" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="7days">Last 7 days</SelectItem>
                <SelectItem value="30days">Last 30 days</SelectItem>
                <SelectItem value="90days">Last 90 days</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>

            {/* Clear Filters */}
            {(filterType !== "all" || filterAction !== "all" || dateRange !== "7days") && (
              <Button
                variant="ghost"
                size="sm"
                className="text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                onClick={() => {
                  setFilterType("all");
                  setFilterAction("all");
                  setDateRange("7days");
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Total Activity</p>
              <p className="text-3xl font-semibold text-slate-900 dark:text-slate-100 mt-1">247</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-teal-50 dark:bg-teal-950/30 flex items-center justify-center">
              <Activity className="h-5 w-5 text-teal-600 dark:text-teal-400" />
            </div>
          </div>
          <div className="flex items-center gap-1 mt-3 text-xs">
            <TrendingUp className="h-3 w-3 text-green-600 dark:text-green-400" />
            <span className="text-green-600 dark:text-green-400 font-medium">+12% from last week</span>
          </div>
        </Card>

        <Card className="p-6 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Active Users</p>
              <p className="text-3xl font-semibold text-slate-900 dark:text-slate-100 mt-1">12</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center">
              <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="flex items-center gap-1 mt-3 text-xs">
            <TrendingUp className="h-3 w-3 text-green-600 dark:text-green-400" />
            <span className="text-green-600 dark:text-green-400 font-medium">+2 new this week</span>
          </div>
        </Card>

        <Card className="p-6 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Comments</p>
              <p className="text-3xl font-semibold text-slate-900 dark:text-slate-100 mt-1">63</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-cyan-50 dark:bg-cyan-950/30 flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
            </div>
          </div>
          <div className="flex items-center gap-1 mt-3 text-xs">
            <span className="text-slate-600 dark:text-slate-400 font-medium">18 today</span>
          </div>
        </Card>

        <Card className="p-6 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Tasks Done</p>
              <p className="text-3xl font-semibold text-slate-900 dark:text-slate-100 mt-1">34</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-green-50 dark:bg-green-950/30 flex items-center justify-center">
              <CheckSquare className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <div className="flex items-center gap-1 mt-3 text-xs">
            <span className="text-slate-600 dark:text-slate-400 font-medium">85% completion rate</span>
          </div>
        </Card>
      </div>

      {/* Activity Feed */}
      <ActivityFeed limit={20} showHeader={false} />
    </div>
  );
}
