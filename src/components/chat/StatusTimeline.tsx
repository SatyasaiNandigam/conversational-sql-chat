import { cn } from '@/lib/utils';
import { Check, Loader2, ChevronDown, Terminal } from 'lucide-react';
import { useState } from 'react';

export interface StatusStep {
  nodeName: string;
  detail?: string;
}

interface StatusTimelineProps {
  steps: StatusStep[];
  isStreaming: boolean;
}

const NODE_LABELS: Record<string, string> = {
  'FOLLOW_UP DETECTOR': 'Detecting follow-up',
  'ORCHESTRATOR': 'Orchestrating pipeline',
  'INTENT_CLASSIFIER': 'Classifying intent',
  'SCHEMA RETRIEVER': 'Retrieving schema',
  'QUERY PLANNER': 'Planning query',
  'SQL AGENT': 'Generating SQL',
  'VALIDATOR': 'Validating query',
  'EXECUTOR AGENT': 'Executing query',
  'MEMORY AGENT': 'Generating response',
};

function getLabel(nodeName: string): string {
  return NODE_LABELS[nodeName] || nodeName;
}

export function StatusTimeline({ steps, isStreaming }: StatusTimelineProps) {
  const [expanded, setExpanded] = useState(false);

  if (steps.length === 0) return null;

  const lastStep = steps[steps.length - 1];
  const completedSteps = isStreaming ? steps.slice(0, -1) : steps;
  const showToggle = steps.length > 1;

  return (
    <div className="mb-3">
      <button
        onClick={() => showToggle && setExpanded(!expanded)}
        className={cn(
          'flex w-full items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-left text-xs font-mono transition-all',
          showToggle && 'hover:bg-primary/10 hover:border-primary/30 cursor-pointer',
          !showToggle && 'cursor-default',
        )}
      >
        {isStreaming ? (
          <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-primary" />
        ) : (
          <Terminal className="h-3.5 w-3.5 shrink-0 text-primary" />
        )}
        <span className="flex-1 text-muted-foreground tracking-wide">
          {isStreaming
            ? `> ${getLabel(lastStep.nodeName)}...`
            : `> ${steps.length} processes completed`}
        </span>
        {showToggle && (
          <ChevronDown
            className={cn(
              'h-3.5 w-3.5 text-muted-foreground transition-transform duration-200',
              expanded && 'rotate-180',
            )}
          />
        )}
      </button>

      {expanded && (
        <div className="mt-1 rounded-lg border border-primary/10 bg-background px-3 py-2 font-mono">
          <ol className="space-y-1">
            {completedSteps.map((step, i) => (
              <li
                key={i}
                className="flex items-center gap-2 text-[11px] text-muted-foreground"
              >
                <Check className="h-3 w-3 shrink-0 text-primary" />
                <span className="text-primary/60">[{String(i + 1).padStart(2, '0')}]</span>
                <span>{getLabel(step.nodeName)}</span>
              </li>
            ))}
            {isStreaming && (
              <li className="flex items-center gap-2 text-[11px] text-foreground">
                <Loader2 className="h-3 w-3 shrink-0 animate-spin text-primary" />
                <span className="text-primary/60">[{String(steps.length).padStart(2, '0')}]</span>
                <span>{getLabel(lastStep.nodeName)}</span>
              </li>
            )}
          </ol>
        </div>
      )}
    </div>
  );
}
