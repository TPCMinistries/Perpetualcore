"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Star,
  Mail,
  Phone,
  Building2,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Contact,
  RelationshipStrength,
  RELATIONSHIP_STRENGTH_CONFIG,
} from "@/types/contacts";
import { useContactsPage } from "../ContactsPageProvider";
import { formatDistanceToNow } from "date-fns";

interface ContactsListViewProps {
  contacts: Contact[];
  isLoading?: boolean;
  onRowClick?: (contact: Contact) => void;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function ContactsListView({
  contacts,
  isLoading = false,
  onRowClick,
}: ContactsListViewProps) {
  const router = useRouter();
  const {
    state,
    selectContact,
    toggleSelection,
    hasSelection,
  } = useContactsPage();

  const handleRowClick = useCallback(
    (contact: Contact, event: React.MouseEvent) => {
      if ((event.target as HTMLElement).closest('button, [role="checkbox"]')) {
        return;
      }

      const allIds = contacts.map((c) => c.id);

      if (event.shiftKey || event.metaKey || event.ctrlKey) {
        selectContact(contact.id, event.shiftKey, event.metaKey || event.ctrlKey, allIds);
      } else if (onRowClick) {
        onRowClick(contact);
      } else {
        router.push(`/dashboard/contacts/${contact.id}`);
      }
    },
    [contacts, selectContact, onRowClick, router]
  );

  if (isLoading) {
    return (
      <div className="border rounded-lg divide-y">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 animate-pulse">
            <div className="h-10 w-10 rounded-full bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-48 bg-muted rounded" />
              <div className="h-3 w-32 bg-muted rounded" />
            </div>
            <div className="h-6 w-20 bg-muted rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (contacts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg">
        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
          <Building2 className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium">No contacts found</h3>
        <p className="text-muted-foreground mt-1">
          Try adjusting your filters or add new contacts.
        </p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg divide-y">
      {contacts.map((contact, index) => {
        const strength = contact.relationship_strength as RelationshipStrength;
        const config = RELATIONSHIP_STRENGTH_CONFIG[strength];
        const isSelected = state.selectedIds.has(contact.id);
        const isFocused = state.focusedIndex === index;

        return (
          <div
            key={contact.id}
            onClick={(e) => handleRowClick(contact, e)}
            className={cn(
              "group flex items-center gap-4 p-4 cursor-pointer transition-colors",
              "hover:bg-muted/30",
              isSelected && "bg-primary/5",
              isFocused && "ring-2 ring-inset ring-violet-500"
            )}
          >
            {/* Checkbox */}
            <div
              className={cn(
                "transition-opacity",
                hasSelection ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              )}
            >
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => toggleSelection(contact.id)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            {/* Avatar */}
            <Avatar className="h-10 w-10 flex-shrink-0">
              <AvatarImage src={contact.avatar_url || ""} />
              <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white text-sm">
                {getInitials(contact.full_name)}
              </AvatarFallback>
            </Avatar>

            {/* Main Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-medium truncate">{contact.full_name}</h3>
                {contact.is_favorite && (
                  <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400 flex-shrink-0" />
                )}
                {config && (
                  <Badge
                    variant="outline"
                    className={cn("text-xs hidden sm:inline-flex", config.color, config.bgColor)}
                  >
                    {config.label}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5">
                {contact.job_title && (
                  <span className="truncate">{contact.job_title}</span>
                )}
                {contact.job_title && contact.company && (
                  <span className="text-muted-foreground/50">•</span>
                )}
                {contact.company && (
                  <span className="truncate flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    {contact.company}
                  </span>
                )}
              </div>
            </div>

            {/* Contact Info */}
            <div className="hidden md:flex items-center gap-3 text-sm text-muted-foreground">
              {contact.email && (
                <span className="flex items-center gap-1 truncate max-w-[180px]">
                  <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                  {contact.email}
                </span>
              )}
              {contact.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5" />
                  {contact.phone}
                </span>
              )}
            </div>

            {/* Last Contact */}
            <div className="hidden lg:block text-sm text-muted-foreground w-28 text-right">
              {contact.last_interaction_at
                ? formatDistanceToNow(new Date(contact.last_interaction_at), {
                    addSuffix: true,
                  })
                : "Never contacted"}
            </div>

            {/* Arrow */}
            <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        );
      })}
    </div>
  );
}
