/**
 * Credential Resolution Layer for Skills
 *
 * Resolves API credentials using priority cascade:
 * 1. User's personal BYOK key (skill_credentials)
 * 2. Organization's shared key (skill_credentials)
 * 3. System environment variable (fallback)
 *
 * All user-provided keys are encrypted at rest.
 */

import { createAdminClient } from "@/lib/supabase/server";
import { encryptSecret, decryptSecret, hashValue, isEncryptionConfigured } from "@/lib/crypto/encryption";

export interface CredentialInfo {
  source: "user" | "organization" | "system";
  provider: string;
  key: string;
  label?: string;
  scopes?: string[];
}

export interface CredentialValidationResult {
  valid: boolean;
  error?: string;
  metadata?: Record<string, any>;
}

// Provider-specific env var mappings
const PROVIDER_ENV_VARS: Record<string, string> = {
  todoist: "TODOIST_API_KEY",
  linear: "LINEAR_API_KEY",
  notion: "NOTION_API_KEY",
  github: "GITHUB_TOKEN",
  trello: "TRELLO_TOKEN",
  slack: "SLACK_BOT_TOKEN",
  discord: "DISCORD_BOT_TOKEN",
  openai: "OPENAI_API_KEY",
  anthropic: "ANTHROPIC_API_KEY",
};

/**
 * Resolve credential for a provider with cascade:
 * User BYOK → Org BYOK → System Env
 */
export async function resolveCredential(
  provider: string,
  userId: string,
  organizationId?: string
): Promise<CredentialInfo | null> {
  const supabase = createAdminClient();

  // 1. Check user's personal BYOK credential
  const { data: userCred } = await supabase
    .from("skill_credentials")
    .select("*")
    .eq("user_id", userId)
    .eq("provider", provider)
    .eq("is_active", true)
    .single();

  if (userCred?.encrypted_key) {
    try {
      const decryptedKey = decryptSecret(userCred.encrypted_key);

      // Update last_used_at
      await supabase
        .from("skill_credentials")
        .update({ last_used_at: new Date().toISOString() })
        .eq("id", userCred.id)
        .catch(() => {});

      return {
        source: "user",
        provider,
        key: decryptedKey,
        label: userCred.label,
        scopes: userCred.scopes,
      };
    } catch (error) {
      console.error(`Failed to decrypt user credential for ${provider}:`, error);
    }
  }

  // 2. Check organization's shared BYOK credential
  if (organizationId) {
    const { data: orgCred } = await supabase
      .from("skill_credentials")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("provider", provider)
      .eq("is_active", true)
      .single();

    if (orgCred?.encrypted_key) {
      try {
        const decryptedKey = decryptSecret(orgCred.encrypted_key);

        await supabase
          .from("skill_credentials")
          .update({ last_used_at: new Date().toISOString() })
          .eq("id", orgCred.id)
          .catch(() => {});

        return {
          source: "organization",
          provider,
          key: decryptedKey,
          label: orgCred.label,
          scopes: orgCred.scopes,
        };
      } catch (error) {
        console.error(`Failed to decrypt org credential for ${provider}:`, error);
      }
    }
  }

  // 3. Fallback to system environment variable
  const envVarName = PROVIDER_ENV_VARS[provider];
  if (envVarName) {
    const systemKey = process.env[envVarName];
    if (systemKey) {
      return {
        source: "system",
        provider,
        key: systemKey,
      };
    }
  }

  return null;
}

/**
 * Save a new BYOK credential (encrypted)
 */
