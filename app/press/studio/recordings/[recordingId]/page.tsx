import { PressWorkspacePage } from "@/components/press/PressWorkspacePage";

export default function PressStudioRecordingPage({ params }: { params: { recordingId: string } }) {
  return <PressWorkspacePage projectId={params.recordingId} />;
}
