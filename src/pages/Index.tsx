import { useState } from 'react';
import { ChatContainer } from '@/components/chat/ChatContainer';
import { SessionSidebar } from '@/components/chat/SessionSidebar';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';

const Index = () => {
  const [activeSession, setActiveSession] = useState<number | null>(null);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <SessionSidebar
          activeSession={activeSession}
          onSelectSession={setActiveSession}
          onNewChat={() => setActiveSession(null)}
        />
        <div className="flex-1 flex flex-col">
          <header className="h-12 flex items-center border-b border-border bg-card px-4">
            <SidebarTrigger className="mr-3" />
            <span className="text-sm font-medium text-foreground">
              {activeSession !== null ? `Session ${activeSession}` : 'New Chat'}
            </span>
          </header>
          <div className="flex-1">
            <ChatContainer activeSession={activeSession} />
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Index;
