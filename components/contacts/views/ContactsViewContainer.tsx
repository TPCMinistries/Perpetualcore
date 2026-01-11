"use client";

import { Contact } from "@/types/contacts";
import { useContactsPage } from "../ContactsPageProvider";
import { ContactsTableView } from "./ContactsTableView";
import { ContactsListView } from "./ContactsListView";
import { ContactsCardsView } from "./ContactsCardsView";

interface ContactsViewContainerProps {
  contacts: Contact[];
  isLoading?: boolean;
  onRowClick?: (contact: Contact) => void;
}

export function ContactsViewContainer({
  contacts,
  isLoading = false,
  onRowClick,
}: ContactsViewContainerProps) {
  const { state } = useContactsPage();

  switch (state.viewMode) {
    case "table":
      return (
        <ContactsTableView
          contacts={contacts}
          isLoading={isLoading}
          onRowClick={onRowClick}
        />
      );
    case "list":
      return (
        <ContactsListView
          contacts={contacts}
          isLoading={isLoading}
          onRowClick={onRowClick}
        />
      );
    case "cards":
      return (
        <ContactsCardsView
          contacts={contacts}
          isLoading={isLoading}
          onRowClick={onRowClick}
        />
      );
    default:
      return (
        <ContactsTableView
          contacts={contacts}
          isLoading={isLoading}
          onRowClick={onRowClick}
        />
      );
  }
}
