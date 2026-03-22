export interface SSEEvent {
  event: string;
  data: any;
}

export interface StreamCallbacks {
  onStatus: (status: string, detail?: string) => void;
  onContent: (chunk: string) => void;
  onError: (error: string) => void;
  onDone: () => void;
}

const LANGGRAPH_STATUS_EVENTS = new Set([
  'on_chain_start',
  'on_chain_end',
  'on_tool_start',
  'on_tool_end',
  'on_retriever_start',
  'on_retriever_end',
  'on_parser_start',
  'on_parser_end',
]);

function humanizeEvent(event: string, data: any): string {
  const name = data?.name || data?.metadata?.langgraph_node || '';
  switch (event) {
    case 'on_chain_start':
      return name ? `Running ${name}…` : 'Processing…';
    case 'on_chain_end':
      return name ? `Finished ${name}` : 'Step complete';
    case 'on_tool_start':
      return name ? `Calling tool: ${name}…` : 'Calling tool…';
    case 'on_tool_end':
      return name ? `Tool ${name} returned` : 'Tool returned';
    case 'on_retriever_start':
      return 'Retrieving context…';
    case 'on_retriever_end':
      return 'Context retrieved';
    case 'on_parser_start':
      return 'Parsing output…';
    case 'on_parser_end':
      return 'Parsing complete';
    default:
      return event;
  }
}

export function streamChat(
  endpoint: string,
  query: string,
  callbacks: StreamCallbacks,
  signal?: AbortSignal,
) {
  fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
    body: JSON.stringify({ query }),
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
            if (raw === '[DONE]') {
              callbacks.onDone();
              return;
            }
            try {
              const data = JSON.parse(raw);
              const eventType = currentEvent || data.event || '';

              if (LANGGRAPH_STATUS_EVENTS.has(eventType)) {
                callbacks.onStatus(humanizeEvent(eventType, data));
              } else if (eventType === 'on_chat_model_stream' || data.content || data.text) {
                const chunk =
                  data?.data?.chunk?.content ||
                  data?.content ||
                  data?.text ||
                  (typeof data === 'string' ? data : '');
                if (chunk) callbacks.onContent(chunk);
              } else if (eventType === 'error') {
                callbacks.onError(data.message || 'Unknown error');
              } else {
                // Fallback: treat unknown events with content as content
                const fallback = data?.data?.chunk?.content || data?.content || data?.text;
                if (fallback) callbacks.onContent(fallback);
                else if (eventType) callbacks.onStatus(humanizeEvent(eventType, data));
              }
            } catch {
              // Plain text data line
              if (raw) callbacks.onContent(raw);
            }
            currentEvent = '';
          }
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
