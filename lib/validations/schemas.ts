import { z } from "zod";

/**
 * Shared Zod validation schemas for API endpoints.
 * Import these schemas in your route handlers for consistent validation.
 */

// ============================================
// Common/Reusable Schemas
// ============================================

/** UUID validation */
export const uuidSchema = z.string().uuid("Invalid ID format");

/** Email validation with sanitization */
export const emailSchema = z
  .string()
  .email("Invalid email address")
  .toLowerCase()
  .trim()
  .max(255, "Email too long");

/** Safe string - trimmed and length-limited */
export const safeStringSchema = (maxLength = 1000) =>
  z.string().trim().max(maxLength, `Text exceeds ${maxLength} characters`);

/** URL validation */
export const urlSchema = z.string().url("Invalid URL").max(2048, "URL too long");

/** Phone number - basic validation */
export const phoneSchema = z
  .string()
  .regex(/^[+]?[\d\s\-().]{7,20}$/, "Invalid phone number")
  .optional()
  .or(z.literal(""));

/** Pagination schema */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// ============================================
// Auth Schemas
// ============================================

/** 2FA token - exactly 6 digits */
export const totpTokenSchema = z
  .string()
  .regex(/^\d{6}$/, "Token must be exactly 6 digits");

/** 2FA backup code - typically 8-10 alphanumeric chars */
export const backupCodeSchema = z
  .string()
  .regex(/^[A-Za-z0-9]{8,10}$/, "Invalid backup code format");

/** 2FA verification request */
export const twoFactorVerifySchema = z.object({
  token: totpTokenSchema.optional(),
  backupCode: backupCodeSchema.optional(),
}).refine(
  (data) => data.token || data.backupCode,
  "Either token or backup code is required"
);

/** 2FA enable request */
export const twoFactorEnableSchema = z.object({
  encryptedSecret: z.string().min(1, "Encrypted secret is required"),
  token: totpTokenSchema,
});

// ============================================
// User/Profile Schemas
// ============================================

/** User role enum */
export const userRoleSchema = z.enum(["admin", "member", "viewer"]);

/** Update user role request */
export const updateUserRoleSchema = z.object({
  userId: uuidSchema,
  role: userRoleSchema,
});

/** User preferences schema */
export const userPreferencesSchema = z.object({
  theme: z.enum(["light", "dark", "system"]).optional(),
  language: z.string().max(10).optional(),
  notifications: z.object({
    email: z.boolean().optional(),
    push: z.boolean().optional(),
    desktop: z.boolean().optional(),
  }).optional(),
  aiModel: z.string().max(50).optional(),
  defaultView: z.enum(["list", "grid", "board"]).optional(),
}).passthrough(); // Allow additional fields

/** Team invite request */
export const teamInviteSchema = z.object({
  email: emailSchema,
  role: userRoleSchema.default("member"),
});

// ============================================
// Document Schemas
// ============================================

/** Create text document */
export const createDocumentSchema = z.object({
  title: safeStringSchema(500),
  content: safeStringSchema(100000).optional().default(""),
  content_html: safeStringSchema(200000).optional(),
  folder_id: uuidSchema.optional().nullable(),
  space_id: uuidSchema.optional().nullable(),
});

/** Update document */
export const updateDocumentSchema = z.object({
  title: safeStringSchema(500).optional(),
  content: safeStringSchema(100000).optional(),
  content_html: safeStringSchema(200000).optional(),
  folder_id: uuidSchema.optional().nullable(),
});

// ============================================
// Conversation/Message Schemas
// ============================================

/** Send message request */
export const sendMessageSchema = z.object({
  content: safeStringSchema(10000),
  context: z.string().max(50000).optional(),
  skipAI: z.boolean().optional().default(false),
  attachments: z.array(z.object({
    name: z.string().max(255),
    type: z.string().max(100),
    size: z.number().max(10 * 1024 * 1024), // 10MB max
    url: urlSchema.optional(),
  })).max(10).optional(),
});

// ============================================
// Email Schemas
// ============================================

/** Send email request */
export const sendEmailSchema = z.object({
  to_emails: z.array(emailSchema).min(1, "At least one recipient required").max(50),
  cc_emails: z.array(emailSchema).max(20).optional(),
  bcc_emails: z.array(emailSchema).max(20).optional(),
  subject: safeStringSchema(500),
  body_text: safeStringSchema(50000).optional(),
  body_html: safeStringSchema(100000).optional(),
  scheduled_at: z.string().datetime().optional(),
  in_reply_to: z.string().max(500).optional(),
}).refine(
  (data) => data.body_text || data.body_html,
  "Either body_text or body_html is required"
);

