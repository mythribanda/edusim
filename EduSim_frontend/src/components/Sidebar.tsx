import { Link, useRouterState } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  User,
  Settings,
  Sparkles,
  GraduationCap,
  ChevronLeft,
  Menu,
} from "lucide-react";
import { useSidebarStore } from "@/store/useSidebarStore";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface SidebarItem {
  to: string;
  label: string;
  icon: any;
  badge?: string;
}

const items: SidebarItem[] = [
  { to: "/", label: "Home", icon: Home },
  { to: "/tutor", label: "Tutor", icon: GraduationCap },
  { to: "/profile", label: "Profile", icon: User },
];

export function Sidebar() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { isCollapsed, toggleSidebar, isMobileOpen, setMobileOpen } = useSidebarStore();

  const sidebarVariants = {
    expanded: { width: 260 },
    collapsed: { width: 80 },
  };

  return (
    <TooltipProvider delayDuration={0}>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm md:hidden"
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={isCollapsed ? "collapsed" : "expanded"}
        variants={sidebarVariants}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={`fixed inset-y-0 left-0 z-[110] flex flex-col glass-strong md:relative m-4 rounded-[2rem] p-4 border border-border/50 shadow-2xl transition-all duration-300 ${
          isMobileOpen ? "translate-x-0" : "-translate-x-[120%] md:translate-x-0"
        }`}
      >
        <div className="flex items-center justify-between mb-8 px-2">
          <Link to="/" className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 shrink-0 rounded-2xl bg-gradient-to-br from-[var(--neon-purple)] to-[var(--neon-blue)] flex items-center justify-center glow-purple">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <motion.span 
              animate={{ 
                opacity: isCollapsed ? 0 : 1,
                width: isCollapsed ? 0 : "auto"
              }}
              className="text-xl font-bold text-gradient whitespace-nowrap overflow-hidden"
            >
              EduSim
            </motion.span>
          </Link>
        </div>

        <nav className="flex flex-col gap-2 flex-1 overflow-hidden px-1">
          {items.map((it) => {
            const active = it.to === "/" ? path === "/" : path.startsWith(it.to);
            const Icon = it.icon;

            const NavLink = (
              <Link
                key={it.to}
                to={it.to}
                onClick={() => setMobileOpen(false)}
                className={`group relative flex items-center h-12 rounded-2xl transition-all duration-300 ${
                  active
                    ? "bg-gradient-to-r from-violet-500/20 to-indigo-500/10 border border-violet-400/20 shadow-[0_0_20px_rgba(139,92,246,0.15)] text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50 border border-transparent"
                }`}
              >
                <div className={`w-12 h-12 shrink-0 flex items-center justify-center transition-colors duration-300 ${active ? "text-primary" : "group-hover:text-foreground"}`}>
                  <Icon className="w-5 h-5" />
                </div>
                
                <motion.span
                  animate={{ 
                    opacity: isCollapsed ? 0 : 1,
                    width: isCollapsed ? 0 : "auto"
                  }}
                  className="text-sm font-bold whitespace-nowrap overflow-hidden pr-4"
                >
                  {it.label}
                </motion.span>

                {active && (
                  <motion.div 
                    layoutId="active-indicator"
                    className="absolute left-0 w-1 h-6 bg-primary rounded-r-full shadow-[0_0_10px_var(--primary)]"
                  />
                )}

                {it.badge && !isCollapsed && (
                  <span className="ml-auto mr-4 text-[10px] font-bold px-2 py-0.5 rounded-lg bg-primary/10 text-primary uppercase tracking-widest">
                    {it.badge}
                  </span>
                )}
              </Link>
            );

            if (isCollapsed) {
              return (
                <Tooltip key={it.to}>
                  <TooltipTrigger asChild>
                    <div className="w-full">{NavLink}</div>
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={20} className="rounded-xl px-3 py-2 text-sm shadow-xl glass-strong border-border/50 text-foreground">
                    {it.label}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return NavLink;
          })}
        </nav>

        <div className="pt-4 border-t border-border/50">
           <button 
             onClick={toggleSidebar}
             className="w-full flex items-center h-12 rounded-2xl text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all group"
           >
             <div className="w-12 h-12 shrink-0 flex items-center justify-center group-hover:rotate-180 transition-transform duration-500">
               <ChevronLeft className={`w-5 h-5 transition-transform duration-300 ${isCollapsed ? "rotate-180" : ""}`} />
             </div>
             <motion.span
                animate={{ 
                  opacity: isCollapsed ? 0 : 1,
                  width: isCollapsed ? 0 : "auto"
                }}
                className="text-sm font-bold whitespace-nowrap overflow-hidden"
             >
               Collapse
             </motion.span>
           </button>
        </div>
      </motion.aside>
    </TooltipProvider>
  );
}
