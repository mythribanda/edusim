import React, { useState, useEffect, useMemo } from "react";
import { 
  Plus, 
  Search, 
  Trash2, 
  Loader2, 
  MessageSquare, 
  PanelLeftClose, 
  PanelLeftOpen,
  User as UserIcon,
  Store
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { TutorService } from "@/services/TutorService";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface ChatHistorySidebarProps {
  activeSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onNewChat: () => void;
  refreshTrigger: number;
}

interface Session {
  id: string;
  topic: string;
  created_at: string;
  is_active: boolean;
}

export function ChatHistorySidebar({
  activeSessionId,
  onSelectSession,
  onNewChat,
  refreshTrigger
}: ChatHistorySidebarProps) {
  const { user, isAuthenticated } = useAuthStore();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCollapsed, setIsCollapsed] = useState(false);

  const fetchSessions = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const res = await TutorService.getSessions();
      if (res.success) {
        setSessions(res.sessions || []);
      }
    } catch (err) {
      console.error("Failed to load sessions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [refreshTrigger, isAuthenticated]);

  const handleDelete = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    try {
      const res = await TutorService.deleteSession(sessionId);
      if (res.success) {
        toast.success("Chat history deleted");
        if (activeSessionId === sessionId) {
          onNewChat();
        }
        fetchSessions();
      } else {
        toast.error("Failed to delete chat history");
      }
    } catch (err) {
      toast.error("An error occurred while deleting chat history");
      console.error(err);
    }
  };

  // Grouping logic
  const groupedSessions = useMemo(() => {
    const filtered = sessions.filter(s => 
      (s.topic || "General Physics").toLowerCase().includes(searchQuery.toLowerCase())
    );

    const today: Session[] = [];
    const yesterday: Session[] = [];
    const previous7Days: Session[] = [];
    const older: Session[] = [];

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterdayStart = todayStart - 24 * 60 * 60 * 1000;
    const sevenDaysAgoStart = todayStart - 7 * 24 * 60 * 60 * 1000;

    filtered.forEach(session => {
      const date = new Date(session.created_at).getTime();
      if (date >= todayStart) {
        today.push(session);
      } else if (date >= yesterdayStart) {
        yesterday.push(session);
      } else if (date >= sevenDaysAgoStart) {
        previous7Days.push(session);
      } else {
        older.push(session);
      }
    });

    return [
      { title: "Today", items: today },
      { title: "Yesterday", items: yesterday },
      { title: "Previous 7 Days", items: previous7Days },
      { title: "Older", items: older }
    ].filter(group => group.items.length > 0);
  }, [sessions, searchQuery]);

  if (isCollapsed) {
    return (
      <div className="w-[60px] h-full bg-[#F8FAFC] dark:bg-[#18191B] border-r border-slate-200/80 dark:border-white/5 flex flex-col items-center py-4 space-y-6 shrink-0 transition-all duration-300">
        <button
          onClick={() => setIsCollapsed(false)}
          className="p-2 hover:bg-slate-200/50 dark:hover:bg-white/5 rounded-xl text-slate-400 dark:text-muted-foreground hover:text-slate-800 dark:hover:text-foreground transition-colors cursor-pointer"
          title="Expand Sidebar"
        >
          <PanelLeftOpen className="w-5 h-5" />
        </button>
        <button
          onClick={onNewChat}
          className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl text-white hover:scale-105 active:scale-95 transition-all shadow-md cursor-pointer"
          title="New Chat"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="w-[280px] h-full bg-[#F8FAFC] dark:bg-[#18191B] border-r border-slate-200/80 dark:border-white/5 flex flex-col shrink-0 transition-all duration-300 relative text-slate-800 dark:text-white">
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-slate-200/80 dark:border-white/5 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-md">
            <span className="text-white text-xs font-bold font-mono">ES</span>
          </div>
          <span className="font-semibold tracking-tight text-sm font-mono text-slate-700 dark:text-white/90">EduSim Chats</span>
        </div>
        <button
          onClick={() => setIsCollapsed(true)}
          className="p-1.5 hover:bg-slate-200/50 dark:hover:bg-white/5 rounded-lg text-slate-400 dark:text-muted-foreground hover:text-slate-800 dark:hover:text-foreground transition-colors cursor-pointer"
          title="Collapse Sidebar"
        >
          <PanelLeftClose className="w-4 h-4" />
        </button>
      </div>

      {/* Action Buttons */}
      <div className="p-3 space-y-2 shrink-0">
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-200/40 dark:bg-white/5 hover:bg-slate-200/80 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-medium text-slate-700 dark:text-white transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4 text-blue-500 dark:text-blue-400" />
          <span>New chat</span>
        </button>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-muted-foreground" />
          <input
            type="text"
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-200/40 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-xl text-xs text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-muted-foreground focus:outline-none focus:border-blue-500/50 focus:bg-white dark:focus:bg-white/10 transition-colors"
          />
        </div>
      </div>

      {/* Recents List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-3 pb-4 space-y-4">
        {loading && sessions.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
          </div>
        ) : groupedSessions.length === 0 ? (
          <div className="text-center text-xs text-slate-400 dark:text-muted-foreground py-8">
            {searchQuery ? "No matching chats found" : "No recent chats"}
          </div>
        ) : (
          groupedSessions.map(group => (
            <div key={group.title} className="space-y-1.5">
              <h3 className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-muted-foreground/80">
                {group.title}
              </h3>
              <div className="space-y-0.5">
                {group.items.map(session => {
                  const isActive = activeSessionId === session.id;
                  return (
                    <div
                      key={session.id}
                      onClick={() => onSelectSession(session.id)}
                      className={`group relative flex items-center justify-between px-3 py-2 rounded-xl text-xs cursor-pointer transition-all duration-200 ${
                        isActive
                          ? "bg-slate-200/60 dark:bg-white/10 text-slate-900 dark:text-white font-medium shadow-inner"
                          : "text-slate-600 dark:text-muted-foreground hover:text-slate-900 hover:bg-slate-200/30 dark:hover:text-white dark:hover:bg-white/5"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-4">
                        <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-blue-500 dark:text-blue-400" : "text-slate-400 dark:text-muted-foreground"}`} />
                        <span className="truncate">{session.topic || "General Physics"}</span>
                      </div>
                      <button
                        onClick={(e) => handleDelete(e, session.id)}
                        className="opacity-0 group-hover:opacity-100 hover:text-red-500 dark:hover:text-red-400 p-1 rounded transition-all cursor-pointer"
                        title="Delete chat"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* User profile footer */}
      {user && (
        <div className="p-3 border-t border-slate-200/80 dark:border-white/5 bg-slate-100/30 dark:bg-black/20 shrink-0">
          <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-md shrink-0">
                {user.avatar ? (
                  <img src={user.avatar} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <UserIcon className="w-4 h-4 text-white" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-800 dark:text-white/90 truncate leading-tight">{user.name}</p>
                <p className="text-[10px] text-slate-500 dark:text-muted-foreground truncate capitalize mt-0.5">{user.role || "student"}</p>
              </div>
            </div>
            <button 
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg text-slate-400 dark:text-muted-foreground hover:text-slate-800 dark:hover:text-foreground transition-colors cursor-pointer"
              title="Profile Options"
            >
              <Store className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
