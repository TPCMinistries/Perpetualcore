import { ProfileDetail } from "@/components/development-intelligence/profiles/ProfileDetail";

export const dynamic = "force-dynamic";

export default async function DevelopmentProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ProfileDetail subjectId={id} />;
}

