/**
 * White-Label Module
 *
 * Provides white-label customization for enterprise customers:
 * - Custom branding (logo, colors, favicon)
 * - Custom domain support with verification
 * - Custom footer and login page
 * - CSS overrides
 */

export {
  getWhiteLabelConfig,
  getWhiteLabelByDomain,
  saveWhiteLabelConfig,
  generateDomainVerificationToken,
  verifyCustomDomain,
  getMergedConfig,
  generateCSSVariables,
  isWhiteLabelRequest,
  type WhiteLabelConfig,
} from './config';
