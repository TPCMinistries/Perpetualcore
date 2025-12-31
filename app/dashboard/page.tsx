import { redirect } from "next/navigation";

/**
 * Dashboard root redirects to the new Daily Briefing Home
 * The original dashboard is preserved at /dashboard/overview
 */
export default function DashboardPage() {
  redirect("/dashboard/home");
}
