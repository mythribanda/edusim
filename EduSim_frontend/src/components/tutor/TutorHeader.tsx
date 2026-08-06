import React from "react";
import { Menu, User, History, Sun, Moon } from "lucide-react";
import { useSidebarStore } from "@/store/useSidebarStore";
import { Link } from "@tanstack/react-router";
import { useTheme } from "@/hooks/useTheme";

interface TutorHeaderProps {
  onNewChat: () => void;
  topicTitle?: string;
  topicContext?: {
    subject?: string;
    className?: string;
    chapter?: string;
  };
  toggleHistory?: () => void;
}

export function TutorHeader({ onNewChat, topicTitle, topicContext, toggleHistory }: TutorHeaderProps) {
  const { setMobileOpen } = useSidebarStore();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="z-30 flex items-center justify-between shrink-0 pointer-events-auto mx-4 mt-4 mb-2 px-4 py-3 border border-border/80 bg-card/65 backdrop-blur-xl rounded-[24px] shadow-sm lg:mx-0 lg:mt-0 lg:mb-0 lg:w-full lg:h-16 lg:px-6 lg:py-4 lg:border-t-0 lg:border-x-0 lg:border-b lg:border-border/65 lg:bg-background/80 lg:rounded-none lg:shadow-none">
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Toggle Global Sidebar Button (Hamburger Menu) */}
        <button
          onClick={() => setMobileOpen(true)}
          className="lg:hidden w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-sm shrink-0"
          title="Open Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Toggle Chat History Button */}
        <button
          onClick={toggleHistory}
          className="lg:hidden w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-sm shrink-0"
          title="Toggle Chat History"
        >
          <History className="w-5 h-5" />
        </button>

        <div className="pl-1 shrink-0">
          <h1 className="text-base sm:text-lg lg:text-xl font-bold tracking-tight text-foreground">AI Tutor</h1>
          <p className="text-xs sm:text-sm text-muted-foreground hidden lg:block mt-0.5">
            Your personal AI learning assistant
          </p>
        </div>

        {topicTitle && (
          <div className="hidden md:flex lg:hidden flex-col border-l border-border pl-4">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/75">
              Currently Learning
            </span>
            <span className="text-xs font-semibold text-primary">{topicTitle}</span>
            {topicContext &&
              (topicContext.subject || topicContext.className || topicContext.chapter) && (
                <span className="text-[10px] font-medium text-muted-foreground mt-0.5">
                  {[
                    topicContext.className,
                    topicContext.subject,
                    topicContext.chapter ? `Chapter: ${topicContext.chapter}` : null,
                  ]
                    .filter(Boolean)
                    .join(" • ")}
                </span>
              )}
          </div>
        )}
      </div>

      {/* Right Controls - Mobile View */}
      <div className="flex items-center gap-3 lg:hidden">
        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="w-10 h-10 rounded-full bg-card border border-border/85 flex items-center justify-center hover:bg-secondary/50 transition-all hover:scale-105 active:scale-95 cursor-pointer"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? (
            <Sun className="w-4 h-4 text-amber-500" />
          ) : (
            <Moon className="w-4 h-4 text-muted-foreground" />
          )}
        </button>

        {/* User Profile Button */}
        <Link
          to="/profile"
          className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
        >
          <User className="w-4 h-4" />
        </Link>
      </div>

      {/* Right Controls - Laptop/Desktop View */}
      <div className="hidden lg:flex items-center gap-3">
        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="w-10 h-10 rounded-full bg-card border border-border/80 flex items-center justify-center hover:bg-secondary/50 transition-all hover:scale-105 active:scale-95 cursor-pointer"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? (
            <Sun className="w-4.5 h-4.5 text-amber-500" />
          ) : (
            <Moon className="w-4.5 h-4.5 text-muted-foreground" />
          )}
        </button>

        {/* User Profile Button */}
        <Link
          to="/profile"
          className="w-10 h-10 rounded-full bg-sky-100 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 flex items-center justify-center shadow-sm cursor-pointer border border-sky-200 dark:border-sky-900/30 transition-all hover:scale-105 active:scale-95"
        >
          <User className="w-5 h-5" />
        </Link>
      </div>
    </header>
  );
}
