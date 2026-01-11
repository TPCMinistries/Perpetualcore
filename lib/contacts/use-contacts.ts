"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Contact, RelationshipStrength, ContactFilters } from "@/types/contacts";
import { toast } from "sonner";

// Query keys
export const contactsKeys = {
  all: ["contacts"] as const,
  lists: () => [...contactsKeys.all, "list"] as const,
  list: (filters: ContactsQueryParams) => [...contactsKeys.lists(), filters] as const,
  details: () => [...contactsKeys.all, "detail"] as const,
  detail: (id: string) => [...contactsKeys.details(), id] as const,
};

// Types
export interface ContactsQueryParams {
  search?: string;
  type?: string;
  relationship_strength?: RelationshipStrength | "";
  tags?: string[];
  favorite?: boolean;
  archived?: boolean;
  quick_filter?: "needs_followup" | "recently_contacted" | "";
  sort?: string;
  order?: "asc" | "desc";
  limit?: number;
  offset?: number;
}

export interface ContactsResponse {
  success: boolean;
  contacts: Contact[];
  total: number;
  stats: {
    total: number;
    favorites: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
    avgRelationshipStrength: number;
    needsFollowup: number;
  };
  limit: number;
  offset: number;
}

// Fetch contacts
async function fetchContacts(params: ContactsQueryParams): Promise<ContactsResponse> {
  const searchParams = new URLSearchParams();

  if (params.search) searchParams.set("search", params.search);
  if (params.type) searchParams.set("type", params.type);
  if (params.relationship_strength) searchParams.set("relationship_strength", params.relationship_strength);
  if (params.tags?.length) searchParams.set("tags", params.tags.join(","));
  if (params.favorite !== undefined) searchParams.set("favorite", String(params.favorite));
  if (params.archived !== undefined) searchParams.set("archived", String(params.archived));
  if (params.sort) searchParams.set("sort", params.sort);
  if (params.order) searchParams.set("order", params.order);
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.offset) searchParams.set("offset", String(params.offset));

  const response = await fetch(`/api/contacts?${searchParams.toString()}`);

  if (!response.ok) {
    throw new Error("Failed to fetch contacts");
  }

  return response.json();
}

