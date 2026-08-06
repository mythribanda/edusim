import React from "react";
import { Zap } from "lucide-react";
import "katex/dist/katex.min.css";
import { TutorMarkdownRenderer } from "./TutorMarkdownRenderer";

interface AIExplanationCardProps {
  content: string;
  isLoading?: boolean;
}

export function AIExplanationCard({ content, isLoading }: AIExplanationCardProps) {
  if (!content || content.trim() === "") {
    return (
      <section className="glass-strong rounded-3xl p-6 border border-border flex items-center justify-center min-h-[200px]">
        <div className="text-center">
          <Zap className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
          <p className="text-muted-foreground/60">No explanation available yet. Ask a question to get started.</p>
        </div>
      </section>
    );
  }

  if (isLoading) {
    return (
      <div className="glass-strong rounded-3xl p-6 space-y-4 animate-pulse">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-5 h-5 bg-secondary rounded-full" />
          <div className="h-6 w-40 bg-secondary rounded-lg" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-full bg-secondary/50 rounded" />
          <div className="h-4 w-[90%] bg-secondary/50 rounded" />
          <div className="h-4 w-[95%] bg-secondary/50 rounded" />
          <div className="h-4 w-[85%] bg-secondary/50 rounded" />
        </div>
      </div>
    );
  }

  return (
    <section className="glass-strong rounded-[2rem] p-8 relative overflow-hidden border border-border shadow-xl transition-all">
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 blur-3xl -z-10 pointer-events-none" />
      
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-sm">
            <Zap className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground">AI Analysis & Explanation</h3>
            <p className="text-xs text-muted-foreground">Detailed conceptual walkthrough and derivations</p>
          </div>
        </div>
        <div className="px-4 py-1.5 rounded-full bg-secondary/60 border border-border/40 text-[10px] font-bold uppercase tracking-widest text-muted-foreground select-none">
          AI Assistant
        </div>
      </div>

      <div className="w-full">
        <TutorMarkdownRenderer content={content} density="regular" />
      </div>
    </section>
  );
}
