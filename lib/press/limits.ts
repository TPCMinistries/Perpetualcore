import { PressHttpError } from "./auth";
import { createPressAdminClient } from "./db";
import { PRESS_MAX_FILE_BYTES } from "./media";

export const PRESS_MAX_ORG_STORAGE_BYTES = 10 * 1024 * 1024 * 1024;
export const PRESS_MAX_ACTIVE_JOBS = 8;
export const PRESS_MAX_ACTIVE_PROJECTS = 25;

type PressAdminClient = ReturnType<typeof createPressAdminClient>;

export async function assertPressProjectCapacity(
  admin: PressAdminClient,
  organizationId: string,
): Promise<void> {
  const { count, error } = await admin.from("press_projects")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .neq("status", "archived");
  if (error) throw error;
  if ((count ?? 0) >= PRESS_MAX_ACTIVE_PROJECTS) {
    throw new PressHttpError(429, "This workspace has reached its active recording limit. Archive a recording before adding another.");
  }
}

export async function assertPressUploadCapacity(
  admin: PressAdminClient,
  input: { organizationId: string; projectId: string; fileSize: number },
): Promise<void> {
  if (input.fileSize > PRESS_MAX_FILE_BYTES) {
    throw new PressHttpError(413, "This recording is larger than the 512 MB pilot upload limit.");
  }

  const [sourceResult, assetsResult] = await Promise.all([
    admin.from("press_assets")
      .select("id", { count: "exact", head: true })
      .eq("project_id", input.projectId)
      .eq("organization_id", input.organizationId)
      .in("kind", ["source", "source_video", "source_audio"]),
    admin.from("press_assets")
      .select("file_size")
      .eq("organization_id", input.organizationId)
      .limit(1001),
  ]);
  if (sourceResult.error) throw sourceResult.error;
  if (assetsResult.error) throw assetsResult.error;
  if ((sourceResult.count ?? 0) > 0) {
    throw new PressHttpError(409, "This recording already has a source file. Start a new recording to upload another.");
  }
  if ((assetsResult.data?.length ?? 0) > 1000) {
    throw new PressHttpError(429, "This workspace has reached its media item limit.");
  }
  const reservedBytes = (assetsResult.data ?? []).reduce(
    (total, asset) => total + Number(asset.file_size ?? 0),
    0,
  );
  if (reservedBytes + input.fileSize > PRESS_MAX_ORG_STORAGE_BYTES) {
    throw new PressHttpError(413, "This upload would exceed the workspace's 10 GB storage allowance.");
  }
}

export async function assertPressJobCapacity(
  admin: PressAdminClient,
  organizationId: string,
  additionalJobs = 1,
): Promise<void> {
  const { count, error } = await admin.from("press_jobs")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .in("status", ["pending", "processing", "failed"]);
  if (error) throw error;
  if ((count ?? 0) + additionalJobs > PRESS_MAX_ACTIVE_JOBS) {
    throw new PressHttpError(429, "This workspace already has several media jobs in progress. Try again after they finish.");
  }
}
