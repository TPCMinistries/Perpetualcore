"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Church,
  Plus,
  Calendar,
  Users,
  Heart,
  BookOpen,
  MapPin,
  Video,
  Clock,
  MoreHorizontal,
  Edit,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Types
interface MinistryEvent {
  id: string;
  title: string;
  description?: string;
  event_type: string;
  start_time: string;
  end_time?: string;
  all_day: boolean;
  location_type: string;
  location_name?: string;
  virtual_link?: string;
  expected_attendance?: number;
  actual_attendance?: number;
  status: string;
  created_at: string;
}

interface PrayerRequest {
  id: string;
  title: string;
  description?: string;
  request_type: string;
  requester_name?: string;
  is_confidential: boolean;
  status: string;
  priority: string;
  answered_at?: string;
  answer_notes?: string;
  created_at: string;
  requester?: {
    id: string;
    first_name: string;
    last_name: string;
  };
}

interface DiscipleshipRelationship {
  id: string;
  disciple_name: string;
  disciple_email?: string;
  relationship_type: string;
  meeting_frequency?: string;
  goals?: string[];
  current_focus?: string;
  status: string;
  created_at: string;
  disciple_contact?: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
}

// Config
const EVENT_TYPES: Record<string, { label: string; icon: any; color: string }> = {
  service: { label: "Service", icon: Church, color: "bg-purple-100 text-purple-700" },
  bible_study: { label: "Bible Study", icon: BookOpen, color: "bg-blue-100 text-blue-700" },
  prayer_meeting: { label: "Prayer Meeting", icon: Heart, color: "bg-pink-100 text-pink-700" },
  outreach: { label: "Outreach", icon: Users, color: "bg-green-100 text-green-700" },
  conference: { label: "Conference", icon: Calendar, color: "bg-orange-100 text-orange-700" },
  workshop: { label: "Workshop", icon: BookOpen, color: "bg-cyan-100 text-cyan-700" },
  youth_event: { label: "Youth Event", icon: Users, color: "bg-yellow-100 text-yellow-700" },
  community: { label: "Community", icon: Users, color: "bg-teal-100 text-teal-700" },
  other: { label: "Other", icon: Calendar, color: "bg-gray-100 text-gray-700" },
};

const PRAYER_TYPES: Record<string, { label: string; color: string }> = {
  healing: { label: "Healing", color: "bg-red-100 text-red-700" },
  guidance: { label: "Guidance", color: "bg-blue-100 text-blue-700" },
  provision: { label: "Provision", color: "bg-green-100 text-green-700" },
  relationships: { label: "Relationships", color: "bg-pink-100 text-pink-700" },
  ministry: { label: "Ministry", color: "bg-purple-100 text-purple-700" },
  general: { label: "General", color: "bg-gray-100 text-gray-700" },
  praise: { label: "Praise", color: "bg-yellow-100 text-yellow-700" },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  low: { label: "Low", color: "bg-slate-100 text-slate-700" },
  normal: { label: "Normal", color: "bg-blue-100 text-blue-700" },
  high: { label: "High", color: "bg-orange-100 text-orange-700" },
  urgent: { label: "Urgent", color: "bg-red-100 text-red-700" },
};

