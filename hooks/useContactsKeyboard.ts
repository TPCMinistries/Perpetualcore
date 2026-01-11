"use client";

import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useContactsPage } from "@/components/contacts/ContactsPageProvider";
import { Contact } from "@/types/contacts";

interface UseContactsKeyboardOptions {
  contacts: Contact[];
  onAddContact?: () => void;
  onImport?: () => void;
  onDelete?: () => void;
  onExport?: () => void;
  onEmail?: () => void;
  enabled?: boolean;
}

/**
 * Keyboard navigation hook for the contacts page.
 *
 * Shortcuts:
 * - j / ArrowDown: Move focus down
 * - k / ArrowUp: Move focus up
 * - g then g: Go to first item
 * - G (shift+g): Go to last item
 * - x / Space: Toggle selection on focused item
 * - Shift+X: Range select from last selected to focused
 * - Cmd/Ctrl+A: Select all
 * - Escape: Clear selection / close dialogs
 * - Enter: Open focused contact
 * - s: Toggle favorite on focused contact
 * - t: Open tag dialog for selected
 * - d: Delete selected (with confirmation)
 * - e: Export selected
 * - m: Email selected
 * - n: Add new contact
 * - i: Import contacts
 * - 1/2/3: Switch view modes (table/list/cards)
 * - /: Open command palette
 */
export function useContactsKeyboard({
  contacts,
  onAddContact,
  onImport,
  onDelete,
  onExport,
  onEmail,
  enabled = true,
}: UseContactsKeyboardOptions) {
  const router = useRouter();
  const {
    state,
    dispatch,
    navigate,
    toggleSelection,
    selectContact,
    selectAll,
    clearSelection,
    setViewMode,
    openBulkAction,
    hasSelection,
  } = useContactsPage();

  // Track 'g' key for gg command
  let lastKeyWasG = false;
  let gKeyTimeout: NodeJS.Timeout | null = null;

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Don't handle if typing in an input
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable ||
        target.closest('[role="dialog"]')
      ) {
        return;
      }

      // Don't handle if command palette is open
      if (state.isCommandPaletteOpen) {
        return;
      }

      // Don't handle if editing a cell
      if (state.editingCell) {
        if (e.key === "Escape") {
          dispatch({ type: "STOP_EDITING" });
          e.preventDefault();
        }
        return;
      }

      const totalCount = contacts.length;
      const focusedContact = state.focusedIndex >= 0 ? contacts[state.focusedIndex] : null;

      switch (e.key) {
        // Navigation
        case "j":
        case "ArrowDown":
          e.preventDefault();
          if (state.focusedIndex === -1) {
            dispatch({ type: "SET_FOCUSED_INDEX", payload: 0 });
          } else {
            navigate("down", totalCount);
          }
          break;

        case "k":
        case "ArrowUp":
          e.preventDefault();
          if (state.focusedIndex === -1) {
            dispatch({ type: "SET_FOCUSED_INDEX", payload: totalCount - 1 });
          } else {
            navigate("up", totalCount);
          }
          break;

        case "g":
          if (e.shiftKey) {
            // G - go to last
            e.preventDefault();
            navigate("last", totalCount);
          } else {
            // First 'g' - wait for second
            if (lastKeyWasG) {
              // gg - go to first
              e.preventDefault();
              navigate("first", totalCount);
              lastKeyWasG = false;
              if (gKeyTimeout) clearTimeout(gKeyTimeout);
            } else {
              lastKeyWasG = true;
              gKeyTimeout = setTimeout(() => {
                lastKeyWasG = false;
              }, 500);
            }
          }
          break;

        case "G":
          e.preventDefault();
          navigate("last", totalCount);
          break;

        // Selection
        case "x":
        case " ":
          e.preventDefault();
          if (focusedContact) {
            if (e.shiftKey) {
              // Range select
              const allIds = contacts.map((c) => c.id);
              selectContact(focusedContact.id, true, false, allIds);
            } else {
              toggleSelection(focusedContact.id);
            }
          }
          break;

        case "a":
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault();
            selectAll(contacts.map((c) => c.id));
          }
          break;

        case "Escape":
          e.preventDefault();
          if (hasSelection) {
            clearSelection();
          } else {
            dispatch({ type: "SET_FOCUSED_INDEX", payload: -1 });
          }
          break;

        // Open contact
        case "Enter":
          e.preventDefault();
          if (focusedContact) {
            router.push(`/dashboard/contacts/${focusedContact.id}`);
          }
          break;

        // Bulk actions
        case "t":
          if (hasSelection) {
            e.preventDefault();
            openBulkAction("tag");
          }
          break;

        case "d":
          if (hasSelection && onDelete) {
            e.preventDefault();
            onDelete();
          }
          break;

        case "e":
          if (hasSelection && onExport) {
            e.preventDefault();
            onExport();
          }
          break;

        case "m":
          if (hasSelection && onEmail) {
            e.preventDefault();
            onEmail();
          }
          break;

        // Quick actions
        case "n":
          if (!e.metaKey && !e.ctrlKey && onAddContact) {
            e.preventDefault();
            onAddContact();
          }
          break;

        case "i":
          if (!e.metaKey && !e.ctrlKey && onImport) {
            e.preventDefault();
            onImport();
          }
          break;

        // View modes
        case "1":
          e.preventDefault();
          setViewMode("table");
          break;

        case "2":
          e.preventDefault();
          setViewMode("list");
          break;

        case "3":
          e.preventDefault();
          setViewMode("cards");
          break;

        // Command palette is handled by the CommandPalette component
        // but we can also trigger it here
        case "/":
          if (!e.metaKey && !e.ctrlKey) {
            e.preventDefault();
            dispatch({ type: "OPEN_COMMAND_PALETTE" });
          }
          break;
      }
    },
    [
      contacts,
      state.focusedIndex,
      state.isCommandPaletteOpen,
      state.editingCell,
      navigate,
      toggleSelection,
      selectContact,
      selectAll,
      clearSelection,
      setViewMode,
      openBulkAction,
      hasSelection,
      onAddContact,
      onImport,
      onDelete,
      onExport,
      onEmail,
      router,
      dispatch,
    ]
  );

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [enabled, handleKeyDown]);

  // Reset focus when contacts change
  useEffect(() => {
    if (state.focusedIndex >= contacts.length) {
      dispatch({ type: "SET_FOCUSED_INDEX", payload: Math.max(0, contacts.length - 1) });
    }
  }, [contacts.length, state.focusedIndex, dispatch]);
}
