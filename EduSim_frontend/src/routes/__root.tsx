import { Outlet, Link, createRootRoute, HeadContent, Scripts, useRouterState, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60000, // consider data fresh for 1 minute
      gcTime: 1000 * 60 * 10, // keep unused data in cache for 10 minutes
      refetchOnWindowFocus: false, // disable refetching on window focus
      retry: 1,
    },
  },
});
import { useSidebarStore } from "@/store/useSidebarStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useSimulationStore } from "@/store/useSimulationStore";
import "katex/dist/katex.min.css";

import appCss from "../styles.css?url";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

// Global fetch interceptor to display backend success/error notifications
if (typeof window !== "undefined" && !(window as any).__fetchIntercepted__) {
  (window as any).__fetchIntercepted__ = true;
  const originalFetch = window.fetch;
  window.fetch = async function (input, init) {
    const response = await originalFetch(input, init);
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      try {
        const clone = response.clone();
        const data = await clone.json();
        if (data && typeof data === "object") {
          if (data.success === true && typeof data.message === "string" && data.message) {
            toast.success(data.message);
          } else if (data.success === false && typeof data.message === "string" && data.message) {
            toast.error(data.message);
          }
        }
      } catch (e) {
        // Ignored
      }
    }
    return response;
  };
}


const PUBLIC_ROUTE_ALLOWLIST = new Set([
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
]);

const normalizePathname = (pathname: string) => {
  if (!pathname) {
    return "/";
  }

  if (pathname !== "/" && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }

  return pathname;
};

const isPublicRoute = (pathname: string) => PUBLIC_ROUTE_ALLOWLIST.has(normalizePathname(pathname));

const EMPTY_LOGIN_SEARCH = {
  verify_token: "",
  reset_token: "",
};

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center glass-strong rounded-3xl p-10">
        <h1 className="text-7xl font-bold text-gradient">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Lost in space</h2>
        <p className="mt-2 text-sm text-muted-foreground">This page drifted into a black hole.</p>
        <Link
          to="/"
          className="mt-6 inline-flex px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[var(--neon-purple)] to-[var(--neon-blue)] text-white text-sm font-medium glow-purple"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "EduSim — Interactive Learning Simulations" },
      {
        name: "description",
        content: "Explore classes, subjects, and immersive science simulations.",
      },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: () => (
    <QueryClientProvider client={queryClient}>
      <RootComponent />
    </QueryClientProvider>
  ),
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const routerState = useRouterState();
  const { isCollapsed } = useSidebarStore();
  const { isAuthenticated, checkAuth } = useAuthStore();
  const { isMaximized } = useSimulationStore();
  const navigate = useNavigate();
  const [isDesktop, setIsDesktop] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  const pathname = normalizePathname(routerState.location.pathname);

  useEffect(() => {
    if (!pathname.startsWith("/sandbox")) {
      useSimulationStore.getState().setMaximized(false);
    }
  }, [pathname]);

  useEffect(() => {
    const updateDesktop = () => setIsDesktop(window.innerWidth >= 1024);
    updateDesktop();
    window.addEventListener("resize", updateDesktop);
    return () => window.removeEventListener("resize", updateDesktop);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const verifySession = async () => {
      await checkAuth();
      if (!cancelled) {
        setAuthChecked(true);
      }
    };

    verifySession();
    return () => {
      cancelled = true;
    };
  }, [checkAuth]);

  const isRootRoute = pathname === "/";
  const isLandingOrAuthPage = pathname === "/login" || pathname === "/signup";
  const isAuthPage = pathname === "/login" || pathname === "/signup" || pathname === "/forgot-password" || pathname === "/reset-password";
  const requiresAuth = !isPublicRoute(pathname);

  useEffect(() => {
    if (!authChecked) {
      return;
    }

    if (isRootRoute) {
      navigate({
        to: isAuthenticated ? "/dashboard" : "/login",
        search: (isAuthenticated ? undefined : EMPTY_LOGIN_SEARCH) as any,
      });
      return;
    }

    if (!isAuthenticated && requiresAuth) {
      toast.error("Please login to continue");
      navigate({ to: "/login", search: EMPTY_LOGIN_SEARCH as any });
    } else if (isAuthenticated && isAuthPage) {
      navigate({ to: "/dashboard" });
    }
  }, [isAuthenticated, requiresAuth, navigate, isAuthPage, authChecked, isRootRoute, pathname]);

  if (isLandingOrAuthPage) {
    return (
      <div className="min-h-screen w-full relative bg-background text-foreground overflow-y-auto overflow-x-hidden custom-scrollbar">
        <Outlet />
        <Toaster />
      </div>
    );
  }
  
  return (
    <div className="flex min-h-screen w-full relative bg-background text-foreground overflow-hidden">
      {!isMaximized && <Sidebar />}
      
      <motion.main 
        initial={false}
        animate={{ 
          paddingLeft: isDesktop ? (isMaximized ? 0 : (isCollapsed ? 72 : 240)) : 0
        }}
        transition={{ type: "spring", stiffness: 400, damping: 40 }}
        className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden relative w-full"
      >
        <Navbar />
        
        {/* Main Content Scroll Container */}
        {/* Outlet is rendered directly — no AnimatePresence wrapper to avoid exit-animation
            blocking the incoming page from becoming visible. */}
        <div className={`flex-1 overflow-x-hidden ${pathname.startsWith('/tutor') || pathname.startsWith('/sandbox') ? 'flex flex-col h-full overflow-hidden p-0' : 'overflow-y-auto pt-28 pb-12 px-4 md:px-10 custom-scrollbar scroll-smooth'}`}>
          <div className={`mx-auto w-full ${pathname.startsWith('/tutor') || pathname.startsWith('/sandbox') ? 'h-full max-w-none' : 'max-w-[1500px]'}`}>
            <Outlet />
          </div>
        </div>
      </motion.main>
      <Toaster />
    </div>
  );
}
