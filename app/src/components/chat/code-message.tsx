'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Copy } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getHighlighter } from 'shiki';
import { toast } from 'sonner';

interface CodeMessageProps {
  content: string;
  language?: string;
  className?: string;
}

export function CodeMessage({ content, language = 'typescript', className }: CodeMessageProps) {
  const [highlightedCode, setHighlightedCode] = useState<string>('');

  useEffect(() => {
    async function highlight() {
      try {
        const highlighter = await getHighlighter({
          themes: ['github-dark'],
          langs: [language],
        });

        const html = highlighter.codeToHtml(content, {
          lang: language,
          themes: {
            light: 'github-dark',
            dark: 'github-dark',
          },
        });
        setHighlightedCode(html);
      } catch (error) {
        console.error('Failed to highlight code:', error);
        setHighlightedCode(`<pre><code>${content}</code></pre>`);
      }
    }

    highlight();
  }, [content, language]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      toast.success('Code copied to clipboard');
    } catch (error) {
      console.error('Failed to copy code:', error);
      toast.error('Failed to copy code');
    }
  };

  return (
    <div className={cn('relative group', className)}>
      <div
        className="bg-slack-lightGray dark:bg-slate-800 rounded-lg overflow-hidden"
        dangerouslySetInnerHTML={{ __html: highlightedCode }}
      />
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={handleCopy}
      >
        <Copy className="h-4 w-4" />
      </Button>
    </div>
  );
}
