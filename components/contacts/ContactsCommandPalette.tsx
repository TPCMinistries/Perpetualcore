"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  UserPlus,
  Upload,
  Sparkles,
  Star,
  Mail,
  Phone,
  Building2,
  Tag,
  Download,
  Trash2,
  Search,
  Users,
  Filter,
  LayoutGrid,
  LayoutList,
  Table2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useContactsPage } from "./ContactsPageProvider";
import { Contact, RELATIONSHIP_STRENGTH_CONFIG, RelationshipStrength } from "@/types/contacts";
import { useContacts } from "@/lib/contacts/use-contacts";

interface ContactsCommandPaletteProps {
  onAddContact?: () => void;
  onImport?: () => void;
  onDiscover?: () => void;
  onAdvancedSearch?: () => void;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// Simple fuzzy match function
function fuzzyMatch(str: string, pattern: string): boolean {
  const s = str.toLowerCase();
  const p = pattern.toLowerCase();

  let sIdx = 0;
  for (let pIdx = 0; pIdx < p.length; pIdx++) {
    // Find next occurrence of pattern char in string
    while (sIdx < s.length && s[sIdx] !== p[pIdx]) {
      sIdx++;
    }
    if (sIdx >= s.length) return false;
    sIdx++;
  }
  return true;
}

export function ContactsCommandPalette({
  onAddContact,
  onImport,
  onDiscover,
  onAdvancedSearch,
}: ContactsCommandPaletteProps) {
  const router = useRouter();
  const {
    state,
    dispatch,
    hasSelection,
    selectedCount,
    openBulkAction,
    setViewMode,
  } = useContactsPage();

  const [search, setSearch] = useState("");

  // Fetch contacts for search
  const { data } = useContacts({ limit: 500 });
  const contacts = data?.contacts || [];

  // Filter contacts based on search
  const filteredContacts = useMemo(() => {
    if (!search.trim()) return contacts.slice(0, 8); // Show first 8 when no search

    const query = search.toLowerCase().trim();
    return contacts
      .filter((contact) => {
        // Check name, email, company, job title
        const searchableText = [
          contact.full_name,
          contact.email,
          contact.company,
          contact.job_title,
          contact.phone,
          ...(contact.tags || []),
        ].filter(Boolean).join(" ").toLowerCase();

        // Try exact substring match first
        if (searchableText.includes(query)) return true;

        // Fall back to fuzzy match on name
        return fuzzyMatch(contact.full_name, query);
      })
      .slice(0, 10); // Limit to 10 results
  }, [contacts, search]);

  // Quick actions based on context
  const quickActions = useMemo(() => {
    const actions = [];

    // View mode actions
    actions.push(
      { id: "view-table", label: "Switch to Table View", icon: Table2, shortcut: "1", action: () => setViewMode("table") },
      { id: "view-list", label: "Switch to List View", icon: LayoutList, shortcut: "2", action: () => setViewMode("list") },
      { id: "view-cards", label: "Switch to Cards View", icon: LayoutGrid, shortcut: "3", action: () => setViewMode("cards") },
    );

    // Bulk actions when items selected
    if (hasSelection) {
      actions.push(
        { id: "bulk-tag", label: `Tag ${selectedCount} contact${selectedCount > 1 ? "s" : ""}`, icon: Tag, shortcut: "T", action: () => openBulkAction("tag") },
        { id: "bulk-email", label: `Email ${selectedCount} contact${selectedCount > 1 ? "s" : ""}`, icon: Mail, shortcut: "M", action: () => openBulkAction("email") },
        { id: "bulk-export", label: `Export ${selectedCount} contact${selectedCount > 1 ? "s" : ""}`, icon: Download, shortcut: "E", action: () => openBulkAction("export") },
        { id: "bulk-delete", label: `Delete ${selectedCount} contact${selectedCount > 1 ? "s" : ""}`, icon: Trash2, shortcut: "D", action: () => openBulkAction("delete") },
      );
    }

    // Create/import actions
    actions.push(
      { id: "add-contact", label: "Add New Contact", icon: UserPlus, shortcut: "N", action: onAddContact },
      { id: "import", label: "Import Contacts", icon: Upload, shortcut: "I", action: onImport },
      { id: "discover", label: "Discover from Email", icon: Sparkles, action: onDiscover },
      { id: "search", label: "Advanced Search", icon: Filter, shortcut: "/", action: onAdvancedSearch },
    );

    return actions.filter(a => a.action);
  }, [hasSelection, selectedCount, onAddContact, onImport, onDiscover, onAdvancedSearch, openBulkAction, setViewMode]);

  // Handle keyboard shortcut to open
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      // ⌘K or Ctrl+K to toggle
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        dispatch({ type: "TOGGLE_COMMAND_PALETTE" });
        return;
      }