export default function MinistryPage() {
  const [activeTab, setActiveTab] = useState("events");

  // Events state
  const [events, setEvents] = useState<MinistryEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [showEventDialog, setShowEventDialog] = useState(false);

  // Prayer state
  const [prayers, setPrayers] = useState<PrayerRequest[]>([]);
  const [prayerStats, setPrayerStats] = useState<Record<string, number>>({});
  const [loadingPrayers, setLoadingPrayers] = useState(true);
  const [showPrayerDialog, setShowPrayerDialog] = useState(false);
  const [quickPrayer, setQuickPrayer] = useState("");

  // Discipleship state
  const [relationships, setRelationships] = useState<DiscipleshipRelationship[]>([]);
  const [loadingRelationships, setLoadingRelationships] = useState(true);
  const [showRelationshipDialog, setShowRelationshipDialog] = useState(false);

  // Form states
  const [eventForm, setEventForm] = useState({
    title: "",
    event_type: "service",
    start_time: "",
    end_time: "",
    location_type: "in_person",
    location_name: "",
    description: "",
  });

  const [prayerForm, setPrayerForm] = useState({
    title: "",
    description: "",
    request_type: "general",
    requester_name: "",
    priority: "normal",
  });

  const [relationshipForm, setRelationshipForm] = useState({
    disciple_name: "",
    disciple_email: "",
    relationship_type: "discipleship",
    meeting_frequency: "weekly",
    current_focus: "",
  });

  const [saving, setSaving] = useState(false);

  // Fetch events
  const fetchEvents = useCallback(async () => {
    try {
      setLoadingEvents(true);
      const res = await fetch("/api/ministry/events");
      if (!res.ok) throw new Error("Failed to fetch events");
      const data = await res.json();
      setEvents(data.events || []);
    } catch (error) {
      console.error("Error fetching events:", error);
      toast.error("Failed to load events");
    } finally {
      setLoadingEvents(false);
    }
  }, []);

  // Fetch prayers
  const fetchPrayers = useCallback(async () => {
    try {
      setLoadingPrayers(true);
      const res = await fetch("/api/ministry/prayer");
      if (!res.ok) throw new Error("Failed to fetch prayers");
      const data = await res.json();
      setPrayers(data.requests || []);
      setPrayerStats(data.stats || {});
    } catch (error) {
      console.error("Error fetching prayers:", error);
      toast.error("Failed to load prayer requests");
    } finally {
      setLoadingPrayers(false);
    }
  }, []);

  // Fetch relationships
  const fetchRelationships = useCallback(async () => {
    try {
      setLoadingRelationships(true);
      const res = await fetch("/api/ministry/discipleship");
      if (!res.ok) throw new Error("Failed to fetch relationships");
      const data = await res.json();
      setRelationships(data.relationships || []);
    } catch (error) {
      console.error("Error fetching relationships:", error);
      toast.error("Failed to load discipleship relationships");
    } finally {
      setLoadingRelationships(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
    fetchPrayers();
    fetchRelationships();
  }, [fetchEvents, fetchPrayers, fetchRelationships]);

  // Create event
  const handleCreateEvent = async () => {
    if (!eventForm.title || !eventForm.start_time) {
      toast.error("Title and start time are required");
      return;
    }

    try {
      setSaving(true);
      const res = await fetch("/api/ministry/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventForm),
      });

      if (!res.ok) throw new Error("Failed to create event");

      toast.success("Event created");
      setShowEventDialog(false);
      setEventForm({
        title: "",
        event_type: "service",
        start_time: "",
        end_time: "",
        location_type: "in_person",
        location_name: "",
        description: "",
      });
      fetchEvents();
    } catch (error) {
      console.error("Error creating event:", error);
      toast.error("Failed to create event");
    } finally {
      setSaving(false);
    }
  };

  // Quick prayer capture
  const handleQuickPrayer = async () => {
    if (!quickPrayer.trim()) return;

    try {
      setSaving(true);
      const res = await fetch("/api/ministry/prayer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: quickPrayer }),
      });

      if (!res.ok) throw new Error("Failed to create prayer request");

      toast.success("Prayer request added");
      setQuickPrayer("");
      fetchPrayers();
    } catch (error) {
      console.error("Error creating prayer:", error);
      toast.error("Failed to add prayer request");
    } finally {
      setSaving(false);
    }
  };

  // Create prayer request
  const handleCreatePrayer = async () => {
    if (!prayerForm.title) {
      toast.error("Title is required");
      return;
    }

    try {
      setSaving(true);
      const res = await fetch("/api/ministry/prayer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prayerForm),
      });

      if (!res.ok) throw new Error("Failed to create prayer request");

      toast.success("Prayer request created");
      setShowPrayerDialog(false);
      setPrayerForm({
        title: "",
        description: "",
        request_type: "general",
        requester_name: "",
        priority: "normal",
      });
      fetchPrayers();
    } catch (error) {
      console.error("Error creating prayer:", error);
      toast.error("Failed to create prayer request");
    } finally {
      setSaving(false);
    }
  };

  // Mark prayer as answered
  const handleMarkAnswered = async (prayerId: string) => {
    try {
      const res = await fetch("/api/ministry/prayer", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: prayerId, status: "answered" }),
      });

      if (!res.ok) throw new Error("Failed to update prayer");

      toast.success("Marked as answered");
      fetchPrayers();
    } catch (error) {
      console.error("Error updating prayer:", error);
      toast.error("Failed to update prayer request");
    }
  };

  // Create relationship
  const handleCreateRelationship = async () => {
    if (!relationshipForm.disciple_name) {
      toast.error("Name is required");
      return;
    }

    try {
      setSaving(true);
      const res = await fetch("/api/ministry/discipleship", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(relationshipForm),
      });

      if (!res.ok) throw new Error("Failed to create relationship");

      toast.success("Discipleship relationship created");
      setShowRelationshipDialog(false);
      setRelationshipForm({
        disciple_name: "",
        disciple_email: "",
        relationship_type: "discipleship",
        meeting_frequency: "weekly",
        current_focus: "",
      });
      fetchRelationships();
    } catch (error) {
      console.error("Error creating relationship:", error);
      toast.error("Failed to create relationship");
    } finally {
      setSaving(false);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b">
        <div>
          <h1 className="text-2xl font-semibold">Ministry</h1>
          <p className="text-muted-foreground">
            Manage events, prayer requests, and discipleship
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="px-6 pt-4 border-b">
          <TabsList>
            <TabsTrigger value="events" className="gap-2">
              <Calendar className="h-4 w-4" />
              Events
            </TabsTrigger>
            <TabsTrigger value="prayer" className="gap-2">
              <Heart className="h-4 w-4" />
              Prayer
            </TabsTrigger>
            <TabsTrigger value="discipleship" className="gap-2">
              <Users className="h-4 w-4" />
              Discipleship
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Events Tab */}
        <TabsContent value="events" className="flex-1 overflow-auto p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-medium">Upcoming Events</h2>
            <Button onClick={() => setShowEventDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Event
            </Button>
          </div>

          {loadingEvents ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : events.length === 0 ? (
            <Card className="p-12 text-center">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No events scheduled</h3>
              <p className="text-muted-foreground mb-4">
                Create your first ministry event
              </p>
              <Button onClick={() => setShowEventDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Event
              </Button>
            </Card>
          ) : (
            <div className="space-y-4">
              {events.map((event) => {
                const typeConfig = EVENT_TYPES[event.event_type] || EVENT_TYPES.other;
                const TypeIcon = typeConfig.icon;

                return (
                  <Card key={event.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className={cn("p-2 rounded-lg", typeConfig.color)}>
                            <TypeIcon className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="font-medium">{event.title}</h3>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDate(event.start_time)}
                              </span>
                              {event.location_name && (
                                <span className="flex items-center gap-1">
                                  {event.location_type === "virtual" ? (
                                    <Video className="h-3 w-3" />
                                  ) : (
                                    <MapPin className="h-3 w-3" />
                                  )}
                                  {event.location_name}
                                </span>
                              )}
                            </div>
                            {event.description && (
                              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                                {event.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <Badge className={typeConfig.color}>{typeConfig.label}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Prayer Tab */}
        <TabsContent value="prayer" className="flex-1 overflow-auto p-6">
          {/* Quick Prayer Capture */}
          <Card className="mb-6 bg-gradient-to-r from-pink-50 to-purple-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Heart className="h-5 w-5 text-pink-600" />
                <span className="font-medium text-pink-900">Quick Prayer Request</span>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a prayer request..."
                  value={quickPrayer}
                  onChange={(e) => setQuickPrayer(e.target.value)}
                  className="bg-white"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleQuickPrayer();
                  }}
                />
                <Button onClick={handleQuickPrayer} disabled={saving || !quickPrayer.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold">{prayerStats.active || 0}</div>
                <p className="text-sm text-muted-foreground">Active</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{prayerStats.answered || 0}</div>
                <p className="text-sm text-muted-foreground">Answered</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold">{prayerStats.ongoing || 0}</div>
                <p className="text-sm text-muted-foreground">Ongoing</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold">
                  {Object.values(prayerStats).reduce((a, b) => a + b, 0)}
                </div>
                <p className="text-sm text-muted-foreground">Total</p>
              </CardContent>
            </Card>
          </div>

          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium">Prayer Requests</h2>
            <Button onClick={() => setShowPrayerDialog(true)} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Detailed Request
            </Button>
          </div>

          {loadingPrayers ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : prayers.length === 0 ? (
            <Card className="p-12 text-center">
              <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No prayer requests</h3>
              <p className="text-muted-foreground">
                Use the quick capture above to add prayer requests
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {prayers.map((prayer) => {
                const typeConfig = PRAYER_TYPES[prayer.request_type] || PRAYER_TYPES.general;
                const priorityConfig = PRIORITY_CONFIG[prayer.priority] || PRIORITY_CONFIG.normal;

                return (
                  <Card key={prayer.id} className={cn(
                    "transition-all",
                    prayer.status === "answered" && "opacity-60"
                  )}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className={cn(
                              "font-medium",
                              prayer.status === "answered" && "line-through"
                            )}>
                              {prayer.title}
                            </h3>
                            {prayer.status === "answered" && (
                              <Badge className="bg-green-100 text-green-700">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Answered
                              </Badge>
                            )}
                          </div>
                          {prayer.description && (
                            <p className="text-sm text-muted-foreground mb-2">
                              {prayer.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2">
                            <Badge className={typeConfig.color}>{typeConfig.label}</Badge>
                            <Badge className={priorityConfig.color}>{priorityConfig.label}</Badge>
                            {prayer.requester_name && (
                              <span className="text-xs text-muted-foreground">
                                From: {prayer.requester_name}
                              </span>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {formatRelativeTime(prayer.created_at)}
                            </span>
                          </div>
                        </div>
                        {prayer.status !== "answered" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMarkAnswered(prayer.id)}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Answered
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Discipleship Tab */}
        <TabsContent value="discipleship" className="flex-1 overflow-auto p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-medium">Discipleship Relationships</h2>
            <Button onClick={() => setShowRelationshipDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Relationship
            </Button>
          </div>

          {loadingRelationships ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : relationships.length === 0 ? (
            <Card className="p-12 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No discipleship relationships</h3>
              <p className="text-muted-foreground mb-4">
                Start tracking your mentoring and discipleship relationships
              </p>
              <Button onClick={() => setShowRelationshipDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Relationship
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {relationships.map((rel) => (
                <Card key={rel.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-medium">{rel.disciple_name}</h3>
                        {rel.disciple_email && (
                          <p className="text-sm text-muted-foreground">{rel.disciple_email}</p>
                        )}
                      </div>
                      <Badge variant={rel.status === "active" ? "default" : "secondary"}>
                        {rel.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Badge variant="outline">{rel.relationship_type}</Badge>
                      {rel.meeting_frequency && (
                        <span className="text-muted-foreground">
                          Meets {rel.meeting_frequency}
                        </span>
                      )}
                    </div>
                    {rel.current_focus && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Current focus: {rel.current_focus}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Event Dialog */}
      <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Ministry Event</DialogTitle>
            <DialogDescription>Schedule a new ministry event</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Title *</Label>
              <Input
                value={eventForm.title}
                onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                placeholder="Sunday Service"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Event Type *</Label>
                <Select
                  value={eventForm.event_type}
                  onValueChange={(value) => setEventForm({ ...eventForm, event_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(EVENT_TYPES).map(([value, config]) => (
                      <SelectItem key={value} value={value}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Location Type</Label>
                <Select
                  value={eventForm.location_type}
                  onValueChange={(value) => setEventForm({ ...eventForm, location_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in_person">In Person</SelectItem>
                    <SelectItem value="virtual">Virtual</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Start Time *</Label>
                <Input
                  type="datetime-local"
                  value={eventForm.start_time}
                  onChange={(e) => setEventForm({ ...eventForm, start_time: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>End Time</Label>
                <Input
                  type="datetime-local"
                  value={eventForm.end_time}
                  onChange={(e) => setEventForm({ ...eventForm, end_time: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Location</Label>
              <Input
                value={eventForm.location_name}
                onChange={(e) => setEventForm({ ...eventForm, location_name: e.target.value })}
                placeholder="Main Sanctuary"
              />
            </div>
            <div className="grid gap-2">
              <Label>Description</Label>
              <Textarea
                value={eventForm.description}
                onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                placeholder="Event details..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEventDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateEvent} disabled={saving}>
              {saving ? "Creating..." : "Create Event"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Prayer Dialog */}
      <Dialog open={showPrayerDialog} onOpenChange={setShowPrayerDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Prayer Request</DialogTitle>
            <DialogDescription>Create a detailed prayer request</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Request *</Label>
              <Input
                value={prayerForm.title}
                onChange={(e) => setPrayerForm({ ...prayerForm, title: e.target.value })}
                placeholder="Prayer request..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Type</Label>
                <Select
                  value={prayerForm.request_type}
                  onValueChange={(value) => setPrayerForm({ ...prayerForm, request_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PRAYER_TYPES).map(([value, config]) => (
                      <SelectItem key={value} value={value}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Priority</Label>
                <Select
                  value={prayerForm.priority}
                  onValueChange={(value) => setPrayerForm({ ...prayerForm, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PRIORITY_CONFIG).map(([value, config]) => (
                      <SelectItem key={value} value={value}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Requester Name</Label>
              <Input
                value={prayerForm.requester_name}
                onChange={(e) => setPrayerForm({ ...prayerForm, requester_name: e.target.value })}
                placeholder="Optional"
              />
            </div>
            <div className="grid gap-2">
              <Label>Details</Label>
              <Textarea
                value={prayerForm.description}
                onChange={(e) => setPrayerForm({ ...prayerForm, description: e.target.value })}
                placeholder="Additional details..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPrayerDialog(false)}>Cancel</Button>
            <Button onClick={handleCreatePrayer} disabled={saving}>
              {saving ? "Adding..." : "Add Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Relationship Dialog */}
      <Dialog open={showRelationshipDialog} onOpenChange={setShowRelationshipDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Discipleship Relationship</DialogTitle>
            <DialogDescription>Start tracking a mentoring relationship</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Name *</Label>
              <Input
                value={relationshipForm.disciple_name}
                onChange={(e) => setRelationshipForm({ ...relationshipForm, disciple_name: e.target.value })}
                placeholder="John Smith"
              />
            </div>
            <div className="grid gap-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={relationshipForm.disciple_email}
                onChange={(e) => setRelationshipForm({ ...relationshipForm, disciple_email: e.target.value })}
                placeholder="john@example.com"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Type</Label>
                <Select
                  value={relationshipForm.relationship_type}
                  onValueChange={(value) => setRelationshipForm({ ...relationshipForm, relationship_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mentoring">Mentoring</SelectItem>
                    <SelectItem value="discipleship">Discipleship</SelectItem>
                    <SelectItem value="accountability">Accountability</SelectItem>
                    <SelectItem value="coaching">Coaching</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Meeting Frequency</Label>
                <Select
                  value={relationshipForm.meeting_frequency}
                  onValueChange={(value) => setRelationshipForm({ ...relationshipForm, meeting_frequency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="biweekly">Bi-weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Current Focus</Label>
              <Textarea
                value={relationshipForm.current_focus}
                onChange={(e) => setRelationshipForm({ ...relationshipForm, current_focus: e.target.value })}
                placeholder="What are you currently working on together?"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRelationshipDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateRelationship} disabled={saving}>
              {saving ? "Creating..." : "Create Relationship"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
