"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Clock,
  AlertTriangle,
  Bell,
  RefreshCw,
  BellOff,
  ChevronRight,
  MessageSquare,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  FollowupContact,
  FollowupUrgency,
  RELATIONSHIP_STRENGTH_CONFIG,
  FOLLOWUP_URGENCY_CONFIG,
} from "@/types/contacts";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface FollowUpRemindersProps {
  maxContacts?: number;
  showTitle?: boolean;
  compact?: boolean;
  onReachOut?: (contact: FollowupContact) => void;
}

export function FollowUpReminders({
  maxContacts = 5,
  showTitle = true,
  compact = false,
  onReachOut,
}: FollowUpRemindersProps) {
  const router = useRouter();
  const [contacts, setContacts] = useState<FollowupContact[]>([]);
  const [counts, setCounts] = useState({ urgent: 0, overdue: 0, due_soon: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchFollowups();
  }, []);

  const fetchFollowups = async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);

    try {
      const response = await fetch(`/api/contacts/followups?limit=${maxContacts}`);
      if (response.ok) {
        const data = await response.json();
        setContacts(data.contacts || []);
        setCounts(data.counts || { urgent: 0, overdue: 0, due_soon: 0, total: 0 });
      }
    } catch (error) {
      console.error("Error fetching follow-ups:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSnooze = async (
    contactId: string,
    duration: "1_week" | "1_month" | "3_months"
  ) => {
    try {
      const response = await fetch(`/api/contacts/${contactId}/snooze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ duration }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message);
        // Remove from list
        setContacts((prev) => prev.filter((c) => c.contact_id !== contactId));
        setCounts((prev) => ({ ...prev, total: prev.total - 1 }));
      } else {
        toast.error("Failed to snooze reminder");
      }
    } catch (error) {
      console.error("Error snoozing:", error);
      toast.error("Failed to snooze reminder");
    }
  };

  const handleMarkContacted = async (contact: FollowupContact) => {
    // For now, just remove from list and show toast
    // In the future, this could open an interaction log dialog
    setContacts((prev) => prev.filter((c) => c.contact_id !== contact.contact_id));
    setCounts((prev) => ({ ...prev, total: prev.total - 1 }));
    toast.success(`Marked ${contact.full_name} as contacted`);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getTimeAgoText = (date: string | undefined, daysOverdue: number) => {
    if (!date) return "Never contacted";
    if (daysOverdue === 0) return "Today";
    if (daysOverdue === 1) return "1 day ago";
    if (daysOverdue < 7) return `${daysOverdue} days ago`;
    if (daysOverdue < 30) return `${Math.floor(daysOverdue / 7)} weeks ago`;
    if (daysOverdue < 365) return `${Math.floor(daysOverdue / 30)} months ago`;
    return `${Math.floor(daysOverdue / 365)} years ago`;
  };

  if (loading) {
    return (
      <Card>
        {showTitle && (
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-amber-500" />
              <Skeleton className="h-5 w-40" />
            </div>
          </CardHeader>
        )}
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 p-2">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (contacts.length === 0) {
    return (
      <Card>
        {showTitle && (
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-amber-500" />
                <CardTitle className="text-base">Follow-up Reminders</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fetchFollowups(true)}
                disabled={refreshing}
              >
                <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
              </Button>
            </div>
          </CardHeader>
        )}
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <Check className="h-10 w-10 mx-auto mb-3 text-green-500" />
            <p className="text-sm font-medium">All caught up!</p>
            <p className="text-xs mt-1">
              No contacts need follow-up right now
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-amber-200 dark:border-amber-800">
      {showTitle && (
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Bell className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <CardTitle className="text-base">Follow-up Reminders</CardTitle>
                <CardDescription>
                  {counts.total} contact{counts.total !== 1 ? "s" : ""} need attention
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {counts.urgent > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {counts.urgent} urgent
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fetchFollowups(true)}
                disabled={refreshing}
              >
                <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
              </Button>
            </div>
          </div>
        </CardHeader>
      )}
      <CardContent>
        <div className="space-y-2">
          {contacts.map((contact) => {
            const strengthConfig =
              RELATIONSHIP_STRENGTH_CONFIG[
                contact.relationship_strength as keyof typeof RELATIONSHIP_STRENGTH_CONFIG
              ] || RELATIONSHIP_STRENGTH_CONFIG.new;
            const urgencyConfig = FOLLOWUP_URGENCY_CONFIG[contact.urgency];

            return (
              <div
                key={contact.contact_id}
                className={cn(
                  "flex items-center gap-3 p-2 rounded-lg transition-all group",
                  contact.urgency === "urgent" && "bg-red-50 dark:bg-red-950/20",
                  contact.urgency === "overdue" && "bg-amber-50 dark:bg-amber-950/20",
                  contact.urgency === "due_soon" && "bg-blue-50 dark:bg-blue-950/20",
                  compact ? "p-2" : "p-3"
                )}
              >
                <Avatar className={compact ? "h-8 w-8" : "h-10 w-10"}>
                  <AvatarImage src={contact.avatar_url || undefined} />
                  <AvatarFallback
                    className={cn(strengthConfig.bgColor, strengthConfig.color)}
                  >
                    {getInitials(contact.full_name)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className="font-medium text-sm truncate cursor-pointer hover:underline"
                      onClick={() =>
                        router.push(`/dashboard/contacts/${contact.contact_id}`)
                      }
                    >
                      {contact.full_name}
                    </span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] px-1.5 h-4",
                        urgencyConfig?.bgColor,
                        urgencyConfig?.color
                      )}
                    >
                      {urgencyConfig?.label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>
                      {getTimeAgoText(contact.last_interaction_at, contact.days_overdue)}
                    </span>
                    {contact.company && (
                      <>
                        <span className="text-muted-foreground/50">·</span>
                        <span className="truncate">{contact.company}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() =>
                            onReachOut
                              ? onReachOut(contact)
                              : router.push(
                                  `/dashboard/contacts/${contact.contact_id}?reach_out=true`
                                )
                          }
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Reach out</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <BellOff className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleSnooze(contact.contact_id, "1_week")}
                      >
                        Snooze 1 week
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleSnooze(contact.contact_id, "1_month")}
                      >
                        Snooze 1 month
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleSnooze(contact.contact_id, "3_months")}
                      >
                        Snooze 3 months
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleMarkContacted(contact)}
                        >
                          <Check className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Mark as contacted</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            );
          })}
        </div>

        {counts.total > maxContacts && (
          <Button
            variant="ghost"
            className="w-full mt-3"
            onClick={() => router.push("/dashboard/contacts?filter=needs_followup")}
          >
            View all {counts.total} contacts
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
