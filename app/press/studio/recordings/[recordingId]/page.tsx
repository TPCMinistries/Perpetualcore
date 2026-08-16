import { PressWorkspacePage } from "@/components/press/PressWorkspacePage";

export default async function PressStudioRecordingPage({
  params,
}: {
  params: Promise<{ recordingId: string }>;
}) {
  const { recordingId } = await params;
  return <PressWorkspacePage projectId={recordingId} />;
}
