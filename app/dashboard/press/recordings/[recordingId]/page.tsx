import { PressWorkspacePage } from "@/components/press/PressWorkspacePage";

export default function PressRecordingPage({ params }: { params: { recordingId: string } }) {
  return <PressWorkspacePage projectId={params.recordingId} />;
}
