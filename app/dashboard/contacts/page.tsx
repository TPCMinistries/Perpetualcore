"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Loader2,
  Users,
  Star,
  Building2,
  Heart,
  UserPlus,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DiscoverContactsModal } from "@/components/contacts/DiscoverContactsModal";
import { AdvancedSearchModal, SearchFilters } from "@/components/contacts/AdvancedSearchModal";
import { ImportContactsModal } from "@/components/contacts/ImportContactsModal";
import { ContactsPageProvider, useContactsPage } from "@/components/contacts/ContactsPageProvider";
import { ContactsToolbar } from "@/components/contacts/ContactsToolbar";
import { ContactsViewContainer } from "@/components/contacts/views/ContactsViewContainer";
import { BulkActionsBar } from "@/components/contacts/BulkActionsBar";
import { ContactsCommandPalette } from "@/components/contacts/ContactsCommandPalette";
import { BulkActionsDialog } from "@/components/contacts/BulkActionsDialog";
import { useContacts, useDeleteContacts, exportContactsToCSV } from "@/lib/contacts/use-contacts";
import { useContactsKeyboard } from "@/hooks/useContactsKeyboard";
import { Contact } from "@/types/contacts";
import { toast } from "sonner";

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

export default function ContactsPage() {
  return (
    <TooltipProvider>
      <ContactsPageProvider defaultViewMode="table">
        <ContactsPageContent />
      </ContactsPageProvider>
    </TooltipProvider>
  );
}

function ContactsPageContent() {
  const router = useRouter();
  const {
    state,
    clearSelection,
    selectedCount,
    hasSelection,
  } = useContactsPage();

  // Modals state
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDiscoverModal, setShowDiscoverModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<SearchFilters>({});
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

  // Build query params from state
  const queryParams = useMemo(() => ({
    search: state.search || advancedFilters.search || undefined,
    type: state.typeFilter || advancedFilters.type || undefined,
    relationship_strength: state.strengthFilter || advancedFilters.relationship_strength || undefined,
    tags: advancedFilters.tags,
    favorite: advancedFilters.isFavorite || undefined,
    limit: 200, // Increase limit for table view
  }), [state.search, state.typeFilter, state.strengthFilter, advancedFilters]);

  // Fetch contacts using React Query
  const { data, isLoading, refetch } = useContacts(queryParams);
  const deleteContacts = useDeleteContacts();

  // Apply client-side quick filters
  const filteredContacts = useMemo(() => {
    let contacts = data?.contacts || [];

    // Quick filter
    if (state.quickFilter === "needs_followup" || advancedFilters.needsFollowup) {
      contacts = contacts.filter((c: Contact) =>
        c.next_followup_date && new Date(c.next_followup_date) <= new Date()
      );
    } else if (state.quickFilter === "recently_contacted" || advancedFilters.recentlyContacted) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      contacts = contacts.filter((c: Contact) =>
        c.last_interaction_at && new Date(c.last_interaction_at) >= thirtyDaysAgo
      );
    }

    // Advanced boolean filters
    if (advancedFilters.hasEmail) {
      contacts = contacts.filter((c: Contact) => c.email);
    }
    if (advancedFilters.hasPhone) {
      contacts = contacts.filter((c: Contact) => c.phone);
    }

    return contacts;
  }, [data?.contacts, state.quickFilter, advancedFilters]);

  const stats = data?.stats;

  const handleAdvancedSearch = (filters: SearchFilters) => {
    setAdvancedFilters(filters);
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
      toast.error("Failed to create contact");
    } finally {
      setCreating(false);
    }
  };

  // Bulk action handlers
  const handleBulkDelete = async () => {
    const ids = Array.from(state.selectedIds);
    await deleteContacts.mutateAsync(ids);
    clearSelection();
    setShowDeleteConfirm(false);
  };

  const handleBulkExport = () => {
    const selectedContacts = filteredContacts.filter((c: Contact) =>
      state.selectedIds.has(c.id)
    );
    exportContactsToCSV(selectedContacts);
    clearSelection();
  };

  const handleBulkEmail = () => {
    const selectedContacts = filteredContacts.filter((c: Contact) =>
      state.selectedIds.has(c.id)
    );
    const emails = selectedContacts
      .map((c: Contact) => c.email)
      .filter(Boolean)
      .join(",");
    if (emails) {
      window.location.href = `mailto:${emails}`;
    } else {
      toast.error("No email addresses found for selected contacts");
    }
  };

  // Keyboard navigation
  useContactsKeyboard({
    contacts: filteredContacts,
    onAddContact: () => setShowCreateDialog(true),
    onImport: () => setShowImportModal(true),
    onDelete: () => setShowDeleteConfirm(true),
    onExport: handleBulkExport,
    onEmail: handleBulkEmail,
    enabled: true,
  });

  if (isLoading && !data) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-violet-950/20">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/30 ring-4 ring-violet-500/10">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Contacts
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Manage your network with AI-powered relationship intelligence
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
          <StatCard
            icon={Users}
            gradient="from-violet-500 to-purple-600"
            value={stats?.total || 0}
            label="Total Contacts"
          />
          <StatCard
            icon={Star}
            gradient="from-amber-500 to-orange-500"
            value={stats?.favorites || 0}
            label="Favorites"
          />
          <StatCard
            icon={Heart}
            gradient="from-emerald-500 to-teal-500"
            value={`${stats?.avgRelationshipStrength || 0}%`}
            label="Avg Strength"
          />
          <StatCard
            icon={Building2}
            gradient="from-blue-500 to-cyan-500"
            value={stats?.byType?.investor || 0}
            label="Investors"
          />
          <StatCard
            icon={AlertCircle}
            gradient="from-rose-500 to-pink-500"
            value={stats?.needsFollowup || 0}
            label="Need Follow-up"
          />
        </div>

        {/* Toolbar */}
        <div className="mb-6 rounded-2xl bg-white dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-700/50 shadow-sm p-4">
          <ContactsToolbar
            onImport={() => setShowImportModal(true)}
            onDiscover={() => setShowDiscoverModal(true)}
            onAddContact={() => setShowCreateDialog(true)}
            onAdvancedSearch={() => setShowAdvancedSearch(true)}
          />
        </div>

        {/* Contacts View */}
        <div className="min-h-[400px]">
          {filteredContacts.length === 0 && !isLoading ? (
            <EmptyState
              onImport={() => setShowImportModal(true)}
              onDiscover={() => setShowDiscoverModal(true)}
              onAddContact={() => setShowCreateDialog(true)}
            />
          ) : (
            <ContactsViewContainer
              contacts={filteredContacts}
              isLoading={isLoading}
            />
          )}
        </div>

        {/* Pagination info */}
        {filteredContacts.length > 0 && (
          <div className="mt-4 text-sm text-muted-foreground text-center">
            Showing {filteredContacts.length} of {stats?.total || 0} contacts
          </div>
        )}
      </div>

      {/* Bulk Actions Bar */}
      <BulkActionsBar
        onExport={handleBulkExport}
        onEmail={handleBulkEmail}
        onDelete={() => setShowDeleteConfirm(true)}
      />

      {/* Command Palette */}
      <ContactsCommandPalette
        onAddContact={() => setShowCreateDialog(true)}
        onImport={() => setShowImportModal(true)}
        onDiscover={() => setShowDiscoverModal(true)}
        onAdvancedSearch={() => setShowAdvancedSearch(true)}
      />

      {/* Bulk Actions Dialog */}
      <BulkActionsDialog contacts={filteredContacts} />

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedCount} contact{selectedCount > 1 ? "s" : ""}?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the selected contacts.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteContacts.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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

      {/* Discover Contacts Modal */}
      <DiscoverContactsModal
        open={showDiscoverModal}
        onOpenChange={setShowDiscoverModal}
        onContactsCreated={(count) => {
          if (count > 0) refetch();
        }}
      />

      {/* Import Contacts Modal */}
      <ImportContactsModal
        open={showImportModal}
        onOpenChange={setShowImportModal}
        onImportComplete={() => refetch()}
      />

      {/* Advanced Search Modal */}
      <AdvancedSearchModal
        open={showAdvancedSearch}
        onOpenChange={setShowAdvancedSearch}
        onSearch={handleAdvancedSearch}
        currentFilters={advancedFilters}
      />
    </div>
  );
}

