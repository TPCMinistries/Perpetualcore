import { DevelopmentNav } from "@/components/development-intelligence/DevelopmentNav";
import { AgentCommandCenter } from "@/components/development-intelligence/agentic/AgentCommandCenter";

export const dynamic = "force-dynamic";

export default function DevelopmentAgentPage() {
  return <div className="space-y-6 pb-12"><DevelopmentNav /><AgentCommandCenter /></div>;
}
