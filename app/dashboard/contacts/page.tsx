"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  Loader2,
  Users,
  Star,
  Building2,
  Mail,
  Phone,
  Linkedin,
  Twitter,
  MoreVertical,
  Sparkles,
  Heart,
  UserPlus,
  Filter,
  Grid3X3,
  List,
  ArrowUpDown,
  Clock,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface Contact {
  id: string;
  first_name: string;
  last_name?: string;
  full_name: string;
  email?: string;
  phone?: string;
  avatar_url?: string;
  company?: string;
  job_title?: string;
  contact_type: string;
  relationship_strength: number;
  relationship_status: string;
  lead_status?: string;
  linkedin_url?: string;
  twitter_url?: string;
  ai_enriched: boolean;
  is_favorite: boolean;
  tags: string[];
  last_contacted_at?: string;
  next_followup_date?: string;
  created_at: string;
}

interface Stats {
  total: number;
  favorites: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
  avgRelationshipStrength: number;
  needsFollowup: number;
}

const contactTypeOptions = [
  { value: "contact", label: "Contact" },
  { value: "investor", label: "Investor" },
  { value: "partner", label: "Partner" },
  { value: "customer", label: "Customer" },
  { value: "vendor", label: "Vendor" },
  { value: "mentor", label: "Mentor" },
  { value: "advisor", label: "Advisor" },
  { value: "team", label: "Team Member" },
  { value: "prospect", label: "Prospect" },
  { value: "lead", label: "Lead" },
];

const typeColors: Record<string, string> = {
  investor: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  partner: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  customer: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  vendor: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  mentor: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
  advisor: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
  team: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  prospect: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  lead: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  contact: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
};

