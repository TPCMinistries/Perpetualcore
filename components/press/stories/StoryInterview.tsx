"use client";

import { useState } from "react";
import { AlertCircle, ArrowRight, Loader2, MessageCircle, Send, SkipForward, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PRESS_STORY_MAX_INTERVIEW_QUESTIONS, type PressStory } from "@/lib/press/stories/types";
import { getErrorMessage, postInterviewTurn, updateStory } from "./api";

export function StoryInterview({
  story,
  assetCount,
  onStoryUpdate,
  onJumpToContent,
}: {
  story: PressStory;
  assetCount: number;
  onStoryUpdate: (story: PressStory) => void;
  onJumpToContent: () => void;
}) {
  const [answer, setAnswer] = useState("");
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasStarted = story.interview.length > 0;
  const questionsAsked = story.interview.filter((turn) => turn.role === "assistant").length;

  async function sendTurn(nextAnswer?: string) {
    setThinking(true);
    setError(null);
    try {
      const response = await postInterviewTurn(story.id, nextAnswer ? { answer: nextAnswer } : {});
      onStoryUpdate(response.story);
      setAnswer("");
    } catch (turnError) {
      setError(getErrorMessage(turnError));
    } finally {
      setThinking(false);
    }
  }

  async function skipToContent() {
    setError(null);
    try {
      const updated = await updateStory(story.id, { interview_complete: true });
      onStoryUpdate(updated);
      onJumpToContent();
    } catch (skipError) {
      setError(getErrorMessage(skipError));
    }
  }

  return (
    <div>
      {!hasStarted && (
        <div className="border border-black/10 bg-[#f6f1e8] p-5 text-center sm:p-8">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#1648d8]">
            <MessageCircle className="h-5 w-5 text-white" aria-hidden />
          </span>
          <p className="mt-4 text-base font-black text-[#121214]">Press will ask a few quick questions</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-black/60">
            {assetCount > 0
              ? "A short interview about what happened pulls out the details worth writing about."
              : "Add at least one photo or video first, then come back to start the interview."}
          </p>
          <Button
            type="button"
            className="mt-5 h-12 rounded-full bg-[#ff3b5c] px-6 text-base font-black text-[#121214] hover:bg-[#ff7288]"
            disabled={assetCount === 0 || thinking}
            onClick={() => void sendTurn()}
          >
            {thinking ? <Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden /> : <Sparkles className="mr-2 h-4 w-4" aria-hidden />}
            Start interview
          </Button>
        </div>
      )}

      {hasStarted && (
        <div className="space-y-4" aria-live="polite">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-black/50">
            Question {Math.min(questionsAsked, PRESS_STORY_MAX_INTERVIEW_QUESTIONS)} of ~{PRESS_STORY_MAX_INTERVIEW_QUESTIONS}
          </p>
          <ol className="space-y-3">
            {story.interview.map((turn, index) => (
              <li key={index} className={turn.role === "assistant" ? "flex justify-start" : "flex justify-end"}>
                <div
                  className={
                    turn.role === "assistant"
                      ? "max-w-[85%] border border-black/10 bg-[#f6f1e8] px-4 py-3 text-sm leading-6 text-[#121214]"
                      : "max-w-[85%] bg-[#121214] px-4 py-3 text-sm leading-6 text-white"
                  }
                >
                  {turn.text}
                </div>
              </li>
            ))}
          </ol>
          {thinking && (
            <div className="flex items-center gap-2 text-sm text-black/50" role="status">
              <Loader2 className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" aria-hidden /> Thinking…
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="mt-4 flex items-start gap-2 border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>{error}</span>
        </div>
      )}

      {hasStarted && !story.interview_complete && (
        <form
          className="mt-4 space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (!answer.trim() || thinking) return;
            void sendTurn(answer.trim());
          }}
        >
          <label htmlFor="interview-answer" className="sr-only">Your answer</label>
          <Textarea
            id="interview-answer"
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
            placeholder="Type your answer…"
            className="min-h-24 rounded-md text-base"
            disabled={thinking}
            maxLength={4000}
          />
          <div className="flex flex-wrap gap-2">
            <Button type="submit" className="h-11 rounded-full bg-[#1648d8] px-5 text-white hover:bg-[#1039ad]" disabled={!answer.trim() || thinking}>
              {thinking ? <Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden /> : <Send className="mr-2 h-4 w-4" aria-hidden />}
              Send
            </Button>
            <Button type="button" variant="outline" className="h-11 rounded-full bg-white" onClick={() => void skipToContent()} disabled={thinking}>
              <SkipForward className="mr-2 h-4 w-4" aria-hidden /> Skip to content
            </Button>
          </div>
        </form>
      )}

      {story.interview_complete && (
        <div className="mt-5 border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          <p className="font-semibold">Interview complete.</p>
          <Button type="button" className="mt-3 h-11 rounded-full bg-[#c7f34b] px-5 text-[#121214] hover:bg-[#b6e02f]" onClick={onJumpToContent}>
            Generate content <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
          </Button>
        </div>
      )}
    </div>
  );
}
