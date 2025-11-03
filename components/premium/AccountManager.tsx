"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Calendar,
  Mail,
  MessageCircle,
  Phone,
  Video,
  Clock,
  CheckCircle2,
  Star,
} from "lucide-react";

interface AccountManagerProps {
  name?: string;
  title?: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  timezone?: string;
}

export function AccountManager({
  name = "Sarah Mitchell",
  title = "Senior Account Manager",
  email = "sarah.mitchell@aios.com",
  phone = "+1 (555) 123-4567",
  avatarUrl = "",
  timezone = "EST (GMT-5)",
}: AccountManagerProps) {
  const upcomingMeetings = [
    {
      title: "Quarterly Business Review",
      date: "Tomorrow, 2:00 PM EST",
      type: "video",
    },
    {
      title: "Strategy Session",
      date: "Next Week, Thu 10:00 AM EST",
      type: "call",
    },
  ];

  const recentActivities = [
    {
      action: "Optimized your AI agent workflows",
      time: "2 hours ago",
    },
    {
      action: "Sent monthly analytics report",
      time: "Yesterday",
    },
    {
      action: "Completed security audit review",
      time: "3 days ago",
    },
  ];

  return (
    <Card className="border-2 bg-gradient-to-br from-primary/5 via-purple-500/5 to-pink-500/5">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl">Your Account Manager</CardTitle>
            <CardDescription>White-glove support for premium customers</CardDescription>
          </div>
          <Badge className="bg-gradient-to-r from-primary to-purple-600 text-white border-0">
            Premium Support
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Manager Profile */}
        <div className="flex items-start gap-6 p-6 rounded-xl bg-background border-2">
          <Avatar className="h-24 w-24 border-4 border-primary/20">
            <AvatarImage src={avatarUrl} alt={name} />
            <AvatarFallback className="bg-gradient-to-br from-primary to-purple-600 text-white text-2xl font-bold">
              {name.split(" ").map(n => n[0]).join("")}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-2xl font-bold">{name}</h3>
              <div className="flex items-center gap-1 text-yellow-500">
                <Star className="h-4 w-4 fill-current" />
                <Star className="h-4 w-4 fill-current" />
                <Star className="h-4 w-4 fill-current" />
                <Star className="h-4 w-4 fill-current" />
                <Star className="h-4 w-4 fill-current" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">{title}</p>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{phone}</span>
              </div>
              <div className="flex items-center gap-2 text-sm col-span-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>Available during business hours ({timezone})</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button size="sm" className="bg-gradient-to-r from-primary to-purple-600">
                <Video className="mr-2 h-4 w-4" />
                Schedule Call
              </Button>
              <Button size="sm" variant="outline">
                <MessageCircle className="mr-2 h-4 w-4" />
                Send Message
              </Button>
              <Button size="sm" variant="outline">
                <Calendar className="mr-2 h-4 w-4" />
                View Calendar
              </Button>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Upcoming Meetings */}
          <div className="p-4 rounded-lg bg-background border-2">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Upcoming Meetings
            </h4>
            <div className="space-y-3">
              {upcomingMeetings.map((meeting, index) => (
                <div
                  key={index}
                  className="p-3 rounded-lg border-2 hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-1">
                    {meeting.type === "video" ? (
                      <Video className="h-4 w-4 text-primary" />
                    ) : (
                      <Phone className="h-4 w-4 text-primary" />
                    )}
                    <p className="font-medium text-sm">{meeting.title}</p>
                  </div>
                  <p className="text-xs text-muted-foreground ml-6">{meeting.date}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="p-4 rounded-lg bg-background border-2">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Recent Activity
            </h4>
            <div className="space-y-3">
              {recentActivities.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 pb-3 border-b last:border-0 last:pb-0"
                >
                  <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.action}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Response Time Guarantee */}
        <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/30 border-2 border-green-500/20">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-green-500 flex items-center justify-center">
              <Clock className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-green-900 dark:text-green-100">
                Priority Support Guarantee
              </h4>
              <p className="text-sm text-green-700 dark:text-green-300">
                15-minute response time during business hours • 24/7 emergency support available
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
