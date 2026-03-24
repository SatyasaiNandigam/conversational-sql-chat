import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface StreamingMarkdownProps {
  content: string;
  isStreaming: boolean;
}

export function StreamingMarkdown({ content, isStreaming }: StreamingMarkdownProps) {
  const [displayedLength, setDisplayedLength] = useState(0);
  const prevContentRef = useRef('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // If content grew while streaming, animate the new chars
    if (isStreaming && content.length > displayedLength) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        setDisplayedLength((prev) => {
          if (prev >= content.length) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            return prev;
          }
          // Speed: render ~3 chars per tick for smooth but fast typing
          return Math.min(prev + 3, content.length);
        });
      }, 12);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [content, isStreaming]);

  // When streaming ends, show full content immediately
  useEffect(() => {
    if (!isStreaming) {
      setDisplayedLength(content.length);
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
  }, [isStreaming, content.length]);

  // Reset when content is entirely new (new message)
  useEffect(() => {
    if (content && !content.startsWith(prevContentRef.current.slice(0, 20))) {
      setDisplayedLength(0);
    }
    prevContentRef.current = content;
  }, [content]);

  const visibleContent = content.slice(0, displayedLength);
  const showCursor = isStreaming && displayedLength < content.length;

  return (
    <div className="prose prose-sm max-w-none dark:prose-invert prose-pre:bg-background prose-pre:border prose-pre:border-primary/20 prose-code:text-primary prose-pre:rounded-lg prose-pre:p-3 prose-headings:font-bold prose-strong:text-primary">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {visibleContent + (showCursor ? '▊' : '')}
      </ReactMarkdown>
    </div>
  );
}
