import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { rateLimiters } from "@/lib/rate-limit";
import { logger } from "@/lib/logging";
import { stripe } from "@/lib/stripe/client";

/**
 * DELETE /api/user/account
 *
 * GDPR-compliant account deletion.
 * Deletes all user data across all tables and cancels Stripe subscription.
 * Requires the user to confirm by sending { confirmation: "DELETE" } in the body.
 */
export async function DELETE(request: NextRequest) {
  try {
    // Strict rate limit — 5 per minute
    const rateLimitResult = await rateLimiters.strict.check(request);
    if (!rateLimitResult.success) {
      return rateLimitResult.response;
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Require confirmation
    const body = await request.json();
    if (body.confirmation !== "DELETE") {
      return NextResponse.json(
        { error: 'You must send { "confirmation": "DELETE" } to confirm.' },
        { status: 400 }
      );
    }

    const adminSupabase = createAdminClient();
    const userId = user.id;

    // 1. Get user profile for org info
    const { data: profile } = await adminSupabase
      .from("profiles")
      .select("organization_id, full_name, email")
      .eq("id", userId)
      .single();

    const organizationId = profile?.organization_id;

    // 2. Cancel Stripe subscription if exists
    if (organizationId) {
      try {
        const { data: subscription } = await adminSupabase
          .from("subscriptions")
          .select("stripe_subscription_id, stripe_customer_id")
          .eq("organization_id", organizationId)
          .single();

        if (subscription?.stripe_subscription_id) {
          await stripe.subscriptions.cancel(
            subscription.stripe_subscription_id,
            { prorate: true }
          );
        }
      } catch (stripeErr) {
        // Log but don't block deletion
        console.error("[AccountDeletion] Stripe cancellation error:", stripeErr);
      }
    }

    // 3. Delete user data from all tables (child tables first for FK order)
    // Uses admin client to bypass RLS
    const deletionTables: { table: string; column: string }[] = [
      // ── Chat & AI (child tables first) ──
      { table: "conversation_messages", column: "user_id" },
      { table: "conversation_bookmarks", column: "user_id" },
      { table: "conversation_participants", column: "user_id" },
      { table: "shared_conversations", column: "user_id" },
      { table: "conversations", column: "user_id" },
      { table: "conversation_context", column: "user_id" },
      { table: "ai_assistant_conversations", column: "user_id" },
      { table: "ai_memories", column: "user_id" },
      { table: "user_ai_memory", column: "user_id" },
      { table: "user_ai_usage", column: "user_id" },
      { table: "user_ai_quotas", column: "user_id" },
      { table: "ai_learning_log", column: "user_id" },
      { table: "ai_insights", column: "user_id" },

      // ── Intelligence ──
      { table: "intelligence_insights", column: "user_id" },
      { table: "intelligence_patterns", column: "user_id" },
      { table: "intelligence_preferences", column: "user_id" },
      { table: "intelligence_suggestions", column: "user_id" },
      { table: "commitment_extractions", column: "user_id" },
      { table: "proactive_nudges", column: "user_id" },

      // ── Documents & Knowledge ──
      { table: "document_annotations", column: "user_id" },
      { table: "document_activity", column: "user_id" },
      { table: "document_presence", column: "user_id" },
      { table: "document_shares", column: "user_id" },
      { table: "document_tags", column: "user_id" },
      { table: "document_folders", column: "user_id" },
      { table: "document_projects", column: "user_id" },
      { table: "document_knowledge_spaces", column: "user_id" },
      { table: "document_chunks", column: "user_id" },
      { table: "documents", column: "user_id" },
      { table: "web_clips", column: "user_id" },
      { table: "media_transcriptions", column: "user_id" },
      { table: "image_analysis", column: "user_id" },
      { table: "knowledge_contributions", column: "user_id" },

      // ── Tasks & Work Items ──
      { table: "task_deliverables", column: "user_id" },
      { table: "task_health_flags", column: "user_id" },
      { table: "work_item_attachments", column: "user_id" },
      { table: "work_item_comments", column: "user_id" },
      { table: "work_item_history", column: "user_id" },
      { table: "work_items", column: "user_id" },
      { table: "tasks", column: "user_id" },
      { table: "external_tasks", column: "user_id" },

      // ── Contacts & CRM ──
      { table: "contact_notes", column: "user_id" },
      { table: "contact_ideas", column: "user_id" },
      { table: "contact_opportunities", column: "user_id" },
      { table: "contact_interactions", column: "user_id" },
      { table: "contact_relationships", column: "user_id" },
      { table: "contact_attributes", column: "user_id" },
      { table: "contact_history", column: "user_id" },
      { table: "contacts", column: "user_id" },

      // ── Email ──
      { table: "email_attachments", column: "user_id" },
      { table: "email_tracking", column: "user_id" },
      { table: "email_analytics", column: "user_id" },
      { table: "email_rules", column: "user_id" },
      { table: "email_drafts", column: "user_id" },
      { table: "email_outbox", column: "user_id" },
      { table: "lead_email_sequence_state", column: "user_id" },
      { table: "email_sequence_steps", column: "user_id" },
      { table: "email_sequences", column: "user_id" },
      { table: "emails", column: "user_id" },
      { table: "email_folder_assignments", column: "user_id" },
      { table: "email_folders", column: "user_id" },
      { table: "email_templates", column: "user_id" },
      { table: "email_accounts", column: "user_id" },

      // ── Calendar & Meetings ──
      { table: "calendar_events", column: "user_id" },
      { table: "meetings", column: "user_id" },
      { table: "promises", column: "user_id" },

      // ── Decisions ──
      { table: "decision_comments", column: "user_id" },
      { table: "decision_notifications", column: "user_id" },
      { table: "decision_events", column: "user_id" },
      { table: "decisions", column: "user_id" },

      // ── Entity Architecture ──
      { table: "content_publish_log", column: "user_id" },
      { table: "content_items", column: "created_by" },
      { table: "project_milestones", column: "user_id" },
      { table: "entity_projects", column: "owner_id" },
      { table: "brands", column: "owner_id" },
      { table: "entities", column: "owner_id" },

      // ── Automation ──
      { table: "automation_executions", column: "user_id" },
      { table: "automation_triggers", column: "user_id" },
      { table: "automation_logs", column: "user_id" },
      { table: "automation_queue", column: "owner_id" },
      { table: "content_queue", column: "user_id" },
      { table: "telegram_interactions", column: "user_id" },

      // ── Auth & Security ──
      { table: "two_factor_attempts", column: "user_id" },
      { table: "two_factor_recovery", column: "user_id" },
      { table: "oauth_states", column: "user_id" },
      { table: "sso_sessions", column: "user_id" },
      { table: "sso_login_attempts", column: "user_id" },

      // ── Teams & Projects ──
      { table: "team_members", column: "user_id" },
      { table: "project_members", column: "user_id" },

      // ── Notifications ──
      { table: "notifications", column: "user_id" },
      { table: "notification_preferences", column: "user_id" },
      { table: "push_subscriptions", column: "user_id" },

      // ── API & Webhooks ──
      { table: "api_rate_limit_violations", column: "user_id" },
      { table: "api_usage", column: "user_id" },
      { table: "api_usage_aggregates", column: "user_id" },
      { table: "api_billing", column: "user_id" },
      { table: "api_keys", column: "user_id" },
      { table: "webhook_deliveries", column: "user_id" },
      { table: "webhooks", column: "user_id" },

      // ── Skills & Training ──
      { table: "skill_executions", column: "user_id" },
      { table: "user_skills", column: "user_id" },
      { table: "skill_credentials", column: "user_id" },
      { table: "training_progress", column: "user_id" },
      { table: "training_enrollments", column: "user_id" },
      { table: "training_certificates", column: "user_id" },
      { table: "training_modules", column: "created_by" },

      // ── Marketplace ──
      { table: "marketplace_reviews", column: "user_id" },
      { table: "marketplace_purchases", column: "user_id" },
      { table: "marketplace_payouts", column: "user_id" },
      { table: "marketplace_items", column: "user_id" },

      // ── Partners & Referrals ──
      { table: "partner_commissions", column: "user_id" },
      { table: "partner_payouts", column: "user_id" },
      { table: "partner_referrals", column: "user_id" },
      { table: "partners", column: "user_id" },

      // ── Billing & Usage ──
      { table: "code_redemptions", column: "user_id" },
      { table: "overage_alerts", column: "user_id" },
      { table: "usage_tracking", column: "user_id" },

      // ── Expenses & Reminders ──
      { table: "expenses", column: "user_id" },
      { table: "reminders", column: "user_id" },

      // ── Matters & Command Center ──
      { table: "matters", column: "user_id" },

      // ── Onboarding & Activity ──
      { table: "onboarding_progress", column: "user_id" },
      { table: "activity_log", column: "user_id" },
      { table: "audit_log_exports", column: "user_id" },
      { table: "audit_logs", column: "user_id" },

      // ── Workspaces & UI ──
      { table: "user_workspaces", column: "user_id" },
      { table: "attention_items", column: "user_id" },
      { table: "briefing_cache", column: "user_id" },
      { table: "mentions", column: "user_id" },
      { table: "user_custom_permissions", column: "user_id" },

      // ── Integrations ──
      { table: "integration_actions", column: "user_id" },
      { table: "integrations", column: "user_id" },
      { table: "external_app_events", column: "user_id" },
      { table: "app_connections", column: "user_id" },

      // ── Conversion & Sales ──
      { table: "conversion_events", column: "user_id" },
      { table: "consultation_bookings", column: "user_id" },
      { table: "enterprise_demo_requests", column: "user_id" },

      // ── Collections & Organization ──
      { table: "smart_collections", column: "user_id" },
      { table: "folders", column: "user_id" },
      { table: "tags", column: "user_id" },
      { table: "item_stakeholders", column: "user_id" },
      { table: "item_relationships", column: "user_id" },

      // ── Beta & Misc ──
      { table: "beta_access", column: "user_id" },

      // ── Legacy profile table ──
      { table: "user_profiles", column: "user_id" },
    ];

    const errors: string[] = [];

    for (const { table, column } of deletionTables) {
      try {
        const { error } = await adminSupabase
          .from(table)
          .delete()
          .eq(column, userId);

        if (error && !error.message.includes("does not exist")) {
          errors.push(`${table}: ${error.message}`);
        }
      } catch {
        // Table might not exist — skip silently
      }
    }

    // 4. Nullify user references in tables owned by the org
    // (Where the user is referenced as assignee, reviewer, etc. but doesn't own the row)
    const nullifyColumns: { table: string; column: string }[] = [
      { table: "sales_contacts", column: "assigned_to" },
      { table: "exceptions", column: "assigned_to" },
      { table: "exceptions", column: "resolved_by" },
      { table: "exception_events", column: "performed_by" },
      { table: "document_action_items", column: "assignee_user_id" },
      { table: "document_action_items", column: "completed_by" },
      { table: "content_items", column: "submitted_by" },
      { table: "content_items", column: "reviewed_by" },
      { table: "content_queue", column: "approved_by" },
      { table: "project_stage_history", column: "changed_by" },
      { table: "promises", column: "made_to_user_id" },
      { table: "mentions", column: "mentioned_by_id" },
      { table: "overage_alerts", column: "acknowledged_by" },
    ];

    for (const { table, column } of nullifyColumns) {
      try {
        const { error } = await adminSupabase
          .from(table)
          .update({ [column]: null })
          .eq(column, userId);

        if (error && !error.message.includes("does not exist")) {
          errors.push(`nullify ${table}.${column}: ${error.message}`);
        }
      } catch {
        // Skip silently
      }
    }

    // 5. Delete org-level data if user is the only member
    if (organizationId) {
      const { data: orgMembers } = await adminSupabase
        .from("profiles")
        .select("id")
        .eq("organization_id", organizationId);

      // If this user is the last member, clean up all org data
      if (!orgMembers || orgMembers.length <= 1) {
        const orgDeletionTables = [
          // Billing & usage
          "usage_tracking",
          "usage_meters",
          "overage_alerts",
          "plan_overage_config",
          "subscriptions",
          "stripe_webhook_events",

          // Teams & invites
          "team_invitations",
          "team_consulting_advisors",
          "team_members",
          "teams",

          // Org context & health
          "organization_context",
          "executive_priorities",
          "system_health",

          // SSO
          "sso_providers",

          // Projects (org-scoped)
          "project_milestones",
          "project_stages",
          "projects",

          // The organization itself (last)
          "organizations",
        ];

        for (const table of orgDeletionTables) {
          try {
            const { error } = await adminSupabase
              .from(table)
              .delete()
              .eq(
                table === "organizations" ? "id" : "organization_id",
                organizationId
              );

            if (error && !error.message.includes("does not exist")) {
              errors.push(`org:${table}: ${error.message}`);
            }
          } catch {
            // Skip silently
          }
        }
      }
    }

    // 6. Delete profile
    try {
      await adminSupabase.from("profiles").delete().eq("id", userId);
    } catch (err) {
      errors.push(`profiles: ${err}`);
    }

    // 7. Delete auth user via admin API
    try {
      await adminSupabase.auth.admin.deleteUser(userId);
    } catch (err) {
      errors.push(`auth.deleteUser: ${err}`);
    }

    // 8. Log the deletion (for compliance audit trail)
    logger.security("Account deleted (GDPR)", {
      userId,
      email: user.email,
      tablesProcessed: deletionTables.length + nullifyColumns.length,
      deletionErrors: errors.length > 0 ? errors : undefined,
      path: "/api/user/account",
    });

    if (errors.length > 0) {
      console.error("[AccountDeletion] Partial errors:", errors);
    }

    return NextResponse.json({
      success: true,
      message:
        "Your account and all associated data have been permanently deleted.",
      errorsEncountered: errors.length,
    });
  } catch (error) {
    logger.error("Account deletion error", {
      error,
      path: "/api/user/account",
    });
    return NextResponse.json(
      { error: "Failed to delete account. Please contact support." },
      { status: 500 }
    );
  }
}

/**
 * GET /api/user/account
 *
 * Returns a summary of data that would be deleted.
 * Useful for showing the user what they're about to lose.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id, full_name, email, created_at")
      .eq("id", user.id)
      .single();

    const orgId = profile?.organization_id;

    // Count data across key tables
    const counts: Record<string, number> = {};

    const tablesToCount = [
      { table: "conversations", column: "user_id", label: "conversations" },
      { table: "conversation_messages", column: "user_id", label: "messages" },
      { table: "documents", column: "user_id", label: "documents" },
      { table: "contacts", column: "user_id", label: "contacts" },
      { table: "tasks", column: "user_id", label: "tasks" },
      { table: "ai_memories", column: "user_id", label: "ai_memories" },
      { table: "api_keys", column: "user_id", label: "api_keys" },
      { table: "emails", column: "user_id", label: "emails" },
      { table: "calendar_events", column: "user_id", label: "calendar_events" },
      { table: "entities", column: "owner_id", label: "entities" },
      { table: "brands", column: "owner_id", label: "brands" },
      { table: "integrations", column: "user_id", label: "integrations" },
      { table: "webhooks", column: "user_id", label: "webhooks" },
      { table: "training_enrollments", column: "user_id", label: "training_enrollments" },
    ];

    for (const { table, column, label } of tablesToCount) {
      try {
        const { count } = await supabase
          .from(table)
          .select("*", { count: "exact", head: true })
          .eq(column, user.id);
        counts[label] = count || 0;
      } catch {
        counts[label] = 0;
      }
    }

    return NextResponse.json({
      user: {
        email: user.email,
        name: profile?.full_name,
        memberSince: profile?.created_at,
      },
      dataSummary: counts,
      warning:
        "Deleting your account will permanently remove all this data. This action cannot be undone.",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch account data" },
      { status: 500 }
    );
  }
}
