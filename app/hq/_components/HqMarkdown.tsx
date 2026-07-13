'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/**
 * Reuses the repo's existing react-markdown + remark-gfm (see
 * components/markdown-message.tsx) rather than a new renderer, restyled for
 * the /hq theme. Covers headings/bold/lists/tables/blockquotes — the shapes
 * lib/ops writes; anything more exotic renders with sane fallback styling.
 */
export function HqMarkdown({ content }: { content: string }) {
  return (
    <div className="hq-tabular text-sm leading-relaxed" style={{ color: 'var(--hq-ink)' }}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ node, ...props }) => <h1 className="mb-3 mt-5 text-base font-semibold first:mt-0" {...props} />,
          h2: ({ node, ...props }) => <h2 className="mb-2 mt-5 text-sm font-semibold first:mt-0" {...props} />,
          h3: ({ node, ...props }) => <h3 className="mb-2 mt-4 text-sm font-semibold first:mt-0" {...props} />,
          p: ({ node, ...props }) => <p className="mb-3" style={{ color: 'var(--hq-ink-dim)' }} {...props} />,
          ul: ({ node, ...props }) => <ul className="mb-3 ml-5 list-disc space-y-1.5" {...props} />,
          ol: ({ node, ...props }) => <ol className="mb-3 ml-5 list-decimal space-y-1.5" {...props} />,
          li: ({ node, ...props }) => <li style={{ color: 'var(--hq-ink-dim)' }} {...props} />,
          a: ({ node, ...props }) => (
            <a className="underline" style={{ color: 'var(--hq-gold)' }} target="_blank" rel="noopener noreferrer" {...props} />
          ),
          blockquote: ({ node, ...props }) => (
            <blockquote
              className="mb-3 border-l-2 py-1 pl-3 italic"
              style={{ borderColor: 'var(--hq-gold)', color: 'var(--hq-ink)' }}
              {...props}
            />
          ),
          table: ({ node, ...props }) => (
            <div className="mb-3 overflow-x-auto rounded-md border" style={{ borderColor: 'var(--hq-border)' }}>
              <table className="hq-tabular w-full text-left text-xs" {...props} />
            </div>
          ),
          thead: ({ node, ...props }) => <thead style={{ background: 'var(--hq-panel-2)' }} {...props} />,
          th: ({ node, ...props }) => (
            <th className="hq-eyebrow px-3 py-2 font-semibold normal-case tracking-normal" {...props} />
          ),
          td: ({ node, ...props }) => (
            <td className="border-t px-3 py-2" style={{ borderColor: 'var(--hq-border)', color: 'var(--hq-ink)' }} {...props} />
          ),
          strong: ({ node, ...props }) => <strong className="font-semibold" style={{ color: 'var(--hq-ink)' }} {...props} />,
          hr: ({ node, ...props }) => <hr className="my-4" style={{ borderColor: 'var(--hq-border)' }} {...props} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
