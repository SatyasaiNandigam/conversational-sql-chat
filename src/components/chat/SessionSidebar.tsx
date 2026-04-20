import { useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { fetchSessions } from '@/lib/api';
import { Plus, MessageSquare, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';

interface SessionSidebarProps {
  activeSession: number | null;
  onSelectSession: (id: number) => void;
  onNewChat: () => void;
}

export interface SessionSidebarHandle {
  refresh: () => void;
}

export const SessionSidebar = forwardRef<SessionSidebarHandle, SessionSidebarProps>(
  function SessionSidebar({ activeSession, onSelectSession, onNewChat }, ref) {
  const [sessions, setSessions] = useState<number[]>([]);

  const loadSessions = () => {
    fetchSessions()
      .then(setSessions)
      .catch(() => {});
  };

  useEffect(() => {
    loadSessions();
  }, []);

  useImperativeHandle(ref, () => ({ refresh: loadSessions }), []);


  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarHeader className="p-3">
        <div className="flex items-center gap-2 px-1">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-primary/40 bg-primary/10 neon-glow-sm">
            <Bot className="h-4 w-4 text-primary" />
          </div>
          <span className="text-xs font-bold tracking-widest uppercase text-primary neon-text group-data-[collapsible=icon]:hidden" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            SQL Bot
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <div className="px-3 pb-2 group-data-[collapsible=icon]:px-1">
          <Button
            onClick={onNewChat}
            variant="outline"
            className="w-full justify-start gap-2 rounded-lg border-primary/30 border-dashed text-primary hover:bg-primary/10 hover:text-primary hover:neon-glow-sm transition-shadow"
            size="sm"
          >
            <Plus className="h-4 w-4 shrink-0" />
            <span className="group-data-[collapsible=icon]:hidden text-xs tracking-wider">+ NEW CHAT</span>
          </Button>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] tracking-widest uppercase text-muted-foreground">Threads</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {sessions.map((id) => (
                <SidebarMenuItem key={id}>
                  <SidebarMenuButton
                    onClick={() => onSelectSession(id)}
                    isActive={activeSession === id}
                    className={cn(
                      'cursor-pointer text-xs tracking-wide',
                      activeSession === id && 'bg-primary/15 text-primary border-l-2 border-primary neon-glow-sm',
                    )}
                  >
                    <MessageSquare className="h-4 w-4 shrink-0" />
                    <span>Thread_{id}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {sessions.length === 0 && (
                <p className="px-3 py-2 text-[10px] text-muted-foreground tracking-wider group-data-[collapsible=icon]:hidden">
                  No active threads
                </p>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3">
        <div className="flex items-center gap-2 group-data-[collapsible=icon]:hidden">
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          <p className="text-[10px] text-muted-foreground tracking-wider uppercase">
            System operational
          </p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
