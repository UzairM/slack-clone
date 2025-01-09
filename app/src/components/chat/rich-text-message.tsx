'use client';

import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';

interface RichTextMessageProps {
  content: string;
  className?: string;
}

export function RichTextMessage({ content, className }: RichTextMessageProps) {
  return (
    <div className={cn('prose prose-sm dark:prose-invert max-w-none', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeSanitize]}
        components={{
          // Override default element styling
          p: ({ children }) => <p className="text-sm leading-relaxed mb-4 last:mb-0">{children}</p>,
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-slack-blue hover:underline"
            >
              {children}
            </a>
          ),
          ul: ({ children }) => <ul className="list-disc pl-6 mb-4 last:mb-0">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-6 mb-4 last:mb-0">{children}</ol>,
          li: ({ children }) => <li className="mb-1 last:mb-0">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-slack-gray/20 pl-4 italic my-4">
              {children}
            </blockquote>
          ),
          code: ({ className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '');
            const isInline = !match;
            return isInline ? (
              <code className="bg-slack-lightGray dark:bg-slate-800 px-1.5 py-0.5 rounded text-sm font-mono">
                {children}
              </code>
            ) : (
              <code>{children}</code>
            );
          },
          pre: ({ children }) => (
            <pre className="bg-slack-lightGray dark:bg-slate-800 p-4 rounded-lg overflow-x-auto mb-4 last:mb-0">
              {children}
            </pre>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
