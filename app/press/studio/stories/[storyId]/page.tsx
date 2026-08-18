import { StoryWorkspacePage } from "@/components/press/stories/StoryWorkspacePage";

export default async function PressStudioStoryPage({
  params,
}: {
  params: Promise<{ storyId: string }>;
}) {
  const { storyId } = await params;
  return <StoryWorkspacePage storyId={storyId} />;
}
