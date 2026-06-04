import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { sendSalesInquiryEmail, sendSalesConfirmationEmail } from "@/lib/email";
import { z } from "zod";
import { validationErrorResponse } from "@/lib/validations/schemas";

// This endpoint serves the engagement intake (homepage CTA), the Atlas
// flagship intake (/products/atlas), and the Atlas Discovery audit
// intake (/products/atlas-discovery). All three submit the same shape;
// routing distinguishes via two mechanisms:
//   1. Explicit `product` field (preferred):
//      - "atlas-discovery"  — productized audit
//      - "atlas-flagship"   — by-invitation full install (optional — may be omitted by /products/atlas)
//      - undefined          — generic engagement intake
//   2. `message` field prefix (legacy/redundant):
//      - "[Atlas intake] ..."           — flagship by-invitation
//      - "[Atlas Discovery intake] ..." — productized audit
//      - no prefix                       — generic engagement intake
// Filtering by product or by message prefix both work. Atlas Discovery
// rows can be queried via:
//   SELECT * FROM sales_contacts WHERE product = 'atlas-discovery'
//      OR message ILIKE '%Atlas Discovery intake%';

// Simple in-memory rate limiting (resets on server restart)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS_PER_WINDOW = 5; // 5 requests per hour per IP

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return true;
  }

  record.count++;
  return false;
}

const companySizeValues = [
  "1-10",
  "11-50",
  "51-200",
  "201-500",
  "501-1000",
  "1000+",
  "1001+",
] as const;

const planValues = [
  "software-access",
  "guided-setup",
  "first-workflow",
  "operating-lane-deposit",
  "manual-invoice",
  "company-ai-os",
  "department-ai-os",
  "studio-sprint-30",
  "studio-retainer",
  "product-subscription",
  "venture-partner",
  "institute-partner",
  "exploring",
  "Pro",
  "Enterprise",
  "Custom",
] as const;

function splitName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const firstName = parts[0] || name;
  const lastName = parts.length > 1 ? parts.slice(1).join(" ") : null;
  return { firstName, lastName };
}

function estimateValueForPlan(plan: string) {
  if (plan === "operating-lane-deposit" || plan === "company-ai-os" || plan === "studio-retainer") {
    return 30000;
  }

  if (plan === "first-workflow" || plan === "studio-sprint-30" || plan === "department-ai-os") {
    return 12000;
  }

  if (plan === "guided-setup" || plan === "manual-invoice") {
    return 5000;
  }

  if (plan === "software-access" || plan === "product-subscription") {
    return 499;
  }

  return null;
}

function getSalesOwnerUserId() {
  return process.env.LORENZO_USER_ID || process.env.DEFAULT_WEBHOOK_USER_ID || process.env.SALES_OWNER_USER_ID || null;
}

// Zod schema for contact sales form
const contactSalesSchema = z.object({
  name: z.string()
    .min(1, "Name is required")
    .max(100, "Name is too long")
    .transform(s => s.trim().replace(/[<>]/g, "")),
  email: z.string()
    .email("Invalid email address")
    .max(254, "Email is too long")
    .toLowerCase()
    .trim(),
  company: z.string()
    .min(1, "Company name is required")
    .max(200, "Company name is too long")
    .transform(s => s.trim().replace(/[<>]/g, "")),
  phone: z.string()
    .max(30, "Phone number is too long")
    .transform(s => s.trim().replace(/[<>]/g, ""))
    .optional()
    .nullable(),
  employees: z.enum(companySizeValues, {
    errorMap: () => ({ message: "Please select a valid company size" }),
  }),
  plan: z.enum(planValues, {
    errorMap: () => ({ message: "Please select a valid plan" }),
  }),
  message: z.string()
    .max(2000, "Message is too long")
    .transform(s => s.trim().replace(/[<>]/g, ""))
    .optional()
    .nullable(),
  // Optional product tag — allows callers to identify which product surface
  // generated the intake. Accepted pattern: lowercase alpha + hyphens only.
  // Field is optional so legacy callers (homepage CTA, /products/atlas) continue
  // to work without modification; their rows get product = NULL.
  product: z.string()
    .min(1)
    .max(64)
    .regex(/^[a-z0-9-]+$/, "product must be lowercase alphanumeric with hyphens")
    .optional()
    .nullable(),
});

