/**
 * Dead code — /consulting 301-redirects to /studio/engagements via next.config.mjs.
 * This file exists as belt-and-suspenders. The next.config.mjs redirect takes precedence.
 * Per Plan 12-06 Task 1, Option B selected (file kept as server-component redirect).
 */
import { redirect } from "next/navigation";

export default function ConsultingPage() {
  redirect("/studio/engagements");
}