// Stat Card Component
function StatCard({
  icon: Icon,
  gradient,
  value,
  label,
  trend,
}: {
  icon: typeof Users;
  gradient: string;
  value: number | string;
  label: string;
  trend?: { value: number; positive: boolean };
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-700/50 p-4 hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-slate-900/50 transition-all duration-300 hover:-translate-y-0.5">
      {/* Gradient accent */}
      <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${gradient} opacity-10 rounded-full -translate-y-8 translate-x-8 group-hover:opacity-20 transition-opacity`} />

      <div className="relative flex items-center gap-3">
        <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
              {value}
            </p>
            {trend && (
              <span className={`text-xs font-medium ${trend.positive ? "text-emerald-600" : "text-red-500"}`}>
                {trend.positive ? "+" : ""}{trend.value}%
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">{label}</p>
        </div>
      </div>
    </div>
  );
}

// Empty State Component
function EmptyState({
  onImport,
  onDiscover,
  onAddContact,
}: {
  onImport: () => void;
  onDiscover: () => void;
  onAddContact: () => void;
}) {
  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-violet-50/50 dark:from-slate-800 dark:to-violet-950/20">
      <CardContent className="py-16 px-8 text-center">
        <div className="h-20 w-20 mx-auto rounded-full bg-gradient-to-br from-violet-100 to-purple-200 dark:from-violet-900/50 dark:to-purple-800/30 flex items-center justify-center mb-6 shadow-lg shadow-violet-200/50 dark:shadow-violet-900/30">
          <Users className="h-10 w-10 text-violet-600 dark:text-violet-400" />
        </div>
        <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
          Build Your Network
        </h3>
        <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-sm mx-auto">
          Start adding contacts to build meaningful relationships with AI-powered insights and tracking
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="outline"
            onClick={onImport}
            className="border-blue-200 text-blue-700 hover:bg-blue-50"
          >
            <Plus className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button
            variant="outline"
            onClick={onDiscover}
            className="border-amber-200 text-amber-700 hover:bg-amber-50"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Discover from Email
          </Button>
          <Button
            onClick={onAddContact}
            className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-lg shadow-violet-500/25"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add Contact
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
