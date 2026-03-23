import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Square } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => void;
  onStop: () => void;
  isStreaming: boolean;
  disabled?: boolean;
}

export function ChatInput({ onSend, onStop, isStreaming, disabled }: ChatInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  }, [value, disabled, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (isStreaming) return;
      handleSubmit();
    }
  };

  return (
    <div className="border-t border-border bg-card/80 backdrop-blur-sm px-4 py-3">
      <div className="mx-auto flex max-w-3xl items-end gap-2">
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            e.target.style.height = 'auto';
            e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px';
          }}
          onKeyDown={handleKeyDown}
          placeholder="> Enter query..."
          className="min-h-[44px] max-h-[160px] resize-none rounded-xl border-primary/20 bg-background text-sm font-mono focus:border-primary/50 focus:neon-border transition-shadow"
          rows={1}
          disabled={disabled}
        />
        {isStreaming ? (
          <Button
            size="icon"
            variant="destructive"
            className="h-[44px] w-[44px] shrink-0 rounded-xl active:scale-95 transition-transform"
            onClick={onStop}
          >
            <Square className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            size="icon"
            className="h-[44px] w-[44px] shrink-0 rounded-xl bg-primary text-primary-foreground hover:bg-primary/80 neon-glow-sm active:scale-95 transition-all"
            onClick={handleSubmit}
            disabled={!value.trim() || disabled}
          >
            <Send className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
