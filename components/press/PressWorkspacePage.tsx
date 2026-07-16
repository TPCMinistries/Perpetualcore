"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, Archive, ArrowLeft, FileText, Film, Loader2, RefreshCw, Scissors, Send, Sparkles, Video } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClipCandidates } from "./ClipCandidates";
import { ExportsPanel } from "./ExportsPanel";
import { GenerationStudio } from "./GenerationStudio";
import { PublishPerformancePanel } from "./PublishPerformancePanel";
import { getErrorMessage, getPressProject, getPressTranscript, listPressClips, listPressRenders, updatePressProject } from "./api-client";
import { PressStatusBadge } from "./PressStatusBadge";
import { SourcePlayer } from "./SourcePlayer";
import { TranscriptEditor } from "./TranscriptEditor";
import type { PressClip, PressProject, PressRender, PressTranscript } from "./types";

export function PressWorkspacePage({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [project, setProject] = useState<PressProject | null>(null);
  const [transcript, setTranscript] = useState<PressTranscript | null>(null);
  const [clips, setClips] = useState<PressClip[]>([]);
  const [renders, setRenders] = useState<PressRender[]>([]);
  const [seekToMs, setSeekToMs] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("source");
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [archiving, setArchiving] = useState(false);

  async function archiveProject() {
    setArchiving(true);
    setError(null);
    try {
      await updatePressProject(projectId, { status: "archived" });
      router.push("/dashboard/press");
      router.refresh();
    } catch (archiveError) {
      setError(getErrorMessage(archiveError));
      setArchiveOpen(false);
    } finally {
      setArchiving(false);
    }
  }

  const load = useCallback(async (signal?: AbortSignal, background = false) => {
    if (background) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const [nextProject, nextTranscript, nextClips, nextRenders] = await Promise.all([
        getPressProject(projectId, signal),
        getPressTranscript(projectId, signal),
        listPressClips(projectId, signal),
        listPressRenders(projectId, signal),
      ]);
      setProject(nextProject);
      if (!background && nextProject.status === "review") setActiveTab("clips");
      setTranscript(nextTranscript);
      setClips(nextClips);
      setRenders(nextRenders);
    } catch (loadError) {
      if (loadError instanceof DOMException && loadError.name === "AbortError") return;
      setError(getErrorMessage(loadError));
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [projectId]);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  if (loading) {
    return <div className="flex min-h-[55vh] items-center justify-center" role="status"><Loader2 className="mr-2 h-5 w-5 animate-spin text-zinc-500 motion-reduce:animate-none" aria-hidden /><span className="text-sm text-zinc-600">Loading production workspace…</span></div>;
  }

  if (error || !project) {
    return (
      <div className="mx-auto max-w-2xl border border-red-200 bg-red-50 p-6" role="alert">
        <AlertCircle className="h-6 w-6 text-red-700" aria-hidden />
        <h1 className="mt-4 text-xl font-semibold text-red-950">This production workspace could not be loaded</h1>
        <p className="mt-2 text-sm text-red-800">{error || "The recording is unavailable."}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button variant="outline" className="h-11 bg-white" onClick={() => void load()}><RefreshCw className="mr-2 h-4 w-4" aria-hidden />Try again</Button>
          <Button asChild className="h-11 bg-zinc-950 text-white hover:bg-zinc-800"><Link href="/dashboard/press">Back to Press</Link></Button>
        </div>
      </div>
    );
  }

  const asset = project.assets?.find((item) => item.kind.startsWith("source"))
    ?? project.assets?.find((item) => item.kind === "source")
    ?? project.assets?.[0];
  const proxyAsset = project.assets?.find((item) => item.kind === "proxy" && item.fileSize > 0);
  const posterAsset = project.assets?.find((item) => item.kind === "poster" && item.fileSize > 0);

  return (
    <div className="pb-10">
      <Link href="/dashboard/press" className="inline-flex min-h-11 items-center text-sm font-medium text-zinc-600 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2">
        <ArrowLeft className="mr-2 h-4 w-4" aria-hidden /> Back to recordings
      </Link>

      <header className="mt-3 border-b border-zinc-300 pb-6">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div className="min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">Production workspace</p>
            <h1 className="mt-3 truncate text-3xl font-semibold tracking-[-0.035em] text-zinc-950">{project.title}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <PressStatusBadge status={project.status} />
              {asset?.fileName && <span className="max-w-full truncate text-xs text-zinc-500">{asset.fileName}</span>}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 self-start sm:self-auto">
            <Button type="button" variant="outline" className="h-11 rounded-md bg-white" onClick={() => void load(undefined, true)} disabled={refreshing}>
              <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin motion-reduce:animate-none" : ""}`} aria-hidden /> Refresh status
            </Button>
            {project.status !== "archived" && (
              <Button type="button" variant="outline" className="h-11 rounded-md bg-white text-zinc-700" onClick={() => setArchiveOpen(true)}>
                <Archive className="mr-2 h-4 w-4" aria-hidden /> Archive
              </Button>
            )}
          </div>
        </div>
        {project.status === "failed" && project.errorMessage && <div className="mt-5 flex items-start gap-2 border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />{project.errorMessage}</div>}
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
        <div className="overflow-x-auto pb-1">
          <TabsList className="h-12 min-w-max justify-start rounded-none border border-zinc-300 bg-white p-1">
            <TabsTrigger value="source" className="min-h-10 rounded-sm px-4 data-[state=active]:bg-zinc-950 data-[state=active]:text-white"><Video className="mr-2 h-4 w-4" aria-hidden />Source</TabsTrigger>
            <TabsTrigger value="transcript" className="min-h-10 rounded-sm px-4 data-[state=active]:bg-zinc-950 data-[state=active]:text-white"><FileText className="mr-2 h-4 w-4" aria-hidden />Transcript</TabsTrigger>
            <TabsTrigger value="generate" className="min-h-10 rounded-sm px-4 data-[state=active]:bg-zinc-950 data-[state=active]:text-white"><Sparkles className="mr-2 h-4 w-4" aria-hidden />Generate</TabsTrigger>
            <TabsTrigger value="clips" className="min-h-10 rounded-sm px-4 data-[state=active]:bg-zinc-950 data-[state=active]:text-white"><Scissors className="mr-2 h-4 w-4" aria-hidden />Clips {clips.length > 0 && <span className="ml-2 opacity-70">{clips.length}</span>}</TabsTrigger>
            <TabsTrigger value="exports" className="min-h-10 rounded-sm px-4 data-[state=active]:bg-zinc-950 data-[state=active]:text-white"><Film className="mr-2 h-4 w-4" aria-hidden />Exports {renders.length > 0 && <span className="ml-2 opacity-70">{renders.length}</span>}</TabsTrigger>
            <TabsTrigger value="publish" className="min-h-10 rounded-sm px-4 data-[state=active]:bg-zinc-950 data-[state=active]:text-white"><Send className="mr-2 h-4 w-4" aria-hidden />Publish</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="source" className="mt-6 focus-visible:ring-zinc-950">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <SourcePlayer asset={asset} playbackAsset={proxyAsset} posterAsset={posterAsset} seekToMs={seekToMs} />
            <aside className="border border-zinc-300 bg-white p-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">Source record</p>
              <dl className="mt-5 divide-y divide-zinc-200 text-sm">
                <div className="flex justify-between gap-4 py-3"><dt className="text-zinc-500">File</dt><dd className="max-w-[180px] truncate text-right font-medium text-zinc-900">{asset?.fileName || "Unavailable"}</dd></div>
                <div className="flex justify-between gap-4 py-3"><dt className="text-zinc-500">Type</dt><dd className="text-right font-medium text-zinc-900">{asset?.mimeType || "Unavailable"}</dd></div>
                <div className="flex justify-between gap-4 py-3"><dt className="text-zinc-500">Status</dt><dd className="text-right font-medium capitalize text-zinc-900">{project.status}</dd></div>
              </dl>
              <p className="mt-5 text-xs leading-5 text-zinc-500">The source remains unchanged. Transcript edits, clip approvals, and rendered outputs are tracked separately.</p>
            </aside>
          </div>
        </TabsContent>

        <TabsContent value="transcript" className="mt-6 focus-visible:ring-zinc-950">
          <div className="grid gap-6 xl:grid-cols-[minmax(320px,0.8fr)_minmax(0,1.2fr)] xl:items-start">
            <div className="xl:sticky xl:top-24"><SourcePlayer asset={asset} playbackAsset={proxyAsset} posterAsset={posterAsset} seekToMs={seekToMs} /></div>
            <TranscriptEditor transcript={transcript} onSeek={(milliseconds) => setSeekToMs(milliseconds)} onSaved={setTranscript} />
          </div>
        </TabsContent>

        <TabsContent value="generate" className="mt-6 focus-visible:ring-zinc-950">
          <GenerationStudio projectId={project.id} onReviewClips={() => setActiveTab("clips")} />
        </TabsContent>

        <TabsContent value="clips" className="mt-6 focus-visible:ring-zinc-950">
          <div className="mb-5">
            <h2 className="text-xl font-semibold tracking-tight text-zinc-950">Clip review</h2>
            <p className="mt-1 text-sm text-zinc-600">Approve only the moments that should move into rendering.</p>
          </div>
          <ClipCandidates clips={clips} onChange={(updated) => setClips((current) => current.map((clip) => clip.id === updated.id ? updated : clip))} onRenders={(created) => setRenders((current) => [...created, ...current.filter((item) => !created.some((next) => next.id === item.id))])} />
        </TabsContent>

        <TabsContent value="exports" className="mt-6 focus-visible:ring-zinc-950">
          <div className="mb-5">
            <h2 className="text-xl font-semibold tracking-tight text-zinc-950">Exports</h2>
            <p className="mt-1 text-sm text-zinc-600">Download completed variants. Links are generated securely when requested.</p>
          </div>
          <ExportsPanel renders={renders} />
        </TabsContent>

        <TabsContent value="publish" className="mt-6 focus-visible:ring-zinc-950">
          <PublishPerformancePanel projectId={project.id} renders={renders} />
        </TabsContent>
      </Tabs>

      <AlertDialog open={archiveOpen} onOpenChange={setArchiveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive this recording?</AlertDialogTitle>
            <AlertDialogDescription>
              It will leave the active archive but remain available under the Archived filter. Source files and production history are preserved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={archiving}>Keep recording</AlertDialogCancel>
            <AlertDialogAction disabled={archiving} onClick={(event) => { event.preventDefault(); void archiveProject(); }}>
              {archiving && <Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden />}
              Archive recording
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
