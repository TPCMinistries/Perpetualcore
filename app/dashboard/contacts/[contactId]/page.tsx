"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  ArrowLeft,
  Star,
  StarOff,
  Mail,
  Phone,
  Building2,
  MapPin,
  Clock,
  Calendar,
  Edit,
  Trash2,
  MoreHorizontal,
  MessageSquare,
  Plus,
  FileText,
  Users,
  Briefcase,
  ExternalLink,
  Video,
  UserPlus,
  StickyNote,
  Lightbulb,
  Target,
  Sparkles,
  Loader2,
  DollarSign,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Contact,
  ContactInteraction,
  ContactProject,
  ContactConnection,
  InteractionType,
  RELATIONSHIP_STRENGTH_CONFIG,
  INTERACTION_TYPE_CONFIG,
  CONTACT_TYPE_CONFIG,
  CreateInteractionInput,
} from "@/types/contacts";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import { RelatedItems } from "@/components/cross-linking/RelatedItems";

export default function ContactDetailPage() {
  const pathname = usePathname();
  const contactId = pathname.split('/').pop() || '';
  const router = useRouter();

  const [contact, setContact] = useState<Contact | null>(null);
  const [recentInteractions, setRecentInteractions] = useState<ContactInteraction[]>([]);
  const [linkedProjects, setLinkedProjects] = useState<ContactProject[]>([]);
  const [connections, setConnections] = useState<ContactConnection[]>([]);
  const [loading, setLoading] = useState(true);

  // Notes state
  const [notes, setNotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [aiProcessing, setAiProcessing] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteContent, setEditingNoteContent] = useState("");
  const [noteAiProcessing, setNoteAiProcessing] = useState<string | null>(null);

  // Ideas state
  const [linkedIdeas, setLinkedIdeas] = useState<any[]>([]);

  // Deals/Opportunities state
  const [linkedDeals, setLinkedDeals] = useState<any[]>([]);

  // Network state
  const [networkData, setNetworkData] = useState<{
    directConnections: any[];
    mutualConnections: any[];
    suggestedConnections: any[];
    stats: { totalConnections: number; closeConnections: number; mutualCount: number; suggestionsCount: number };
  } | null>(null);
  const [networkLoading, setNetworkLoading] = useState(false);
  const [addConnectionDialogOpen, setAddConnectionDialogOpen] = useState(false);
  const [allContacts, setAllContacts] = useState<any[]>([]);
  const [selectedConnectionContact, setSelectedConnectionContact] = useState<string>("");
  const [connectionType, setConnectionType] = useState<string>("colleague");
  const [connectionStrength, setConnectionStrength] = useState<string>("known");
  const [connectionNotes, setConnectionNotes] = useState<string>("");
  const [addingConnection, setAddingConnection] = useState(false);

  // Dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [interactionDialogOpen, setInteractionDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [insightsDialogOpen, setInsightsDialogOpen] = useState(false);
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);

  // AI Insights state
  const [insights, setInsights] = useState<any>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);

  // AI Message generation state
  const [generatedMessages, setGeneratedMessages] = useState<any[]>([]);
  const [messageLoading, setMessageLoading] = useState(false);
  const [selectedMessageType, setSelectedMessageType] = useState("check_in");

  // AI Interaction assistance state
  const [interactionAiProcessing, setInteractionAiProcessing] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState<Partial<Contact>>({});

  // Interaction form state
  const [newInteraction, setNewInteraction] = useState<CreateInteractionInput>({
    contact_id: contactId,
    interaction_type: "meeting",
    summary: "",
    key_points: [],
    action_items: [],
  });

  useEffect(() => {
    fetchContact();
    fetchNotes();
    fetchLinkedItems();
    fetchNetworkData();
  }, [contactId]);

  const fetchContact = async () => {
    try {
      const response = await fetch(`/api/contacts/${contactId}`);
      if (!response.ok) {
        router.push("/dashboard/contacts");
        return;
      }
      const data = await response.json();
      setContact(data.contact);
      setRecentInteractions(data.recentInteractions || []);
      setLinkedProjects(data.linkedProjects || []);
      setConnections(data.connections || []);
      setEditForm(data.contact);
    } catch (error) {
      console.error("Error fetching contact:", error);
      toast.error("Failed to load contact");
      router.push("/dashboard/contacts");
    } finally {
      setLoading(false);
    }
  };

  const fetchNotes = async () => {
    try {
      const response = await fetch(`/api/contacts/${contactId}/notes`);
      if (response.ok) {
        const data = await response.json();
        setNotes(data.notes || []);
      }
    } catch (error) {
      console.error("Error fetching notes:", error);
    }
  };

  const fetchLinkedItems = async () => {
    try {
      // Fetch linked ideas
      const ideasRes = await fetch(`/api/contacts/${contactId}/ideas`);
      if (ideasRes.ok) {
        const data = await ideasRes.json();
        setLinkedIdeas(data.ideas || []);
      }

      // Fetch linked deals/opportunities
      const dealsRes = await fetch(`/api/contacts/${contactId}/opportunities`);
      if (dealsRes.ok) {
        const data = await dealsRes.json();
        setLinkedDeals(data.opportunities || []);
      }
    } catch (error) {
      console.error("Error fetching linked items:", error);
    }
  };

  const fetchNetworkData = async () => {
    setNetworkLoading(true);
    try {
      const response = await fetch(`/api/contacts/${contactId}/network`);
      if (response.ok) {
        const data = await response.json();
        setNetworkData(data);
      }
    } catch (error) {
      console.error("Error fetching network data:", error);
    } finally {
      setNetworkLoading(false);
    }
  };

  const fetchAllContacts = async () => {
    try {
      const response = await fetch(`/api/contacts?limit=100`);
      if (response.ok) {
        const data = await response.json();
        // Filter out the current contact
        setAllContacts((data.contacts || []).filter((c: any) => c.id !== contactId));
      }
    } catch (error) {
      console.error("Error fetching contacts:", error);
    }
  };

  const handleAddConnection = async () => {
    if (!selectedConnectionContact) {
      toast.error("Please select a contact");
      return;
    }
    setAddingConnection(true);
    try {
      const response = await fetch(`/api/contacts/${contactId}/network`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          connected_contact_id: selectedConnectionContact,
          relationship_type: connectionType,
          strength: connectionStrength,
          notes: connectionNotes || null,
        }),
      });
      if (response.ok) {
        toast.success("Connection added");
        setAddConnectionDialogOpen(false);
        setSelectedConnectionContact("");
        setConnectionType("colleague");
        setConnectionStrength("known");
        setConnectionNotes("");
        fetchNetworkData();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to add connection");
      }
    } catch (error) {
      toast.error("Failed to add connection");
    } finally {
      setAddingConnection(false);
    }
  };

  const handleRemoveConnection = async (connectionId: string) => {
    try {
      const response = await fetch(`/api/contacts/${contactId}/network?connectionId=${connectionId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        toast.success("Connection removed");
        fetchNetworkData();
      }
    } catch (error) {
      toast.error("Failed to remove connection");
    }
  };

  const handleSaveNote = async () => {
    if (!newNote.trim()) return;
    setSavingNote(true);
    try {
      const response = await fetch(`/api/contacts/${contactId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newNote }),
      });
      if (response.ok) {
        const data = await response.json();
        setNotes([data.note, ...notes]);
        setNewNote("");
        setNoteDialogOpen(false);
        toast.success("Note saved");
      }
    } catch (error) {
      toast.error("Failed to save note");
    } finally {
      setSavingNote(false);
    }
  };

  const handleAiSummarize = async () => {
    if (!newNote.trim()) return;
    setAiProcessing(true);
    try {
      const response = await fetch(`/api/contacts/${contactId}/notes/ai`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "summarize", content: newNote }),
      });
      if (response.ok) {
        const data = await response.json();
        setNewNote(data.result || newNote);
      }
    } catch (error) {
      toast.error("AI processing failed");
    } finally {
      setAiProcessing(false);
    }
  };

  const handleAiExpand = async () => {
    if (!newNote.trim()) return;
    setAiProcessing(true);
    try {
      const response = await fetch(`/api/contacts/${contactId}/notes/ai`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "expand", content: newNote }),
      });
      if (response.ok) {
        const data = await response.json();
        setNewNote(data.result || newNote);
      }
    } catch (error) {
      toast.error("AI processing failed");
    } finally {
      setAiProcessing(false);
    }
  };

  const handleAiExtractActions = async () => {
    if (!newNote.trim()) return;
    setAiProcessing(true);
    try {
      const response = await fetch(`/api/contacts/${contactId}/notes/ai`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "extract_actions", content: newNote }),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.actions?.length > 0) {
          setNewNote(newNote + "\n\n**Action Items:**\n" + data.actions.map((a: string) => `- ${a}`).join("\n"));
        }
        toast.success(`Found ${data.actions?.length || 0} action items`);
      }
    } catch (error) {
      toast.error("AI processing failed");
    } finally {
      setAiProcessing(false);
    }
  };

  // AI actions for existing notes
  const handleEnhanceExistingNote = async (noteId: string, action: "summarize" | "expand" | "extract_key_points") => {
    const note = notes.find((n) => n.id === noteId);
    if (!note) return;

    setNoteAiProcessing(noteId);
    try {
      const response = await fetch(`/api/contacts/${contactId}/notes/ai`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, content: note.content }),
      });
      if (response.ok) {
        const data = await response.json();
        let newContent = note.content;

        if (action === "summarize" || action === "expand") {
          newContent = data.result || note.content;
        } else if (action === "extract_key_points" && data.key_points?.length > 0) {
          newContent = note.content + "\n\n**Key Points:**\n" + data.key_points.map((p: string) => `• ${p}`).join("\n");
        }

        // Update the note in database
        const updateRes = await fetch(`/api/contacts/${contactId}/notes`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ noteId, content: newContent, ai_generated: true }),
        });

        if (updateRes.ok) {
          setNotes((prev) =>
            prev.map((n) => (n.id === noteId ? { ...n, content: newContent, ai_generated: true } : n))
          );
          toast.success(action === "summarize" ? "Note summarized" : action === "expand" ? "Note expanded" : "Key points extracted");
        }
      }
    } catch (error) {
      toast.error("AI processing failed");
    } finally {
      setNoteAiProcessing(null);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      const response = await fetch(`/api/contacts/${contactId}/notes?noteId=${noteId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setNotes((prev) => prev.filter((n) => n.id !== noteId));
        toast.success("Note deleted");
      } else {
        toast.error("Failed to delete note");
      }
    } catch (error) {
      toast.error("Failed to delete note");
    }
  };

  const handleFetchInsights = async () => {
    setInsightsLoading(true);
    setInsightsDialogOpen(true);
    try {
      const response = await fetch(`/api/contacts/${contactId}/insights`);
      if (response.ok) {
        const data = await response.json();
        setInsights(data.insights);
        // Update contact with new AI summary
        if (data.insights?.summary) {
          setContact((prev) => prev ? { ...prev, ai_summary: data.insights.summary } : prev);
        }
      } else {
        toast.error("Failed to generate insights");
      }
    } catch (error) {
      console.error("Error fetching insights:", error);
      toast.error("Failed to generate insights");
    } finally {
      setInsightsLoading(false);
    }
  };

  const handleGenerateMessage = async () => {
    setMessageLoading(true);
    setMessageDialogOpen(true);
    try {
      const response = await fetch(`/api/contacts/${contactId}/generate-message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message_type: selectedMessageType }),
      });
      if (response.ok) {
        const data = await response.json();
        setGeneratedMessages(data.variations || []);
      } else {
        toast.error("Failed to generate message");
      }
    } catch (error) {
      console.error("Error generating message:", error);
      toast.error("Failed to generate message");
    } finally {
      setMessageLoading(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!contact) return;
    try {
      const response = await fetch(`/api/contacts/${contactId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_favorite: !contact.is_favorite }),
      });

      if (response.ok) {
        setContact({ ...contact, is_favorite: !contact.is_favorite });
        toast.success(contact.is_favorite ? "Removed from favorites" : "Added to favorites");
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  const handleSaveEdit = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/contacts/${contactId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });

      if (response.ok) {
        const data = await response.json();
        setContact(data.contact);
        setEditDialogOpen(false);
        toast.success("Contact updated");
      } else {
        toast.error("Failed to update contact");
      }
    } catch (error) {
      console.error("Error updating contact:", error);
      toast.error("Failed to update contact");
    } finally {
      setSaving(false);
    }
  };

  const handleLogInteraction = async () => {
    if (!newInteraction.summary.trim()) {
      toast.error("Summary is required");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/contacts/${contactId}/interactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newInteraction),
      });

      if (response.ok) {
        const data = await response.json();
        setRecentInteractions([data.interaction, ...recentInteractions]);
        setInteractionDialogOpen(false);
        setNewInteraction({
          contact_id: contactId,
          interaction_type: "meeting",
          summary: "",
          key_points: [],
          action_items: [],
        });
        toast.success("Interaction logged");
        fetchContact(); // Refresh to get updated last_interaction_at
      } else {
        toast.error("Failed to log interaction");
      }
    } catch (error) {
      console.error("Error logging interaction:", error);
      toast.error("Failed to log interaction");
    } finally {
      setSaving(false);
    }
  };

  const handleInteractionAiSummarize = async () => {
    if (!newInteraction.summary.trim()) return;
    setInteractionAiProcessing(true);
    try {
      const response = await fetch(`/api/contacts/${contactId}/notes/ai`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "summarize_interaction",
          content: newInteraction.summary,
          interaction_type: newInteraction.interaction_type,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        setNewInteraction({
          ...newInteraction,
          summary: data.result || newInteraction.summary,
        });
        toast.success("Summary enhanced");
      }
    } catch (error) {
      toast.error("AI processing failed");
    } finally {
      setInteractionAiProcessing(false);
    }
  };

  const handleInteractionAiKeyPoints = async () => {
    if (!newInteraction.summary.trim()) return;
    setInteractionAiProcessing(true);
    try {
      const response = await fetch(`/api/contacts/${contactId}/notes/ai`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "extract_key_points",
          content: newInteraction.summary,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.key_points?.length > 0) {
          setNewInteraction({
            ...newInteraction,
            key_points: data.key_points,
          });
          toast.success(`Found ${data.key_points.length} key points`);
        } else {
          toast.info("No key points identified");
        }
      }
    } catch (error) {
      toast.error("AI processing failed");
    } finally {
      setInteractionAiProcessing(false);
    }
  };

  const handleInteractionAiActionItems = async () => {
    if (!newInteraction.summary.trim()) return;
    setInteractionAiProcessing(true);
    try {
      const response = await fetch(`/api/contacts/${contactId}/notes/ai`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "extract_actions",
          content: newInteraction.summary,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.actions?.length > 0) {
          setNewInteraction({
            ...newInteraction,
            action_items: data.actions,
          });
          toast.success(`Found ${data.actions.length} action items`);
        } else {
          toast.info("No action items identified");
        }
      }
    } catch (error) {
      toast.error("AI processing failed");
    } finally {
      setInteractionAiProcessing(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/contacts/${contactId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Contact deleted");
        router.push("/dashboard/contacts");
      } else {
        toast.error("Failed to delete contact");
      }
    } catch (error) {
      console.error("Error deleting contact:", error);
      toast.error("Failed to delete contact");
    } finally {
      setSaving(false);
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

  const getInteractionIcon = (type: InteractionType) => {
    const icons: Record<InteractionType, React.ReactNode> = {
      email: <Mail className="h-4 w-4" />,
      call: <Phone className="h-4 w-4" />,
      video_call: <Video className="h-4 w-4" />,
      meeting: <Users className="h-4 w-4" />,
      message: <MessageSquare className="h-4 w-4" />,
      social_media: <ExternalLink className="h-4 w-4" />,
      event: <Calendar className="h-4 w-4" />,
      introduction: <UserPlus className="h-4 w-4" />,
      note: <FileText className="h-4 w-4" />,
      other: <MoreHorizontal className="h-4 w-4" />,
    };
    return icons[type] || icons.other;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!contact) {
    return null;
  }

  // Fallback to defaults if values are invalid or missing
  const strengthConfig = RELATIONSHIP_STRENGTH_CONFIG[contact.relationship_strength]
    || RELATIONSHIP_STRENGTH_CONFIG['new'];
  const typeConfig = CONTACT_TYPE_CONFIG[contact.contact_type]
    || CONTACT_TYPE_CONFIG['personal'];

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      {/* Back Button */}
      <Button
        variant="ghost"
        className="mb-4 -ml-2"
        onClick={() => router.push("/dashboard/contacts")}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Contacts
      </Button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start gap-6 mb-8">
        <Avatar className="h-20 w-20">
          <AvatarImage src={contact.avatar_url || undefined} />
          <AvatarFallback className={cn("text-2xl", strengthConfig.bgColor, strengthConfig.color)}>
            {getInitials(contact.full_name)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-bold">{contact.full_name}</h1>
            {contact.is_favorite && (
              <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
            )}
            <Badge
              variant="secondary"
              className={cn(strengthConfig.bgColor, strengthConfig.color)}
            >
              {strengthConfig.label}
            </Badge>
            <Badge variant="outline">
              {typeConfig.label}
            </Badge>
          </div>

          {(contact.job_title || contact.company) && (
            <p className="text-lg text-muted-foreground mt-1">
              {contact.job_title}
              {contact.job_title && contact.company && " at "}
              {contact.company && (
                <span className="inline-flex items-center gap-1">
                  <Building2 className="h-4 w-4" />
                  {contact.company}
                </span>
              )}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground">
            {contact.email && (
              <a
                href={`mailto:${contact.email}`}
                className="flex items-center gap-1 hover:text-primary transition-colors"
              >
                <Mail className="h-4 w-4" />
                {contact.email}
              </a>
            )}
            {contact.phone && (
              <a
                href={`tel:${contact.phone}`}
                className="flex items-center gap-1 hover:text-primary transition-colors"
              >
                <Phone className="h-4 w-4" />
                {contact.phone}
              </a>
            )}
            {contact.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {contact.location}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handleToggleFavorite}>
            {contact.is_favorite ? (
              <StarOff className="h-4 w-4" />
            ) : (
              <Star className="h-4 w-4" />
            )}
          </Button>

          <Button
            variant="outline"
            onClick={handleFetchInsights}
            className="border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            AI Insights
          </Button>

          <Button onClick={() => setInteractionDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Log Interaction
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setEditDialogOpen(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Contact
              </DropdownMenuItem>
              {contact.email && (
                <DropdownMenuItem onClick={() => window.open(`mailto:${contact.email}`)}>
                  <Mail className="h-4 w-4 mr-2" />
                  Send Email
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={handleGenerateMessage}>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Message
              </DropdownMenuItem>
              {contact.phone && (
                <DropdownMenuItem onClick={() => window.open(`tel:${contact.phone}`)}>
                  <Phone className="h-4 w-4 mr-2" />
                  Call
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setDeleteDialogOpen(true)}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Contact
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="notes">
            Notes
            {notes.length > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {notes.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="timeline">
            Timeline
            {recentInteractions.length > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {recentInteractions.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="deals">
            Deals
            {linkedDeals.length > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {linkedDeals.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="ideas">
            Ideas
            {linkedIdeas.length > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {linkedIdeas.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="projects">
            Projects
            {linkedProjects.length > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {linkedProjects.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="connections">
            Connections
            {connections.length > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {connections.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* About Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">About</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleFetchInsights}
                  disabled={insightsLoading}
                  className="h-8 text-violet-600 hover:text-violet-700 hover:bg-violet-50"
                >
                  {insightsLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-1" />
                      {contact.ai_summary ? "Refresh" : "AI Summary"}
                    </>
                  )}
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {contact.ai_summary && (
                  <div className="p-3 rounded-lg bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 border border-violet-100 dark:border-violet-800">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="h-4 w-4 text-violet-500" />
                      <Label className="text-violet-700 dark:text-violet-300 font-medium">AI Summary</Label>
                    </div>
                    <p className="text-sm">{contact.ai_summary}</p>
                  </div>
                )}

                {contact.how_we_met && (
                  <div>
                    <Label className="text-muted-foreground">How we met</Label>
                    <p className="mt-1">{contact.how_we_met}</p>
                  </div>
                )}

                {contact.first_met_date && (
                  <div>
                    <Label className="text-muted-foreground">First met</Label>
                    <p className="mt-1">{format(new Date(contact.first_met_date), "MMMM d, yyyy")}</p>
                  </div>
                )}

                {!contact.how_we_met && !contact.first_met_date && !contact.ai_summary && (
                  <p className="text-muted-foreground text-sm">
                    No additional details yet. Click Edit to add more information, or generate an AI summary.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Stats Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 rounded-lg bg-muted/50">
                    <p className="text-2xl font-bold">{contact.interaction_count || 0}</p>
                    <p className="text-sm text-muted-foreground">Interactions</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-muted/50">
                    <p className="text-2xl font-bold">{contact.project_count || 0}</p>
                    <p className="text-sm text-muted-foreground">Projects</p>
                  </div>
                </div>

                {contact.last_interaction_at && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Last interaction:</span>
                    <span>
                      {formatDistanceToNow(new Date(contact.last_interaction_at), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                )}

                {contact.next_followup_date && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Follow-up scheduled:</span>
                    <span>{format(new Date(contact.next_followup_date), "MMM d, yyyy")}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Related Tasks & Emails */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">Related Items</CardTitle>
                <CardDescription>Tasks, emails, and documents linked to this contact</CardDescription>
              </CardHeader>
              <CardContent>
                <RelatedItems
                  sourceType="contact"
                  sourceId={contactId}
                  excludeTypes={["contact", "project"]}
                  showHeader={false}
                  maxItems={6}
                />
              </CardContent>
            </Card>

            {/* Tags & Skills */}
            {(contact.tags?.length > 0 ||
              contact.skills?.length > 0 ||
              contact.interests?.length > 0) && (
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg">Tags & Expertise</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {contact.tags?.length > 0 && (
                    <div>
                      <Label className="text-muted-foreground">Tags</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {contact.tags.map((tag) => (
                          <Badge key={tag} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {contact.skills?.length > 0 && (
                    <div>
                      <Label className="text-muted-foreground">Skills</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {contact.skills.map((skill) => (
                          <Badge key={skill} variant="outline">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {contact.interests?.length > 0 && (
                    <div>
                      <Label className="text-muted-foreground">Interests</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {contact.interests.map((interest) => (
                          <Badge key={interest} variant="outline" className="bg-muted">
                            {interest}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Can Help With / Looking For */}
            {(contact.can_help_with?.length > 0 || contact.looking_for?.length > 0) && (
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg">Opportunities</CardTitle>
                  <CardDescription>What they offer and what they need</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {contact.can_help_with?.length > 0 && (
                    <div>
                      <Label className="text-muted-foreground">Can Help With</Label>
                      <ul className="mt-2 space-y-1">
                        {contact.can_help_with.map((item, i) => (
                          <li key={i} className="text-sm flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {contact.looking_for?.length > 0 && (
                    <div>
                      <Label className="text-muted-foreground">Looking For</Label>
                      <ul className="mt-2 space-y-1">
                        {contact.looking_for.map((item, i) => (
                          <li key={i} className="text-sm flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Interaction History</CardTitle>
                <CardDescription>All communications with this contact</CardDescription>
              </div>
              <Button onClick={() => setInteractionDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Log Interaction
              </Button>
            </CardHeader>
            <CardContent>
              {recentInteractions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-8 w-8 mx-auto mb-3 opacity-50" />
                  <p>No interactions logged yet</p>
                  <p className="text-sm mt-1">Log your first interaction to start tracking</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentInteractions.map((interaction) => {
                    const typeConfig = INTERACTION_TYPE_CONFIG[interaction.interaction_type];
                    return (
                      <div
                        key={interaction.id}
                        className="flex gap-4 p-4 rounded-lg border"
                      >
                        <div
                          className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                            typeConfig.color,
                            "bg-muted"
                          )}
                        >
                          {getInteractionIcon(interaction.interaction_type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium">{typeConfig.label}</span>
                            {interaction.subject && (
                              <span className="text-muted-foreground">- {interaction.subject}</span>
                            )}
                            <span className="text-xs text-muted-foreground ml-auto">
                              {format(new Date(interaction.interaction_date), "MMM d, yyyy h:mm a")}
                            </span>
                          </div>
                          <p className="text-sm mt-1">{interaction.summary}</p>
                          {interaction.key_points?.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs text-muted-foreground mb-1">Key Points:</p>
                              <ul className="text-sm space-y-1">
                                {interaction.key_points.map((point, i) => (
                                  <li key={i} className="flex items-center gap-2">
                                    <span className="w-1 h-1 rounded-full bg-primary" />
                                    {point}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {interaction.action_items?.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs text-muted-foreground mb-1">Action Items:</p>
                              <ul className="text-sm space-y-1">
                                {interaction.action_items.map((item, i) => (
                                  <li key={i} className="flex items-center gap-2">
                                    <input type="checkbox" className="rounded" disabled />
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Projects Tab */}
        <TabsContent value="projects">
          <Card>
            <CardHeader>
              <CardTitle>Linked Projects</CardTitle>
              <CardDescription>Projects this contact is involved with</CardDescription>
            </CardHeader>
            <CardContent>
              {linkedProjects.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Briefcase className="h-8 w-8 mx-auto mb-3 opacity-50" />
                  <p>No projects linked yet</p>
                  <p className="text-sm mt-1">Link this contact to relevant projects</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {linkedProjects.map((lp) => (
                    <div
                      key={lp.id}
                      className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => router.push(`/dashboard/projects/${lp.project_id}`)}
                    >
                      <span className="text-2xl">{lp.project?.emoji || "📁"}</span>
                      <div className="flex-1">
                        <p className="font-medium">{lp.project?.name}</p>
                        {lp.role && (
                          <p className="text-sm text-muted-foreground">Role: {lp.role}</p>
                        )}
                      </div>
                      {lp.project?.current_stage && (
                        <Badge variant="outline">{lp.project.current_stage}</Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notes Tab */}
        <TabsContent value="notes">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Notes</CardTitle>
                <CardDescription>Your personal notes about this contact - use AI to enhance them</CardDescription>
              </div>
              <Button onClick={() => setNoteDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Note
              </Button>
            </CardHeader>
            <CardContent>
              {notes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <StickyNote className="h-8 w-8 mx-auto mb-3 opacity-50" />
                  <p>No notes yet</p>
                  <p className="text-sm mt-1">Add notes to remember important details</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {notes.map((note) => (
                    <div
                      key={note.id}
                      className="group p-4 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(note.created_at), "MMM d, yyyy h:mm a")}
                          </span>
                          {note.ai_generated && (
                            <Badge variant="secondary" className="text-xs">
                              <Sparkles className="h-3 w-3 mr-1" />
                              AI Enhanced
                            </Badge>
                          )}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem
                              onClick={() => handleEnhanceExistingNote(note.id, "summarize")}
                              disabled={noteAiProcessing === note.id}
                            >
                              {noteAiProcessing === note.id ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <Sparkles className="h-4 w-4 mr-2 text-violet-500" />
                              )}
                              Summarize with AI
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleEnhanceExistingNote(note.id, "expand")}
                              disabled={noteAiProcessing === note.id}
                            >
                              {noteAiProcessing === note.id ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <Sparkles className="h-4 w-4 mr-2 text-blue-500" />
                              )}
                              Expand with AI
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleEnhanceExistingNote(note.id, "extract_key_points")}
                              disabled={noteAiProcessing === note.id}
                            >
                              {noteAiProcessing === note.id ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <Sparkles className="h-4 w-4 mr-2 text-amber-500" />
                              )}
                              Extract Key Points
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDeleteNote(note.id)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Note
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <p className="whitespace-pre-wrap text-sm">{note.content}</p>
                      {/* Quick AI actions bar */}
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-xs text-muted-foreground mr-1">AI:</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs px-2"
                          onClick={() => handleEnhanceExistingNote(note.id, "summarize")}
                          disabled={noteAiProcessing === note.id}
                        >
                          {noteAiProcessing === note.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            "Summarize"
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs px-2"
                          onClick={() => handleEnhanceExistingNote(note.id, "expand")}
                          disabled={noteAiProcessing === note.id}
                        >
                          {noteAiProcessing === note.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            "Expand"
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs px-2"
                          onClick={() => handleEnhanceExistingNote(note.id, "extract_key_points")}
                          disabled={noteAiProcessing === note.id}
                        >
                          {noteAiProcessing === note.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            "Key Points"
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Deals Tab */}
        <TabsContent value="deals">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Deals & Opportunities</CardTitle>
                <CardDescription>Business opportunities linked to this contact</CardDescription>
              </div>
              <Button variant="outline" onClick={() => router.push("/dashboard/opportunities")}>
                <Plus className="h-4 w-4 mr-2" />
                Link Deal
              </Button>
            </CardHeader>
            <CardContent>
              {linkedDeals.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="h-8 w-8 mx-auto mb-3 opacity-50" />
                  <p>No deals linked yet</p>
                  <p className="text-sm mt-1">Link opportunities to track business relationships</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {linkedDeals.map((deal) => (
                    <div
                      key={deal.id}
                      className="flex items-center gap-4 p-4 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => router.push(`/dashboard/opportunities/${deal.id}`)}
                    >
                      <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                        <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{deal.title || deal.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {deal.stage && <Badge variant="outline" className="mr-2">{deal.stage}</Badge>}
                          {deal.value && `$${deal.value.toLocaleString()}`}
                        </p>
                      </div>
                      {deal.role && (
                        <Badge variant="secondary">{deal.role}</Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Ideas Tab */}
        <TabsContent value="ideas">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Linked Ideas</CardTitle>
                <CardDescription>Ideas and opportunities this contact could help with</CardDescription>
              </div>
              <Button variant="outline" onClick={() => router.push("/dashboard/ideas")}>
                <Plus className="h-4 w-4 mr-2" />
                Link Idea
              </Button>
            </CardHeader>
            <CardContent>
              {linkedIdeas.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Lightbulb className="h-8 w-8 mx-auto mb-3 opacity-50" />
                  <p>No ideas linked yet</p>
                  <p className="text-sm mt-1">Connect ideas where this contact could contribute</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {linkedIdeas.map((idea) => (
                    <div
                      key={idea.id}
                      className="flex items-center gap-4 p-4 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => router.push(`/dashboard/ideas/${idea.id}`)}
                    >
                      <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                        <Lightbulb className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{idea.title}</p>
                        {idea.description && (
                          <p className="text-sm text-muted-foreground truncate">{idea.description}</p>
                        )}
                      </div>
                      {idea.status && (
                        <Badge variant="outline">{idea.status}</Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Network Tab */}
        <TabsContent value="connections" className="space-y-4">
          {/* Network Stats */}
          {networkData && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Card className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Total</span>
                </div>
                <p className="text-2xl font-bold mt-1">{networkData.stats.totalConnections}</p>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm text-muted-foreground">Close</span>
                </div>
                <p className="text-2xl font-bold mt-1">{networkData.stats.closeConnections}</p>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4 text-blue-500" />
                  <span className="text-sm text-muted-foreground">Mutual</span>
                </div>
                <p className="text-2xl font-bold mt-1">{networkData.stats.mutualCount}</p>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-500" />
                  <span className="text-sm text-muted-foreground">Suggested</span>
                </div>
                <p className="text-2xl font-bold mt-1">{networkData.stats.suggestionsCount}</p>
              </Card>
            </div>
          )}

          {/* Direct Connections */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <div>
                <CardTitle>Network Connections</CardTitle>
                <CardDescription>People this contact knows</CardDescription>
              </div>
              <Button
                size="sm"
                onClick={() => {
                  fetchAllContacts();
                  setAddConnectionDialogOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Connection
              </Button>
            </CardHeader>
            <CardContent>
              {networkLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : !networkData || networkData.directConnections.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-8 w-8 mx-auto mb-3 opacity-50" />
                  <p>No connections mapped yet</p>
                  <p className="text-sm mt-1">Add connections to build the relationship web</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {networkData.directConnections.map((conn) => (
                    <div
                      key={conn.id}
                      className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors group"
                    >
                      <Avatar
                        className="h-10 w-10 cursor-pointer"
                        onClick={() => router.push(`/dashboard/contacts/${conn.contact?.id}`)}
                      >
                        <AvatarImage src={conn.contact?.avatar_url || undefined} />
                        <AvatarFallback>
                          {conn.contact?.first_name?.[0]}{conn.contact?.last_name?.[0] || ""}
                        </AvatarFallback>
                      </Avatar>
                      <div
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={() => router.push(`/dashboard/contacts/${conn.contact?.id}`)}
                      >
                        <p className="font-medium truncate">
                          {conn.contact?.first_name} {conn.contact?.last_name}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          {conn.contact?.company && <span>{conn.contact.company}</span>}
                          {conn.relationship_type && (
                            <Badge variant="secondary" className="text-xs">
                              {conn.relationship_type}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          conn.strength === "close" && "border-green-500 text-green-600",
                          conn.strength === "known" && "border-blue-500 text-blue-600",
                          conn.strength === "acquaintance" && "border-gray-400 text-gray-500"
                        )}
                      >
                        {conn.strength}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleRemoveConnection(conn.id)}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Suggested Connections */}
          {networkData && networkData.suggestedConnections.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-500" />
                  Suggested Connections
                </CardTitle>
                <CardDescription>
                  People who might know {contact?.first_name || "this contact"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {networkData.suggestedConnections.map((suggestion) => (
                    <div
                      key={suggestion.contact.id}
                      className="flex items-center gap-3 p-3 rounded-lg border bg-purple-50/50 dark:bg-purple-950/20 hover:bg-purple-100/50 dark:hover:bg-purple-900/30 transition-colors"
                    >
                      <Avatar
                        className="h-10 w-10 cursor-pointer"
                        onClick={() => router.push(`/dashboard/contacts/${suggestion.contact.id}`)}
                      >
                        <AvatarImage src={suggestion.contact.avatar_url || undefined} />
                        <AvatarFallback>
                          {suggestion.contact.first_name?.[0]}{suggestion.contact.last_name?.[0] || ""}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p
                          className="font-medium truncate cursor-pointer hover:underline"
                          onClick={() => router.push(`/dashboard/contacts/${suggestion.contact.id}`)}
                        >
                          {suggestion.contact.first_name} {suggestion.contact.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          {suggestion.reason}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          try {
                            const response = await fetch(`/api/contacts/${contactId}/network`, {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                connected_contact_id: suggestion.contact.id,
                                relationship_type: suggestion.reason_type,
                                strength: "known",
                              }),
                            });
                            if (response.ok) {
                              toast.success("Connection added");
                              fetchNetworkData();
                            } else {
                              const data = await response.json();
                              toast.error(data.error || "Failed to add connection");
                            }
                          } catch (error) {
                            toast.error("Failed to add connection");
                          }
                        }}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Connect
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Mutual Connections */}
          {networkData && networkData.mutualConnections.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-500" />
                  Mutual Connections
                </CardTitle>
                <CardDescription>
                  Contacts with shared connections
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {networkData.mutualConnections.map((mutual, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => router.push(`/dashboard/contacts/${mutual.through.id}`)}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={mutual.through.avatar_url || undefined} />
                        <AvatarFallback>
                          {mutual.through.first_name?.[0]}{mutual.through.last_name?.[0] || ""}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {mutual.through.first_name} {mutual.through.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {mutual.mutual_count} mutual connection{mutual.mutual_count > 1 ? "s" : ""}
                        </p>
                      </div>
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Contact</DialogTitle>
            <DialogDescription>Update contact information</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label>Name</Label>
                <Input
                  value={editForm.full_name || ""}
                  onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={editForm.email || ""}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={editForm.phone || ""}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Company</Label>
                <Input
                  value={editForm.company || ""}
                  onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Job Title</Label>
                <Input
                  value={editForm.job_title || ""}
                  onChange={(e) => setEditForm({ ...editForm, job_title: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Contact Type</Label>
                <Select
                  value={editForm.contact_type}
                  onValueChange={(value) =>
                    setEditForm({ ...editForm, contact_type: value as any })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CONTACT_TYPE_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Relationship</Label>
                <Select
                  value={editForm.relationship_strength}
                  onValueChange={(value) =>
                    setEditForm({ ...editForm, relationship_strength: value as any })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(RELATIONSHIP_STRENGTH_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Location</Label>
                <Input
                  value={editForm.location || ""}
                  onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>First Met Date</Label>
                <Input
                  type="date"
                  value={editForm.first_met_date || ""}
                  onChange={(e) => setEditForm({ ...editForm, first_met_date: e.target.value })}
                />
              </div>

              <div className="col-span-2 space-y-2">
                <Label>How We Met</Label>
                <Textarea
                  value={editForm.how_we_met || ""}
                  onChange={(e) => setEditForm({ ...editForm, how_we_met: e.target.value })}
                  rows={2}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Log Interaction Dialog */}
      <Dialog open={interactionDialogOpen} onOpenChange={setInteractionDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Log Interaction</DialogTitle>
            <DialogDescription>
              Record an interaction with {contact.full_name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Interaction Type</Label>
              <Select
                value={newInteraction.interaction_type}
                onValueChange={(value: InteractionType) =>
                  setNewInteraction({ ...newInteraction, interaction_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(INTERACTION_TYPE_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      <span className="flex items-center gap-2">
                        <span className={config.color}>{config.label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Subject (optional)</Label>
              <Input
                placeholder="e.g., Project discussion, Catch-up call"
                value={newInteraction.subject || ""}
                onChange={(e) =>
                  setNewInteraction({ ...newInteraction, subject: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Summary *</Label>
              <Textarea
                placeholder="What did you discuss? Key takeaways? Paste your raw notes and use AI to enhance..."
                value={newInteraction.summary}
                onChange={(e) =>
                  setNewInteraction({ ...newInteraction, summary: e.target.value })
                }
                rows={4}
              />
              {/* AI Assistance Buttons */}
              <div className="flex flex-wrap gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleInteractionAiSummarize}
                  disabled={interactionAiProcessing || !newInteraction.summary.trim()}
                  className="text-xs"
                >
                  {interactionAiProcessing ? (
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  ) : (
                    <Sparkles className="h-3 w-3 mr-1 text-violet-500" />
                  )}
                  Enhance Summary
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleInteractionAiKeyPoints}
                  disabled={interactionAiProcessing || !newInteraction.summary.trim()}
                  className="text-xs"
                >
                  {interactionAiProcessing ? (
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  ) : (
                    <Sparkles className="h-3 w-3 mr-1 text-blue-500" />
                  )}
                  Extract Key Points
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleInteractionAiActionItems}
                  disabled={interactionAiProcessing || !newInteraction.summary.trim()}
                  className="text-xs"
                >
                  {interactionAiProcessing ? (
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  ) : (
                    <Sparkles className="h-3 w-3 mr-1 text-amber-500" />
                  )}
                  Find Action Items
                </Button>
              </div>
            </div>

            {/* Key Points Display */}
            {newInteraction.key_points && newInteraction.key_points.length > 0 && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Sparkles className="h-3 w-3 text-blue-500" />
                  Key Points
                </Label>
                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 space-y-1">
                  {newInteraction.key_points.map((point: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-2 text-sm">
                      <span className="text-blue-500 mt-0.5">•</span>
                      <span>{point}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Items Display */}
            {newInteraction.action_items && newInteraction.action_items.length > 0 && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Sparkles className="h-3 w-3 text-amber-500" />
                  Action Items
                </Label>
                <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 space-y-1">
                  {newInteraction.action_items.map((item: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-2 text-sm">
                      <span className="text-amber-500 mt-0.5">☐</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Date & Time</Label>
              <Input
                type="datetime-local"
                value={
                  newInteraction.interaction_date
                    ? new Date(newInteraction.interaction_date).toISOString().slice(0, 16)
                    : new Date().toISOString().slice(0, 16)
                }
                onChange={(e) =>
                  setNewInteraction({
                    ...newInteraction,
                    interaction_date: new Date(e.target.value).toISOString(),
                  })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setInteractionDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleLogInteraction} disabled={saving}>
              {saving ? "Logging..." : "Log Interaction"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Contact</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {contact.full_name}? This action cannot be undone.
              All interactions and linked projects will also be removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={saving}>
              {saving ? "Deleting..." : "Delete Contact"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Note Dialog */}
      <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add Note</DialogTitle>
            <DialogDescription>
              Add a note about {contact.full_name}. Use AI to help enhance your notes.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Textarea
              placeholder="Write your note here..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              rows={6}
              className="resize-none"
            />

            {/* AI Actions */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleAiSummarize}
                disabled={aiProcessing || !newNote.trim()}
              >
                {aiProcessing ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <Sparkles className="h-3 w-3 mr-1" />
                )}
                Summarize
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAiExpand}
                disabled={aiProcessing || !newNote.trim()}
              >
                {aiProcessing ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <Sparkles className="h-3 w-3 mr-1" />
                )}
                Expand
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAiExtractActions}
                disabled={aiProcessing || !newNote.trim()}
              >
                {aiProcessing ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <Sparkles className="h-3 w-3 mr-1" />
                )}
                Extract Actions
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setNoteDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveNote} disabled={savingNote || !newNote.trim()}>
              {savingNote ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <StickyNote className="h-4 w-4 mr-2" />
                  Save Note
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Insights Dialog */}
      <Dialog open={insightsDialogOpen} onOpenChange={setInsightsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-violet-500" />
              AI Insights for {contact.full_name}
            </DialogTitle>
            <DialogDescription>
              Relationship analysis and suggestions powered by AI
            </DialogDescription>
          </DialogHeader>

          {insightsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
              <span className="ml-3 text-muted-foreground">Analyzing relationship...</span>
            </div>
          ) : insights ? (
            <div className="space-y-6 py-4">
              {/* Summary */}
              <div>
                <Label className="text-muted-foreground">Summary</Label>
                <p className="mt-1">{insights.summary}</p>
              </div>

              {/* Relationship Health */}
              <div className="flex items-center gap-4">
                <div>
                  <Label className="text-muted-foreground">Relationship Health</Label>
                  <Badge
                    className={cn(
                      "mt-1 capitalize",
                      insights.relationship_health === "strong" && "bg-emerald-100 text-emerald-700",
                      insights.relationship_health === "good" && "bg-green-100 text-green-700",
                      insights.relationship_health === "needs_attention" && "bg-amber-100 text-amber-700",
                      insights.relationship_health === "at_risk" && "bg-red-100 text-red-700",
                      insights.relationship_health === "new" && "bg-slate-100 text-slate-700"
                    )}
                  >
                    {insights.relationship_health?.replace("_", " ")}
                  </Badge>
                </div>
                <div>
                  <Label className="text-muted-foreground">Follow-up Urgency</Label>
                  <Badge
                    variant="outline"
                    className={cn(
                      "mt-1 capitalize",
                      insights.follow_up_urgency === "high" && "border-red-300 text-red-600",
                      insights.follow_up_urgency === "medium" && "border-amber-300 text-amber-600",
                      insights.follow_up_urgency === "low" && "border-green-300 text-green-600"
                    )}
                  >
                    {insights.follow_up_urgency}
                  </Badge>
                </div>
              </div>

              {insights.health_reasoning && (
                <div>
                  <Label className="text-muted-foreground">Analysis</Label>
                  <p className="mt-1 text-sm">{insights.health_reasoning}</p>
                </div>
              )}

              {/* Next Best Action */}
              {insights.next_best_action && (
                <div className="p-4 rounded-lg bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800">
                  <Label className="text-violet-700 dark:text-violet-300">Next Best Action</Label>
                  <p className="mt-1 font-medium">{insights.next_best_action}</p>
                </div>
              )}

              {/* Suggested Actions */}
              {insights.suggested_actions?.length > 0 && (
                <div>
                  <Label className="text-muted-foreground">Suggested Actions</Label>
                  <ul className="mt-2 space-y-2">
                    {insights.suggested_actions.map((action: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="w-5 h-5 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs text-violet-600 dark:text-violet-400">{i + 1}</span>
                        </span>
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Talking Points */}
              {insights.talking_points?.length > 0 && (
                <div>
                  <Label className="text-muted-foreground">Talking Points</Label>
                  <ul className="mt-2 space-y-1">
                    {insights.talking_points.map((point: string, i: number) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <MessageSquare className="h-3 w-3 text-muted-foreground" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Connection Opportunities */}
              {insights.connection_opportunities?.length > 0 && (
                <div>
                  <Label className="text-muted-foreground">Connection Opportunities</Label>
                  <ul className="mt-2 space-y-1">
                    {insights.connection_opportunities.map((opp: string, i: number) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <Lightbulb className="h-3 w-3 text-amber-500" />
                        {opp}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No insights available</p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setInsightsDialogOpen(false)}>
              Close
            </Button>
            {insights && (
              <Button onClick={handleGenerateMessage}>
                <Send className="h-4 w-4 mr-2" />
                Generate Message
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Generated Messages Dialog */}
      <Dialog open={messageDialogOpen} onOpenChange={setMessageDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-blue-500" />
              Generated Messages for {contact.full_name}
            </DialogTitle>
            <DialogDescription>
              AI-generated outreach messages in different tones
            </DialogDescription>
          </DialogHeader>

          {messageLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              <span className="ml-3 text-muted-foreground">Generating messages...</span>
            </div>
          ) : generatedMessages.length > 0 ? (
            <div className="space-y-6 py-4">
              {generatedMessages.map((msg, i) => (
                <div key={i} className="p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant="secondary" className="capitalize">
                      {msg.tone}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(`Subject: ${msg.subject}\n\n${msg.body}`);
                        toast.success("Copied to clipboard");
                      }}
                    >
                      Copy
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">Subject</Label>
                      <p className="font-medium">{msg.subject}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Message</Label>
                      <p className="text-sm whitespace-pre-wrap">{msg.body}</p>
                    </div>
                  </div>
                  {contact.email && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => {
                        const mailtoUrl = `mailto:${contact.email}?subject=${encodeURIComponent(msg.subject)}&body=${encodeURIComponent(msg.body)}`;
                        window.open(mailtoUrl);
                      }}
                    >
                      <Mail className="h-3 w-3 mr-2" />
                      Open in Email
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No messages generated yet</p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setMessageDialogOpen(false)}>
              Close
            </Button>
            <Button onClick={handleGenerateMessage} disabled={messageLoading}>
              {messageLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              Regenerate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Connection Dialog */}
      <Dialog open={addConnectionDialogOpen} onOpenChange={setAddConnectionDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-blue-500" />
              Add Connection
            </DialogTitle>
            <DialogDescription>
              Link {contact.full_name} to another contact in your network
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Connect To</Label>
              <Select
                value={selectedConnectionContact}
                onValueChange={setSelectedConnectionContact}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a contact..." />
                </SelectTrigger>
                <SelectContent>
                  {allContacts.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      <div className="flex items-center gap-2">
                        <span>{c.first_name} {c.last_name}</span>
                        {c.company && (
                          <span className="text-muted-foreground text-xs">
                            ({c.company})
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Relationship Type</Label>
                <Select value={connectionType} onValueChange={setConnectionType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="colleague">Colleague</SelectItem>
                    <SelectItem value="friend">Friend</SelectItem>
                    <SelectItem value="business">Business Contact</SelectItem>
                    <SelectItem value="introduced_by">Introduced By</SelectItem>
                    <SelectItem value="mentor">Mentor/Mentee</SelectItem>
                    <SelectItem value="family">Family</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Connection Strength</Label>
                <Select value={connectionStrength} onValueChange={setConnectionStrength}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="close">Close</SelectItem>
                    <SelectItem value="known">Known</SelectItem>
                    <SelectItem value="acquaintance">Acquaintance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea
                placeholder="How do they know each other?"
                value={connectionNotes}
                onChange={(e) => setConnectionNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAddConnectionDialogOpen(false);
                setSelectedConnectionContact("");
                setConnectionType("colleague");
                setConnectionStrength("known");
                setConnectionNotes("");
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleAddConnection} disabled={addingConnection || !selectedConnectionContact}>
              {addingConnection ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Connection
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
