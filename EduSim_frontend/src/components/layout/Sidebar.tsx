import { Link, useRouterState } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  User,
  Settings,
  Sparkles,
  GraduationCap,
  ChevronLeft,
  LogOut,
  Atom,
} from "lucide-react";
import { useSidebarStore } from "@/store/useSidebarStore";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuthStore } from "@/store/useAuthStore";

interface SidebarItem {
  to: string;
  label: string;
  icon: any;
}

const items: SidebarItem[] = [
  { to: "/dashboard", label: "Home", icon: Home },
  { to: "/tutor", label: "Tutor", icon: GraduationCap },
  { to: "/sandbox/default", label: "Sandbox", icon: Atom },
  { to: "/profile", label: "Profile", icon: User },
];

export function Sidebar() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { isCollapsed, toggleSidebar, isMobileOpen, setMobileOpen } = useSidebarStore();
  const { logout } = useAuthStore();

  const sidebarVariants = {
    expanded: { width: 260 },
    collapsed: { width: 80 },
  };

  return (
    <TooltipProvider delayDuration={0}>
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-[35] bg-black/40 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={isCollapsed ? "collapsed" : "expanded"}
        variants={sidebarVariants}
        transition={{ type: "spring", stiffness: 400, damping: 40 }}
        className={`fixed inset-y-0 left-0 z-[60] flex flex-col bg-background/80 backdrop-blur-2xl border-r border-border/20 shadow-2xl overflow-hidden transition-colors duration-300 ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex items-center h-20 px-5 mb-4 shrink-0">
          <Link to="/dashboard" className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br from-[var(--neon-purple)] to-[var(--neon-blue)] flex items-center justify-center glow-purple">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            {!isCollapsed && (
              <motion.span 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xl font-bold tracking-tight text-gradient whitespace-nowrap"
              >
                EduSim
              </motion.span>
            )}
          </Link>
        </div>

        <nav className="flex flex-col gap-2 flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar px-4">
          {items.map((it) => {
            const active = it.to === "/dashboard" ? (path === "/" || path === "/dashboard") : path.startsWith(it.to);
            const Icon = it.icon;

            const NavLink = (
              <Link
                key={it.to}
                to={it.to}
                onClick={() => setMobileOpen(false)}
                className={`group relative flex items-center h-12 rounded-2xl transition-all duration-300 ${
                  active
                    ? "bg-secondary text-primary font-semibold shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`}
              >
                <div className="w-12 h-12 shrink-0 flex items-center justify-center">
                   <Icon className={`w-5 h-5 transition-all duration-300 ${active ? "text-primary scale-110 drop-shadow-[0_0_8px_var(--primary)]" : "group-hover:scale-110"}`} />
                </div>
                
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-[15px] font-medium whitespace-nowrap overflow-hidden pr-4"
                  >
                    {it.label}
                  </motion.span>
                )}

                {active && (
                  <motion.div 
                    layoutId="active-nav-indicator"
                    className="absolute right-2 w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_10px_var(--primary)]"
                  />
                )}
              </Link>
            );

            if (isCollapsed) {
              return (
                <Tooltip key={it.to}>
                  <TooltipTrigger asChild>
                    <div className="w-full">{NavLink}</div>
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={15} className="font-medium text-sm bg-card border border-border text-foreground shadow-md px-3 py-1.5">
                    {it.label}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return NavLink;
          })}
        </nav>

        <div className="p-4 mt-auto space-y-2 border-t border-border/10">
           {isCollapsed ? (
             <Tooltip>
               <TooltipTrigger asChild>
                 <button 
                   onClick={toggleSidebar}
                   className="w-full flex items-center h-12 rounded-2xl text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all duration-300 group"
                 >
                   <div className="w-12 h-12 shrink-0 flex items-center justify-center">
                     <ChevronLeft className="w-5 h-5 rotate-180" />
                   </div>
                 </button>
               </TooltipTrigger>
               <TooltipContent side="right" sideOffset={15} className="font-medium text-sm bg-card border border-border text-foreground shadow-md px-3 py-1.5">
                 Expand
               </TooltipContent>
             </Tooltip>
           ) : (
             <button 
               onClick={toggleSidebar}
               className="w-full flex items-center h-12 rounded-2xl text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all duration-300 group"
             >
               <div className="w-12 h-12 shrink-0 flex items-center justify-center">
                 <ChevronLeft className="w-5 h-5" />
               </div>
               <span className="text-[15px] font-medium">Collapse</span>
             </button>
           )}

           {isCollapsed ? (
             <Tooltip>
               <TooltipTrigger asChild>
                 <button 
                   onClick={logout}
                   className="w-full flex items-center h-12 rounded-2xl text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-all duration-300 group"
                 >
                   <div className="w-12 h-12 shrink-0 flex items-center justify-center">
                     <LogOut className="w-5 h-5" />
                   </div>
                 </button>
               </TooltipTrigger>
               <TooltipContent side="right" sideOffset={15} className="font-medium text-sm bg-card border border-border text-foreground shadow-md px-3 py-1.5">
                 Logout
               </TooltipContent>
             </Tooltip>
           ) : (
             <button 
               onClick={logout}
               className="w-full flex items-center h-12 rounded-2xl text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-all duration-300 group"
             >
               <div className="w-12 h-12 shrink-0 flex items-center justify-center">
                 <LogOut className="w-5 h-5" />
               </div>
               <span className="text-[15px] font-medium">Logout</span>
             </button>
           )}
        </div>
      </motion.aside>
    </TooltipProvider>
  );
}
