/**
 * Billing Module
 *
 * Comprehensive billing system with:
 * - Usage metering (Stripe integration)
 * - Overage calculation and management
 * - Per-model pricing
 * - Usage alerts and notifications
 */

// Metering
export {
  getOrCreateMeter,
  incrementMeter,
  getOrganizationMeters,
  getUsageSummary,
  syncUsageToStripe,
  trackAITokens,
  trackPremiumModelTokens,
  trackAPICall,
  trackAgentRun,
  type MeterType,
  type UsageMeter,
  type MeterUsageResult,
} from './metering';

// Overage
export {
  getPlanOverageConfig,
  checkOverageAllowed,
  projectUsage,
  getOverageBreakdown,
  estimateAdditionalCost,
  type PlanType,
  type PlanOverageConfig,
  type OverageCheckResult,
  type UsageProjection,
} from './overage';

// Model Pricing
export {
  getAllModelPricing,
  getModelPricing,
  calculateCost,
  calculateCostDB,
  getModelsForTier,
  isModelAvailableForTier,
  getPremiumModels,
  getModelsByProvider,
  estimateMonthlyCost,
  compareModelCosts,
  clearPricingCache,
  type ModelPricing,
  type CostCalculation,
} from './model-pricing';

// Alerts
export {
  getOrganizationAlerts,
  checkAlerts,
  sendAlertNotifications,
  acknowledgeAlert,
  resetAlertsForBillingPeriod,
  updateAlertPreferences,
  createCustomAlert,
  getPendingAlerts,
  type OverageAlert,
  type AlertTrigger,
  type AlertNotification,
} from './alerts';
