"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Star,
  MoreHorizontal,
  Mail,
  Phone,
  Linkedin,
  Twitter,
  Building2,
  ExternalLink,
  StickyNote,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Contact,
  RelationshipStrength,
  RELATIONSHIP_STRENGTH_CONFIG,
} from "@/types/contacts";
import { useContactsPage } from "../ContactsPageProvider";
import { useToggleFavorite } from "@/lib/contacts/use-contacts";

interface ContactsCardsViewProps {
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

export function ContactsCardsView({
  contacts,
  isLoading = false,
  onRowClick,
}: ContactsCardsViewProps) {
  const router = useRouter();
  const {
    state,
    selectContact,
    toggleSelection,
    hasSelection,
  } = useContactsPage();

  const toggleFavorite = useToggleFavorite();

  const handleCardClick = useCallback(
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border bg-card p-4 animate-pulse"
          >
            <div className="flex items-start gap-3">
              <div className="h-12 w-12 rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-muted rounded" />
                <div className="h-3 w-24 bg-muted rounded" />
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <div className="h-3 w-full bg-muted rounded" />
              <div className="h-3 w-3/4 bg-muted rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (contacts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
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
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {contacts.map((contact) => {
        const strength = contact.relationship_strength as RelationshipStrength;
        const config = RELATIONSHIP_STRENGTH_CONFIG[strength];
        const isSelected = state.selectedIds.has(contact.id);

        return (
          <div
            key={contact.id}
            onClick={(e) => handleCardClick(contact, e)}
            className={cn(
              "group relative rounded-xl border bg-card p-4 cursor-pointer transition-all",
              "hover:shadow-md hover:border-primary/20",
              config?.borderColor && `border-t-4 ${config.borderColor}`,
              isSelected && "ring-2 ring-primary ring-offset-2"
            )}
          >
            {/* Selection checkbox (shows on hover or when has selection) */}
            <div
              className={cn(
                "absolute top-3 left-3 transition-opacity",
                hasSelection ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              )}
            >
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => toggleSelection(contact.id)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            {/* Header */}
            <div className="flex items-start gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={contact.avatar_url || ""} />
                <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white">
                  {getInitials(contact.full_name)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold truncate">{contact.full_name}</h3>
                  {contact.is_favorite && (
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 flex-shrink-0" />
                  )}
                </div>
                {contact.job_title && (
                  <p className="text-sm text-muted-foreground truncate">
                    {contact.job_title}
                  </p>
                )}
                {contact.company && (
                  <p className="text-sm text-muted-foreground truncate flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    {contact.company}
                  </p>
                )}
              </div>

              {/* Actions Menu */}
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
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite.mutate({
                        id: contact.id,
                        isFavorite: !contact.is_favorite,
                      });
                    }}
                  >
                    <Star
                      className={cn(
                        "h-4 w-4 mr-2",
                        contact.is_favorite && "fill-yellow-400 text-yellow-400"
                      )}
                    />
                    {contact.is_favorite ? "Remove favorite" : "Add to favorites"}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/dashboard/contacts/${contact.id}`);
                    }}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Details
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-1 mt-4">
              {contact.email && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.location.href = `mailto:${contact.email}`;
                  }}
                >
                  <Mail className="h-4 w-4" />
                </Button>
              )}
              {contact.phone && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.location.href = `tel:${contact.phone}`;
                  }}
                >
                  <Phone className="h-4 w-4" />
                </Button>
              )}
              {contact.linkedin_url && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(contact.linkedin_url, "_blank");
                  }}
                >
                  <Linkedin className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Footer - Type & Relationship */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t">
              <Badge variant="outline" className="text-xs capitalize">
                {contact.contact_type || "contact"}
              </Badge>
              {config && (
                <Badge
                  variant="outline"
                  className={cn("text-xs", config.color, config.bgColor)}
                >
                  {config.label}
                </Badge>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
