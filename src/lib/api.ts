const BASE_URL = 'http://localhost:8000';

export interface SessionMessage {
  content: string;
  type: 'human' | 'ai';
  id: string;
}

export async function fetchSessions(): Promise<number[]> {
  const res = await fetch(`${BASE_URL}/sessions`);
  if (!res.ok) throw new Error('Failed to fetch sessions');
  const data = await res.json();
  return data.sessions;
}

export async function fetchMessages(threadId: number): Promise<SessionMessage[]> {
  const res = await fetch(`${BASE_URL}/messages/${threadId}`);
  if (!res.ok) throw new Error('Failed to fetch messages');
  const data = await res.json();
  return data.messages;
}
