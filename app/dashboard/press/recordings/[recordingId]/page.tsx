import { redirect } from "next/navigation";

export default function PressRecordingPage({ params }: { params: { recordingId: string } }) {
  redirect(`/press/studio/recordings/${params.recordingId}`);
}
