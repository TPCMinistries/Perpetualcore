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
 * Update these Price IDs from your Stripe Dashboard
 */
export const STRIPE_PLANS = {
  free: {
    name: "Free",
    priceMonthlyId: null,
    priceAnnualId: null,
    priceMonthly: 0,
    priceAnnual: 0,
  },
  pro: {
    name: "Pro",
    priceMonthlyId: process.env.STRIPE_PRO_MONTHLY_PRICE_ID || "price_pro_monthly",
    priceAnnualId: process.env.STRIPE_PRO_ANNUAL_PRICE_ID || "price_pro_annual",
    priceMonthly: 49,
    priceAnnual: 470, // 20% discount ($588 → $470)
  },
  business: {
    name: "Business",
    priceMonthlyId: process.env.STRIPE_BUSINESS_MONTHLY_PRICE_ID || "price_business_monthly",
    priceAnnualId: process.env.STRIPE_BUSINESS_ANNUAL_PRICE_ID || "price_business_annual",
    priceMonthly: 149,
    priceAnnual: 1430, // 20% discount ($1,788 → $1,430)
  },
  enterprise: {
    name: "Enterprise",
    priceMonthlyId: null, // Custom pricing
    priceAnnualId: null,
    priceMonthly: 499, // Starting price
    priceAnnual: 4790, // 20% discount
  },
} as const;

/**
 * Plan limits and features
 */
export const PLAN_LIMITS = {
  free: {
    aiMessages: 50, // 50 per month (Gemini only)
    documents: 5,
    storageGB: 1,
    teamMembers: 1,
    messageHistory: 30, // days
    overageRate: null, // No overage allowed
    features: {
      basicAI: true, // Gemini only
      advancedAI: false,
      calendar: false,
      email: false,
      whatsapp: false,
      tasks: false,
      voice: false,
      agents: false,
      prioritySupport: false,
      customIntegrations: false,
      sso: false,
    },
  },
  pro: {
    aiMessages: 1000, // 1,000 per month
    documents: -1, // unlimited
    storageGB: 10,
    teamMembers: 1,
    messageHistory: -1, // unlimited
    overageRate: 0.05, // $0.05 per message overage
    features: {
      basicAI: true,
      advancedAI: true, // All AI models
      calendar: "full", // sync + send
      email: "full", // sync + send
      whatsapp: false,
      tasks: true,
      voice: false,
      agents: false,
      prioritySupport: true,
      customIntegrations: false,
      sso: false,
    },
  },
  business: {
    aiMessages: 4000, // 4,000 per month
    documents: -1, // unlimited
    storageGB: 50,
    teamMembers: 5,
    messageHistory: -1,
    overageRate: 0.04, // $0.04 per message overage
    features: {
      basicAI: true,
      advancedAI: true,
      calendar: "full",
      email: "full",
      whatsapp: true,
      tasks: true,
      voice: false,
      agents: 5, // 5 autonomous agents
      prioritySupport: true,
      customIntegrations: false,
      sso: false,
    },
  },
  enterprise: {
    aiMessages: 20000, // 20,000+ per month (customizable)
    documents: -1,
    storageGB: -1, // unlimited
    teamMembers: -1, // unlimited
    messageHistory: -1,
    overageRate: 0.03, // $0.03 per message (negotiable)
    features: {
      basicAI: true,
      advancedAI: true,
      calendar: "full",
      email: "full",
      whatsapp: true,
      tasks: true,
      voice: true,
      agents: -1, // unlimited
      prioritySupport: true,
      customIntegrations: true,
      sso: true,
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
