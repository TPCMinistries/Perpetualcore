import type { UTMParams } from "./types";

const UTM_COOKIE_NAME = "pc_utm";
const ANON_COOKIE_NAME = "pc_anon_id";
const SESSION_COOKIE_NAME = "pc_session_id";
const UTM_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

/**
 * Extract UTM params from URL search params.
 */
export function extractUTMFromURL(url: URL): UTMParams | null {
  const utm_source = url.searchParams.get("utm_source");
  const utm_medium = url.searchParams.get("utm_medium");
  const utm_campaign = url.searchParams.get("utm_campaign");
  const utm_term = url.searchParams.get("utm_term");
  const utm_content = url.searchParams.get("utm_content");

  // Only store if at least one UTM param is present
  if (!utm_source && !utm_medium && !utm_campaign) {
    return null;
  }

  return {
    utm_source: utm_source || undefined,
    utm_medium: utm_medium || undefined,
    utm_campaign: utm_campaign || undefined,
    utm_term: utm_term || undefined,
    utm_content: utm_content || undefined,
  };
}

/**
 * Serialize UTM params to cookie value.
 */
export function serializeUTM(utm: UTMParams): string {
  return JSON.stringify(utm);
}

/**
 * Deserialize UTM params from cookie value.
 */
export function deserializeUTM(value: string): UTMParams | null {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

/**
 * Generate a random anonymous ID.
 */
export function generateAnonymousId(): string {
  return `anon_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
}

/**
 * Generate a session ID.
 */
export function generateSessionId(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
}

export {
  UTM_COOKIE_NAME,
  ANON_COOKIE_NAME,
  SESSION_COOKIE_NAME,
  UTM_MAX_AGE,
};
