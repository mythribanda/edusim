import { createFileRoute } from "@tanstack/react-router";
import { PageWrapper } from "@/components/Card";

export const Route = createFileRoute("/library")({
  component: () => (
    <PageWrapper>
      <div className="glass-strong rounded-3xl p-12 text-center">
        <h1 className="text-3xl font-bold text-gradient mb-2">Library</h1>
        <p className="text-muted-foreground">Browse the full simulation library.</p>
      </div>
    </PageWrapper>
  ),
});
