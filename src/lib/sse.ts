export interface StreamCallbacks {
  onStatus: (nodeName: string, detail?: string) => void;
  onContent: (chunk: string) => void;
  onSql: (sql: string) => void;
  onError: (error: string) => void;
  onDone: () => void;
}

/**
 * Extract a human-readable detail from a node's state payload.
 */
function extractDetail(nodeName: string, state: Record<string, any>): string | undefined {
  if (state.sql && typeof state.sql === 'string') {
    return state.sql;
  }
  if (state.validation_feedback && typeof state.validation_feedback === 'object') {
    const vf = state.validation_feedback;
    if (vf.status) return `Status: ${vf.status}`;
  }
  if (state.intent_result && typeof state.intent_result === 'string') {
    return state.intent_result;
  }
  return undefined;
}

/**
 * Try to extract the final markdown answer from the last message event.
 * The final node's `messages` array contains AIMessage-like strings with
 * `content='...'` that holds the markdown answer.
 */
function extractFinalContent(state: Record<string, any>): string | null {
  const messages = state.messages;
  if (!Array.isArray(messages) || messages.length === 0) return null;

  const last = messages[messages.length - 1];
  if (typeof last !== 'string') return null;

  // Parse content='...' or content="..." from the message string
  const singleMatch = last.match(/^content='([\s\S]*?)'\s+additional_kwargs=/);
  if (singleMatch) {
    return singleMatch[1].replace(/\\n/g, '\n');
  }
  const doubleMatch = last.match(/^content="([\s\S]*?)"\s+additional_kwargs=/);
  if (doubleMatch) {
    return doubleMatch[1].replace(/\\n/g, '\n');
  }
  return null;
}

export function streamChat(
  endpoint: string,
  query: string,
  threadId: number,
  callbacks: StreamCallbacks,
  signal?: AbortSignal,
) {
  // We collect all events to detect the final one
  const collectedEvents: { nodeName: string; state: Record<string, any> }[] = [];

  fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
    body: JSON.stringify({ thread_id: threadId, user_query: query }),
    signal,
  })
    .then(async (response) => {
      if (!response.ok) {
        callbacks.onError(`Server error: ${response.status}`);
        return;
      }
      const reader = response.body?.getReader();
      if (!reader) {
        callbacks.onError('No readable stream');
        return;
      }
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        let currentEvent = '';
        for (const line of lines) {
          if (line.startsWith('event:')) {
            currentEvent = line.slice(6).trim();
          } else if (line.startsWith('data:')) {
            const raw = line.slice(5).trim();

            // Handle done event
            if (raw === '[DONE]' || currentEvent === 'done') {
              // Process the final collected event as the answer
              if (collectedEvents.length > 0) {
                const lastEvent = collectedEvents[collectedEvents.length - 1];
                const content = extractFinalContent(lastEvent.state);
                if (content) {
                  callbacks.onContent(content);
                }
              }
              callbacks.onDone();
              return;
            }

            if (currentEvent === 'message') {
              try {
                const data = JSON.parse(raw);
                // The data is { "NODE_NAME": { ...state } }
                const nodeName = Object.keys(data)[0];
                if (nodeName) {
                  const state = data[nodeName];
                  collectedEvents.push({ nodeName, state });

                  // Emit as intermediate status
                  const detail = extractDetail(nodeName, state);
                  callbacks.onStatus(nodeName, detail);
                }
              } catch {
                // Ignore parse errors
              }
            }
            currentEvent = '';
          }
        }
      }

      // If stream ended without explicit [DONE]
      if (collectedEvents.length > 0) {
        const lastEvent = collectedEvents[collectedEvents.length - 1];
        const content = extractFinalContent(lastEvent.state);
        if (content) {
          callbacks.onContent(content);
        }
      }
      callbacks.onDone();
    })
    .catch((err) => {
      if (err.name !== 'AbortError') {
        callbacks.onError(err.message || 'Connection failed');
      }
    });
}
