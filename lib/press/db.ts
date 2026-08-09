import { createAdminClient } from "@/lib/supabase/server";

/** Service-role client for trusted Press background and tenant-scoped server operations. */
export const createPressAdminClient = createAdminClient;

export const PRESS_ASSET_BUCKET = "press-assets";
export const PRESS_RENDER_BUCKET = "press-renders";
