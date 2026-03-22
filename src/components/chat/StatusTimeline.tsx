import { cn } from '@/lib/utils';
import { Check, Loader2 } from 'lucide-react';

interface StatusTimelineProps {
  steps: string[];
  isStreaming: boolean;
}

export function StatusTimeline({ steps, isStreaming }: StatusTimelineProps) {
  if (steps.length === 0) return null;

  return (
    <div className="mb-3 rounded-lg border border-border bg-muted/40 px-4 py-3">
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Processing
      </p>
      <ol className="space-y-1.5">
        {steps.map((step, i) => {
          const isLast = i === steps.length - 1;
          const active = isLast && isStreaming;
          return (
            <li
              key={i}
              className={cn(
                'flex items-center gap-2 text-sm transition-opacity duration-300',
                active ? 'text-foreground' : 'text-muted-foreground',
              )}
            >
              {active ? (
                <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-primary" />
              ) : (
                <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
              )}
              <span className="overflow-wrap-break-word">{step}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
