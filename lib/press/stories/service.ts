import {
  PRESS_EDITOR_ROLES,
  PRESS_READ_ROLES,
  PressHttpError,
  requireOrganizationAccess,
} from "../auth";
import { PRESS_ASSET_BUCKET, createPressAdminClient } from "../db";
import type { PressStory, PressStoryAsset, PressStoryAssetView, PressStoryView } from "./types";

type PressAdminClient = ReturnType<typeof createPressAdminClient>;

export function asStory(value: unknown): PressStory {
  return value as PressStory;
}

export function asStoryAsset(value: unknown): PressStoryAsset {
  return value as PressStoryAsset;
}

export function rows<T>(value: unknown): T[] {
  return (value ?? []) as T[];
}

/** Loads a story by id and enforces org membership; mutate=true requires an editor role. */
export async function requireStory(storyId: string, options: { mutate?: boolean } = {}) {
  const admin = createPressAdminClient();
  const { data, error } = await admin.from("press_stories").select("*").eq("id", storyId).maybeSingle();
  if (error) throw error;
  if (!data) throw new PressHttpError(404, "Press story not found");
  const story = asStory(data);
  const allowedRoles = options.mutate ? PRESS_EDITOR_ROLES : PRESS_READ_ROLES;
  const { user, role } = await requireOrganizationAccess(story.organization_id, allowedRoles);
  return { story, user, role };
}

/** Loads a story asset scoped to its story and enforces org membership; mutate=true requires an editor role. */
export async function requireStoryAsset(
  storyId: string,
  assetId: string,
  options: { mutate?: boolean } = {},
) {
  const { story, user, role } = await requireStory(storyId, options);
  const admin = createPressAdminClient();
  const { data, error } = await admin.from("press_story_assets").select("*")
    .eq("id", assetId).eq("story_id", storyId).maybeSingle();
  if (error) throw error;
  if (!data) throw new PressHttpError(404, "Press story asset not found");
  return { story, asset: asStoryAsset(data), user, role };
}

/** Mints 1h signed read URLs for a batch of story assets (and their poster frames). */
export async function signStoryAssets(
  admin: PressAdminClient,
  assets: PressStoryAsset[],
): Promise<PressStoryAssetView[]> {
  if (assets.length === 0) return [];
  const paths = [
    ...new Set(
      assets.flatMap((asset) => [asset.storage_path, asset.poster_path].filter((path): path is string => Boolean(path))),
    ),
  ];
  if (paths.length === 0) return assets.map((asset) => ({ ...asset, url: null, poster_url: null }));
  const { data, error } = await admin.storage.from(PRESS_ASSET_BUCKET).createSignedUrls(paths, 3600);
  if (error) throw error;
  const urlByPath = new Map<string, string>();
  for (const item of data ?? []) {
    if (item.path && item.signedUrl) urlByPath.set(item.path, item.signedUrl);
  }
  return assets.map((asset) => ({
    ...asset,
    url: urlByPath.get(asset.storage_path) ?? null,
    poster_url: asset.poster_path ? urlByPath.get(asset.poster_path) ?? null : null,
  }));
}

export function toStoryView(story: PressStory, assets: PressStoryAssetView[]): PressStoryView {
  return { ...story, assets };
}
