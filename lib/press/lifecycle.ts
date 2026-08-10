import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

type PressAdminClient = SupabaseClient<Database>;

const PRESS_MEDIA_BUCKETS = ["press-assets", "press-renders"] as const;
const LIST_PAGE_SIZE = 100;
const MAX_OBJECTS_PER_PROJECT = 5_000;

async function listProjectObjects(
  admin: PressAdminClient,
  bucket: string,
  prefix: string,
  depth = 0,
): Promise<string[]> {
  if (depth > 6) throw new Error("Press Storage path depth is invalid");
  const paths: string[] = [];
  for (let offset = 0; ; offset += LIST_PAGE_SIZE) {
    const { data, error } = await admin.storage.from(bucket).list(prefix, {
      limit: LIST_PAGE_SIZE,
      offset,
      sortBy: { column: "name", order: "asc" },
    });
    if (error) throw error;
    const items = data ?? [];
    for (const item of items) {
      const path = `${prefix}/${item.name}`;
      if (item.id) {
        paths.push(path);
      } else {
        paths.push(...await listProjectObjects(admin, bucket, path, depth + 1));
      }
      if (paths.length > MAX_OBJECTS_PER_PROJECT) {
        throw new Error("Press project contains too many Storage objects for guided-pilot deletion");
      }
    }
    if (items.length < LIST_PAGE_SIZE) break;
  }
  return paths;
}

async function removeInBatches(admin: PressAdminClient, bucket: string, paths: string[]): Promise<number> {
  let removed = 0;
  for (let index = 0; index < paths.length; index += 100) {
    const batch = paths.slice(index, index + 100);
    const { error } = await admin.storage.from(bucket).remove(batch);
    if (error) throw error;
    removed += batch.length;
  }
  return removed;
}

export async function deletePressProjectStorage(
  admin: PressAdminClient,
  input: { projectId: string; organizationId: string },
): Promise<{ removedObjects: number }> {
  const projectPrefix = `${input.organizationId}/${input.projectId}`;
  const byBucket = new Map<string, Set<string>>(PRESS_MEDIA_BUCKETS.map((bucket) => [bucket, new Set()]));
  const addRecordedPath = (bucket: string, path: string) => {
    if (!byBucket.has(bucket) || !path.startsWith(`${projectPrefix}/`)) {
      throw new Error("Press Storage record is outside the verified project boundary");
    }
    byBucket.get(bucket)?.add(path);
  };
  const [assetResult, renderResult] = await Promise.all([
    admin.from("press_assets").select("bucket, storage_path")
      .eq("project_id", input.projectId).eq("organization_id", input.organizationId),
    admin.from("press_renders").select("output_bucket, output_path")
      .eq("project_id", input.projectId).eq("organization_id", input.organizationId),
  ]);
  if (assetResult.error) throw assetResult.error;
  if (renderResult.error) throw renderResult.error;

  for (const asset of assetResult.data ?? []) {
    addRecordedPath(asset.bucket, asset.storage_path);
  }
  for (const render of renderResult.data ?? []) {
    if (render.output_bucket && render.output_path) {
      addRecordedPath(render.output_bucket, render.output_path);
    }
  }

  for (const bucket of PRESS_MEDIA_BUCKETS) {
    const discovered = await listProjectObjects(admin, bucket, projectPrefix);
    for (const path of discovered) byBucket.get(bucket)?.add(path);
  }

  let removedObjects = 0;
  for (const bucket of PRESS_MEDIA_BUCKETS) {
    const paths = [...(byBucket.get(bucket) ?? [])].sort();
    removedObjects += await removeInBatches(admin, bucket, paths);
    const remaining = await listProjectObjects(admin, bucket, projectPrefix);
    if (remaining.length > 0) throw new Error("Press Storage cleanup could not be verified");
  }
  return { removedObjects };
}
