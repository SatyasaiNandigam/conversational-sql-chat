import { useState } from 'react';
import { ChatContainer } from '@/components/chat/ChatContainer';
import { SessionSidebar } from '@/components/chat/SessionSidebar';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';

const Index = () => {
  const [activeSession, setActiveSession] = useState<number | null>(null);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full scanline">
        <SessionSidebar
          activeSession={activeSession}
          onSelectSession={setActiveSession}
          onNewChat={() => setActiveSession(null)}
        />
        <div className="flex-1 flex flex-col">
          <header className="h-12 flex items-center border-b border-border bg-card px-4">
            <SidebarTrigger className="mr-3" />
            <span className="text-xs font-semibold tracking-widest uppercase text-primary neon-text" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              {activeSession !== null ? `Session_${activeSession}` : '> New_Chat'}
            </span>
            <div className="ml-auto flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse neon-glow-sm" />
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Online</span>
            </div>
          </header>
          <div className="flex-1 overflow-hidden">
            <ChatContainer activeSession={activeSession} />
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Index;
