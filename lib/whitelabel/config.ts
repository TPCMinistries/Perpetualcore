import { createClient } from "@/lib/supabase/server";
import { checkFeatureAccess } from "@/lib/features/flags";

export interface WhiteLabelConfig {
  id: string;
  organization_id: string;

  // Domain
  custom_domain: string | null;
  domain_verified: boolean;
  domain_verification_token: string | null;

  // Branding
  logo_url: string | null;
  logo_dark_url: string | null;
  favicon_url: string | null;

  // Colors
  primary_color: string;
  secondary_color: string | null;
  accent_color: string | null;

  // Text
  company_name: string | null;
  tagline: string | null;
  support_email: string | null;
  support_url: string | null;

  // Footer
  hide_powered_by: boolean;
  custom_footer_text: string | null;
  footer_links: Array<{ label: string; url: string }>;

  // Login
  login_background_url: string | null;
  welcome_message: string | null;

  // CSS
  custom_css: string | null;

  is_active: boolean;
}

// Default config when no white-label is set
const DEFAULT_CONFIG: Omit<WhiteLabelConfig, 'id' | 'organization_id'> = {
  custom_domain: null,
  domain_verified: false,
  domain_verification_token: null,
  logo_url: null,
  logo_dark_url: null,
  favicon_url: null,
  primary_color: '#3B82F6',
  secondary_color: null,
  accent_color: null,
  company_name: 'PerpetualCore',
  tagline: 'Your AI-Powered Second Brain',
  support_email: 'support@perpetualcore.com',
  support_url: '/dashboard/support',
  hide_powered_by: false,
  custom_footer_text: null,
  footer_links: [],
  login_background_url: null,
  welcome_message: null,
  custom_css: null,
  is_active: false,
};

/**
 * Get white-label configuration for an organization
 */
export async function getWhiteLabelConfig(
  organizationId: string
): Promise<WhiteLabelConfig | null> {
  const supabase = await createClient();

  // First check if org has white-label access
  const access = await checkFeatureAccess(organizationId, 'white_label');

  if (!access.allowed) {
    return null;
  }

  const { data, error } = await supabase
    .from('white_label_configs')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    ...data,
    footer_links: data.footer_links || [],
  } as WhiteLabelConfig;
}

/**
 * Get white-label config by custom domain
 */
export async function getWhiteLabelByDomain(
  domain: string
): Promise<WhiteLabelConfig | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('white_label_configs')
    .select('*')
    .eq('custom_domain', domain)
    .eq('domain_verified', true)
    .eq('is_active', true)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    ...data,
    footer_links: data.footer_links || [],
  } as WhiteLabelConfig;
}

/**
 * Create or update white-label configuration
 */
export async function saveWhiteLabelConfig(
  organizationId: string,
  config: Partial<Omit<WhiteLabelConfig, 'id' | 'organization_id'>>
): Promise<WhiteLabelConfig | null> {
  const supabase = await createClient();

  // Check feature access
  const access = await checkFeatureAccess(organizationId, 'white_label');
  if (!access.allowed) {
    console.error('[WhiteLabel] Organization does not have white-label access');
    return null;
  }

  const { data, error } = await supabase
    .from('white_label_configs')
    .upsert(
      {
        organization_id: organizationId,
        ...config,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'organization_id' }
    )
    .select()
    .single();

  if (error) {
    console.error('[WhiteLabel] Error saving config:', error);
    return null;
  }

  return data as WhiteLabelConfig;
}

/**
 * Generate domain verification token
 */
export async function generateDomainVerificationToken(
  organizationId: string
): Promise<string | null> {
  const supabase = await createClient();

  const token = `perpetualcore-verify-${crypto.randomUUID()}`;

  const { error } = await supabase
    .from('white_label_configs')
    .update({
      domain_verification_token: token,
      domain_verified: false,
      updated_at: new Date().toISOString(),
    })
    .eq('organization_id', organizationId);

  if (error) {
    console.error('[WhiteLabel] Error generating token:', error);
    return null;
  }

  return token;
}