      // / to open (when not in input)
      if (e.key === "/" && !state.isCommandPaletteOpen) {
        const target = e.target as HTMLElement;
        if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") {
          e.preventDefault();
          dispatch({ type: "SET_COMMAND_PALETTE", payload: true });
        }
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [dispatch, state.isCommandPaletteOpen]);

  const handleClose = useCallback(() => {
    dispatch({ type: "SET_COMMAND_PALETTE", payload: false });
    setSearch("");
  }, [dispatch]);

  const navigateToContact = useCallback((contact: Contact) => {
    handleClose();
    router.push(`/dashboard/contacts/${contact.id}`);
  }, [handleClose, router]);

  const runAction = useCallback((action: (() => void) | undefined) => {
    if (action) {
      handleClose();
      action();
    }
  }, [handleClose]);

  return (
    <CommandDialog
      open={state.isCommandPaletteOpen}
      onOpenChange={(open) => dispatch({ type: "SET_COMMAND_PALETTE", payload: open })}
    >
      <CommandInput
        placeholder="Search contacts or type a command..."
        value={search}
        onValueChange={setSearch}
      />
      <CommandList className="max-h-[400px]">
        <CommandEmpty>
          <div className="flex flex-col items-center py-6 text-center">
            <Search className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No contacts found</p>
            <button
              className="text-sm text-violet-600 hover:underline mt-1"
              onClick={() => runAction(onAddContact)}
            >
              Add new contact
            </button>
          </div>
        </CommandEmpty>

        {/* Contacts Results */}
        {filteredContacts.length > 0 && (
          <CommandGroup heading="Contacts">
            {filteredContacts.map((contact) => {
              const strength = contact.relationship_strength as RelationshipStrength;
              const config = RELATIONSHIP_STRENGTH_CONFIG[strength];

              return (
                <CommandItem
                  key={contact.id}
                  value={`contact-${contact.id}-${contact.full_name}`}
                  onSelect={() => navigateToContact(contact)}
                  className="flex items-center gap-3 py-2"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={contact.avatar_url || ""} />
                    <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white text-xs">
                      {getInitials(contact.full_name)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{contact.full_name}</span>
                      {contact.is_favorite && (
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 flex-shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {contact.job_title && (
                        <span className="truncate">{contact.job_title}</span>
                      )}
                      {contact.job_title && contact.company && (
                        <span>at</span>
                      )}
                      {contact.company && (
                        <span className="truncate flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {contact.company}
                        </span>
                      )}
                    </div>
                  </div>

                  {config && (
                    <Badge
                      variant="outline"
                      className={cn("text-[10px] h-5 px-1.5", config.color, config.bgColor)}
                    >
                      {config.label}
                    </Badge>
                  )}
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}

        {/* Quick Actions */}
        {!search && (
          <>
            <CommandSeparator />

            {/* View Actions */}
            <CommandGroup heading="Views">
              {quickActions.filter(a => a.id.startsWith("view-")).map((action) => {
                const Icon = action.icon;
                const isActive =
                  (action.id === "view-table" && state.viewMode === "table") ||
                  (action.id === "view-list" && state.viewMode === "list") ||
                  (action.id === "view-cards" && state.viewMode === "cards");

                return (
                  <CommandItem
                    key={action.id}
                    value={action.label}
                    onSelect={() => runAction(action.action)}
                    className={cn(isActive && "bg-accent")}
                  >
                    <Icon className={cn("mr-2 h-4 w-4", isActive && "text-violet-600")} />
                    <span>{action.label}</span>
                    {action.shortcut && (
                      <CommandShortcut>{action.shortcut}</CommandShortcut>
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>

            {/* Bulk Actions (if selection) */}
            {hasSelection && (
              <>
                <CommandSeparator />
                <CommandGroup heading={`Selected (${selectedCount})`}>
                  {quickActions.filter(a => a.id.startsWith("bulk-")).map((action) => {
                    const Icon = action.icon;
                    return (
                      <CommandItem
                        key={action.id}
                        value={action.label}
                        onSelect={() => runAction(action.action)}
                        className={cn(action.id === "bulk-delete" && "text-red-600")}
                      >
                        <Icon className="mr-2 h-4 w-4" />
                        <span>{action.label}</span>
                        {action.shortcut && (
                          <CommandShortcut>{action.shortcut}</CommandShortcut>
                        )}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </>
            )}

            {/* Create/Import Actions */}
            <CommandSeparator />
            <CommandGroup heading="Actions">
              {quickActions.filter(a => !a.id.startsWith("view-") && !a.id.startsWith("bulk-")).map((action) => {
                const Icon = action.icon;
                return (
                  <CommandItem
                    key={action.id}
                    value={action.label}
                    onSelect={() => runAction(action.action)}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    <span>{action.label}</span>
                    {action.shortcut && (
                      <CommandShortcut>{action.shortcut}</CommandShortcut>
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </>
        )}
      </CommandList>

      {/* Footer */}
      <div className="border-t px-3 py-2 text-xs text-muted-foreground flex items-center justify-between bg-muted/30">
        <div className="flex gap-4">
          <span className="flex items-center gap-1">
            <kbd className="rounded border bg-background px-1 font-mono text-[10px]">↑</kbd>
            <kbd className="rounded border bg-background px-1 font-mono text-[10px]">↓</kbd>
            <span className="ml-1">navigate</span>
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded border bg-background px-1 font-mono text-[10px]">↵</kbd>
            <span className="ml-1">select</span>
          </span>
        </div>
        <span className="flex items-center gap-1">
          <kbd className="rounded border bg-background px-1.5 font-mono text-[10px]">esc</kbd>
          <span className="ml-1">close</span>
        </span>
      </div>
    </CommandDialog>
  );
}
