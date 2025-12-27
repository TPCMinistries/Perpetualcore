"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  Star,
  StarOff,
  MoreHorizontal,
  Archive,
  Mail,
  Phone,
  MessageSquare,
  Building2,
  MapPin,
  Clock,
  Filter,
  Grid3X3,
  List,
  Users,
  Bell,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Contact,
  ContactType,
  RelationshipStrength,
  RELATIONSHIP_STRENGTH_CONFIG,
  CONTACT_TYPE_CONFIG,
} from "@/types/contacts";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ReachOutButton } from "@/components/contacts/ReachOutButton";
import { ContactFormFull } from "@/components/contacts/ContactFormFull";

type ViewMode = "grid" | "list";

export default function ContactsPage() {
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // Filters
  const [typeFilter, setTypeFilter] = useState<ContactType | "all">("all");
  const [strengthFilter, setStrengthFilter] = useState<RelationshipStrength | "all">("all");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showNeedsFollowup, setShowNeedsFollowup] = useState(false);

  // Fetch contacts
  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      const response = await fetch("/api/contacts");
      const data = await response.json();
      if (data.contacts) {
        setContacts(data.contacts);
      }
    } catch (error) {
      console.error("Error fetching contacts:", error);
      toast.error("Failed to load contacts");
    } finally {
      setLoading(false);
    }
  };

  // Filter contacts
  const filteredContacts = useMemo(() => {
    return contacts.filter((contact) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          contact.full_name.toLowerCase().includes(query) ||
          contact.email?.toLowerCase().includes(query) ||
          contact.company?.toLowerCase().includes(query) ||
          contact.job_title?.toLowerCase().includes(query) ||
          contact.tags?.some((tag) => tag.toLowerCase().includes(query));
        if (!matchesSearch) return false;
      }

      // Type filter
      if (typeFilter !== "all" && contact.contact_type !== typeFilter) {
        return false;
      }

      // Strength filter
      if (strengthFilter !== "all" && contact.relationship_strength !== strengthFilter) {
        return false;
      }

      // Favorites filter
      if (showFavoritesOnly && !contact.is_favorite) {
        return false;
      }

      // Needs follow-up filter
      if (showNeedsFollowup) {
        const relationshipDays: Record<string, number> = {
          inner_circle: 14,
          close: 30,
          connected: 60,
          acquaintance: 90,
          new: 7,
        };
        const daysSinceContact = contact.last_interaction_at
          ? Math.floor((Date.now() - new Date(contact.last_interaction_at).getTime()) / (1000 * 60 * 60 * 24))
          : 999;
        const expectedDays = relationshipDays[contact.relationship_strength] || 30;
        if (daysSinceContact < expectedDays) {
          return false;
        }
      }

      return true;
    });
  }, [contacts, searchQuery, typeFilter, strengthFilter, showFavoritesOnly, showNeedsFollowup]);

  const handleContactCreated = (newContact: Contact) => {
    setContacts([newContact, ...contacts]);
  };

  const handleToggleFavorite = async (contact: Contact) => {
    try {
      const response = await fetch(`/api/contacts/${contact.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_favorite: !contact.is_favorite }),
      });

      if (response.ok) {
        setContacts(
          contacts.map((c) =>
            c.id === contact.id ? { ...c, is_favorite: !c.is_favorite } : c
          )
        );
        toast.success(contact.is_favorite ? "Removed from favorites" : "Added to favorites");
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  const handleArchiveContact = async (contactId: string) => {
    try {
      const response = await fetch(`/api/contacts/${contactId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_archived: true }),
      });

      if (response.ok) {
        setContacts(contacts.filter((c) => c.id !== contactId));
        toast.success("Contact archived");
      }
    } catch (error) {
      console.error("Error archiving contact:", error);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Contacts</h1>
          <p className="text-muted-foreground mt-1">
            Your network - {contacts.length} connections
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Contact
        </Button>

        <ContactFormFull
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onSuccess={handleContactCreated}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search contacts..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Select
            value={typeFilter}
            onValueChange={(value) => setTypeFilter(value as ContactType | "all")}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {Object.entries(CONTACT_TYPE_CONFIG).map(([key, config]) => (
                <SelectItem key={key} value={key}>
                  {config.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={strengthFilter}
            onValueChange={(value) => setStrengthFilter(value as RelationshipStrength | "all")}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Relationship" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Relationships</SelectItem>
              {Object.entries(RELATIONSHIP_STRENGTH_CONFIG).map(([key, config]) => (
                <SelectItem key={key} value={key}>
                  {config.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant={showFavoritesOnly ? "default" : "outline"}
            size="icon"
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            title="Show favorites only"
          >
            <Star className={cn("h-4 w-4", showFavoritesOnly && "fill-current")} />
          </Button>

          <Button
            variant={showNeedsFollowup ? "default" : "outline"}
            size="sm"
            onClick={() => setShowNeedsFollowup(!showNeedsFollowup)}
            className={cn(
              "gap-1.5",
              showNeedsFollowup && "bg-amber-500 hover:bg-amber-600 text-white"
            )}
          >
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Follow-up</span>
          </Button>

          <div className="border-l h-6 mx-2" />

          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
            <TabsList className="h-9">
              <TabsTrigger value="grid" className="px-2">
                <Grid3X3 className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="list" className="px-2">
                <List className="h-4 w-4" />
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Empty State */}
      {filteredContacts.length === 0 && (
        <div className="text-center py-16">
          <Users className="h-12 w-12 mx-auto text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-medium">
            {contacts.length === 0 ? "No contacts yet" : "No contacts match your filters"}
          </h3>
          <p className="text-muted-foreground mt-1">
            {contacts.length === 0
              ? "Add your first contact to start building your network."
              : "Try adjusting your filters or search query."}
          </p>
          {contacts.length === 0 && (
            <Button className="mt-4" onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Contact
            </Button>
          )}
        </div>
      )}

      {/* Grid View */}
      {viewMode === "grid" && filteredContacts.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredContacts.map((contact) => (
            <ContactCard
              key={contact.id}
              contact={contact}
              onClick={() => router.push(`/dashboard/contacts/${contact.id}`)}
              onToggleFavorite={() => handleToggleFavorite(contact)}
              onArchive={() => handleArchiveContact(contact.id)}
            />
          ))}
        </div>
      )}

      {/* List View */}
      {viewMode === "list" && filteredContacts.length > 0 && (
        <div className="space-y-2">
          {filteredContacts.map((contact) => (
            <ContactListItem
              key={contact.id}
              contact={contact}
              onClick={() => router.push(`/dashboard/contacts/${contact.id}`)}
              onToggleFavorite={() => handleToggleFavorite(contact)}
              onArchive={() => handleArchiveContact(contact.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Contact Card Component
function ContactCard({
  contact,
  onClick,
  onToggleFavorite,
  onArchive,
}: {
  contact: Contact;
  onClick: () => void;
  onToggleFavorite: () => void;
  onArchive: () => void;
}) {
  const strengthConfig = RELATIONSHIP_STRENGTH_CONFIG[contact.relationship_strength];

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card
      className="group cursor-pointer hover:shadow-md transition-all border-l-4 relative"
      style={{ borderLeftColor: strengthConfig.color.replace("text-", "").includes("-") ? `var(--${strengthConfig.color.replace("text-", "")})` : undefined }}
      onClick={onClick}
    >
      <CardContent className="p-4 pb-12">
        <div className="flex items-start gap-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={contact.avatar_url || undefined} />
            <AvatarFallback className={cn(strengthConfig.bgColor, strengthConfig.color)}>
              {getInitials(contact.full_name)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-medium truncate">{contact.full_name}</h3>
              {contact.is_favorite && (
                <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500 flex-shrink-0" />
              )}
            </div>

            {(contact.job_title || contact.company) && (
              <p className="text-sm text-muted-foreground truncate">
                {contact.job_title}
                {contact.job_title && contact.company && " at "}
                {contact.company}
              </p>
            )}

            <div className="flex items-center gap-2 mt-2">
              <Badge
                variant="secondary"
                className={cn("text-xs", strengthConfig.bgColor, strengthConfig.color)}
              >
                {strengthConfig.label}
              </Badge>
            </div>

            {contact.last_interaction_at && (
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDistanceToNow(new Date(contact.last_interaction_at), {
                  addSuffix: true,
                })}
              </p>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onClick={onToggleFavorite}>
                {contact.is_favorite ? (
                  <>
                    <StarOff className="h-4 w-4 mr-2" />
                    Remove from favorites
                  </>
                ) : (
                  <>
                    <Star className="h-4 w-4 mr-2" />
                    Add to favorites
                  </>
                )}
              </DropdownMenuItem>
              {contact.email && (
                <DropdownMenuItem onClick={() => window.open(`mailto:${contact.email}`)}>
                  <Mail className="h-4 w-4 mr-2" />
                  Send email
                </DropdownMenuItem>
              )}
              {contact.phone && (
                <DropdownMenuItem onClick={() => window.open(`tel:${contact.phone}`)}>
                  <Phone className="h-4 w-4 mr-2" />
                  Call
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onArchive} className="text-destructive">
                <Archive className="h-4 w-4 mr-2" />
                Archive
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Reach Out Button - shows on hover */}
        <div
          className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <ReachOutButton
            contactId={contact.id}
            contactName={contact.full_name}
            contactEmail={contact.email}
            variant="outline"
            size="sm"
          />
        </div>

        {contact.tags && contact.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {contact.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
              >
                {tag}
              </span>
            ))}
            {contact.tags.length > 3 && (
              <span className="text-xs px-2 py-0.5 text-muted-foreground">
                +{contact.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Contact List Item Component
function ContactListItem({
  contact,
  onClick,
  onToggleFavorite,
  onArchive,
}: {
  contact: Contact;
  onClick: () => void;
  onToggleFavorite: () => void;
  onArchive: () => void;
}) {
  const strengthConfig = RELATIONSHIP_STRENGTH_CONFIG[contact.relationship_strength];

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div
      className="group flex items-center gap-4 p-4 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
      onClick={onClick}
    >
      <Avatar className="h-10 w-10">
        <AvatarImage src={contact.avatar_url || undefined} />
        <AvatarFallback className={cn(strengthConfig.bgColor, strengthConfig.color)}>
          {getInitials(contact.full_name)}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-4 gap-2 sm:gap-4 items-center">
        <div className="sm:col-span-2">
          <div className="flex items-center gap-2">
            <span className="font-medium truncate">{contact.full_name}</span>
            {contact.is_favorite && (
              <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500 flex-shrink-0" />
            )}
          </div>
          {(contact.job_title || contact.company) && (
            <p className="text-sm text-muted-foreground truncate">
              {contact.job_title}
              {contact.job_title && contact.company && " at "}
              {contact.company}
            </p>
          )}
        </div>

        <div className="hidden sm:flex items-center gap-2">
          <Badge
            variant="secondary"
            className={cn("text-xs", strengthConfig.bgColor, strengthConfig.color)}
          >
            {strengthConfig.label}
          </Badge>
        </div>

        <div className="hidden sm:block text-sm text-muted-foreground">
          {contact.last_interaction_at ? (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDistanceToNow(new Date(contact.last_interaction_at), {
                addSuffix: true,
              })}
            </span>
          ) : (
            <span className="text-muted-foreground/50">No interactions</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
        <div className="hidden sm:block">
          <ReachOutButton
            contactId={contact.id}
            contactName={contact.full_name}
            contactEmail={contact.email}
            variant="icon"
            showLabel={false}
          />
        </div>

        {contact.email && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hidden sm:flex"
            onClick={(e) => {
              e.stopPropagation();
              window.open(`mailto:${contact.email}`);
            }}
          >
            <Mail className="h-4 w-4" />
          </Button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuItem onClick={onToggleFavorite}>
              {contact.is_favorite ? (
                <>
                  <StarOff className="h-4 w-4 mr-2" />
                  Remove from favorites
                </>
              ) : (
                <>
                  <Star className="h-4 w-4 mr-2" />
                  Add to favorites
                </>
              )}
            </DropdownMenuItem>
            {contact.email && (
              <DropdownMenuItem onClick={() => window.open(`mailto:${contact.email}`)}>
                <Mail className="h-4 w-4 mr-2" />
                Send email
              </DropdownMenuItem>
            )}
            {contact.phone && (
              <DropdownMenuItem onClick={() => window.open(`tel:${contact.phone}`)}>
                <Phone className="h-4 w-4 mr-2" />
                Call
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onArchive} className="text-destructive">
              <Archive className="h-4 w-4 mr-2" />
              Archive
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
