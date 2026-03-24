import { cn } from '@/lib/utils';
import { StatusTimeline, type StatusStep } from './StatusTimeline';
import { StreamingMarkdown } from './StreamingMarkdown';
import { User, Bot, ChevronDown, Database } from 'lucide-react';
import { useState } from 'react';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  statusSteps: StatusStep[];
  isStreaming: boolean;
  error?: string;
  sql?: string;
}

interface ChatMessageProps {
  message: Message;
}

function SqlBlock({ sql }: { sql: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mb-2">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-mono text-muted-foreground hover:bg-primary/10 hover:border-primary/30 transition-all cursor-pointer"
      >
        <Database className="h-3.5 w-3.5 text-primary" />
        <span className="tracking-wide">Generated SQL</span>
        <ChevronDown className={cn('h-3.5 w-3.5 text-muted-foreground transition-transform duration-200', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="mt-1 rounded-lg border border-primary/10 bg-background p-3 font-mono text-[11px] text-primary/90 overflow-x-auto whitespace-pre-wrap">
          {sql}
        </div>
      )}
    </div>
  );
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={cn('flex gap-3 py-4', isUser && 'flex-row-reverse')}>
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border',
          isUser
            ? 'bg-primary/20 border-primary/40 text-primary neon-glow-sm'
            : 'border-accent/40 bg-accent/10 text-accent',
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>

      <div className={cn('min-w-0 max-w-[75%] space-y-2', isUser && 'text-right')}>
        {!isUser && message.statusSteps.length > 0 && (
          <StatusTimeline steps={message.statusSteps} isStreaming={message.isStreaming} />
        )}

        {!isUser && message.sql && (
          <SqlBlock sql={message.sql} />
        )}

        {message.error ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive font-mono">
            <span className="text-destructive/60">ERROR: </span>{message.error}
          </div>
        ) : message.content ? (
          <div
            className={cn(
              'rounded-xl px-4 py-3 text-sm leading-relaxed border',
              isUser
                ? 'bg-primary/15 border-primary/30 text-foreground neon-glow-sm'
                : 'bg-card border-border text-foreground',
            )}
          >
            {isUser ? (
              <p>{message.content}</p>
            ) : (
              <StreamingMarkdown content={message.content} isStreaming={message.isStreaming} />
            )}
          </div>
        ) : message.isStreaming ? (
          <div className="rounded-xl border border-accent/30 bg-accent/5 px-4 py-3">
            <div className="flex gap-1.5">
              <span className="h-2 w-2 animate-bounce rounded-full bg-primary/60 [animation-delay:0ms]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-primary/60 [animation-delay:150ms]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-primary/60 [animation-delay:300ms]" />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