export async function POST(request: Request) {
  try {
    // Get IP for rate limiting
    const forwardedFor = request.headers.get("x-forwarded-for");
    const ip = forwardedFor?.split(",")[0]?.trim() || "unknown";

    // Check rate limit
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    // Validate input with Zod
    let validatedData;
    try {
      const rawBody = await request.json();
      validatedData = contactSalesSchema.parse(rawBody);
    } catch (error) {
      return validationErrorResponse(error);
    }

    const {
      name: sanitizedName,
      email: sanitizedEmail,
      company: sanitizedCompany,
      phone: sanitizedPhone,
      employees: sanitizedEmployees,
      plan: sanitizedPlan,
      message: sanitizedMessage,
      product: sanitizedProduct,
    } = validatedData;

    // Save to database for tracking.
    // Use createAdminClient() for server-side INSERT per CORE-tier rule
    // (CLAUDE.md: background/server operations ALWAYS use createAdminClient()).
    const supabase = createAdminClient();
    const { error: dbError } = await supabase.from("sales_contacts").insert({
      name: sanitizedName,
      email: sanitizedEmail,
      company: sanitizedCompany,
      phone: sanitizedPhone,
      company_size: sanitizedEmployees,
      interested_in: sanitizedPlan,
      message: sanitizedMessage,
      product: sanitizedProduct ?? null,
      created_at: new Date().toISOString(),
      status: "new",
    });

    if (dbError) {
      // Log error but continue - we'll still try to send emails
      if (process.env.NODE_ENV === "development") {
        console.error("Failed to save contact to database:", dbError);
      }
    }

    const ownerUserId = getSalesOwnerUserId();
    if (ownerUserId) {
      const now = new Date().toISOString();
      const { firstName, lastName } = splitName(sanitizedName);
      const canonicalMetadata = {
        source: "contact-sales",
        plan: sanitizedPlan,
        product: sanitizedProduct ?? null,
        companySize: sanitizedEmployees,
        submittedAt: now,
      };
      const leadNotes = [
        "Public sales/contact intake",
        `Plan: ${sanitizedPlan}`,
        sanitizedProduct ? `Product: ${sanitizedProduct}` : "",
        sanitizedMessage ? `Message:\n${sanitizedMessage}` : "",
      ].filter(Boolean).join("\n\n");

      const { data: existingLead } = await supabase
        .from("leads")
        .select("id, notes, metadata, tags, status")
        .eq("email", sanitizedEmail)
        .eq("user_id", ownerUserId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const leadPayload = {
        user_id: ownerUserId,
        name: sanitizedName,
        first_name: firstName,
        last_name: lastName,
        contact_name: sanitizedName,
        email: sanitizedEmail,
        contact_email: sanitizedEmail,
        phone: sanitizedPhone || null,
        company: sanitizedCompany,
        company_name: sanitizedCompany,
        company_size: sanitizedEmployees,
        title: sanitizedProduct ? `${sanitizedProduct} inquiry` : `${sanitizedPlan} inquiry`,
        status: existingLead?.status || "new",
        source: "contact-sales",
        source_detail: sanitizedProduct || sanitizedPlan,
        estimated_value: estimateValueForPlan(sanitizedPlan),
        notes: existingLead?.notes ? `${existingLead.notes}\n\n---\n${leadNotes}` : leadNotes,
        tags: Array.from(
          new Set([
            ...((existingLead?.tags as string[] | null) || []),
            "public-intake",
            sanitizedPlan,
            ...(sanitizedProduct ? [sanitizedProduct] : []),
          ]),
        ),
        metadata: {
          ...((existingLead?.metadata && typeof existingLead.metadata === "object" && !Array.isArray(existingLead.metadata)
            ? existingLead.metadata
            : {}) as Record<string, unknown>),
          contactSales: canonicalMetadata,
        },
        ai_insights: {
          contactSales: {
            plan: sanitizedPlan,
            product: sanitizedProduct ?? null,
            nextAction:
              sanitizedPlan === "manual-invoice"
                ? "Prepare manual invoice path and confirm billing details."
                : sanitizedProduct === "package-intake"
                  ? "Open account handoff, confirm kickoff window, and create first-lane tasks."
                  : "Qualify fit and choose package, proposal, or operating lane.",
          },
        },
        updated_at: now,
      };

      const leadResult = existingLead?.id
        ? await supabase.from("leads").update(leadPayload).eq("id", existingLead.id).select("id").single()
        : await supabase
            .from("leads")
            .insert({
              ...leadPayload,
              created_at: now,
            })
            .select("id")
            .single();

      if (leadResult.error) {
        if (process.env.NODE_ENV === "development") {
          console.error("Failed to sync contact-sales lead:", leadResult.error);
        }
      } else if (leadResult.data?.id) {
        await supabase.from("lead_activities").insert({
          lead_id: leadResult.data.id,
          user_id: ownerUserId,
          activity_type: sanitizedProduct === "package-intake" ? "package_intake" : "sales_intake",
          title: sanitizedProduct === "package-intake" ? "Package intake submitted" : "Public sales inquiry submitted",
          description: leadNotes,
          to_value: sanitizedPlan,
        });
      }
    }

    // Send email to sales team
    await sendSalesInquiryEmail({
      name: sanitizedName,
      email: sanitizedEmail,
      company: sanitizedCompany,
      phone: sanitizedPhone || undefined,
      employees: sanitizedEmployees,
      plan: sanitizedPlan,
      message: sanitizedMessage || undefined,
    });

    // Send confirmation email to prospect
    await sendSalesConfirmationEmail({
      name: sanitizedName,
      email: sanitizedEmail,
      plan: sanitizedPlan,
    });

    return NextResponse.json({
      success: true,
      message: "Contact information received. Our team will reach out within 24 hours.",
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to submit contact form";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
