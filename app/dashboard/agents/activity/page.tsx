"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { ArrowLeft, CheckCircle2, XCircle, Activity, FileText, CheckSquare, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface AgentActivity {
  id: string;
  agent: {
    name: string;
    agent_type: string;
  };
  activity_type: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
}

export default function AgentActivityPage() {
  const [activities, setActivities] = useState<AgentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
  }, []);

  async function fetchActivities() {
    try {
      const response = await fetch("/api/agents/activity");
      if (response.ok) {
        const data = await response.json();
        setActivities(data.activities || []);
      }
    } catch (error) {
      console.error("Error fetching activities:", error);
    } finally {
      setIsLoading(false);
    }
  }

  function getActivityIcon(activityType: string) {
    const icons: { [key: string]: any } = {
      analysis: FileText,
      action: CheckSquare,
      monitoring: Activity,
      suggestion: MessageSquare,
      error: XCircle,
    };
    return icons[activityType] || Activity;
  }

  function getStatusBadge(status: string) {
    if (status === "completed") {
      return (
        <span className="flex items-center text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full gap-1">
          <CheckCircle2 className="h-3 w-3" />
          Success
        </span>
      );
    }
    if (status === "failed") {
      return (
        <span className="flex items-center text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full gap-1">
          <XCircle className="h-3 w-3" />
          Failed
        </span>
      );
    }
    return (
      <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
        Pending
      </span>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Agent Activity</h1>
          <p className="text-muted-foreground">Loading activities...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link href="/dashboard/agents">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Agents
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Agent Activity Log</h1>
        <p className="text-muted-foreground">
          See what your AI agents have been doing
        </p>
      </div>

      {/* Activity Feed */}
      <div className="space-y-3">
        {activities.length === 0 ? (
          <Card className="p-12 text-center">
            <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">No agent activity yet</p>
          </Card>
        ) : (
          activities.map((activity) => {
            const ActivityIcon = getActivityIcon(activity.activity_type);

            return (
              <Card key={activity.id} className="p-4">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    <ActivityIcon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-sm">{activity.title}</h3>
                      {getStatusBadge(activity.status)}
                    </div>
                    {activity.description && (
                      <p className="text-sm text-muted-foreground mb-2">
                        {activity.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="font-medium">{activity.agent.name}</span>
                      <span>•</span>
                      <span className="capitalize">
                        {activity.activity_type}
                      </span>
                      <span>•</span>
                      <span>
                        {new Date(activity.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
