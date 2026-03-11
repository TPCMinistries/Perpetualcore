/**
 * GoHighLevel API Client
 *
 * Wraps the GHL REST API v1 for sub-account (location) management.
 * Used for the OPERATE layer of Perpetual Core.
 *
 * Required env vars:
 *   GHL_AGENCY_API_KEY - Agency-level API key from GHL settings
 *   GHL_DEFAULT_SNAPSHOT_ID - Snapshot to apply to new sub-accounts
 *   GHL_WHITE_LABEL_DOMAIN - Your white-label GHL domain (e.g., operate.perpetualcore.com)
 */

const GHL_API_BASE = "https://rest.gohighlevel.com/v1";

function getAgencyKey(): string {
  const key = process.env.GHL_AGENCY_API_KEY;
  if (!key) {
    throw new Error("GHL_AGENCY_API_KEY environment variable is not set");
  }
  return key;
}

async function ghlFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = `${GHL_API_BASE}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${getAgencyKey()}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `GHL API error ${response.status}: ${body}`
    );
  }

  return response;
}

export interface GHLSubAccount {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  website?: string;
  timezone?: string;
}

export interface CreateSubAccountParams {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  website?: string;
  timezone?: string;
}

/**
 * Create a new GHL sub-account (location) for a user.
 * Optionally applies the default snapshot.
 */
export async function createSubAccount(
  params: CreateSubAccountParams
): Promise<GHLSubAccount> {
  const body: Record<string, unknown> = {
    name: params.name,
    email: params.email,
  };

  if (params.phone) body.phone = params.phone;
  if (params.address) body.address = params.address;
  if (params.city) body.city = params.city;
  if (params.state) body.state = params.state;
  if (params.country) body.country = params.country;
  if (params.postalCode) body.postalCode = params.postalCode;
  if (params.website) body.website = params.website;
  if (params.timezone) body.timezone = params.timezone;

  // Apply default snapshot if configured
  const snapshotId = process.env.GHL_DEFAULT_SNAPSHOT_ID;
  if (snapshotId) {
    body.snapshotId = snapshotId;
  }

  const response = await ghlFetch("/locations/", {
    method: "POST",
    body: JSON.stringify(body),
  });

  return response.json();
}

/**
 * Get an existing GHL sub-account by location ID.
 */
export async function getSubAccount(
  locationId: string
): Promise<GHLSubAccount> {
  const response = await ghlFetch(`/locations/${locationId}`);
  return response.json();
}

/**
 * Delete a GHL sub-account.
 * Use with caution — this removes all data in the sub-account.
 */
export async function deleteSubAccount(
  locationId: string
): Promise<void> {
  await ghlFetch(`/locations/${locationId}`, {
    method: "DELETE",
  });
}

/**
 * Get the white-label URL for a GHL sub-account.
 */
export function getSubAccountUrl(locationId: string): string {
  const domain =
    process.env.GHL_WHITE_LABEL_DOMAIN || "app.gohighlevel.com";
  return `https://${domain}/location/${locationId}`;
}

/**
 * Plans that include OPERATE (GHL) access.
 * Pro and above get GHL sub-accounts.
 */
export const OPERATE_ELIGIBLE_PLANS = [
  "pro",
  "team",
  "business",
  "enterprise",
  "custom",
] as const;

/**
 * Check if a plan tier includes OPERATE access.
 */
export function planIncludesOperate(plan: string): boolean {
  return (OPERATE_ELIGIBLE_PLANS as readonly string[]).includes(plan);
}
