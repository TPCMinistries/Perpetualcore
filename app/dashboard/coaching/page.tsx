"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users,
  Plus,
  Calendar,
  Clock,
  DollarSign,
  Target,
  MoreHorizontal,
  Video,
  CheckCircle2,
  AlertCircle,
  Building,
  Mail,
  Phone,
  ChevronRight,
  Edit,
  Trash2,
  X,
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Types
interface CoachingClient {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  role?: string;
  coaching_type: string;
  engagement_start: string;
  engagement_end?: string;
  session_frequency?: string;
  session_duration_minutes: number;
  primary_goals?: string[];
  rate_type?: string;
  rate_amount?: number;
  status: string;
  notes?: string;
  created_at: string;
  contact?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    avatar_url?: string;
  };
  session_counts?: {
    total: number;
    completed: number;
  };
}

interface CoachingSession {
  id: string;
  client_id: string;
  session_number: number;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  prep_notes?: string;
  goals_for_session?: string[];
  topics_covered?: string[];
  key_insights?: string;
  action_items?: any;
  completed_at?: string;
  client?: {
    id: string;
    name: string;
    company?: string;
    coaching_type: string;
  };
}

// Config
const COACHING_TYPES: Record<string, { label: string; color: string }> = {
  executive: { label: "Executive", color: "bg-purple-100 text-purple-700" },
  leadership: { label: "Leadership", color: "bg-blue-100 text-blue-700" },
  career: { label: "Career", color: "bg-green-100 text-green-700" },
  life: { label: "Life", color: "bg-pink-100 text-pink-700" },
  business: { label: "Business", color: "bg-orange-100 text-orange-700" },
  ministry: { label: "Ministry", color: "bg-cyan-100 text-cyan-700" },
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  prospect: { label: "Prospect", color: "bg-gray-100 text-gray-700" },
  active: { label: "Active", color: "bg-green-100 text-green-700" },
  paused: { label: "Paused", color: "bg-yellow-100 text-yellow-700" },
  completed: { label: "Completed", color: "bg-blue-100 text-blue-700" },
  churned: { label: "Churned", color: "bg-red-100 text-red-700" },
};

