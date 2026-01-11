"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users, Building2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MentionedContact {
  id: string;
  full_name: string;
  email?: string;
  company?: string;
  job_title?: string;
  avatar_url?: string;
  relationship_strength?: string;
}

interface ContactMentionProps {
  inputValue: string;
  onInputChange: (value: string) => void;
  onMentionSelect: (contact: MentionedContact) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  mentionedContacts: MentionedContact[];
  setMentionedContacts: React.Dispatch<React.SetStateAction<MentionedContact[]>>;
}

export function useContactMention() {
  const [mentionedContacts, setMentionedContacts] = useState<MentionedContact[]>([]);
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionSearch, setMentionSearch] = useState("");
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
  const [contacts, setContacts] = useState<MentionedContact[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Fetch contacts for mention dropdown
  const fetchContacts = useCallback(async (search: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/contacts?search=${encodeURIComponent(search)}&limit=10`);
      if (response.ok) {
        const data = await response.json();
        setContacts(data.contacts || []);
      }
    } catch (error) {
      console.error("Failed to fetch contacts:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    if (showMentionDropdown && mentionSearch) {
      const timer = setTimeout(() => fetchContacts(mentionSearch), 200);
      return () => clearTimeout(timer);
    } else if (showMentionDropdown && !mentionSearch) {
      fetchContacts("");
    }
  }, [mentionSearch, showMentionDropdown, fetchContacts]);

  // Reset selected index when contacts change
  useEffect(() => {
    setSelectedIndex(0);
  }, [contacts]);

  const handleInputChange = useCallback((
    value: string,
    cursorPosition: number,
    textareaRef: React.RefObject<HTMLTextAreaElement>
  ) => {
    // Check if we're typing a mention
    const textBeforeCursor = value.substring(0, cursorPosition);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);

    if (mentionMatch) {
      setMentionSearch(mentionMatch[1]);
      setShowMentionDropdown(true);

      // Calculate position for dropdown
      if (textareaRef.current) {
        const textarea = textareaRef.current;
        // Simple positioning - show above the textarea
        const rect = textarea.getBoundingClientRect();
        setMentionPosition({
          top: -200, // Show above
          left: 0,
        });
      }
    } else {
      setShowMentionDropdown(false);
      setMentionSearch("");
    }
  }, []);

  const handleMentionSelect = useCallback((
    contact: MentionedContact,
    inputValue: string,
    cursorPosition: number,
    onInputChange: (value: string) => void
  ) => {
    // Replace the @search with @ContactName
    const textBeforeCursor = inputValue.substring(0, cursorPosition);
    const textAfterCursor = inputValue.substring(cursorPosition);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);

    if (mentionMatch) {
      const beforeMention = textBeforeCursor.substring(0, mentionMatch.index);
      const newValue = `${beforeMention}@${contact.full_name.replace(/\s+/g, "_")} ${textAfterCursor}`;
      onInputChange(newValue);
    }

    // Add to mentioned contacts if not already there
    setMentionedContacts((prev) => {
      if (prev.find((c) => c.id === contact.id)) return prev;
      return [...prev, contact];
    });

    setShowMentionDropdown(false);
    setMentionSearch("");
  }, []);

  const handleKeyDown = useCallback((
    e: React.KeyboardEvent,
    inputValue: string,
    cursorPosition: number,
    onInputChange: (value: string) => void
  ) => {
    if (!showMentionDropdown) return false;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, contacts.length - 1));
      return true;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
      return true;
    }

    if (e.key === "Enter" || e.key === "Tab") {
      if (contacts[selectedIndex]) {
        e.preventDefault();
        handleMentionSelect(contacts[selectedIndex], inputValue, cursorPosition, onInputChange);
        return true;
      }
    }

    if (e.key === "Escape") {
      e.preventDefault();
      setShowMentionDropdown(false);
      return true;
    }

    return false;
  }, [showMentionDropdown, contacts, selectedIndex, handleMentionSelect]);

  const clearMentionedContacts = useCallback(() => {
    setMentionedContacts([]);
  }, []);

  return {
    mentionedContacts,
    setMentionedContacts,
    showMentionDropdown,
    setShowMentionDropdown,
    mentionSearch,
    mentionPosition,
    contacts,
    loading,
    selectedIndex,
    handleInputChange,
    handleMentionSelect,
    handleKeyDown,
    clearMentionedContacts,
  };
}

interface MentionDropdownProps {
  contacts: MentionedContact[];
  loading: boolean;
  selectedIndex: number;
  onSelect: (contact: MentionedContact) => void;
  position: { top: number; left: number };
}

export function MentionDropdown({
  contacts,
  loading,
  selectedIndex,
  onSelect,
  position,
}: MentionDropdownProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const getStrengthColor = (strength?: string) => {
    switch (strength) {
      case "inner_circle":
        return "bg-emerald-100 text-emerald-700";
      case "close":
        return "bg-amber-100 text-amber-700";
      case "connected":
        return "bg-purple-100 text-purple-700";
      case "acquaintance":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  return (
    <div
      className="absolute z-50 w-80 max-h-64 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg"
      style={{ bottom: "100%", left: position.left, marginBottom: "8px" }}
    >
      <div className="p-2 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Users className="h-3 w-3" />
          <span>Mention a contact</span>
        </div>
      </div>

      {loading ? (
        <div className="p-4 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : contacts.length === 0 ? (
        <div className="p-4 text-center text-sm text-muted-foreground">
          No contacts found
        </div>
      ) : (
        <div className="py-1">
          {contacts.map((contact, index) => (
            <button
              key={contact.id}
              type="button"
              onClick={() => onSelect(contact)}
              className={cn(
                "w-full px-3 py-2 flex items-center gap-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors",
                selectedIndex === index && "bg-slate-100 dark:bg-slate-800"
              )}
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={contact.avatar_url} />
                <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white text-xs">
                  {getInitials(contact.full_name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm truncate">
                    {contact.full_name}
                  </span>
                  {contact.relationship_strength && (
                    <Badge
                      variant="secondary"
                      className={cn("text-[10px] px-1.5 py-0", getStrengthColor(contact.relationship_strength))}
                    >
                      {contact.relationship_strength.replace("_", " ")}
                    </Badge>
                  )}
                </div>
                {(contact.job_title || contact.company) && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground truncate">
                    {contact.job_title && <span>{contact.job_title}</span>}
                    {contact.job_title && contact.company && <span>at</span>}
                    {contact.company && (
                      <span className="flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        {contact.company}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      <div className="p-2 border-t border-slate-100 dark:border-slate-800 text-xs text-muted-foreground">
        <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">↑↓</kbd> to navigate,{" "}
        <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">Enter</kbd> to select
      </div>
    </div>
  );
}

// Helper to extract mentioned contact IDs from text
export function extractMentionedContactIds(text: string, mentionedContacts: MentionedContact[]): string[] {
  const mentionPattern = /@([A-Za-z_]+)/g;
  const mentions = text.match(mentionPattern) || [];

  const contactIds: string[] = [];
  for (const mention of mentions) {
    const name = mention.substring(1).replace(/_/g, " ");
    const contact = mentionedContacts.find(
      (c) => c.full_name.toLowerCase() === name.toLowerCase()
    );
    if (contact) {
      contactIds.push(contact.id);
    }
  }

  return [...new Set(contactIds)];
}

// Component to show mentioned contacts as pills
export function MentionedContactsPills({
  contacts,
  onRemove,
}: {
  contacts: MentionedContact[];
  onRemove: (id: string) => void;
}) {
  if (contacts.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5 mb-2">
      {contacts.map((contact) => (
        <Badge
          key={contact.id}
          variant="secondary"
          className="pl-1 pr-2 py-1 gap-1.5 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 hover:bg-violet-200 dark:hover:bg-violet-900/50"
        >
          <Avatar className="h-4 w-4">
            <AvatarImage src={contact.avatar_url} />
            <AvatarFallback className="bg-violet-500 text-white text-[8px]">
              {contact.full_name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs">{contact.full_name}</span>
          <button
            type="button"
            onClick={() => onRemove(contact.id)}
            className="ml-1 h-3 w-3 rounded-full hover:bg-violet-300 dark:hover:bg-violet-800 flex items-center justify-center"
          >
            ×
          </button>
        </Badge>
      ))}
    </div>
  );
}
