import React, { useState } from "react";
import { Search, Send, Sparkles } from "lucide-react";

interface TutorInputPanelProps {
  onAnalyze: (query: string) => void;
  isLoading: boolean;
  className?: string;
  initialValue?: string;
  curriculumContext?: {
    subject: string;
    chapter: string;
    topic?: string;
  };
}

const EXAMPLES = [
  "Explain force and acceleration",
  "What is momentum?",
  "Explain total internal reflection",
  "Difference between pitch and loudness",
  "Give formulas related to velocity",
];

export function TutorInputPanel({ onAnalyze, isLoading, className = "", initialValue = "", curriculumContext }: TutorInputPanelProps) {
    const CURRICULUM_EXAMPLES: Record<string, string[]> = {
      "Motion": [
        "What is the difference between distance and displacement?",
        "Explain Newton's first law of motion",
        "How do we calculate average velocity?",
        "What is acceleration and how does it relate to force?",
      ],
      "Sounds": [
        "What is the speed of sound?",
        "Explain the Doppler effect",
        "What is resonance in sound waves?",
      ],
      "Electricity": [
        "What is electric current?",
        "How do we calculate resistance?",
        "What is Ohm's law?",
      ],
      "Magnetism": [
        "What creates a magnetic field?",
        "Explain electromagnetic induction",
        "How do magnets work?",
      ],
      "Light": [
        "What is total internal reflection?",
        "How do lenses work?",
        "What is refraction?",
      ],
    };

    const examples: string[] = curriculumContext 
      ? (curriculumContext.topic ? CURRICULUM_EXAMPLES[curriculumContext.topic] : null) || 
        (curriculumContext.chapter ? CURRICULUM_EXAMPLES[curriculumContext.chapter] : null) || 
        EXAMPLES
      : EXAMPLES;
  const [query, setQuery] = useState(initialValue);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !isLoading) {
      onAnalyze(query);
    }
  };

  return (
    <div className={`glass-strong rounded-[2rem] p-8 flex flex-col gap-8 border border-border/50 shadow-xl ${className}`}>
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--neon-purple)] to-[var(--neon-blue)] flex items-center justify-center shadow-lg glow-purple shrink-0">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">AI Tutor Workspace</h2>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
            Powered by EduSim Intelligence
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="relative group">
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask me anything about physics concepts or formulas..."
          className="w-full h-44 bg-secondary/30 border border-border/50 rounded-[1.5rem] p-6 pr-14 text-base focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none text-foreground placeholder:text-muted-foreground/60 leading-relaxed font-medium"
        />
        <button
          type="submit"
          disabled={isLoading || !query.trim()}
          className="absolute bottom-5 right-5 w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg disabled:opacity-30 disabled:cursor-not-allowed hover:scale-105 active:scale-95 transition-all shadow-primary/20"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>

      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <div className="h-px flex-1 bg-border/50" />
          <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] whitespace-nowrap">
            Example Prompts
          </h3>
          <div className="h-px flex-1 bg-border/50" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {examples.map((ex) => (
            <button
              key={ex}
              onClick={() => {
                setQuery(ex);
                onAnalyze(ex);
              }}
              disabled={isLoading}
              className="px-4 py-3 rounded-xl bg-secondary/30 border border-border/50 text-xs hover:bg-secondary hover:border-primary/30 transition-all text-left font-bold text-foreground/80 hover:text-foreground"
            >
              {ex}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={isLoading || !query.trim()}
        className="w-full py-4.5 rounded-[1.5rem] bg-primary text-white font-bold text-base shadow-xl hover:shadow-primary/20 transition-all flex items-center justify-center gap-3 active:scale-[0.98] mt-2"
      >
        {isLoading ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <>
            <Search className="w-5 h-5" />
            Analyze Question
          </>
        )}
      </button>
    </div>
  );
}
