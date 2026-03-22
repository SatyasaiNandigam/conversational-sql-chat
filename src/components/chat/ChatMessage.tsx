import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';
import { StatusTimeline, type StatusStep } from './StatusTimeline';
import { User, Bot } from 'lucide-react';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  statusSteps: StatusStep[];
  isStreaming: boolean;
  error?: string;
}

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={cn('flex gap-3 py-4', isUser && 'flex-row-reverse')}>
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'border border-border bg-card text-muted-foreground',
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>

      <div className={cn('min-w-0 max-w-[75%] space-y-2', isUser && 'text-right')}>
        {!isUser && message.statusSteps.length > 0 && (
          <StatusTimeline steps={message.statusSteps} isStreaming={message.isStreaming} />
        )}

        {message.error ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {message.error}
          </div>
        ) : message.content ? (
          <div
            className={cn(
              'rounded-2xl px-4 py-3 text-sm leading-relaxed',
              isUser
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-foreground',
            )}
          >
            <div className="prose prose-sm max-w-none dark:prose-invert prose-pre:bg-card prose-pre:border prose-pre:border-border prose-code:text-foreground prose-pre:rounded-lg prose-pre:p-3">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.content}
              </ReactMarkdown>
            </div>
          </div>
        ) : message.isStreaming ? (
          <div className="rounded-2xl bg-muted px-4 py-3">
            <div className="flex gap-1">
              <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/40 [animation-delay:0ms]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/40 [animation-delay:150ms]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/40 [animation-delay:300ms]" />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
