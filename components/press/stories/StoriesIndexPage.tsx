"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight, Camera, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PRESS_STORY_VOICE_KEYS, PRESS_STORY_VOICES } from "@/lib/press/stories/voices";
import { createStory, getErrorMessage, listStories, type PressStoryListItem } from "./api";
import { formatRelativeTime } from "./format";
import { StoryStatusBadge } from "./StoryStatusBadge";

export function StoriesIndexPage() {
  const router = useRouter();
  const [stories, setStories] = useState<PressStoryListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [voiceKey, setVoiceKey] = useState(PRESS_STORY_VOICE_KEYS[0]);
  const [notes, setNotes] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const result = await listStories(signal);
      setStories(result);
    } catch (loadError) {
      if (loadError instanceof DOMException && loadError.name === "AbortError") return;
      setError(getErrorMessage(loadError));
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim() || creating) return;
    setCreating(true);
    setCreateError(null);
    try {
      const story = await createStory({ title: title.trim(), voice_key: voiceKey, notes: notes.trim() || undefined });
      router.push(`/press/studio/stories/${story.id}`);
    } catch (createErr) {
      setCreateError(getErrorMessage(createErr));
      setCreating(false);
    }
  }

  return (
    <div className="space-y-8 pb-6">
      <header className="relative overflow-hidden border border-black/10 bg-[#f6f1e8] px-5 py-8 sm:px-8 sm:py-10">
        <div className="pointer-events-none absolute -right-14 -top-16 h-44 w-44 rounded-full bg-[#c7f34b]" aria-hidden />
        <div className="relative max-w-3xl">
          <Link href="/press/studio" className="mb-4 inline-flex min-h-11 items-center text-sm font-semibold text-black/60 hover:text-[#1648d8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1648d8] focus-visible:ring-offset-2">
            <ArrowRight className="mr-2 h-4 w-4 rotate-180" aria-hidden /> Back to Press
          </Link>
          <div className="flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-black/60">
            <span className="h-1.5 w-1.5 rounded-full bg-[#ff3b5c]" aria-hidden />
            Press · Stories
          </div>
          <h1 className="mt-4 text-[clamp(2.2rem,8vw,4rem)] font-black leading-[0.94] tracking-[-0.06em] text-[#121214]">
            Turn today into content.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-black/65">
            Drop in the photos and videos from something you did today. Press interviews you, then hands back finished posts.
          </p>
        </div>
      </header>

      <section aria-labelledby="new-story-title" className="border border-black/10 bg-white p-5 sm:p-7">
        <p id="new-story-title" className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[#d91943]">New story</p>
        <form onSubmit={handleCreate} className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="story-title" className="text-xs text-zinc-600">Title</Label>
            <Input
              id="story-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Uplift CNA orientation, KBCC"
              className="h-12 rounded-md text-base"
              required
              maxLength={160}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="story-voice" className="text-xs text-zinc-600">Voice</Label>
            <Select value={voiceKey} onValueChange={(value) => setVoiceKey(value as typeof voiceKey)}>
              <SelectTrigger id="story-voice" className="h-12 rounded-md text-base"><SelectValue /></SelectTrigger>
              <SelectContent>
                {PRESS_STORY_VOICE_KEYS.map((key) => (
                  <SelectItem key={key} value={key}>{PRESS_STORY_VOICES[key].name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="story-notes" className="text-xs text-zinc-600">Notes (optional)</Label>
            <Textarea
              id="story-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Anything worth knowing up front — who was there, what happened, why it mattered."
              className="min-h-24 rounded-md text-base"
              maxLength={4000}
            />
          </div>
          {createError && (
            <div className="flex items-start gap-2 border border-red-200 bg-red-50 p-3 text-sm text-red-800 sm:col-span-2" role="alert">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <span>{createError}</span>
            </div>
          )}
          <div className="sm:col-span-2">
            <Button type="submit" className="h-12 w-full rounded-full bg-[#ff3b5c] px-6 text-base font-black text-[#121214] hover:bg-[#ff7288] sm:w-auto" disabled={creating || !title.trim()}>
              {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden /> : <Camera className="mr-2 h-4 w-4" aria-hidden />}
              {creating ? "Starting…" : "Start a story"}
            </Button>
          </div>
        </form>
      </section>

      {loading && (
        <div className="flex min-h-40 items-center justify-center border border-black/10 bg-white" role="status">
          <Loader2 className="mr-2 h-5 w-5 animate-spin text-[#1648d8] motion-reduce:animate-none" aria-hidden />
          <span className="text-sm text-black/60">Loading your stories…</span>
        </div>
      )}

      {!loading && error && (
        <div className="border border-red-200 bg-red-50 p-5" role="alert">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-700" aria-hidden />
            <div className="flex-1">
              <h2 className="font-medium text-red-950">Stories could not be loaded</h2>
              <p className="mt-1 text-sm text-red-800">{error}</p>
              <Button type="button" variant="outline" className="mt-4 h-11 border-red-300 bg-white" onClick={() => void load()}>
                <RefreshCw className="mr-2 h-4 w-4" aria-hidden /> Try again
              </Button>
            </div>
          </div>
        </div>
      )}

      {!loading && !error && stories.length === 0 && (
        <div className="border border-black/10 bg-white">
          <EmptyState
            icon={Camera}
            title="Your first story starts above"
            description="Give it a title and a voice, then add the photos and videos from today. Press does the rest."
          />
        </div>
      )}

      {!loading && !error && stories.length > 0 && (
        <section aria-labelledby="stories-list-title">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[#1648d8]">Your workspace</p>
              <h2 id="stories-list-title" className="mt-2 text-2xl font-black tracking-[-0.04em] text-[#121214]">Stories</h2>
            </div>
            <p className="text-sm text-black/50">{stories.length} total</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {stories.map((story) => (
              <Link
                key={story.id}
                href={`/press/studio/stories/${story.id}`}
                className="group flex min-h-40 flex-col justify-between border border-black/10 bg-white p-5 transition-colors duration-200 hover:border-[#1648d8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1648d8] focus-visible:ring-offset-2"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="min-w-0 truncate text-lg font-black tracking-[-0.02em] text-[#121214]">{story.title}</h3>
                    <ArrowRight className="h-4 w-4 shrink-0 text-zinc-400 transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none" aria-hidden />
                  </div>
                  <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-black/50">{PRESS_STORY_VOICES[story.voice_key]?.name ?? story.voice_key}</p>
                </div>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <StoryStatusBadge status={story.status} />
                  <span className="text-xs text-zinc-500">{story.asset_count} {story.asset_count === 1 ? "file" : "files"} · {formatRelativeTime(story.updated_at)}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
