/**
 * Agent Identity Loader
 * Loads agent identity with in-memory caching (5-minute TTL)
 */

import { AgentIdentity } from "./types";
import { getAgentIdentity } from "./index";

interface CacheEntry {
  identity: AgentIdentity | null;
  expiresAt: number;
}

// Simple in-memory cache with TTL
const identityCache = new Map<string, CacheEntry>();

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Load an agent identity for a user, with caching
 * Returns null if no identity is configured
 */
export async function loadAgentIdentity(userId: string): Promise<AgentIdentity | null> {
  // Check cache first
  const cached = identityCache.get(userId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.identity;
  }

  // Load from database
  try {
    const identity = await getAgentIdentity(userId);

    // Cache the result (even null, to avoid repeated DB calls)
    identityCache.set(userId, {
      identity,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });

    return identity;
  } catch (error) {
    console.error("[IdentityLoader] Error loading agent identity:", error);
    return null;
  }
}

/**
 * Invalidate the cache for a specific user
 * Call this when an identity is created, updated, or deleted
 */
export function invalidateIdentityCache(userId: string): void {
  identityCache.delete(userId);
}

/**
 * Clear the entire identity cache
 */
export function clearIdentityCache(): void {
  identityCache.clear();
}
