import { createFileRoute } from "@tanstack/react-router";
import SandboxPage from "@/sandbox/pages/SandboxPage";

export const Route = createFileRoute("/sandbox/$simulationId")({
  component: SandboxPage,
  validateSearch: (search: Record<string, unknown>): { query?: string; mode?: string } => ({
    query: typeof search.query === "string" ? search.query : undefined,
    mode: typeof search.mode === "string" ? search.mode : undefined,
  }),
});
