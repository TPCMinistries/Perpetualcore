"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Mail,
  Building2,
  Calendar,
  UserPlus,
  Sparkles,
  Users,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Search,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface EmailSuggestion {
  email: string;
  name: string;
  email_count: number;
  company: string | null;
  domain: string | null;
  first_email_date: string | null;
  last_email_date: string | null;
}

interface DiscoverContactsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onContactsCreated?: (count: number) => void;
}

export function DiscoverContactsModal({
  open,
  onOpenChange,
  onContactsCreated,
}: DiscoverContactsModalProps) {
  const [suggestions, setSuggestions] = useState<EmailSuggestion[]>([]);
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [stats, setStats] = useState<{
    total_unique_senders: number;
    existing_contacts: number;
  } | null>(null);
  const [result, setResult] = useState<{
    created: number;
    errors: Array<{ email: string; error: string }>;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (open) {
      fetchSuggestions();
      setSelectedEmails(new Set());
      setResult(null);
      setSearchQuery("");
    }
  }, [open]);

  // Filter suggestions by search query
  const filteredSuggestions = suggestions.filter((s) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      s.email.toLowerCase().includes(query) ||
      s.name?.toLowerCase().includes(query) ||
      s.company?.toLowerCase().includes(query)
    );
  });

  async function fetchSuggestions() {
    setLoading(true);
    try {
      const response = await fetch("/api/contacts/sync-from-emails");
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.suggestions || []);
        setStats({
          total_unique_senders: data.total_unique_senders,
          existing_contacts: data.existing_contacts,
        });
      }
    } catch (error) {
      console.error("Error fetching suggestions:", error);
    } finally {
      setLoading(false);
    }
  }

  function toggleSelection(email: string) {
    const newSelected = new Set(selectedEmails);
    if (newSelected.has(email)) {
      newSelected.delete(email);
    } else {
      newSelected.add(email);
    }
    setSelectedEmails(newSelected);
  }

  function selectAll() {
    // Select all from filtered list (or deselect if all filtered are selected)
    const filteredEmails = filteredSuggestions.map((s) => s.email);
    const allFilteredSelected = filteredEmails.every((e) => selectedEmails.has(e));

    if (allFilteredSelected) {
      // Deselect all filtered
      const newSelected = new Set(selectedEmails);
      filteredEmails.forEach((e) => newSelected.delete(e));
      setSelectedEmails(newSelected);
    } else {
      // Add all filtered to selection
      const newSelected = new Set(selectedEmails);
      filteredEmails.forEach((e) => newSelected.add(e));
      setSelectedEmails(newSelected);
    }
  }

  async function createContacts() {
    if (selectedEmails.size === 0) return;

    setCreating(true);
    try {
      const senders = suggestions
        .filter((s) => selectedEmails.has(s.email))
        .map((s) => ({
          email: s.email,
          name: s.name,
          company: s.company,
        }));

      const response = await fetch("/api/contacts/sync-from-emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senders }),
      });

      if (response.ok) {
        const data = await response.json();
        setResult({
          created: data.created_count,
          errors: data.errors || [],
        });

        // Remove created contacts from suggestions
        setSuggestions((prev) =>
          prev.filter((s) => !selectedEmails.has(s.email) || data.errors?.some((e: any) => e.email === s.email))
        );
        setSelectedEmails(new Set());

        if (onContactsCreated) {
          onContactsCreated(data.created_count);
        }
      }
    } catch (error) {
      console.error("Error creating contacts:", error);
    } finally {
      setCreating(false);
    }
  }

  function formatDate(dateStr: string | null) {
    if (!dateStr) return "Unknown";
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
    } catch {
      return "Unknown";
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            Discover Contacts from Emails
          </DialogTitle>
          <DialogDescription>
            We found people who have emailed you frequently but aren&apos;t in your contacts yet.
            Select the ones you&apos;d like to add.
          </DialogDescription>
        </DialogHeader>

        {/* Stats */}
        {stats && (
          <div className="flex gap-4 text-sm text-muted-foreground border-b pb-3">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{stats.existing_contacts} existing contacts</span>
            </div>
            <div className="flex items-center gap-1">
              <Mail className="h-4 w-4" />
              <span>{stats.total_unique_senders} unique senders</span>
            </div>
          </div>
        )}

        {/* Result Banner */}
        {result && (
          <div className={`p-3 rounded-lg ${
            result.errors.length > 0
              ? "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400"
              : "bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400"
          }`}>
            <div className="flex items-center gap-2">
              {result.errors.length > 0 ? (
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
              ) : (
                <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
              )}
              <span>
                {result.created} contact{result.created !== 1 ? "s" : ""} created
                {result.errors.length > 0 && ` (${result.errors.length} failed)`}
              </span>
            </div>
            {result.errors.length > 0 && (
              <div className="mt-2 text-xs space-y-1 pl-6">
                {result.errors.map((err, i) => (
                  <div key={i}>
                    <span className="font-medium">{err.email}</span>: {err.error}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Search Box */}
        {!loading && suggestions.length > 0 && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-h-0">
          {loading ? (
            <div className="space-y-3 py-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-3 p-3">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              ))}
            </div>
          ) : suggestions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <UserPlus className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">
                No new contacts discovered from your emails.
              </p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Email senders who aren&apos;t in your contacts yet will appear here.
              </p>
            </div>
          ) : (
            <>
              {/* Select All */}
              <div className="flex items-center justify-between py-2 border-b">
                <button
                  onClick={selectAll}
                  className="text-sm text-primary hover:underline"
                >
                  {selectedEmails.size === filteredSuggestions.length
                    ? "Deselect All"
                    : `Select All${searchQuery ? ` (${filteredSuggestions.length})` : ""}`}
                </button>
                <span className="text-sm text-muted-foreground">
                  {selectedEmails.size} selected
                </span>
              </div>

              {/* Suggestions List */}
              <ScrollArea className="h-[300px] pr-4">
                {filteredSuggestions.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">
                    <Search className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p>No results for &quot;{searchQuery}&quot;</p>
                  </div>
                ) : (
                <div className="space-y-1 py-2">
                  {filteredSuggestions.map((suggestion) => (
                    <div
                      key={suggestion.email}
                      className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedEmails.has(suggestion.email)
                          ? "bg-primary/5 border border-primary/20"
                          : "hover:bg-muted/50"
                      }`}
                      onClick={() => toggleSelection(suggestion.email)}
                    >
                      <div
                        className="mt-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Checkbox
                          checked={selectedEmails.has(suggestion.email)}
                          onCheckedChange={() => toggleSelection(suggestion.email)}
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">
                            {suggestion.name || suggestion.email.split("@")[0]}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            {suggestion.email_count} emails
                          </Badge>
                        </div>

                        <p className="text-sm text-muted-foreground truncate">
                          {suggestion.email}
                        </p>

                        <div className="flex items-center gap-4 mt-1.5 text-xs text-muted-foreground">
                          {suggestion.company && (
                            <span className="flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              {suggestion.company.charAt(0).toUpperCase() +
                                suggestion.company.slice(1)}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            First: {formatDate(suggestion.first_email_date)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Last: {formatDate(suggestion.last_email_date)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                )}
              </ScrollArea>
            </>
          )}
        </div>

        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button
            onClick={createContacts}
            disabled={selectedEmails.size === 0 || creating}
          >
            {creating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4 mr-2" />
                Add {selectedEmails.size} Contact
                {selectedEmails.size !== 1 ? "s" : ""}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
