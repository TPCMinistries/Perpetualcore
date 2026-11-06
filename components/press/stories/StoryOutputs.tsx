"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, Check, Copy, Download, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { PressStoryAssetView, PressStoryView } from "@/lib/press/stories/types";
import { generateStoryContent, getErrorMessage, PressStoriesApiError } from "./api";

const ROTATING_STATUS = [
  "Reading through your photos and notes…",
  "Weighing what came out in the interview…",
  "Drafting in your voice…",
  "Building the LinkedIn, Instagram, and X versions…",
  "Writing captions for each photo…",
  "Almost there…",
];

function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      type="button"
      variant="outline"
      className="h-9 rounded-full border-black/15 bg-white px-3 text-xs font-semibold"
      onClick={() => {
        void navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? <Check className="mr-1.5 h-3.5 w-3.5" aria-hidden /> : <Copy className="mr-1.5 h-3.5 w-3.5" aria-hidden />}
      {copied ? "Copied" : label}
    </Button>
  );
}

function buildMarkdown(story: PressStoryView, edits: { linkedin: string; instagram: string; xThread: string[]; newsletter: { subject: string; body: string } }): string {
  const outputs = story.outputs;
  if (!outputs) return "";
  const lines: string[] = [`# ${outputs.headline}`, "", outputs.summary, "", "## LinkedIn", "", edits.linkedin, "", "## Instagram", "", edits.instagram, "", "## X Thread", ""];
  edits.xThread.forEach((post, index) => lines.push(`${index + 1}. ${post}`));
  lines.push("", "## Newsletter", "", `Subject: ${edits.newsletter.subject}`, "", edits.newsletter.body, "", "## Photo captions", "");
  outputs.photo_captions.forEach((item) => lines.push(`- ${item.caption}`));
  lines.push("", "## Hooks", "");
  outputs.hooks.forEach((hook) => lines.push(`- ${hook}`));
  return lines.join("\n");
}