export default function ContactsPage() {
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [creating, setCreating] = useState(false);

  // Create form state
  const [newContact, setNewContact] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    company: "",
    job_title: "",
    contact_type: "contact",
    linkedin_url: "",
    enrich_now: false,
  });

  useEffect(() => {
    fetchContacts();
  }, [search, typeFilter]);

  const fetchContacts = async () => {
    try {
      let url = "/api/contacts?limit=100";
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (typeFilter !== "all") url += `&type=${typeFilter}`;

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setContacts(data.contacts || []);
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Failed to fetch contacts:", error);
    } finally {
      setLoading(false);
    }
  };

  const createContact = async () => {
    if (!newContact.first_name.trim()) return;

    setCreating(true);
    try {
      const response = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newContact),
      });

      if (response.ok) {
        const data = await response.json();
        setShowCreateDialog(false);
        setNewContact({
          first_name: "",
          last_name: "",
          email: "",
          phone: "",
          company: "",
          job_title: "",
          contact_type: "contact",
          linkedin_url: "",
          enrich_now: false,
        });
        router.push(`/dashboard/contacts/${data.contact.id}`);
      }
    } catch (error) {
      console.error("Failed to create contact:", error);
    } finally {
      setCreating(false);
    }
  };

  const toggleFavorite = async (contact: Contact, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`/api/contacts/${contact.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_favorite: !contact.is_favorite }),
      });
      fetchContacts();
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
    }
  };

  const getInitials = (contact: Contact) => {
    const first = contact.first_name?.[0] || "";
    const last = contact.last_name?.[0] || "";
    return (first + last).toUpperCase() || "?";
  };

  const getRelationshipColor = (strength: number) => {
    if (strength >= 80) return "text-emerald-500";
    if (strength >= 60) return "text-green-500";
    if (strength >= 40) return "text-yellow-500";
    if (strength >= 20) return "text-orange-500";
    return "text-red-500";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                Contacts
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                Manage your network with AI-powered insights
              </p>
            </div>
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white border-0"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add Contact
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card className="border-0 shadow-md bg-white dark:bg-slate-800/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                  <Users className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {stats?.total || 0}
                  </p>
                  <p className="text-xs text-slate-500">Total Contacts</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-white dark:bg-slate-800/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <Star className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {stats?.favorites || 0}
                  </p>
                  <p className="text-xs text-slate-500">Favorites</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-white dark:bg-slate-800/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <Heart className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {stats?.avgRelationshipStrength || 0}%
                  </p>
                  <p className="text-xs text-slate-500">Avg Strength</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-white dark:bg-slate-800/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {stats?.byType?.investor || 0}
                  </p>
                  <p className="text-xs text-slate-500">Investors</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-white dark:bg-slate-800/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {stats?.needsFollowup || 0}
                  </p>
                  <p className="text-xs text-slate-500">Need Follow-up</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6 border-0 shadow-md bg-white dark:bg-slate-800/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search contacts..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[160px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {contactTypeOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex items-center border rounded-lg p-1 bg-slate-100 dark:bg-slate-800">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-8 px-3",
                    viewMode === "grid" && "bg-white dark:bg-slate-700 shadow-sm"
                  )}
                  onClick={() => setViewMode("grid")}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-8 px-3",
                    viewMode === "list" && "bg-white dark:bg-slate-700 shadow-sm"
                  )}
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contacts Grid/List */}
        {contacts.length === 0 ? (
          <Card className="border-0 shadow-md bg-white dark:bg-slate-800/50">
            <CardContent className="p-12 text-center">
              <Users className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                No contacts yet
              </h3>
              <p className="text-slate-500 dark:text-slate-400 mb-4">
                Start building your network by adding your first contact
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Add Contact
              </Button>
            </CardContent>
          </Card>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {contacts.map((contact) => (
              <Card
                key={contact.id}
                className="border-0 shadow-md bg-white dark:bg-slate-800/50 hover:shadow-lg transition-shadow cursor-pointer group"
                onClick={() => router.push(`/dashboard/contacts/${contact.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={contact.avatar_url} />
                      <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white">
                        {getInitials(contact)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-900 dark:text-white truncate">
                          {contact.full_name}
                        </h3>
                        {contact.ai_enriched && (
                          <Sparkles className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                        )}
                      </div>
                      {contact.job_title && (
                        <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                          {contact.job_title}
                        </p>
                      )}
                      {contact.company && (
                        <p className="text-sm text-slate-400 dark:text-slate-500 truncate flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {contact.company}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={(e) => toggleFavorite(contact, e)}
                      className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
                    >
                      <Star
                        className={cn(
                          "h-4 w-4",
                          contact.is_favorite
                            ? "fill-amber-400 text-amber-400"
                            : "text-slate-300 dark:text-slate-600"
                        )}
                      />
                    </button>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <Badge className={cn("text-xs", typeColors[contact.contact_type] || typeColors.contact)}>
                      {contact.contact_type}
                    </Badge>

                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className={getRelationshipColor(contact.relationship_strength)}>
                        {contact.relationship_strength}%
                      </span>
                      <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full",
                            contact.relationship_strength >= 80 ? "bg-emerald-500" :
                            contact.relationship_strength >= 60 ? "bg-green-500" :
                            contact.relationship_strength >= 40 ? "bg-yellow-500" :
                            contact.relationship_strength >= 20 ? "bg-orange-500" : "bg-red-500"
                          )}
                          style={{ width: `${contact.relationship_strength}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    {contact.email && (
                      <a
                        href={`mailto:${contact.email}`}
                        onClick={(e) => e.stopPropagation()}
                        className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                      >
                        <Mail className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
                      </a>
                    )}
                    {contact.phone && (
                      <a
                        href={`tel:${contact.phone}`}
                        onClick={(e) => e.stopPropagation()}
                        className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                      >
                        <Phone className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
                      </a>
                    )}
                    {contact.linkedin_url && (
                      <a
                        href={contact.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                      >
                        <Linkedin className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
                      </a>
                    )}
                    {contact.twitter_url && (
                      <a
                        href={contact.twitter_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                      >
                        <Twitter className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-0 shadow-md bg-white dark:bg-slate-800/50 overflow-hidden">
            <div className="divide-y divide-slate-200 dark:divide-slate-700">
              {contacts.map((contact) => (
                <div
                  key={contact.id}
                  className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors flex items-center gap-4"
                  onClick={() => router.push(`/dashboard/contacts/${contact.id}`)}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={contact.avatar_url} />
                    <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white text-sm">
                      {getInitials(contact)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-900 dark:text-white">
                        {contact.full_name}
                      </span>
                      {contact.ai_enriched && (
                        <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                      )}
                      <Badge className={cn("text-xs", typeColors[contact.contact_type] || typeColors.contact)}>
                        {contact.contact_type}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {[contact.job_title, contact.company].filter(Boolean).join(" at ")}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    {contact.email && (
                      <span className="text-sm text-slate-500 dark:text-slate-400 hidden lg:block">
                        {contact.email}
                      </span>
                    )}

                    <div className="flex items-center gap-1 text-sm">
                      <span className={getRelationshipColor(contact.relationship_strength)}>
                        {contact.relationship_strength}%
                      </span>
                    </div>

                    <button
                      onClick={(e) => toggleFavorite(contact, e)}
                      className="p-1"
                    >
                      <Star
                        className={cn(
                          "h-4 w-4",
                          contact.is_favorite
                            ? "fill-amber-400 text-amber-400"
                            : "text-slate-300 dark:text-slate-600"
                        )}
                      />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Contact</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First Name *</Label>
                <Input
                  value={newContact.first_name}
                  onChange={(e) => setNewContact({ ...newContact, first_name: e.target.value })}
                  placeholder="John"
                />
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input
                  value={newContact.last_name}
                  onChange={(e) => setNewContact({ ...newContact, last_name: e.target.value })}
                  placeholder="Doe"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={newContact.email}
                onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                placeholder="john@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                value={newContact.phone}
                onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                placeholder="+1 (555) 123-4567"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Company</Label>
                <Input
                  value={newContact.company}
                  onChange={(e) => setNewContact({ ...newContact, company: e.target.value })}
                  placeholder="Acme Inc."
                />
              </div>
              <div className="space-y-2">
                <Label>Job Title</Label>
                <Input
                  value={newContact.job_title}
                  onChange={(e) => setNewContact({ ...newContact, job_title: e.target.value })}
                  placeholder="CEO"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Contact Type</Label>
              <Select
                value={newContact.contact_type}
                onValueChange={(v) => setNewContact({ ...newContact, contact_type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {contactTypeOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>LinkedIn URL</Label>
              <Input
                value={newContact.linkedin_url}
                onChange={(e) => setNewContact({ ...newContact, linkedin_url: e.target.value })}
                placeholder="https://linkedin.com/in/johndoe"
              />
            </div>

            <div className="flex items-center gap-2 p-3 rounded-lg bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800">
              <input
                type="checkbox"
                id="enrich"
                checked={newContact.enrich_now}
                onChange={(e) => setNewContact({ ...newContact, enrich_now: e.target.checked })}
                className="rounded border-violet-300"
              />
              <label htmlFor="enrich" className="text-sm text-violet-700 dark:text-violet-300 flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Enrich with AI (uses Perplexity to find more info)
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={createContact}
              disabled={!newContact.first_name.trim() || creating}
              className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white border-0"
            >
              {creating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4 mr-2" />
              )}
              Add Contact
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
