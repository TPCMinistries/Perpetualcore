import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set");
}

/**
 * Stripe client instance
 * Configured with API version and TypeScript support
 */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-12-18.acacia",
  typescript: true,
});

/**
 * Stripe pricing configuration
 * Matches perpetualcore.com/pricing
 * Update these Price IDs from your Stripe Dashboard after creating products
 */
export const STRIPE_PLANS = {
  free: {
    name: "Free",
    priceMonthlyId: null,
    priceAnnualId: null,
    priceMonthly: 0,
    priceAnnual: 0,
  },
  starter: {
    name: "Starter",
    priceMonthlyId: process.env.STRIPE_STARTER_MONTHLY_PRICE_ID || null,
    priceAnnualId: process.env.STRIPE_STARTER_ANNUAL_PRICE_ID || null,
    priceMonthly: 49,
    priceAnnual: 470, // 20% discount
  },
  pro: {
    name: "Pro",
    priceMonthlyId: process.env.STRIPE_PRO_MONTHLY_PRICE_ID || null,
    priceAnnualId: process.env.STRIPE_PRO_ANNUAL_PRICE_ID || null,
    priceMonthly: 99,
    priceAnnual: 950, // 20% discount
  },
  team: {
    name: "Team",
    priceMonthlyId: process.env.STRIPE_TEAM_MONTHLY_PRICE_ID || null,
    priceAnnualId: process.env.STRIPE_TEAM_ANNUAL_PRICE_ID || null,
    priceMonthly: 499,
    priceAnnual: 4790, // 20% discount
  },
  business: {
    name: "Business",
    priceMonthlyId: process.env.STRIPE_BUSINESS_MONTHLY_PRICE_ID || null,
    priceAnnualId: process.env.STRIPE_BUSINESS_ANNUAL_PRICE_ID || null,
    priceMonthly: 1999,
    priceAnnual: 19190, // 20% discount
  },
  enterprise: {
    name: "Enterprise",
    priceMonthlyId: process.env.STRIPE_ENTERPRISE_MONTHLY_PRICE_ID || null,
    priceAnnualId: process.env.STRIPE_ENTERPRISE_ANNUAL_PRICE_ID || null,
    priceMonthly: 9999,
    priceAnnual: 95990, // 20% discount
  },
  custom: {
    name: "Custom",
    priceMonthlyId: null, // Contact sales
    priceAnnualId: null,
    priceMonthly: null,
    priceAnnual: null,
  },
} as const;

/**
 * Plan limits and features - matches perpetualcore.com/pricing
 */
export const PLAN_LIMITS = {
  free: {
    aiMessages: -1, // Unlimited Gemini
    premiumMessages: 0,
    documents: 5,
    storageGB: 1,
    teamMembers: 1,
    automations: 5,
    features: {
      geminiUnlimited: true,
      gpt4oMini: false,
      premiumModels: false,
      calendar: false,
      email: false,
      whatsapp: false,
      workflows: false,
      api: false,
      slackTeams: false,
      sso: false,
      customTraining: false,
      whiteLabel: false,
      onPremise: false,
      support: "community",
    },
  },
  starter: {
    aiMessages: -1, // Unlimited GPT-4o Mini
    premiumMessages: 100, // 100 Claude/GPT-4 messages
    documents: -1, // Unlimited
    storageGB: 10,
    teamMembers: 1,
    automations: -1, // Unlimited
    features: {
      geminiUnlimited: true,
      gpt4oMini: true,
      premiumModels: true, // Limited to 100/mo
      calendar: true,
      email: true,
      whatsapp: false,
      workflows: true,
      api: false,
      slackTeams: false,
      sso: false,
      customTraining: false,
      whiteLabel: false,
      onPremise: false,
      support: "priority_email",
    },
  },
  pro: {
    aiMessages: -1, // Unlimited all models
    premiumMessages: -1, // Unlimited
    documents: -1,
    storageGB: 50,
    teamMembers: 1,
    automations: -1,
    features: {
      geminiUnlimited: true,
      gpt4oMini: true,
      premiumModels: true, // Unlimited
      calendar: true,
      email: true,
      whatsapp: false,
      workflows: true,
      api: true,
      slackTeams: false,
      sso: false,
      customTraining: false,
      whiteLabel: false,
      onPremise: false,
      support: "priority_4hr",
    },
  },
  team: {
    aiMessages: -1,
    premiumMessages: -1,
    documents: -1,
    storageGB: -1, // Included per member
    teamMembers: 10,
    automations: -1,
    features: {
      geminiUnlimited: true,
      gpt4oMini: true,
      premiumModels: true,
      calendar: true,
      email: true,
      whatsapp: false,
      workflows: true,
      api: true,
      slackTeams: true,
      sso: false,
      customTraining: false,
      whiteLabel: false,
      onPremise: false,
      support: "dedicated_success",
    },
  },
  business: {
    aiMessages: -1,
    premiumMessages: -1,
    documents: -1,
    storageGB: -1, // Unlimited
    teamMembers: 50,
    automations: -1,
    features: {
      geminiUnlimited: true,
      gpt4oMini: true,
      premiumModels: true,
      calendar: true,
      email: true,
      whatsapp: true,
      workflows: true,
      api: true,
      slackTeams: true,
      sso: true,
      customTraining: true,
      whiteLabel: false,
      onPremise: false,
      support: "priority_phone_2hr",
      sla: "99.9%",
    },
  },
  enterprise: {
    aiMessages: -1,
    premiumMessages: -1,
    documents: -1,
    storageGB: -1,
    teamMembers: 250,
    automations: -1,
    features: {
      geminiUnlimited: true,
      gpt4oMini: true,
      premiumModels: true,
      calendar: true,
      email: true,
      whatsapp: true,
      workflows: true,
      api: true,
      slackTeams: true,
      sso: true,
      customTraining: true,
      whiteLabel: true,
      onPremise: false,
      support: "24_7_dedicated",
      sla: "99.95%",
      hipaa: true,
      soc2: true,
    },
  },
  custom: {
    aiMessages: -1,
    premiumMessages: -1,
    documents: -1,
    storageGB: -1,
    teamMembers: -1, // Unlimited
    automations: -1,
    features: {
      geminiUnlimited: true,
      gpt4oMini: true,
      premiumModels: true,
      calendar: true,
      email: true,
      whatsapp: true,
      workflows: true,
      api: true,
      slackTeams: true,
      sso: true,
      customTraining: true,
      whiteLabel: true,
      onPremise: true,
      support: "custom",
      sla: "custom",
      hipaa: true,
      soc2: true,
    },
  },
} as const;

export type PlanType = keyof typeof STRIPE_PLANS;
export type SubscriptionStatus =
  | "active"
  | "canceled"
  | "past_due"
  | "trialing"
  | "incomplete"
  | "incomplete_expired"
  | "unpaid";
