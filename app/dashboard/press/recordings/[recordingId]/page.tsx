import { redirect } from "next/navigation";

export default async function PressRecordingPage({
  params,
}: {
  params: Promise<{ recordingId: string }>;
}) {
  const { recordingId } = await params;
  redirect(`/press/studio/recordings/${recordingId}`);
}
