import { redirect } from "next/navigation";

/**
 * Dashboard root redirects to the Perpetual Core operating command center.
 * The daily briefing remains available at /dashboard/home.
 */
export default function DashboardPage() {
  redirect("/dashboard/operating");
}
