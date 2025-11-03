/**
 * SAML 2.0 Authentication Library
 * Handles SAML authentication flows for SSO
 */

import { SAML, SamlConfig } from "@node-saml/node-saml";
import { SSOProvider } from "@/types";

export interface SAMLProfile {
  nameID: string;
  nameIDFormat: string;
  sessionIndex?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  [key: string]: any;
}

/**
 * Create SAML configuration from SSO provider
 */
export function createSAMLConfig(
  provider: SSOProvider,
  callbackUrl: string,
  logoutCallbackUrl?: string
): SamlConfig {
  if (provider.provider_type !== "saml") {
    throw new Error("Provider must be of type SAML");
  }

  if (!provider.saml_sso_url || !provider.saml_certificate) {
    throw new Error("SAML SSO URL and certificate are required");
  }

  const config: SamlConfig = {
    // Service Provider (SP) - Our application
    callbackUrl,
    issuer: provider.saml_entity_id || `${process.env.NEXT_PUBLIC_APP_URL}/sso/saml/metadata`,

    // Identity Provider (IdP) - Customer's SSO provider
    entryPoint: provider.saml_sso_url,
    cert: provider.saml_certificate.replace(/\\n/g, "\n"), // Handle escaped newlines

    // Optional logout
    ...(provider.saml_slo_url && logoutCallbackUrl && {
      logoutUrl: provider.saml_slo_url,
      logoutCallbackUrl,
    }),

    // Security settings
    signatureAlgorithm: provider.saml_signature_algorithm || "sha256",
    wantAssertionsSigned: true,
    wantAuthnResponseSigned: true,

    // Name ID format
    identifierFormat: provider.saml_name_id_format || "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress",

    // Additional settings
    acceptedClockSkewMs: 60000, // 60 seconds clock skew tolerance
    disableRequestedAuthnContext: true,
  };

  return config;
}

/**
 * Generate SAML authentication request URL
 */
export async function generateAuthRequest(
  provider: SSOProvider,
  callbackUrl: string,
  relayState?: string
): Promise<string> {
  const config = createSAMLConfig(provider, callbackUrl);
  const saml = new SAML(config);

  return new Promise((resolve, reject) => {
    saml.getAuthorizeUrl(relayState || "", {}, (err, url) => {
      if (err) {
        reject(err);
      } else {
        resolve(url!);
      }
    });
  });
}

/**
 * Validate SAML response and extract user profile
 */
export async function validateSAMLResponse(
  provider: SSOProvider,
  callbackUrl: string,
  samlResponse: string
): Promise<SAMLProfile> {
  const config = createSAMLConfig(provider, callbackUrl);
  const saml = new SAML(config);

  return new Promise((resolve, reject) => {
    saml.validatePostResponse({ SAMLResponse: samlResponse }, (err, profile) => {
      if (err) {
        reject(err);
      } else if (!profile) {
        reject(new Error("No profile returned from SAML response"));
      } else {
        resolve(profile as SAMLProfile);
      }
    });
  });
}

/**
 * Generate SAML logout request URL
 */
export async function generateLogoutRequest(
  provider: SSOProvider,
  callbackUrl: string,
  nameID: string,
  sessionIndex?: string
): Promise<string> {
  if (!provider.saml_slo_url) {
    throw new Error("SAML Single Logout URL is not configured");
  }

  const config = createSAMLConfig(provider, callbackUrl, callbackUrl);
  const saml = new SAML(config);

  return new Promise((resolve, reject) => {
    saml.getLogoutUrl({ nameID, sessionIndex }, {}, (err, url) => {
      if (err) {
        reject(err);
      } else {
        resolve(url!);
      }
    });
  });
}

/**
 * Validate SAML logout response
 */
export async function validateLogoutResponse(
  provider: SSOProvider,
  callbackUrl: string,
  samlResponse: string
): Promise<boolean> {
  const config = createSAMLConfig(provider, callbackUrl, callbackUrl);
  const saml = new SAML(config);

  return new Promise((resolve, reject) => {
    saml.validatePostResponse({ SAMLResponse: samlResponse }, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve(true);
      }
    });
  });
}

/**
 * Generate SAML metadata XML for Service Provider
 */
export async function generateMetadata(
  provider: SSOProvider,
  callbackUrl: string
): Promise<string> {
  const config = createSAMLConfig(provider, callbackUrl);
  const saml = new SAML(config);

  return new Promise((resolve, reject) => {
    saml.generateServiceProviderMetadata(null, null, (err, metadata) => {
      if (err) {
        reject(err);
      } else {
        resolve(metadata!);
      }
    });
  });
}

/**
 * Map SAML attributes to user profile fields
 */
export function mapSAMLAttributes(
  profile: SAMLProfile,
  attributeMapping: Record<string, string>
): Record<string, any> {
  const mappedProfile: Record<string, any> = {};

  // Map each attribute according to the mapping configuration
  for (const [ourField, samlField] of Object.entries(attributeMapping)) {
    if (profile[samlField] !== undefined) {
      mappedProfile[ourField] = profile[samlField];
    }
  }

  // Ensure we have at least nameID and email
  mappedProfile.nameID = profile.nameID;
  if (!mappedProfile.email && profile.nameID?.includes("@")) {
    mappedProfile.email = profile.nameID;
  }

  // Add session info
  if (profile.sessionIndex) {
    mappedProfile.sessionIndex = profile.sessionIndex;
  }

  return mappedProfile;
}