/**
 * Verify custom domain ownership
 * Checks for TXT record with verification token
 */
export async function verifyCustomDomain(
  organizationId: string
): Promise<{ verified: boolean; error?: string }> {
  const supabase = await createClient();

  // Get current config
  const { data: config } = await supabase
    .from('white_label_configs')
    .select('custom_domain, domain_verification_token')
    .eq('organization_id', organizationId)
    .single();

  if (!config?.custom_domain || !config?.domain_verification_token) {
    return { verified: false, error: 'No domain or verification token set' };
  }

  try {
    // In production, this would check DNS TXT records
    // For now, we'll simulate the check
    // TODO: Integrate with DNS verification service

    // Check TXT record for: _perpetualcore-verification.{domain}
    // Expected value: config.domain_verification_token

    // Simulated check - in production use a DNS library
    const isDomainVerified = await checkDNSTxtRecord(
      `_perpetualcore-verification.${config.custom_domain}`,
      config.domain_verification_token
    );

    if (isDomainVerified) {
      await supabase
        .from('white_label_configs')
        .update({
          domain_verified: true,
          domain_verified_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('organization_id', organizationId);

      return { verified: true };
    }

    return { verified: false, error: 'TXT record not found or does not match' };
  } catch (err) {
    console.error('[WhiteLabel] Domain verification error:', err);
    return { verified: false, error: 'Verification failed' };
  }
}

/**
 * Check DNS TXT record (stub - integrate with DNS service)
 */
async function checkDNSTxtRecord(
  hostname: string,
  expectedValue: string
): Promise<boolean> {
  // TODO: Integrate with DNS resolution service
  // Options: Google DNS API, Cloudflare API, or Node.js dns module

  // For development, return true if domain ends with .test
  if (hostname.endsWith('.test')) {
    return true;
  }

  // In production, implement actual DNS lookup
  console.log(`[WhiteLabel] Would check TXT record for ${hostname}`);
  return false;
}

/**
 * Get merged config (white-label + defaults)
 */
export async function getMergedConfig(
  organizationId: string
): Promise<typeof DEFAULT_CONFIG & { isWhiteLabeled: boolean }> {
  const whiteLabelConfig = await getWhiteLabelConfig(organizationId);

  if (!whiteLabelConfig) {
    return { ...DEFAULT_CONFIG, isWhiteLabeled: false };
  }

  return {
    ...DEFAULT_CONFIG,
    ...Object.fromEntries(
      Object.entries(whiteLabelConfig).filter(([_, v]) => v !== null)
    ),
    isWhiteLabeled: true,
  };
}

/**
 * Generate CSS variables from config
 */
export function generateCSSVariables(config: WhiteLabelConfig): string {
  const vars: string[] = [];

  if (config.primary_color) {
    vars.push(`--color-primary: ${config.primary_color};`);
  }
  if (config.secondary_color) {
    vars.push(`--color-secondary: ${config.secondary_color};`);
  }
  if (config.accent_color) {
    vars.push(`--color-accent: ${config.accent_color};`);
  }

  if (vars.length === 0) return '';

  return `:root { ${vars.join(' ')} }`;
}

/**
 * Check if request is from a white-label domain
 */
export async function isWhiteLabelRequest(
  hostname: string
): Promise<{ isWhiteLabel: boolean; config: WhiteLabelConfig | null; organizationId: string | null }> {
  // Skip for main domains
  const mainDomains = ['perpetualcore.com', 'localhost', '127.0.0.1'];
  if (mainDomains.some((d) => hostname.includes(d))) {
    return { isWhiteLabel: false, config: null, organizationId: null };
  }

  const config = await getWhiteLabelByDomain(hostname);

  if (config) {
    return {
      isWhiteLabel: true,
      config,
      organizationId: config.organization_id,
    };
  }

  return { isWhiteLabel: false, config: null, organizationId: null };
}