/** Referral invite */
export const referralInviteSchema = z.object({
  email: emailSchema,
  message: safeStringSchema(1000).optional(),
  referralLink: urlSchema.optional(),
});

// ============================================
// Contact/Sales Schemas
// ============================================

/** Contact sales form */
export const contactSalesSchema = z.object({
  name: safeStringSchema(100),
  email: emailSchema,
  company: safeStringSchema(200).optional(),
  phone: phoneSchema,
  employees: z.enum(["1-10", "11-50", "51-200", "201-1000", "1000+"]).optional(),
  plan: z.enum(["starter", "pro", "team", "enterprise"]).optional(),
  message: safeStringSchema(5000).optional(),
});

/** Book consultation */
export const bookConsultationSchema = z.object({
  email: emailSchema,
  full_name: safeStringSchema(100),
  company_name: safeStringSchema(200).optional(),
  phone: phoneSchema,
  company_size: z.enum(["1-10", "11-50", "51-200", "201-500", "500+"]).optional(),
  budget_range: z.enum(["<$1k", "$1k-$5k", "$5k-$10k", "$10k-$50k", "$50k+"]).optional(),
  notes: safeStringSchema(2000).optional(),
});

// ============================================
// API Key Schemas
// ============================================

/** Create API key */
export const createApiKeySchema = z.object({
  name: safeStringSchema(100),
  environment: z.enum(["development", "production"]).default("development"),
  expiresAt: z.string().datetime().optional(),
});

// ============================================
// Marketplace Schemas
// ============================================

/** Purchase item */
export const purchaseItemSchema = z.object({
  item_id: uuidSchema,
  quantity: z.number().int().min(1).max(100).default(1),
});

// ============================================
// Task Schemas
// ============================================

/** Create task */
export const createTaskSchema = z.object({
  title: safeStringSchema(500),
  description: safeStringSchema(5000).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  due_date: z.string().datetime().optional(),
  assignee_id: uuidSchema.optional(),
  project_id: uuidSchema.optional(),
  labels: z.array(z.string().max(50)).max(10).optional(),
});

/** Extract tasks from text */
export const extractTasksSchema = z.object({
  text: safeStringSchema(10000),
  context: safeStringSchema(5000).optional(),
});

// ============================================
// Agent Schemas
// ============================================

/** Create AI agent */
export const createAgentSchema = z.object({
  name: safeStringSchema(100),
  description: safeStringSchema(1000).optional(),
  model: z.string().max(50).optional(),
  systemPrompt: safeStringSchema(10000).optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().min(1).max(128000).optional(),
  tools: z.array(z.string().max(100)).max(20).optional(),
});

// ============================================
// Import Schemas
// ============================================

/** Import data */
export const importDataSchema = z.object({
  format: z.enum(["json", "notion", "evernote", "markdown"]),
  options: z.object({
    preserveFolders: z.boolean().optional(),
    importTags: z.boolean().optional(),
  }).optional(),
});

// ============================================
// Validation Helpers
// ============================================

/**
 * Validate request body against a schema.
 * Returns parsed data or throws a formatted error.
 */
export async function validateBody<T extends z.ZodType>(
  request: Request,
  schema: T
): Promise<z.infer<T>> {
  try {
    const body = await request.json();
    return schema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.issues.map((e) => `${e.path.join(".")}: ${e.message}`);
      throw new ValidationError(messages.join("; "));
    }
    throw new ValidationError("Invalid request body");
  }
}

/**
 * Validate query parameters against a schema.
 */
export function validateQuery<T extends z.ZodType>(
  searchParams: URLSearchParams,
  schema: T
): z.infer<T> {
  const params: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    params[key] = value;
  });

  try {
    return schema.parse(params);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.issues.map((e) => `${e.path.join(".")}: ${e.message}`);
      throw new ValidationError(messages.join("; "));
    }
    throw new ValidationError("Invalid query parameters");
  }
}

/**
 * Custom validation error class
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

/**
 * Create a standard error response for validation failures
 */
export function validationErrorResponse(error: unknown): Response {
  const message = error instanceof ValidationError
    ? error.message
    : error instanceof z.ZodError
    ? error.issues.map((e) => `${e.path.join(".")}: ${e.message}`).join("; ")
    : "Invalid request";

  return new Response(
    JSON.stringify({ error: message }),
    {
      status: 400,
      headers: { "Content-Type": "application/json" },
    }
  );
}
