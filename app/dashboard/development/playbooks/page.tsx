import { DevelopmentNav } from "@/components/development-intelligence/DevelopmentNav";
import { PlaybookStudio } from "@/components/development-intelligence/agentic/PlaybookStudio";

export const dynamic = "force-dynamic";

export default function DevelopmentPlaybooksPage() {
  return <div className="space-y-6 pb-12"><DevelopmentNav /><PlaybookStudio /></div>;
}