// Update contact
async function updateContact(id: string, data: Partial<Contact>): Promise<Contact> {
  const response = await fetch(`/api/contacts/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Failed to update contact");
  }

  const result = await response.json();
  return result.contact;
}

// Delete contact(s)
async function deleteContacts(ids: string[]): Promise<void> {
  // Delete one by one (or implement bulk delete endpoint)
  await Promise.all(
    ids.map((id) =>
      fetch(`/api/contacts/${id}`, { method: "DELETE" }).then((res) => {
        if (!res.ok) throw new Error("Failed to delete contact");
      })
    )
  );
}

// Bulk update contacts
async function bulkUpdateContacts(
  ids: string[],
  data: Partial<Contact>
): Promise<void> {
  await Promise.all(ids.map((id) => updateContact(id, data)));
}

// Main hook
export function useContacts(params: ContactsQueryParams = {}) {
  return useQuery({
    queryKey: contactsKeys.list(params),
    queryFn: () => fetchContacts(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: true,
  });
}

// Single contact hook
export function useContact(id: string | null) {
  return useQuery({
    queryKey: contactsKeys.detail(id || ""),
    queryFn: async () => {
      if (!id) return null;
      const response = await fetch(`/api/contacts/${id}`);
      if (!response.ok) throw new Error("Failed to fetch contact");
      const data = await response.json();
      return data.contact as Contact;
    },
    enabled: !!id,
  });
}

// Update contact mutation
export function useUpdateContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Contact> }) =>
      updateContact(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: contactsKeys.lists() });

      // Snapshot previous value
      const previousContacts = queryClient.getQueriesData({
        queryKey: contactsKeys.lists(),
      });

      // Optimistically update
      queryClient.setQueriesData(
        { queryKey: contactsKeys.lists() },
        (old: ContactsResponse | undefined) => {
          if (!old) return old;
          return {
            ...old,
            contacts: old.contacts.map((c) =>
              c.id === id ? { ...c, ...data } : c
            ),
          };
        }
      );

      return { previousContacts };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousContacts) {
        context.previousContacts.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.error("Failed to update contact");
    },
    onSuccess: () => {
      toast.success("Contact updated");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: contactsKeys.lists() });
    },
  });
}

// Delete contacts mutation
export function useDeleteContacts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => deleteContacts(ids),
    onMutate: async (ids) => {
      await queryClient.cancelQueries({ queryKey: contactsKeys.lists() });

      const previousContacts = queryClient.getQueriesData({
        queryKey: contactsKeys.lists(),
      });

      // Optimistically remove
      queryClient.setQueriesData(
        { queryKey: contactsKeys.lists() },
        (old: ContactsResponse | undefined) => {
          if (!old) return old;
          return {
            ...old,
            contacts: old.contacts.filter((c) => !ids.includes(c.id)),
            total: old.total - ids.length,
          };
        }
      );

      return { previousContacts };
    },
    onError: (err, variables, context) => {
      if (context?.previousContacts) {
        context.previousContacts.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.error("Failed to delete contacts");
    },
    onSuccess: (_, ids) => {
      toast.success(`Deleted ${ids.length} contact${ids.length > 1 ? "s" : ""}`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: contactsKeys.lists() });
    },
  });
}

// Bulk tag contacts mutation
export function useBulkTagContacts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      ids,
      tags,
      mode = "add",
      tagsToAdd,
      tagsToRemove,
    }: {
      ids: string[];
      tags?: string[];
      mode?: "add" | "replace";
      tagsToAdd?: string[];
      tagsToRemove?: string[];
    }) => {
      // For each contact, update tags
      const updates = ids.map(async (id) => {
        const contactResponse = await fetch(`/api/contacts/${id}`);
        if (!contactResponse.ok) throw new Error("Failed to fetch contact");
        const { contact } = await contactResponse.json();

        let newTags = [...(contact.tags || [])];

        // Handle mode-based tagging
        if (tags?.length) {
          if (mode === "replace") {
            newTags = tags;
          } else {
            newTags = [...new Set([...newTags, ...tags])];
          }
        }

        // Handle legacy add/remove
        if (tagsToAdd?.length) {
          newTags = [...new Set([...newTags, ...tagsToAdd])];
        }

        if (tagsToRemove?.length) {
          newTags = newTags.filter((t) => !tagsToRemove.includes(t));
        }

        return updateContact(id, { tags: newTags });
      });

      await Promise.all(updates);
    },
    onSuccess: (_, { ids }) => {
      toast.success(
        `Updated tags for ${ids.length} contact${ids.length > 1 ? "s" : ""}`
      );
    },
    onError: () => {
      toast.error("Failed to update tags");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: contactsKeys.lists() });
    },
  });
}

// Toggle favorite mutation
export function useToggleFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isFavorite }: { id: string; isFavorite: boolean }) =>
      updateContact(id, { is_favorite: isFavorite }),
    onMutate: async ({ id, isFavorite }) => {
      await queryClient.cancelQueries({ queryKey: contactsKeys.lists() });

      const previousContacts = queryClient.getQueriesData({
        queryKey: contactsKeys.lists(),
      });

      queryClient.setQueriesData(
        { queryKey: contactsKeys.lists() },
        (old: ContactsResponse | undefined) => {
          if (!old) return old;
          return {
            ...old,
            contacts: old.contacts.map((c) =>
              c.id === id ? { ...c, is_favorite: isFavorite } : c
            ),
          };
        }
      );

      return { previousContacts };
    },
    onError: (err, variables, context) => {
      if (context?.previousContacts) {
        context.previousContacts.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: contactsKeys.lists() });
    },
  });
}

// Export contacts to CSV
export function exportContactsToCSV(contacts: Contact[]): void {
  const headers = [
    "Full Name",
    "Email",
    "Phone",
    "Company",
    "Job Title",
    "Location",
    "Contact Type",
    "Relationship",
    "Tags",
    "How We Met",
    "Notes",
  ];

  const rows = contacts.map((c) => [
    c.full_name || "",
    c.email || "",
    c.phone || "",
    c.company || "",
    c.job_title || "",
    c.location || "",
    c.contact_type || "",
    c.relationship_strength || "",
    (c.tags || []).join("; "),
    c.how_we_met || "",
    "", // Notes would need separate fetch
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `contacts-export-${new Date().toISOString().split("T")[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);

  toast.success(`Exported ${contacts.length} contacts`);
}
