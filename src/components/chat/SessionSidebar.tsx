import { useEffect, useState } from 'react';
import { fetchSessions } from '@/lib/api';
import { Plus, MessageSquare, Database } from 'lucide-react';
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

export function SessionSidebar({ activeSession, onSelectSession, onNewChat }: SessionSidebarProps) {
  const [sessions, setSessions] = useState<number[]>([]);

  useEffect(() => {
    fetchSessions()
      .then(setSessions)
      .catch(() => {});
  }, []);

  // Refresh sessions list periodically
  useEffect(() => {
    const interval = setInterval(() => {
      fetchSessions().then(setSessions).catch(() => {});
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarHeader className="p-3">
        <div className="flex items-center gap-2 px-1">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Database className="h-4 w-4" />
          </div>
          <span className="text-sm font-semibold text-foreground group-data-[collapsible=icon]:hidden">
            Text to SQL
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <div className="px-3 pb-2 group-data-[collapsible=icon]:px-1">
          <Button
            onClick={onNewChat}
            variant="outline"
            className="w-full justify-start gap-2 rounded-lg border-dashed border-border text-muted-foreground hover:text-foreground"
            size="sm"
          >
            <Plus className="h-4 w-4 shrink-0" />
            <span className="group-data-[collapsible=icon]:hidden">New Chat</span>
          </Button>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Sessions</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {sessions.map((id) => (
                <SidebarMenuItem key={id}>
                  <SidebarMenuButton
                    onClick={() => onSelectSession(id)}
                    isActive={activeSession === id}
                    className={cn(
                      'cursor-pointer',
                      activeSession === id && 'bg-accent text-accent-foreground',
                    )}
                  >
                    <MessageSquare className="h-4 w-4 shrink-0" />
                    <span>Session {id}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {sessions.length === 0 && (
                <p className="px-3 py-2 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
                  No sessions yet
                </p>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3">
        <p className="text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
          Ask questions about your data
        </p>
      </SidebarFooter>
    </Sidebar>
  );
}
