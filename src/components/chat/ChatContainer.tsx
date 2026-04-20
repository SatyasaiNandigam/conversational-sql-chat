import { useState, useRef, useEffect, useCallback } from 'react';
import { ChatMessage, type Message } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { streamChat } from '@/lib/sse';
import { fetchMessages } from '@/lib/api';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot } from 'lucide-react';
import type { StatusStep } from './StatusTimeline';

const API_ENDPOINT = 'http://localhost:8000/invoke/stream';

interface ChatContainerProps {
  activeSession: number | null;
  onThreadCreated?: (id: number) => void;
}

export function ChatContainer({ activeSession, onThreadCreated }: ChatContainerProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [threadId, setThreadId] = useState<number | null>(activeSession);
  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const isStreaming = messages.some((m) => m.isStreaming);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (activeSession === null) {
      setMessages([]);
      setThreadId(null);
      return;
    }
    setThreadId(activeSession);
    fetchMessages(activeSession)
      .then((msgs) => {
        const mapped: Message[] = msgs.map((m) => ({
          id: m.id,
          role: m.type === 'human' ? 'user' : 'assistant',
          content: m.content,
          statusSteps: [],
          isStreaming: false,
        }));
        setMessages(mapped);
      })
      .catch(() => setMessages([]));
  }, [activeSession]);

  const handleSend = useCallback((text: string) => {
    const currentThreadId = threadId ?? Date.now();
    const isNewThread = threadId === null;
    if (threadId === null) {
      setThreadId(currentThreadId);
    }

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      statusSteps: [],
      isStreaming: false,
    };
    const assistantId = crypto.randomUUID();
    const assistantMsg: Message = {
      id: assistantId,
      role: 'assistant',
      content: '',
      statusSteps: [],
      isStreaming: true,
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);

    const controller = new AbortController();
    abortRef.current = controller;

    streamChat(
      API_ENDPOINT,
      text,
      currentThreadId,
      {
        onStatus(nodeName: string, detail?: string) {
          const step: StatusStep = { nodeName, detail };
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? {
                    ...m,
                    statusSteps:
                      m.statusSteps[m.statusSteps.length - 1]?.nodeName === nodeName
                        ? m.statusSteps
                        : [...m.statusSteps, step],
                  }
                : m,
            ),
          );
        },
        onSql(sql: string) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, sql } : m,
            ),
          );
        },
        onContent(chunk) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: m.content + chunk } : m,
            ),
          );
        },
        onError(error) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, isStreaming: false, error } : m,
            ),
          );
        },
        onDone() {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, isStreaming: false } : m,
            ),
          );
          if (isNewThread) {
            onThreadCreated?.(currentThreadId);
          }
        },
      },
      controller.signal,
    );
  }, [threadId, onThreadCreated]);

  const handleStop = useCallback(() => {
    abortRef.current?.abort();
    setMessages((prev) =>
      prev.map((m) => (m.isStreaming ? { ...m, isStreaming: false } : m)),
    );
  }, []);

  return (
    <div className="flex h-full flex-col bg-background">
      <ScrollArea className="flex-1">
        <div className="mx-auto max-w-3xl px-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 neon-border">
                <Bot className="h-8 w-8 text-primary neon-text" />
              </div>
              <h2 className="mb-1 text-lg font-bold text-primary neon-text" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                SYSTEM READY
              </h2>
              <p className="max-w-sm text-xs text-muted-foreground tracking-wide">
                {'>'} Awaiting query input. Ask questions about your data and I'll generate SQL to find answers.
              </p>
              <div className="mt-6 flex gap-1">
                {[...Array(3)].map((_, i) => (
                  <span key={i} className="h-1 w-8 rounded-full bg-primary/30" style={{ animationDelay: `${i * 200}ms` }} />
                ))}
              </div>
            </div>
          )}
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      <ChatInput
        onSend={handleSend}
        onStop={handleStop}
        isStreaming={isStreaming}
      />
    </div>
  );
}
