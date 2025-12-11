import { z } from "zod";

/**
 * Server-side environment variables schema.
 * These are only available on the server.
 */
const serverEnvSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

  // Supabase - Required
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("Invalid Supabase URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "Supabase anon key is required"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "Supabase service role key is required"),

  // AI Providers - At least one should be configured
  ANTHROPIC_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  GOOGLE_AI_API_KEY: z.string().optional(),

  // Email - Optional but recommended
  RESEND_API_KEY: z.string().optional(),

  // Stripe - Optional (for billing)
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  // WhatsApp - Optional (for notifications)
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_WHATSAPP_NUMBER: z.string().optional(),

  // Integrations - Optional
  SLACK_CLIENT_ID: z.string().optional(),
  SLACK_CLIENT_SECRET: z.string().optional(),
  ZOOM_CLIENT_ID: z.string().optional(),
  ZOOM_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  // Security
  ENCRYPTION_KEY: z.string().min(32, "Encryption key must be at least 32 characters").optional(),

  // Sentry - Optional
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional().or(z.literal("")),
});

/**
 * Client-side environment variables schema.
 * Only NEXT_PUBLIC_ variables are available on the client.
 */
const clientEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY: z.string().optional(),
  NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY: z.string().optional(),
  NEXT_PUBLIC_STRIPE_PRICE_TEAM_MONTHLY: z.string().optional(),
  NEXT_PUBLIC_STRIPE_PRICE_TEAM_YEARLY: z.string().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional().or(z.literal("")),
});

/**
 * Combined schema for all environment variables
 */
const envSchema = serverEnvSchema.merge(clientEnvSchema);

export type ServerEnv = z.infer<typeof serverEnvSchema>;
export type ClientEnv = z.infer<typeof clientEnvSchema>;
export type Env = z.infer<typeof envSchema>;

/**
 * Validate environment variables at build/runtime.
 * Throws an error with detailed information if validation fails.
 */
function validateEnv(): Env {
  // Skip validation during build if explicitly disabled
  if (process.env.SKIP_ENV_VALIDATION === "true") {
    return process.env as unknown as Env;
  }

  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    const errorMessages = Object.entries(errors)
      .map(([field, messages]) => `  - ${field}: ${messages?.join(", ")}`)
      .join("\n");

    console.error(
      "Invalid environment variables:\n" + errorMessages
    );

    // In production, throw to prevent startup with invalid config
    if (process.env.NODE_ENV === "production") {
      throw new Error("Invalid environment configuration. Check the logs for details.");
    }

    // In development, log warning but continue
    console.warn(
      "Warning: Running with invalid environment configuration. Some features may not work correctly."
    );

    return process.env as unknown as Env;
  }

  return parsed.data;
}

/**
 * Validated environment variables.
 * Import this instead of using process.env directly.
 */
export const env = validateEnv();

/**
 * Helper to check if a feature is enabled based on env vars
 */
export const features = {
  /** Whether email sending is configured */
  email: !!env.RESEND_API_KEY,

  /** Whether Stripe billing is configured */
  billing: !!env.STRIPE_SECRET_KEY && !!env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,

  /** Whether WhatsApp notifications are configured */
  whatsapp: !!env.TWILIO_ACCOUNT_SID && !!env.TWILIO_AUTH_TOKEN,

  /** Whether Slack integration is configured */
  slack: !!env.SLACK_CLIENT_ID && !!env.SLACK_CLIENT_SECRET,

  /** Whether Zoom integration is configured */
  zoom: !!env.ZOOM_CLIENT_ID && !!env.ZOOM_CLIENT_SECRET,

  /** Whether Google Drive integration is configured */
  googleDrive: !!env.GOOGLE_CLIENT_ID && !!env.GOOGLE_CLIENT_SECRET,

  /** Whether 2FA encryption is configured */
  twoFactor: !!env.ENCRYPTION_KEY,

  /** Whether Sentry error tracking is configured */
  sentry: !!env.NEXT_PUBLIC_SENTRY_DSN,

  /** Whether any AI provider is configured */
  ai: !!env.ANTHROPIC_API_KEY || !!env.OPENAI_API_KEY || !!env.GOOGLE_AI_API_KEY,
};

/**
 * Get the configured AI provider
 */
export function getConfiguredAIProvider(): "anthropic" | "openai" | "google" | null {
  if (env.ANTHROPIC_API_KEY) return "anthropic";
  if (env.OPENAI_API_KEY) return "openai";
  if (env.GOOGLE_AI_API_KEY) return "google";
  return null;
}
