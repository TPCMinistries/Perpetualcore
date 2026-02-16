"use client";

import type { A2UIBlock } from "@/lib/a2ui/types";
import type { ImageBlockData } from "@/lib/a2ui/types";

interface ImageBlockProps {
  block: A2UIBlock;
}

export default function ImageBlock({ block }: ImageBlockProps) {
  const data = block.data as ImageBlockData;

  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden">
      <img
        src={data.src}
        alt={data.alt || ""}
        width={data.width}
        height={data.height}
        className="w-full h-auto max-h-96 object-contain"
      />
      {data.caption && (
        <p className="px-3 py-2 text-xs text-slate-500 dark:text-slate-400 text-center border-t border-slate-200 dark:border-slate-700">
          {data.caption}
        </p>
      )}
    </div>
  );
}
