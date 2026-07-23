import { DevelopmentNav } from "@/components/development-intelligence/DevelopmentNav";
import { RunDetail } from "@/components/development-intelligence/operations/RunDetail";

export const dynamic = "force-dynamic";

export default async function DevelopmentOperationRunPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <div className="space-y-6 pb-12"><DevelopmentNav /><RunDetail runId={id} /></div>;
}

