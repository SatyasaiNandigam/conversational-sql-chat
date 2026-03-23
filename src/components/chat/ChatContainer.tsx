import { useState, useRef, useEffect, useCallback } from 'react';
import { ChatMessage, type Message } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { streamChat } from '@/lib/sse';
import { fetchMessages } from '@/lib/api';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Database } from 'lucide-react';
import type { StatusStep } from './StatusTimeline';

const API_ENDPOINT = 'http://localhost:8000/chat/stream';

interface ChatContainerProps {
  activeSession: number | null;
}

export function ChatContainer({ activeSession }: ChatContainerProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const isStreaming = messages.some((m) => m.isStreaming);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load messages when activeSession changes
  useEffect(() => {
    if (activeSession === null) {
      setMessages([]);
      return;
    }
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
        },
      },
      controller.signal,
    );
  }, []);

  const handleStop = useCallback(() => {
    abortRef.current?.abort();
    setMessages((prev) =>
      prev.map((m) => (m.isStreaming ? { ...m, isStreaming: false } : m)),
    );
  }, []);

  return (
    <div className="flex h-screen flex-col bg-background">
      <ScrollArea className="flex-1">
        <div className="mx-auto max-w-3xl px-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
                <Database className="h-7 w-7 text-muted-foreground" />
              </div>
              <h2 className="mb-1 text-lg font-semibold text-foreground">
                What would you like to know?
              </h2>
              <p className="max-w-sm text-sm text-muted-foreground">
                Ask questions about your data and I'll generate SQL queries to find the answers.
              </p>
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
