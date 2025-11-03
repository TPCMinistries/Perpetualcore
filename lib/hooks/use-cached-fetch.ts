import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Generic fetch hook with caching
export function useCachedFetch<T>(
  queryKey: string[],
  url: string,
  options?: {
    staleTime?: number;
    enabled?: boolean;
  }
) {
  return useQuery<T>({
    queryKey,
    queryFn: async () => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    },
    staleTime: options?.staleTime,
    enabled: options?.enabled,
  });
}

// Hook for documents with smart caching
export function useDocuments() {
  return useCachedFetch(["documents"], "/api/documents", {
    staleTime: 3 * 60 * 1000, // 3 minutes
  });
}

// Hook for tasks with smart caching
export function useTasks() {
  return useCachedFetch(["tasks"], "/api/tasks", {
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Hook for user profile with longer cache
export function useUserProfile() {
  return useCachedFetch(["user-profile"], "/api/user/profile", {
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Hook for notifications with shorter cache
export function useNotifications() {
  return useCachedFetch(["notifications"], "/api/notifications", {
    staleTime: 30 * 1000, // 30 seconds
  });
}

// Hook for activity feed with real-time updates
export function useActivity() {
  return useCachedFetch(["activity"], "/api/activity", {
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

// Generic mutation hook with cache invalidation
export function useOptimisticMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: {
    invalidateQueries?: string[][];
    onSuccess?: (data: TData) => void;
    onError?: (error: Error) => void;
  }
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: (data) => {
      // Invalidate and refetch queries
      if (options?.invalidateQueries) {
        options.invalidateQueries.forEach((queryKey) => {
          queryClient.invalidateQueries({ queryKey });
        });
      }
      options?.onSuccess?.(data);
    },
    onError: options?.onError,
  });
}

// Prefetch utility for optimistic loading
export function usePrefetch() {
  const queryClient = useQueryClient();

  return {
    prefetchDocuments: () => {
      queryClient.prefetchQuery({
        queryKey: ["documents"],
        queryFn: async () => {
          const response = await fetch("/api/documents");
          return response.json();
        },
      });
    },
    prefetchTasks: () => {
      queryClient.prefetchQuery({
        queryKey: ["tasks"],
        queryFn: async () => {
          const response = await fetch("/api/tasks");
          return response.json();
        },
      });
    },
  };
}
