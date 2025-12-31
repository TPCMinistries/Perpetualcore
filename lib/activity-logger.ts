import { SupabaseClient } from "@supabase/supabase-js";

type ActionType =
  | "created"
  | "updated"
  | "deleted"
  | "completed"
  | "assigned"
  | "commented"
  | "mentioned"
  | "shared"
  | "archived"
  | "restored"
  | "uploaded"
  | "downloaded";

type EntityType =
  | "task"
  | "project"
  | "document"
  | "contact"
  | "email"
  | "automation"
  | "workflow"
  | "meeting"
  | "comment"
  | "file";

interface LogActivityOptions {
  supabase: SupabaseClient;
  userId: string;
  action: ActionType;
  entityType: EntityType;
  entityId: string;
  entityName: string;
  metadata?: Record<string, any>;
  isPublic?: boolean;
  visibleToUserIds?: string[];
}

/**
 * Log an activity to the activity feed
 * Non-blocking - errors are logged but don't throw
 */
export async function logActivity({
  supabase,
  userId,
  action,
  entityType,
  entityId,
  entityName,
  metadata = {},
  isPublic = true,
  visibleToUserIds,
}: LogActivityOptions): Promise<void> {
  try {
    // Get user profile for org and name
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id, full_name")
      .eq("id", userId)
      .single();

    if (!profile?.organization_id) {
      console.warn("Activity logger: No organization found for user");
      return;
    }

    await supabase.from("activity_feed").insert({
      organization_id: profile.organization_id,
      actor_user_id: userId,
      actor_name: profile.full_name || "Unknown",
      action_type: action,
      entity_type: entityType,
      entity_id: entityId,
      entity_name: entityName,
      metadata,
      is_public: isPublic,
      visible_to_user_ids: visibleToUserIds || null,
    });
  } catch (error) {
    // Log but don't throw - activity logging shouldn't break operations
    console.error("Failed to log activity:", error);
  }
}

/**
 * Batch log multiple activities
 */
export async function logActivities(
  supabase: SupabaseClient,
  userId: string,
  activities: Omit<LogActivityOptions, "supabase" | "userId">[]
): Promise<void> {
  for (const activity of activities) {
    await logActivity({
      supabase,
      userId,
      ...activity,
    });
  }
}

/**
 * Helper to generate activity descriptions
 */
export function getActivityDescription(
  actorName: string,
  action: ActionType,
  entityType: EntityType,
  entityName: string
): string {
  const actionVerbs: Record<ActionType, string> = {
    created: "created",
    updated: "updated",
    deleted: "deleted",
    completed: "completed",
    assigned: "assigned",
    commented: "commented on",
    mentioned: "mentioned you in",
    shared: "shared",
    archived: "archived",
    restored: "restored",
    uploaded: "uploaded",
    downloaded: "downloaded",
  };

  const entityLabels: Record<EntityType, string> = {
    task: "task",
    project: "project",
    document: "document",
    contact: "contact",
    email: "email",
    automation: "automation",
    workflow: "workflow",
    meeting: "meeting",
    comment: "comment",
    file: "file",
  };

  return `${actorName} ${actionVerbs[action]} ${entityLabels[entityType]} "${entityName}"`;
}
