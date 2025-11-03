/**
 * OAuth 2.0 / OpenID Connect Authentication Library
 * Handles OAuth and OIDC authentication flows for SSO
 */

import { SSOProvider } from "@/types";
import crypto from "crypto";

export interface OAuthTokenResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
  refresh_token?: string;
  id_token?: string;
  scope?: string;
}

export interface OAuthUserInfo {
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  locale?: string;
  [key: string]: any;
}

/**
 * Generate OAuth authorization URL with PKCE
 */
export function generateAuthorizationUrl(
  provider: SSOProvider,
  callbackUrl: string,
  state?: string
): { url: string; codeVerifier: string; state: string } {
  if (!provider.oauth_authorization_url || !provider.oauth_client_id) {
    throw new Error("OAuth authorization URL and client ID are required");
  }

  // Generate PKCE code verifier and challenge
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);

  // Generate state for CSRF protection
  const authState = state || generateRandomString(32);

  // Build authorization URL
  const params = new URLSearchParams({
    response_type: "code",
    client_id: provider.oauth_client_id,
    redirect_uri: callbackUrl,
    scope: provider.oauth_scopes?.join(" ") || "openid profile email",
    state: authState,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  const url = `${provider.oauth_authorization_url}?${params.toString()}`;

  return { url, codeVerifier, state: authState };
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(
  provider: SSOProvider,
  callbackUrl: string,
  code: string,
  codeVerifier: string
): Promise<OAuthTokenResponse> {
  if (!provider.oauth_token_url || !provider.oauth_client_id) {
    throw new Error("OAuth token URL and client ID are required");
  }

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: callbackUrl,
    client_id: provider.oauth_client_id,
    code_verifier: codeVerifier,
  });

  // Add client secret if available (for confidential clients)
  if (provider.oauth_client_secret) {
    body.append("client_secret", provider.oauth_client_secret);
  }

  const response = await fetch(provider.oauth_token_url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to exchange code for token: ${error}`);
  }

  return response.json();
}

/**
 * Fetch user information from OAuth provider
 */
export async function fetchUserInfo(
  provider: SSOProvider,
  accessToken: string
): Promise<OAuthUserInfo> {
  if (!provider.oauth_user_info_url) {
    throw new Error("OAuth user info URL is required");
  }

  const response = await fetch(provider.oauth_user_info_url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to fetch user info: ${error}`);
  }

  return response.json();
}

/**
 * Decode JWT ID token (OpenID Connect)
 */
export function decodeIdToken(idToken: string): OAuthUserInfo {
  try {
    const parts = idToken.split(".");
    if (parts.length !== 3) {
      throw new Error("Invalid ID token format");
    }

    const payload = parts[1];
    const decoded = Buffer.from(payload, "base64").toString("utf8");
    return JSON.parse(decoded);
  } catch (error) {
    throw new Error(`Failed to decode ID token: ${error}`);
  }
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(
  provider: SSOProvider,
  refreshToken: string
): Promise<OAuthTokenResponse> {
  if (!provider.oauth_token_url || !provider.oauth_client_id) {
    throw new Error("OAuth token URL and client ID are required");
  }

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: provider.oauth_client_id,
  });

  if (provider.oauth_client_secret) {
    body.append("client_secret", provider.oauth_client_secret);
  }

  const response = await fetch(provider.oauth_token_url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to refresh token: ${error}`);
  }

  return response.json();
}

/**
 * Map OAuth user info to our user profile fields
 */
export function mapOAuthAttributes(
  userInfo: OAuthUserInfo,
  attributeMapping: Record<string, string>
): Record<string, any> {
  const mappedProfile: Record<string, any> = {};

  // Map each attribute according to the mapping configuration
  for (const [ourField, oauthField] of Object.entries(attributeMapping)) {
    if (userInfo[oauthField] !== undefined) {
      mappedProfile[ourField] = userInfo[oauthField];
    }
  }

  // Ensure we have required fields
  mappedProfile.externalUserId = userInfo.sub;
  mappedProfile.email = mappedProfile.email || userInfo.email;

  return mappedProfile;
}

// PKCE Helper Functions

/**
 * Generate a cryptographically random code verifier
 */
function generateCodeVerifier(): string {
  return generateRandomString(128);
}

/**
 * Generate code challenge from verifier using SHA-256
 */
function generateCodeChallenge(verifier: string): string {
  const hash = crypto.createHash("sha256").update(verifier).digest();
  return base64URLEncode(hash);
}

/**
 * Generate cryptographically random string
 */
function generateRandomString(length: number): string {
  const buffer = crypto.randomBytes(length);
  return base64URLEncode(buffer).substring(0, length);
}

/**
 * Base64 URL encode (RFC 4648)
 */
function base64URLEncode(buffer: Buffer): string {
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

// Well-known OAuth providers configurations

export const OAUTH_PROVIDERS = {
  google: {
    name: "Google Workspace",
    authorization_url: "https://accounts.google.com/o/oauth2/v2/auth",
    token_url: "https://oauth2.googleapis.com/token",
    user_info_url: "https://www.googleapis.com/oauth2/v2/userinfo",
    scopes: ["openid", "profile", "email"],
  },
  microsoft: {
    name: "Microsoft Azure AD",
    authorization_url: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
    token_url: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
    user_info_url: "https://graph.microsoft.com/oidc/userinfo",
    scopes: ["openid", "profile", "email"],
  },
  okta: {
    name: "Okta",
    // Note: These URLs need to be customized per Okta domain
    scopes: ["openid", "profile", "email"],
  },
  auth0: {
    name: "Auth0",
    // Note: These URLs need to be customized per Auth0 domain
    scopes: ["openid", "profile", "email"],
  },
};
