import { DevelopmentNav } from "@/components/development-intelligence/DevelopmentNav";
import { RunQueue } from "@/components/development-intelligence/operations/RunQueue";

export const dynamic = "force-dynamic";

export default function DevelopmentOperationsPage() {
  return <div className="space-y-6 pb-12"><DevelopmentNav /><RunQueue /></div>;
}