export default function CoachingPage() {
  const [activeTab, setActiveTab] = useState("clients");

  // Clients state
  const [clients, setClients] = useState<CoachingClient[]>([]);
  const [clientStats, setClientStats] = useState<Record<string, number>>({});
  const [loadingClients, setLoadingClients] = useState(true);
  const [showClientDialog, setShowClientDialog] = useState(false);
  const [showClientSheet, setShowClientSheet] = useState(false);
  const [selectedClient, setSelectedClient] = useState<CoachingClient | null>(null);
  const [clientSessions, setClientSessions] = useState<CoachingSession[]>([]);

  // Sessions state
  const [upcomingSessions, setUpcomingSessions] = useState<CoachingSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [showSessionDialog, setShowSessionDialog] = useState(false);

  // Form states
  const [clientForm, setClientForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    role: "",
    coaching_type: "executive",
    session_frequency: "weekly",
    session_duration_minutes: "60",
    notes: "",
  });

  const [sessionForm, setSessionForm] = useState({
    client_id: "",
    scheduled_at: "",
    prep_notes: "",
  });

  const [saving, setSaving] = useState(false);

  // Fetch clients
  const fetchClients = useCallback(async () => {
    try {
      setLoadingClients(true);
      const res = await fetch("/api/coaching/clients");
      if (!res.ok) throw new Error("Failed to fetch clients");
      const data = await res.json();
      setClients(data.clients || []);
      setClientStats(data.stats || {});
    } catch (error) {
      console.error("Error fetching clients:", error);
      toast.error("Failed to load clients");
    } finally {
      setLoadingClients(false);
    }
  }, []);

  // Fetch sessions
  const fetchSessions = useCallback(async () => {
    try {
      setLoadingSessions(true);
      const res = await fetch("/api/coaching/sessions?upcoming=true");
      if (!res.ok) throw new Error("Failed to fetch sessions");
      const data = await res.json();
      setUpcomingSessions(data.sessions || []);
    } catch (error) {
      console.error("Error fetching sessions:", error);
      toast.error("Failed to load sessions");
    } finally {
      setLoadingSessions(false);
    }
  }, []);

  useEffect(() => {
    fetchClients();
    fetchSessions();
  }, [fetchClients, fetchSessions]);

  // Fetch client details
  const fetchClientDetails = async (clientId: string) => {
    try {
      const res = await fetch(`/api/coaching/clients/${clientId}`);
      if (!res.ok) throw new Error("Failed to fetch client");
      const data = await res.json();
      setSelectedClient(data.client);
      setClientSessions(data.sessions || []);
      setShowClientSheet(true);
    } catch (error) {
      console.error("Error fetching client:", error);
      toast.error("Failed to load client details");
    }
  };

  // Create client
  const handleCreateClient = async () => {
    if (!clientForm.name) {
      toast.error("Name is required");
      return;
    }

    try {
      setSaving(true);
      const res = await fetch("/api/coaching/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...clientForm,
          session_duration_minutes: parseInt(clientForm.session_duration_minutes),
        }),
      });

      if (!res.ok) throw new Error("Failed to create client");

      toast.success("Client created");
      setShowClientDialog(false);
      setClientForm({
        name: "",
        email: "",
        phone: "",
        company: "",
        role: "",
        coaching_type: "executive",
        session_frequency: "weekly",
        session_duration_minutes: "60",
        notes: "",
      });
      fetchClients();
    } catch (error) {
      console.error("Error creating client:", error);
      toast.error("Failed to create client");
    } finally {
      setSaving(false);
    }
  };

  // Create session
  const handleCreateSession = async () => {
    if (!sessionForm.client_id || !sessionForm.scheduled_at) {
      toast.error("Client and scheduled time are required");
      return;
    }

    try {
      setSaving(true);
      const res = await fetch(`/api/coaching/clients/${sessionForm.client_id}/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduled_at: sessionForm.scheduled_at,
          prep_notes: sessionForm.prep_notes,
        }),
      });

      if (!res.ok) throw new Error("Failed to create session");

      toast.success("Session scheduled");
      setShowSessionDialog(false);
      setSessionForm({
        client_id: "",
        scheduled_at: "",
        prep_notes: "",
      });
      fetchSessions();
    } catch (error) {
      console.error("Error creating session:", error);
      toast.error("Failed to schedule session");
    } finally {
      setSaving(false);
    }
  };

  // Complete session
  const handleCompleteSession = async (sessionId: string) => {
    try {
      const res = await fetch("/api/coaching/sessions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: sessionId, status: "completed" }),
      });

      if (!res.ok) throw new Error("Failed to complete session");

      toast.success("Session completed");
      fetchSessions();
      fetchClients();
    } catch (error) {
      console.error("Error completing session:", error);
      toast.error("Failed to complete session");
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate totals
  const totalClients = clients.length;
  const activeClients = clients.filter(c => c.status === "active").length;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b">
        <div>
          <h1 className="text-2xl font-semibold">Coaching</h1>
          <p className="text-muted-foreground">
            Manage your coaching clients and sessions
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="px-6 pt-4 border-b">
          <TabsList>
            <TabsTrigger value="clients" className="gap-2">
              <Users className="h-4 w-4" />
              Clients
            </TabsTrigger>
            <TabsTrigger value="sessions" className="gap-2">
              <Calendar className="h-4 w-4" />
              Sessions
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Clients Tab */}
        <TabsContent value="clients" className="flex-1 overflow-auto p-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <span className="text-2xl font-bold">{totalClients}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">Total Clients</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span className="text-2xl font-bold">{activeClients}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">Active Clients</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <Calendar className="h-5 w-5 text-blue-500" />
                  <span className="text-2xl font-bold">{upcomingSessions.length}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">Upcoming Sessions</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <Target className="h-5 w-5 text-purple-500" />
                  <span className="text-2xl font-bold">
                    {clients.reduce((sum, c) => sum + (c.session_counts?.completed || 0), 0)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">Sessions Completed</p>
              </CardContent>
            </Card>
          </div>

          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium">Coaching Clients</h2>
            <Button onClick={() => setShowClientDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Client
            </Button>
          </div>

          {loadingClients ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : clients.length === 0 ? (
            <Card className="p-12 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No clients yet</h3>
              <p className="text-muted-foreground mb-4">
                Start building your coaching practice
              </p>
              <Button onClick={() => setShowClientDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Client
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {clients.map((client) => {
                const typeConfig = COACHING_TYPES[client.coaching_type] || COACHING_TYPES.executive;
                const statusConfig = STATUS_CONFIG[client.status] || STATUS_CONFIG.active;

                return (
                  <Card
                    key={client.id}
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => fetchClientDetails(client.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={client.contact?.avatar_url} />
                            <AvatarFallback>
                              {client.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-medium">{client.name}</h3>
                            {client.company && (
                              <p className="text-sm text-muted-foreground">{client.company}</p>
                            )}
                          </div>
                        </div>
                        <Badge className={statusConfig.color}>{statusConfig.label}</Badge>
                      </div>

                      <div className="flex items-center gap-2 mb-3">
                        <Badge className={typeConfig.color}>{typeConfig.label}</Badge>
                        {client.session_frequency && (
                          <span className="text-xs text-muted-foreground">
                            {client.session_frequency}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>
                          {client.session_counts?.completed || 0} / {client.session_counts?.total || 0} sessions
                        </span>
                        {client.rate_amount && (
                          <span className="font-medium">
                            {formatCurrency(client.rate_amount)}/{client.rate_type === "hourly" ? "hr" : "mo"}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Sessions Tab */}
        <TabsContent value="sessions" className="flex-1 overflow-auto p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-medium">Upcoming Sessions</h2>
            <Button onClick={() => setShowSessionDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Schedule Session
            </Button>
          </div>

          {loadingSessions ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : upcomingSessions.length === 0 ? (
            <Card className="p-12 text-center">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No upcoming sessions</h3>
              <p className="text-muted-foreground mb-4">
                Schedule your next coaching session
              </p>
              <Button onClick={() => setShowSessionDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Schedule Session
              </Button>
            </Card>
          ) : (
            <div className="space-y-4">
              {upcomingSessions.map((session) => {
                const typeConfig = COACHING_TYPES[session.client?.coaching_type || "executive"];

                return (
                  <Card key={session.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-2 rounded-lg bg-blue-100">
                            <Video className="h-5 w-5 text-blue-700" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium">{session.client?.name}</h3>
                              <Badge variant="outline">Session #{session.session_number}</Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDate(session.scheduled_at)}
                              </span>
                              <span>{session.duration_minutes} min</span>
                              {session.client?.company && (
                                <span className="flex items-center gap-1">
                                  <Building className="h-3 w-3" />
                                  {session.client.company}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge className={typeConfig?.color}>{typeConfig?.label}</Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCompleteSession(session.id);
                            }}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Complete
                          </Button>
                        </div>
                      </div>

                      {session.prep_notes && (
                        <div className="mt-3 p-2 rounded bg-muted text-sm">
                          <span className="font-medium">Prep notes: </span>
                          {session.prep_notes}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Client Dialog */}
      <Dialog open={showClientDialog} onOpenChange={setShowClientDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Coaching Client</DialogTitle>
            <DialogDescription>Add a new client to your coaching practice</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Name *</Label>
              <Input
                value={clientForm.name}
                onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })}
                placeholder="John Smith"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={clientForm.email}
                  onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })}
                  placeholder="john@example.com"
                />
              </div>
              <div className="grid gap-2">
                <Label>Phone</Label>
                <Input
                  value={clientForm.phone}
                  onChange={(e) => setClientForm({ ...clientForm, phone: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Company</Label>
                <Input
                  value={clientForm.company}
                  onChange={(e) => setClientForm({ ...clientForm, company: e.target.value })}
                  placeholder="Acme Inc"
                />
              </div>
              <div className="grid gap-2">
                <Label>Role</Label>
                <Input
                  value={clientForm.role}
                  onChange={(e) => setClientForm({ ...clientForm, role: e.target.value })}
                  placeholder="CEO"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Coaching Type</Label>
                <Select
                  value={clientForm.coaching_type}
                  onValueChange={(value) => setClientForm({ ...clientForm, coaching_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(COACHING_TYPES).map(([value, config]) => (
                      <SelectItem key={value} value={value}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Session Frequency</Label>
                <Select
                  value={clientForm.session_frequency}
                  onValueChange={(value) => setClientForm({ ...clientForm, session_frequency: value })}
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
              <Label>Session Duration (minutes)</Label>
              <Select
                value={clientForm.session_duration_minutes}
                onValueChange={(value) => setClientForm({ ...clientForm, session_duration_minutes: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="60">60 minutes</SelectItem>
                  <SelectItem value="90">90 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Notes</Label>
              <Textarea
                value={clientForm.notes}
                onChange={(e) => setClientForm({ ...clientForm, notes: e.target.value })}
                placeholder="Additional notes about this client..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClientDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateClient} disabled={saving}>
              {saving ? "Creating..." : "Add Client"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Session Dialog */}
      <Dialog open={showSessionDialog} onOpenChange={setShowSessionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Session</DialogTitle>
            <DialogDescription>Schedule a coaching session with a client</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Client *</Label>
              <Select
                value={sessionForm.client_id}
                onValueChange={(value) => setSessionForm({ ...sessionForm, client_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.filter(c => c.status === "active").map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name} - {client.company || "No company"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Scheduled Time *</Label>
              <Input
                type="datetime-local"
                value={sessionForm.scheduled_at}
                onChange={(e) => setSessionForm({ ...sessionForm, scheduled_at: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label>Prep Notes</Label>
              <Textarea
                value={sessionForm.prep_notes}
                onChange={(e) => setSessionForm({ ...sessionForm, prep_notes: e.target.value })}
                placeholder="What to cover in this session..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSessionDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateSession} disabled={saving}>
              {saving ? "Scheduling..." : "Schedule Session"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Client Detail Sheet */}
      <Sheet open={showClientSheet} onOpenChange={setShowClientSheet}>
        <SheetContent className="sm:max-w-[600px] overflow-y-auto">
          {selectedClient && (
            <>
              <SheetHeader>
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={selectedClient.contact?.avatar_url} />
                    <AvatarFallback>
                      {selectedClient.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <SheetTitle>{selectedClient.name}</SheetTitle>
                    <SheetDescription>
                      {selectedClient.company && `${selectedClient.company} • `}
                      {selectedClient.role}
                    </SheetDescription>
                  </div>
                </div>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Contact Info */}
                <div className="space-y-2">
                  {selectedClient.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a href={`mailto:${selectedClient.email}`} className="hover:underline">
                        {selectedClient.email}
                      </a>
                    </div>
                  )}
                  {selectedClient.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      {selectedClient.phone}
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-3 text-center">
                      <div className="text-xl font-bold">
                        {selectedClient.session_counts?.completed || 0}
                      </div>
                      <p className="text-xs text-muted-foreground">Completed</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-3 text-center">
                      <div className="text-xl font-bold">
                        {selectedClient.session_counts?.total || 0}
                      </div>
                      <p className="text-xs text-muted-foreground">Total Sessions</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-3 text-center">
                      <div className="text-xl font-bold">
                        {selectedClient.session_duration_minutes}
                      </div>
                      <p className="text-xs text-muted-foreground">Min/Session</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Goals */}
                {selectedClient.primary_goals && selectedClient.primary_goals.length > 0 && (
                  <div>
                    <Label className="text-sm text-muted-foreground">Goals</Label>
                    <ul className="mt-2 space-y-1">
                      {selectedClient.primary_goals.map((goal, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          <Target className="h-3 w-3 text-muted-foreground" />
                          {goal}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Sessions */}
                <div>
                  <Label className="text-sm text-muted-foreground">Recent Sessions</Label>
                  <div className="mt-2 space-y-2">
                    {clientSessions.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No sessions yet</p>
                    ) : (
                      clientSessions.slice(0, 5).map((session) => (
                        <div key={session.id} className="flex items-center justify-between p-2 rounded-lg bg-muted">
                          <div>
                            <span className="font-medium text-sm">Session #{session.session_number}</span>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(session.scheduled_at)}
                            </p>
                          </div>
                          <Badge variant={session.status === "completed" ? "default" : "outline"}>
                            {session.status}
                          </Badge>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Notes */}
                {selectedClient.notes && (
                  <div>
                    <Label className="text-sm text-muted-foreground">Notes</Label>
                    <p className="mt-1 text-sm whitespace-pre-wrap">{selectedClient.notes}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
