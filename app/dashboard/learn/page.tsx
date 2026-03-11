import { redirect } from "next/navigation";
import { getUser, getUserProfile } from "@/lib/auth/actions";
import { LearnClient } from "./LearnClient";

export const metadata = {
  title: "Learn — AI Academy | Perpetual Core",
  description:
    "AI certification tracks, cohort management, and corporate training through IHA Academy.",
};

export default async function LearnPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const profile = await getUserProfile();
  if (!profile) redirect("/login");

  return (
    <LearnClient
      userEmail={profile.email}
      userName={profile.full_name}
    />
  );
}
