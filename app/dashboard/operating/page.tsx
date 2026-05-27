import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OperatingDashboard } from "@/components/operate/OperatingDashboard";

export const metadata = {
  title: "Operating Dashboard | Perpetual Core",
  description: "Client operating dashboard for Perpetual Core packages, leads, and active lanes.",
};

export default async function OperatingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <OperatingDashboard />;
}
