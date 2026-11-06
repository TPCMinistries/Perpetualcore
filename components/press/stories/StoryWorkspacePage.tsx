"use client";

import { forwardRef, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowLeft, ChevronDown, Loader2, RefreshCw, StickyNote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { PRESS_STORY_VOICE_KEYS, PRESS_STORY_VOICES } from "@/lib/press/stories/voices";
import { getErrorMessage, getStory, updateStory } from "./api";
import { StoryAssetGrid } from "./StoryAssetGrid";
import { StoryInterview } from "./StoryInterview";
import { StoryOutputs } from "./StoryOutputs";
import { StoryStatusBadge } from "./StoryStatusBadge";
import { StoryUploader } from "./StoryUploader";
import type { PressStoryView } from "@/lib/press/stories/types";

type StepKey = "upload" | "interview" | "content";

const STEPS: { key: StepKey; label: string; number: number }[] = [
  { key: "upload", label: "Upload", number: 1 },
  { key: "interview", label: "Interview", number: 2 },
  { key: "content", label: "Content", number: 3 },
];

function initialStep(story: PressStoryView): StepKey {
  if (story.status === "generating" || story.status === "ready" || story.status === "failed") return "content";
  if (story.status === "interviewing" || story.interview.length > 0) return "interview";
  return "upload";
}

export function StoryWorkspacePage({ storyId }: { storyId: string }) {
  const [story, setStory] = useState<PressStoryView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openStep, setOpenStep] = useState<StepKey>("upload");

  const [titleDraft, setTitleDraft] = useState("");
  const [notesOpen, setNotesOpen] = useState(false);
  const [notesDraft, setNotesDraft] = useState("");
  const sectionRefs = useRef<Record<StepKey, HTMLDivElement | null>>({ upload: null, interview: null, content: null });

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getStory(storyId, signal);
      setStory(result);
      setOpenStep(initialStep(result));
      setTitleDraft(result.title);
      setNotesDraft(result.notes);
    } catch (loadError) {
      if (loadError instanceof DOMException && loadError.name === "AbortError") return;
      setError(getErrorMessage(loadError));
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [storyId]);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  function goToStep(step: StepKey) {
    setOpenStep(step);
    sectionRefs.current[step]?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function commitTitle() {
    if (!story) return;
    const trimmed = titleDraft.trim();
    if (!trimmed || trimmed === story.title) {
      setTitleDraft(story.title);
      return;
    }
    try {
      const updated = await updateStory(story.id, { title: trimmed });
      setStory((current) => (current ? { ...current, ...updated } : current));
    } catch {
      setTitleDraft(story.title); // Revert on failure; the PATCH error isn't critical enough to block the page.
    }
  }

  async function commitVoice(voiceKey: string) {
    if (!story) return;
    const previous = story.voice_key;
    setStory((current) => (current ? { ...current, voice_key: voiceKey as typeof current.voice_key } : current));
    try {
      await updateStory(story.id, { voice_key: voiceKey as typeof story.voice_key });
    } catch (voiceError) {
      setStory((current) => (current ? { ...current, voice_key: previous } : current));
      setError(getErrorMessage(voiceError));
    }
  }

  async function commitNotes() {
    if (!story) return;
    if (notesDraft === story.notes) return;
    try {
      const updated = await updateStory(story.id, { notes: notesDraft });
      setStory((current) => (current ? { ...current, ...updated } : current));
    } catch {
      setNotesDraft(story.notes);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[55vh] items-center justify-center" role="status">
        <Loader2 className="mr-2 h-5 w-5 animate-spin text-zinc-500 motion-reduce:animate-none" aria-hidden />
        <span className="text-sm text-zinc-600">Loading story…</span>
      </div>
    );
  }

  if (error || !story) {
    return (
      <div className="mx-auto max-w-2xl border border-red-200 bg-red-50 p-6" role="alert">
        <AlertCircle className="h-6 w-6 text-red-700" aria-hidden />
        <h1 className="mt-4 text-xl font-semibold text-red-950">This story could not be loaded</h1>
        <p className="mt-2 text-sm text-red-800">{error || "The story is unavailable."}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button variant="outline" className="h-11 bg-white" onClick={() => void load()}><RefreshCw className="mr-2 h-4 w-4" aria-hidden />Try again</Button>
          <Button asChild className="h-11 bg-[#1648d8] text-white hover:bg-[#1039ad]"><Link href="/press/studio/stories">Back to Stories</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-10">
      <Link href="/press/studio/stories" className="inline-flex min-h-11 items-center text-sm font-semibold text-black/60 hover:text-[#1648d8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1648d8] focus-visible:ring-offset-2">
        <ArrowLeft className="mr-2 h-4 w-4" aria-hidden /> Back to Stories
      </Link>

      <header className="mt-3 border border-black/10 bg-[#f6f1e8] p-5 sm:p-7">
        <label htmlFor="story-title-input" className="sr-only">Story title</label>
        <input
          id="story-title-input"
          value={titleDraft}
          onChange={(event) => setTitleDraft(event.target.value)}
          onBlur={() => void commitTitle()}
          maxLength={160}
          className="w-full truncate bg-transparent text-3xl font-black tracking-[-0.05em] text-[#121214] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1648d8] sm:text-4xl"
        />

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <StoryStatusBadge status={story.status} />
          <Select value={story.voice_key} onValueChange={(value) => void commitVoice(value)}>
            <SelectTrigger className="h-9 w-auto min-w-[160px] rounded-full border-black/15 bg-white text-xs font-semibold"><SelectValue /></SelectTrigger>
            <SelectContent>
              {PRESS_STORY_VOICE_KEYS.map((key) => (
                <SelectItem key={key} value={key}>{PRESS_STORY_VOICES[key].name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {story.status === "failed" && story.error_message && (
          <div className="mt-4 flex items-start gap-2 border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> {story.error_message}
          </div>
        )}

        <Collapsible open={notesOpen} onOpenChange={setNotesOpen} className="mt-4">
          <CollapsibleTrigger asChild>
            <button type="button" className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 text-xs font-semibold text-black/60 hover:text-[#1648d8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1648d8]">
              <StickyNote className="h-3.5 w-3.5" aria-hidden /> Notes <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", notesOpen && "rotate-180")} aria-hidden />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2">
            <label htmlFor="story-notes-input" className="sr-only">Notes</label>
            <Textarea
              id="story-notes-input"
              value={notesDraft}
              onChange={(event) => setNotesDraft(event.target.value)}
              onBlur={() => void commitNotes()}
              className="min-h-20 rounded-md bg-white text-sm"
              maxLength={4000}
            />
          </CollapsibleContent>
        </Collapsible>
      </header>

      <div className="sticky top-[72px] z-30 -mx-4 mt-4 flex gap-1 overflow-x-auto border-b border-black/10 bg-[#fffdf8]/95 px-4 py-2 backdrop-blur-xl sm:mx-0 sm:px-0 md:static md:border-0 md:bg-transparent md:px-0 md:py-0 md:backdrop-blur-none">
        {STEPS.map((step) => (
          <button
            key={step.key}
            type="button"
            onClick={() => goToStep(step.key)}
            className={cn(
              "inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1648d8]",
              openStep === step.key ? "border-[#1648d8] bg-[#1648d8] text-white" : "border-black/15 bg-white text-black/70 hover:border-black/30"
            )}
          >
            {step.number} {step.label}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-4">
        <StepSection
          ref={(node) => { sectionRefs.current.upload = node; }}
          title="Upload"
          number={1}
          subtitle={`${story.assets.length} file${story.assets.length === 1 ? "" : "s"}`}
          open={openStep === "upload"}
          onToggle={() => setOpenStep((current) => (current === "upload" ? "interview" : "upload"))}
        >
          <StoryUploader
            storyId={story.id}
            existingAssetCount={story.assets.length}
            onFinalized={(asset) => setStory((current) => (current ? { ...current, assets: [...current.assets, asset] } : current))}
          />
          <StoryAssetGrid
            storyId={story.id}
            assets={story.assets}
            onRemoved={(assetId) => setStory((current) => (current ? { ...current, assets: current.assets.filter((asset) => asset.id !== assetId) } : current))}
          />
        </StepSection>

        <StepSection
          ref={(node) => { sectionRefs.current.interview = node; }}
          title="Interview"
          number={2}
          subtitle={story.interview_complete ? "Complete" : story.interview.length > 0 ? "In progress" : "Not started"}
          open={openStep === "interview"}
          onToggle={() => setOpenStep((current) => (current === "interview" ? "content" : "interview"))}
        >
          <StoryInterview
            story={story}
            assetCount={story.assets.length}
            onStoryUpdate={(updated) => setStory((current) => (current ? { ...current, ...updated } : current))}
            onJumpToContent={() => goToStep("content")}
          />
        </StepSection>

        <StepSection
          ref={(node) => { sectionRefs.current.content = node; }}
          title="Content"
          number={3}
          subtitle={story.outputs ? "Ready" : "Not generated"}
          open={openStep === "content"}
          onToggle={() => setOpenStep((current) => (current === "content" ? "upload" : "content"))}
        >
          <StoryOutputs
            story={story}
            assets={story.assets}
            onStoryUpdate={(updated) => setStory(updated)}
          />
        </StepSection>
      </div>
    </div>
  );
}

interface StepSectionProps {
  title: string;
  number: number;
  subtitle: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const StepSection = forwardRef<HTMLDivElement, StepSectionProps>(({ title, number, subtitle, open, onToggle, children }, ref) => {
  return (
    <div ref={ref} className="scroll-mt-32 border border-black/10 bg-white">
      <Collapsible open={open} onOpenChange={onToggle}>
        <CollapsibleTrigger asChild>
          <button type="button" className="flex min-h-14 w-full cursor-pointer items-center justify-between gap-4 px-5 py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1648d8] focus-visible:ring-inset">
            <span className="flex items-center gap-3">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#121214] text-xs font-black text-white">{number}</span>
              <span className="text-lg font-black tracking-[-0.02em] text-[#121214]">{title}</span>
              <span className="text-xs text-black/50">{subtitle}</span>
            </span>
            <ChevronDown className={cn("h-4 w-4 shrink-0 text-black/50 transition-transform", open && "rotate-180")} aria-hidden />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="border-t border-black/10 px-5 py-5">{children}</CollapsibleContent>
      </Collapsible>
    </div>
  );
});
StepSection.displayName = "StepSection";