export function StoryOutputs({
  story,
  assets,
  onStoryUpdate,
}: {
  story: PressStoryView;
  assets: PressStoryAssetView[];
  onStoryUpdate: (story: PressStoryView) => void;
}) {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusLine, setStatusLine] = useState(ROTATING_STATUS[0]);
  const statusIndexRef = useRef(0);

  const outputs = story.outputs;
  const [linkedinEdit, setLinkedinEdit] = useState(outputs?.linkedin ?? "");
  const [instagramEdit, setInstagramEdit] = useState(outputs?.instagram ?? "");
  const [xThreadEdit, setXThreadEdit] = useState<string[]>(outputs?.x_thread ?? []);
  const [newsletterSubjectEdit, setNewsletterSubjectEdit] = useState(outputs?.newsletter.subject ?? "");
  const [newsletterBodyEdit, setNewsletterBodyEdit] = useState(outputs?.newsletter.body ?? "");

  useEffect(() => {
    setLinkedinEdit(outputs?.linkedin ?? "");
    setInstagramEdit(outputs?.instagram ?? "");
    setXThreadEdit(outputs?.x_thread ?? []);
    setNewsletterSubjectEdit(outputs?.newsletter.subject ?? "");
    setNewsletterBodyEdit(outputs?.newsletter.body ?? "");
  }, [outputs]);

  useEffect(() => {
    if (!generating) return;
    const interval = setInterval(() => {
      statusIndexRef.current = (statusIndexRef.current + 1) % ROTATING_STATUS.length;
      setStatusLine(ROTATING_STATUS[statusIndexRef.current]);
    }, 4000);
    return () => clearInterval(interval);
  }, [generating]);

  async function handleGenerate() {
    if (generating) return;
    setGenerating(true);
    setError(null);
    statusIndexRef.current = 0;
    setStatusLine(ROTATING_STATUS[0]);
    try {
      const updated = await generateStoryContent(story.id);
      onStoryUpdate(updated);
    } catch (generateError) {
      if (generateError instanceof PressStoriesApiError && generateError.status === 502) {
        setError("Generation timed out. This can happen on longer stories — try again.");
      } else {
        setError(getErrorMessage(generateError));
      }
    } finally {
      setGenerating(false);
    }
  }

  function downloadMarkdown() {
    if (!story.outputs) return;
    const markdown = buildMarkdown(story, { linkedin: linkedinEdit, instagram: instagramEdit, xThread: xThreadEdit, newsletter: { subject: newsletterSubjectEdit, body: newsletterBodyEdit } });
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${story.title.replace(/[^a-z0-9-]+/gi, "-").toLowerCase() || "story"}.md`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  const assetById = new Map(assets.map((asset) => [asset.id, asset]));

  if (generating) {
    return (
      <div className="flex min-h-56 flex-col items-center justify-center border border-black/10 bg-[#f6f1e8] p-8 text-center" role="status" aria-live="polite">
        <Loader2 className="h-8 w-8 animate-spin text-[#1648d8] motion-reduce:animate-none" aria-hidden />
        <p className="mt-4 text-base font-black text-[#121214]">Writing your posts…</p>
        <p className="mt-1 text-sm text-black/60">{statusLine}</p>
        <p className="mt-3 text-xs text-black/40">This usually takes 30–90 seconds.</p>
      </div>
    );
  }

  if (!outputs) {
    return (
      <div className="border border-black/10 bg-[#f6f1e8] p-5 text-center sm:p-8">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#c7f34b]">
          <Sparkles className="h-5 w-5 text-[#121214]" aria-hidden />
        </span>
        <p className="mt-4 text-base font-black text-[#121214]">Ready to write your posts</p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-black/60">
          {story.interview_complete ? "Press will use your photos, videos, and interview to draft everything below." : "Finish (or skip) the interview first, then generate."}
        </p>
        {error && (
          <div className="mx-auto mt-4 flex max-w-sm items-start gap-2 border border-red-200 bg-red-50 p-3 text-left text-sm text-red-800" role="alert">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span>{error}</span>
          </div>
        )}
        <Button
          type="button"
          className="mt-5 h-12 rounded-full bg-[#ff3b5c] px-6 text-base font-black text-[#121214] hover:bg-[#ff7288]"
          disabled={!story.interview_complete}
          onClick={() => void handleGenerate()}
        >
          <Sparkles className="mr-2 h-4 w-4" aria-hidden /> Generate content
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 border border-black/10 bg-white p-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-black/50">Generated {new Date(outputs.generated_at).toLocaleString()}</p>
          <p className="mt-1 text-sm text-black/60">Edits below are local only — copy or download what you want to keep.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" className="h-10 rounded-full bg-white" onClick={() => void handleGenerate()}>
            <RefreshCw className="mr-2 h-4 w-4" aria-hidden /> Regenerate
          </Button>
          <Button type="button" variant="outline" className="h-10 rounded-full bg-white" onClick={downloadMarkdown}>
            <Download className="mr-2 h-4 w-4" aria-hidden /> Download all as Markdown
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>{error}</span>
        </div>
      )}

      <section className="border border-black/10 bg-white p-4">
        <h3 className="text-lg font-black tracking-[-0.02em] text-[#121214]">{outputs.headline}</h3>
        <p className="mt-2 text-sm leading-6 text-black/70">{outputs.summary}</p>
      </section>

      <OutputBlock title="LinkedIn" value={linkedinEdit} onChange={setLinkedinEdit} copyText={linkedinEdit} />
      <OutputBlock title="Instagram" value={instagramEdit} onChange={setInstagramEdit} copyText={instagramEdit} />

      <section className="border border-black/10 bg-white p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#1648d8]">X Thread</p>
          <CopyButton text={xThreadEdit.join("\n\n")} label="Copy thread" />
        </div>
        <ol className="mt-3 space-y-3">
          {xThreadEdit.map((post, index) => (
            <li key={index} className="border border-zinc-200 bg-[#f6f1e8] p-3">
              <p className="mb-1.5 font-mono text-[10px] text-black/50">{index + 1}/{xThreadEdit.length}</p>
              <Textarea
                value={post}
                onChange={(event) => setXThreadEdit((current) => current.map((item, itemIndex) => (itemIndex === index ? event.target.value : item)))}
                className="min-h-16 rounded-md border-zinc-300 bg-white text-sm"
              />
            </li>
          ))}
        </ol>
      </section>

      <section className="border border-black/10 bg-white p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#1648d8]">Newsletter</p>
          <CopyButton text={`${newsletterSubjectEdit}\n\n${newsletterBodyEdit}`} />
        </div>
        <label htmlFor="newsletter-subject" className="mt-3 block text-xs text-zinc-600">Subject</label>
        <input
          id="newsletter-subject"
          value={newsletterSubjectEdit}
          onChange={(event) => setNewsletterSubjectEdit(event.target.value)}
          className="mt-1 h-11 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1648d8]"
        />
        <label htmlFor="newsletter-body" className="mt-3 block text-xs text-zinc-600">Body</label>
        <Textarea id="newsletter-body" value={newsletterBodyEdit} onChange={(event) => setNewsletterBodyEdit(event.target.value)} className="mt-1 min-h-32 rounded-md text-sm" />
      </section>

      {outputs.photo_captions.length > 0 && (
        <section className="border border-black/10 bg-white p-4">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#1648d8]">Photo captions</p>
          <ul className="mt-3 space-y-3">
            {outputs.photo_captions.map((item) => {
              const asset = assetById.get(item.asset_id);
              const thumb = asset ? (asset.kind === "video" ? asset.poster_url : asset.url) : null;
              return (
                <li key={item.asset_id} className="flex items-start gap-3 border border-zinc-200 bg-[#f6f1e8] p-3">
                  <div className="h-14 w-14 shrink-0 overflow-hidden border border-black/10 bg-zinc-100">
                    {/* eslint-disable-next-line @next/next/no-img-element -- signed Supabase URL */}
                    {thumb && <img src={thumb} alt="" className="h-full w-full object-cover" loading="lazy" />}
                  </div>
                  <p className="flex-1 text-sm leading-6 text-black/75">{item.caption}</p>
                  <CopyButton text={item.caption} />
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {outputs.hooks.length > 0 && (
        <section className="border border-black/10 bg-white p-4">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#1648d8]">Hooks</p>
          <ul className="mt-3 space-y-2">
            {outputs.hooks.map((hook, index) => (
              <li key={index} className="flex items-center justify-between gap-3 border border-zinc-200 bg-[#f6f1e8] px-3 py-2 text-sm text-black/75">
                <span>{hook}</span>
                <CopyButton text={hook} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function OutputBlock({ title, value, onChange, copyText }: { title: string; value: string; onChange: (value: string) => void; copyText: string }) {
  return (
    <section className="border border-black/10 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#1648d8]">{title}</p>
        <CopyButton text={copyText} />
      </div>
      <Textarea value={value} onChange={(event) => onChange(event.target.value)} className="mt-3 min-h-32 rounded-md text-sm" />
    </section>
  );
}
