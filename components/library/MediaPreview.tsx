"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  FileText,
  Image as ImageIcon,
  Music,
  Video,
  Globe,
  Loader2,
  ChevronDown,
  ChevronUp,
  Clock,
  Eye,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type MediaType = "document" | "image" | "audio" | "video" | "web_clip";

interface MediaPreviewProps {
  type: MediaType;
  url: string;
  thumbnailUrl?: string;
  title?: string;
  transcription?: string;
  ocrText?: string;
  aiDescription?: string;
  duration?: number;
  metadata?: Record<string, any>;
  className?: string;
  compact?: boolean;
  onProcess?: () => Promise<void>;
  isProcessing?: boolean;
}

const mediaTypeConfig: Record<MediaType, { icon: React.ElementType; color: string; label: string }> = {
  document: { icon: FileText, color: "text-blue-500 bg-blue-500/10", label: "Document" },
  image: { icon: ImageIcon, color: "text-emerald-500 bg-emerald-500/10", label: "Image" },
  audio: { icon: Music, color: "text-purple-500 bg-purple-500/10", label: "Audio" },
  video: { icon: Video, color: "text-red-500 bg-red-500/10", label: "Video" },
  web_clip: { icon: Globe, color: "text-amber-500 bg-amber-500/10", label: "Web Clip" },
};

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function MediaPreview({
  type,
  url,
  thumbnailUrl,
  title,
  transcription,
  ocrText,
  aiDescription,
  duration,
  metadata,
  className,
  compact = false,
  onProcess,
  isProcessing = false,
}: MediaPreviewProps) {
  const [showTranscript, setShowTranscript] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [mediaDuration, setMediaDuration] = useState(duration || 0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showOcr, setShowOcr] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const config = mediaTypeConfig[type];
  const Icon = config.icon;

  useEffect(() => {
    const media = type === "audio" ? audioRef.current : videoRef.current;
    if (!media) return;

    const handleTimeUpdate = () => setCurrentTime(media.currentTime);
    const handleDurationChange = () => setMediaDuration(media.duration);
    const handleEnded = () => setIsPlaying(false);
    const handleLoadedData = () => setIsLoaded(true);

    media.addEventListener("timeupdate", handleTimeUpdate);
    media.addEventListener("durationchange", handleDurationChange);
    media.addEventListener("ended", handleEnded);
    media.addEventListener("loadeddata", handleLoadedData);

    return () => {
      media.removeEventListener("timeupdate", handleTimeUpdate);
      media.removeEventListener("durationchange", handleDurationChange);
      media.removeEventListener("ended", handleEnded);
      media.removeEventListener("loadeddata", handleLoadedData);
    };
  }, [type]);

  const togglePlay = () => {
    const media = type === "audio" ? audioRef.current : videoRef.current;
    if (!media) return;

    if (isPlaying) {
      media.pause();
    } else {
      media.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    const media = type === "audio" ? audioRef.current : videoRef.current;
    if (!media) return;
    media.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const media = type === "audio" ? audioRef.current : videoRef.current;
    if (!media || !mediaDuration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    media.currentTime = percent * mediaDuration;
  };

  const hasExtractedContent = transcription || ocrText || aiDescription;

  // Compact card view
  if (compact) {
    return (
      <div className={cn("relative group", className)}>
        {/* Thumbnail or icon */}
        <div className="relative aspect-video rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800">
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt={title || "Media preview"}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Icon className={cn("h-12 w-12", config.color)} />
            </div>
          )}

          {/* Play overlay for audio/video */}
          {(type === "audio" || type === "video") && (
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <div className="h-12 w-12 rounded-full bg-white/90 flex items-center justify-center">
                <Play className="h-6 w-6 text-slate-900 ml-1" />
              </div>
            </div>
          )}

          {/* Duration badge */}
          {duration && (
            <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/70 text-white text-xs font-medium">
              {formatDuration(duration)}
            </div>
          )}

          {/* Type badge */}
          <div className={cn(
            "absolute top-2 left-2 px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1",
            config.color
          )}>
            <Icon className="h-3 w-3" />
            {config.label}
          </div>
        </div>

        {/* Transcription indicator */}
        {hasExtractedContent && (
          <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-violet-500 flex items-center justify-center">
            <Sparkles className="h-3 w-3 text-white" />
          </div>
        )}
      </div>
    );
  }

  // Full preview view
  return (
    <div className={cn("rounded-xl overflow-hidden bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700", className)}>
      {/* Media display area */}
      <div className="relative">
        {type === "image" && (
          <div className="relative">
            <img
              src={url}
              alt={title || "Image"}
              className="w-full max-h-[500px] object-contain bg-slate-100 dark:bg-slate-900"
            />
            {/* Image overlay info */}
            {metadata?.width && metadata?.height && (
              <div className="absolute bottom-2 right-2 px-2 py-1 rounded bg-black/70 text-white text-xs">
                {metadata.width} × {metadata.height}
              </div>
            )}
          </div>
        )}

        {type === "audio" && (
          <div className="p-6 bg-gradient-to-br from-purple-500/10 to-violet-500/10">
            <audio ref={audioRef} src={url} preload="metadata" />

            <div className="flex items-center gap-4">
              {/* Play button */}
              <button
                onClick={togglePlay}
                className="h-14 w-14 rounded-full bg-purple-500 hover:bg-purple-600 text-white flex items-center justify-center transition-colors shadow-lg"
              >
                {isPlaying ? (
                  <Pause className="h-6 w-6" />
                ) : (
                  <Play className="h-6 w-6 ml-1" />
                )}
              </button>

              {/* Progress and controls */}
              <div className="flex-1">
                {/* Progress bar */}
                <div
                  className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full cursor-pointer group"
                  onClick={seek}
                >
                  <div
                    className="h-full bg-purple-500 rounded-full relative"
                    style={{ width: `${(currentTime / mediaDuration) * 100 || 0}%` }}
                  >
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 h-4 w-4 bg-white rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>

                {/* Time and volume */}
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm text-slate-500">
                    {formatDuration(currentTime)} / {formatDuration(mediaDuration)}
                  </span>
                  <button onClick={toggleMute} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                    {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {type === "video" && (
          <div className="relative bg-black">
            <video
              ref={videoRef}
              src={url}
              poster={thumbnailUrl}
              className="w-full max-h-[500px]"
              preload="metadata"
            />

            {/* Video controls overlay */}
            <div className="absolute inset-0 flex items-center justify-center group">
              {!isPlaying && (
                <button
                  onClick={togglePlay}
                  className="h-16 w-16 rounded-full bg-white/90 hover:bg-white flex items-center justify-center transition-all shadow-lg"
                >
                  <Play className="h-8 w-8 text-slate-900 ml-1" />
                </button>
              )}
            </div>

            {/* Bottom controls */}
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              {/* Progress bar */}
              <div
                className="h-1 bg-white/30 rounded-full cursor-pointer mb-3"
                onClick={seek}
              >
                <div
                  className="h-full bg-white rounded-full"
                  style={{ width: `${(currentTime / mediaDuration) * 100 || 0}%` }}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button onClick={togglePlay} className="text-white hover:text-white/80">
                    {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                  </button>
                  <button onClick={toggleMute} className="text-white hover:text-white/80">
                    {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                  </button>
                  <span className="text-white text-sm">
                    {formatDuration(currentTime)} / {formatDuration(mediaDuration)}
                  </span>
                </div>
                <button className="text-white hover:text-white/80">
                  <Maximize2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {type === "web_clip" && (
          <div className="relative">
            {thumbnailUrl ? (
              <img
                src={thumbnailUrl}
                alt={title || "Web clip"}
                className="w-full h-48 object-cover"
              />
            ) : (
              <div className="w-full h-48 bg-gradient-to-br from-amber-500/10 to-orange-500/10 flex items-center justify-center">
                <Globe className="h-16 w-16 text-amber-500/50" />
              </div>
            )}
            {metadata?.domain && (
              <div className="absolute bottom-2 left-2 px-2 py-1 rounded bg-black/70 text-white text-xs flex items-center gap-1">
                <Globe className="h-3 w-3" />
                {metadata.domain}
              </div>
            )}
          </div>
        )}

        {type === "document" && thumbnailUrl && (
          <img
            src={thumbnailUrl}
            alt={title || "Document preview"}
            className="w-full max-h-[400px] object-contain bg-slate-100 dark:bg-slate-900"
          />
        )}
      </div>

      {/* Content section */}
      <div className="p-4 space-y-4">
        {/* Type badge and process button */}
        <div className="flex items-center justify-between">
          <div className={cn(
            "px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2",
            config.color
          )}>
            <Icon className="h-4 w-4" />
            {config.label}
            {duration && (
              <span className="flex items-center gap-1 text-xs opacity-70">
                <Clock className="h-3 w-3" />
                {formatDuration(duration)}
              </span>
            )}
          </div>

          {onProcess && !hasExtractedContent && (
            <Button
              variant="outline"
              size="sm"
              onClick={onProcess}
              disabled={isProcessing}
              className="gap-2"
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {isProcessing ? "Processing..." : "Extract Content"}
            </Button>
          )}

          {onProcess && hasExtractedContent && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onProcess}
              disabled={isProcessing}
              className="gap-2 text-slate-500"
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Re-process
            </Button>
          )}
        </div>

        {/* AI Description */}
        {aiDescription && (
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              <Sparkles className="h-4 w-4 text-violet-500" />
              AI Description
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {aiDescription}
            </p>
          </div>
        )}

        {/* OCR Text */}
        {ocrText && (
          <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
            <button
              onClick={() => setShowOcr(!showOcr)}
              className="w-full flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                <Eye className="h-4 w-4 text-emerald-500" />
                Extracted Text (OCR)
              </div>
              {showOcr ? (
                <ChevronUp className="h-4 w-4 text-slate-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-slate-400" />
              )}
            </button>
            <AnimatePresence>
              {showOcr && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-slate-200 dark:border-slate-700"
                >
                  <div className="p-3 max-h-60 overflow-y-auto">
                    <pre className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap font-mono">
                      {ocrText}
                    </pre>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Transcription */}
        {transcription && (
          <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
            <button
              onClick={() => setShowTranscript(!showTranscript)}
              className="w-full flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                <FileText className="h-4 w-4 text-purple-500" />
                Transcription
                {duration && (
                  <span className="text-xs text-slate-400">
                    ({formatDuration(duration)})
                  </span>
                )}
              </div>
              {showTranscript ? (
                <ChevronUp className="h-4 w-4 text-slate-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-slate-400" />
              )}
            </button>
            <AnimatePresence>
              {showTranscript && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-slate-200 dark:border-slate-700"
                >
                  <div className="p-3 max-h-60 overflow-y-auto">
                    <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
                      {transcription}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Web clip metadata */}
        {type === "web_clip" && metadata && (
          <div className="flex items-center gap-4 text-sm text-slate-500">
            {metadata.wordCount && (
              <span>{metadata.wordCount.toLocaleString()} words</span>
            )}
            {metadata.readingTime && (
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {metadata.readingTime} min read
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Compact media badge for document cards
 */
export function MediaTypeBadge({
  type,
  duration,
  className,
}: {
  type: MediaType;
  duration?: number;
  className?: string;
}) {
  const config = mediaTypeConfig[type];
  const Icon = config.icon;

  return (
    <div className={cn(
      "inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium",
      config.color,
      className
    )}>
      <Icon className="h-3 w-3" />
      {config.label}
      {duration && (
        <span className="opacity-70">{formatDuration(duration)}</span>
      )}
    </div>
  );
}

/**
 * Thumbnail with play overlay for media cards
 */
export function MediaThumbnail({
  type,
  thumbnailUrl,
  duration,
  hasTranscription,
  className,
  onClick,
}: {
  type: MediaType;
  thumbnailUrl?: string;
  duration?: number;
  hasTranscription?: boolean;
  className?: string;
  onClick?: () => void;
}) {
  const config = mediaTypeConfig[type];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "relative aspect-video rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 cursor-pointer group",
        className
      )}
      onClick={onClick}
    >
      {thumbnailUrl ? (
        <img
          src={thumbnailUrl}
          alt="Media thumbnail"
          className="w-full h-full object-cover transition-transform group-hover:scale-105"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <Icon className={cn("h-12 w-12 opacity-50", config.color.split(" ")[0])} />
        </div>
      )}

      {/* Play overlay for playable media */}
      {(type === "audio" || type === "video") && (
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="h-12 w-12 rounded-full bg-white/90 flex items-center justify-center transform group-hover:scale-110 transition-transform">
            <Play className="h-6 w-6 text-slate-900 ml-1" />
          </div>
        </div>
      )}

      {/* Duration badge */}
      {duration && (
        <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/70 text-white text-xs font-medium">
          {formatDuration(duration)}
        </div>
      )}

      {/* Transcription indicator */}
      {hasTranscription && (
        <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-violet-500/90 flex items-center justify-center">
          <FileText className="h-3 w-3 text-white" />
        </div>
      )}

      {/* Type badge */}
      <div className={cn(
        "absolute top-2 left-2 px-2 py-0.5 rounded text-xs font-medium",
        config.color
      )}>
        {config.label}
      </div>
    </div>
  );
}
