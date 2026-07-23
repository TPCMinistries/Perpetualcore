import { DevelopmentNav } from "@/components/development-intelligence/DevelopmentNav";
import { EnterpriseIntelligence } from "@/components/development-intelligence/agentic/EnterpriseIntelligence";

export const dynamic = "force-dynamic";

export default function DevelopmentEnterpriseIntelligencePage() {
  return <div className="space-y-6 pb-12"><DevelopmentNav /><EnterpriseIntelligence /></div>;
}