export async function saveCredential(
  provider: string,
  apiKey: string,
  options: {
    userId?: string;
    organizationId?: string;
    label?: string;
    scopes?: string[];
  }
): Promise<{ success: boolean; error?: string }> {
  if (!options.userId && !options.organizationId) {
    return { success: false, error: "Either userId or organizationId is required" };
  }

  if (!isEncryptionConfigured()) {
    return { success: false, error: "Encryption is not properly configured" };
  }

  const supabase = createAdminClient();

  try {
    const encryptedKey = encryptSecret(apiKey);
    const keyHash = hashValue(apiKey);

    const credData: any = {
      provider,
      encrypted_key: encryptedKey,
      key_hash: keyHash,
      label: options.label,
      scopes: options.scopes,
      is_active: true,
      updated_at: new Date().toISOString(),
    };

    if (options.userId) {
      credData.user_id = options.userId;
    } else {
      credData.organization_id = options.organizationId;
    }

    const { error } = await supabase.from("skill_credentials").upsert(credData, {
      onConflict: options.userId ? "user_id,provider" : "organization_id,provider",
    });

    if (error) {
      console.error("Failed to save credential:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error("Failed to encrypt/save credential:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete a credential
 */
export async function deleteCredential(
  provider: string,
  userId?: string,
  organizationId?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient();

  let query = supabase.from("skill_credentials").delete().eq("provider", provider);

  if (userId) {
    query = query.eq("user_id", userId);
  } else if (organizationId) {
    query = query.eq("organization_id", organizationId);
  } else {
    return { success: false, error: "Either userId or organizationId is required" };
  }

  const { error } = await query;

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * List all credentials for a user (without exposing keys)
 */
export async function listUserCredentials(
  userId: string,
  organizationId?: string
): Promise<
  Array<{
    id: string;
    provider: string;
    source: "user" | "organization";
    label?: string;
    isActive: boolean;
    lastUsedAt?: string;
    createdAt: string;
  }>
> {
  const supabase = createAdminClient();
  const credentials: any[] = [];

  // Get user credentials
  const { data: userCreds } = await supabase
    .from("skill_credentials")
    .select("id, provider, label, is_active, last_used_at, created_at")
    .eq("user_id", userId);

  if (userCreds) {
    credentials.push(
      ...userCreds.map((c) => ({
        id: c.id,
        provider: c.provider,
        source: "user" as const,
        label: c.label,
        isActive: c.is_active,
        lastUsedAt: c.last_used_at,
        createdAt: c.created_at,
      }))
    );
  }

  // Get org credentials if applicable
  if (organizationId) {
    const { data: orgCreds } = await supabase
      .from("skill_credentials")
      .select("id, provider, label, is_active, last_used_at, created_at")
      .eq("organization_id", organizationId);

    if (orgCreds) {
      credentials.push(
        ...orgCreds.map((c) => ({
          id: c.id,
          provider: c.provider,
          source: "organization" as const,
          label: c.label,
          isActive: c.is_active,
          lastUsedAt: c.last_used_at,
          createdAt: c.created_at,
        }))
      );
    }
  }

  return credentials;
}

/**
 * Validate a credential by testing it against the provider's API
 */
export async function validateCredential(
  provider: string,
  apiKey: string
): Promise<CredentialValidationResult> {
  try {
    switch (provider) {
      case "todoist":
        return await validateTodoistKey(apiKey);
      case "linear":
        return await validateLinearKey(apiKey);
      case "notion":
        return await validateNotionKey(apiKey);
      case "github":
        return await validateGithubKey(apiKey);
      default:
        // For unknown providers, assume valid if non-empty
        return { valid: !!apiKey, error: apiKey ? undefined : "Empty API key" };
    }
  } catch (error: any) {
    return { valid: false, error: error.message };
  }
}

/**
 * Update validation status in database
 */
export async function updateCredentialValidation(
  credentialId: string,
  result: CredentialValidationResult
): Promise<void> {
  const supabase = createAdminClient();

  await supabase
    .from("skill_credentials")
    .update({
      last_validated_at: new Date().toISOString(),
      validation_error: result.valid ? null : result.error,
      is_active: result.valid,
    })
    .eq("id", credentialId)
    .catch(() => {});
}

// Provider-specific validation functions

async function validateTodoistKey(apiKey: string): Promise<CredentialValidationResult> {
  const response = await fetch("https://api.todoist.com/rest/v2/projects", {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (response.ok) {
    return { valid: true };
  }

  if (response.status === 401 || response.status === 403) {
    return { valid: false, error: "Invalid or expired Todoist API token" };
  }

  return { valid: false, error: `Todoist API error: ${response.status}` };
}

async function validateLinearKey(apiKey: string): Promise<CredentialValidationResult> {
  const response = await fetch("https://api.linear.app/graphql", {
    method: "POST",
    headers: {
      Authorization: apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: "{ viewer { id email } }",
    }),
  });

  if (response.ok) {
    const data = await response.json();
    if (data.errors) {
      return { valid: false, error: data.errors[0]?.message || "GraphQL error" };
    }
    return {
      valid: true,
      metadata: { email: data.data?.viewer?.email },
    };
  }

  return { valid: false, error: `Linear API error: ${response.status}` };
}

async function validateNotionKey(apiKey: string): Promise<CredentialValidationResult> {
  const response = await fetch("https://api.notion.com/v1/users/me", {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Notion-Version": "2022-06-28",
    },
  });

  if (response.ok) {
    return { valid: true };
  }

  if (response.status === 401) {
    return { valid: false, error: "Invalid Notion API key" };
  }

  return { valid: false, error: `Notion API error: ${response.status}` };
}

async function validateGithubKey(apiKey: string): Promise<CredentialValidationResult> {
  const response = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "PerpetualCore/1.0",
    },
  });

  if (response.ok) {
    const data = await response.json();
    return {
      valid: true,
      metadata: { login: data.login, name: data.name },
    };
  }

  if (response.status === 401) {
    return { valid: false, error: "Invalid GitHub token" };
  }

  return { valid: false, error: `GitHub API error: ${response.status}` };
}

/**
 * Check if a provider has any configured credential source
 */
export async function hasCredential(
  provider: string,
  userId: string,
  organizationId?: string
): Promise<boolean> {
  const cred = await resolveCredential(provider, userId, organizationId);
  return cred !== null;
}

/**
 * Get credential source info without the actual key
 */
export async function getCredentialSource(
  provider: string,
  userId: string,
  organizationId?: string
): Promise<{ hasCredential: boolean; source?: "user" | "organization" | "system" }> {
  const cred = await resolveCredential(provider, userId, organizationId);

  if (!cred) {
    return { hasCredential: false };
  }

  return { hasCredential: true, source: cred.source };
}
