import React, { useMemo } from "react";
import { BookOpen, Cpu, FlaskConical, Lightbulb, Zap } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChatBubble } from "./ChatBubble";
import { MessageSquare, Layout } from "lucide-react";
import { AIExplanationCard } from "./AIExplanationCard";
import { formatLatexForDisplay } from "@/utils/latexDisplay";

const MAX_RELATED_CONCEPTS = 6;

const KNOWN_SINGLE_WORD_CONCEPTS = new Set([
  "current",
  "voltage",
  "resistance",
  "force",
  "mass",
  "acceleration",
  "momentum",
  "inertia",
  "energy",
  "power",
  "pressure",
  "density",
  "temperature",
  "velocity",
  "speed",
  "charge",
  "circuit",
  "circuits",
  "conductors",
  "insulators",
  "gravity",
  "friction",
  "impulse",
  "torque",
  "buoyancy",
  "refraction",
  "reflection",
  "optics",
  "electricity",
  "wavelength",
  "frequency",
]);

function normalizeConceptValue(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  let text = value.replace(/\s+/g, " ").trim();
  if (!text) {
    return null;
  }

  if (/[=\\$_{}^]/.test(text)) {
    return null;
  }

  if (/^[\d\W_]+$/.test(text)) {
    return null;
  }

  if (/\d/.test(text)) {
    return null;
  }

  text = text.replace(/\b(?:explain|define|what is|meaning of)\b/i, "").trim();
  if (!text) {
    return null;
  }

  const words = text.match(/[A-Za-z]+(?:'[A-Za-z]+)?/g) || [];
  if (words.length < 2 && !KNOWN_SINGLE_WORD_CONCEPTS.has(text.toLowerCase())) {
    return null;
  }

  return text;
}

function sanitizeConcepts(concepts: unknown) {
  if (!Array.isArray(concepts)) {
    return [] as string[];
  }

  const filtered = concepts.map(normalizeConceptValue).filter(Boolean) as string[];

  // Remove formula/law titles from related concepts
  const cleaned = filtered.filter((c) => !/\b(law|formula|equation)\b/i.test(c));

  const uniqueConcepts = [...new Set(cleaned)];
  return uniqueConcepts.slice(0, MAX_RELATED_CONCEPTS);
}

function formatFormulaDisplay(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  return formatLatexForDisplay(value).replace(/\s+/g, " ").trim();
}

interface TutorOutputPanelProps {
  data: {
    title?: string;
    description?: string;
    queryType?: string;
    concepts?: string[];
    formulas?: Array<{
      formula: string;
      rawFormula?: string;
      displayFormula?: string;
      name: string;
      topic: string;
      meaning: string;
    }>;
    explanation?: string;
    ai_explanation?: string;
    ragContent?: Array<{
      title: string;
      content: string;
    }>;
  } | null;
  className?: string;
  selectedTopic?: {
    subject: string;
    chapter: string;
    topic?: string;
  };
}

export function TutorOutputPanel({ data, className = "", selectedTopic }: TutorOutputPanelProps) {
  const explanationText = data?.explanation || data?.ai_explanation || "";
  const relatedConcepts = useMemo(() => sanitizeConcepts(data?.concepts), [data?.concepts]);
  const formulas = useMemo(() => {
    if (!Array.isArray(data?.formulas)) {
      return [];
    }

    return data.formulas
      .map((formula) => ({
        ...formula,
        displayFormula: formatFormulaDisplay(formula.displayFormula || formula.formula),
      }))
      .filter((formula) => Boolean(formula.displayFormula));
  }, [data?.formulas]);

  if (!data) {
    return (
      <div
        className={`glass-strong rounded-3xl p-12 flex flex-col items-center justify-center text-center gap-6 ${className}`}
      >
        <div className="w-20 h-20 rounded-3xl bg-secondary flex items-center justify-center animate-pulse">
          <BookOpen className="w-10 h-10 text-muted-foreground/30" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-muted-foreground/50">Analysis Results</h3>
          <p className="text-sm text-muted-foreground/30 mt-2">
            Enter a question on the left to see concepts, formulas, and explanations.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-6 h-full ${className}`}>
      <Tabs defaultValue="analysis" className="w-full h-full flex flex-col gap-6">
        {/* Curriculum Context Header */}
        {selectedTopic && (
          <div className="px-5 py-4 rounded-3xl bg-secondary/30 border border-border/50 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-xl">
              📚
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                Currently Viewing
              </p>
              <p className="text-sm font-semibold text-foreground">
                {selectedTopic.subject} • {selectedTopic.chapter}
                {selectedTopic.topic && (
                  <>
                    <span className="mx-2 text-muted-foreground/50">/</span>
                    <span className="text-primary">{selectedTopic.topic}</span>
                  </>
                )}
              </p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mt-2">
          <TabsList className="bg-secondary/50 border border-border/50 rounded-2xl p-1 shadow-sm">
            <TabsTrigger
              value="analysis"
              className="rounded-xl flex items-center gap-2 px-6 font-bold text-sm"
            >
              <Layout className="w-4 h-4" />
              Analysis
            </TabsTrigger>
            <TabsTrigger
              value="chat"
              className="rounded-xl flex items-center gap-2 px-6 font-bold text-sm"
            >
              <MessageSquare className="w-4 h-4" />
              Tutor Chat
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent
          value="analysis"
          className="flex-1 overflow-y-auto pr-2 custom-scrollbar flex flex-col gap-6 outline-none animate-in fade-in duration-500"
        >
          {/* Section 1: Related Concepts */}
          <section className="glass-strong rounded-[2rem] p-8 border border-border/50">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Lightbulb className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Related Concepts</h3>
                <p className="text-xs text-muted-foreground">Key ideas connected to this topic</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {relatedConcepts.length > 0 ? (
                relatedConcepts.map((concept, i) => (
                  <div
                    key={concept}
                    className="px-4 py-2.5 rounded-xl bg-secondary/80 border border-border/50 text-foreground text-sm font-bold animate-in fade-in zoom-in duration-300 hover:border-primary/30 hover:bg-secondary transition-all"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    {concept}
                  </div>
                ))
              ) : (
                <div className="w-full p-6 rounded-2xl bg-secondary/30 border border-dashed border-border text-center">
                  <p className="text-sm text-muted-foreground italic">
                    No specific concepts identified.
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Section 2: Relevant Formulas */}
          <section className="glass-strong rounded-[2rem] p-8 border border-border/50">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <Cpu className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Relevant Formulas</h3>
                <p className="text-xs text-muted-foreground">Mathematical expressions and laws</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {formulas.length > 0 ? (
                formulas.map((f, i) => (
                  <div
                    key={`${f.name}-${i}`}
                    className="p-6 rounded-2xl bg-secondary/50 border border-border/50 hover:border-primary/30 hover:bg-secondary/80 transition-all group animate-in slide-in-from-bottom-4 duration-500 shadow-sm"
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <div className="text-2xl font-mono font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
                      {f.displayFormula}
                    </div>
                    <div className="text-sm font-bold text-foreground/90 mb-1">{f.name}</div>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-3 opacity-60">
                      {f.topic}
                    </div>
                    <div className="text-xs text-muted-foreground leading-relaxed bg-background/50 p-3 rounded-xl border border-border/30">
                      {f.meaning}
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full p-8 rounded-2xl bg-secondary/30 border border-dashed border-border text-center">
                  <p className="text-sm text-muted-foreground italic">
                    No formulas relevant to this query were found.
                  </p>
                </div>
              )}
            </div>
          </section>

          <AIExplanationCard content={data.explanation || data.ai_explanation || ""} />
          {/* Section 4: Textbook / RAG Content */}
          <section className="glass-strong rounded-3xl p-6 border-l-4 border-l-indigo-500 mb-4">
            <div className="flex items-center gap-3 mb-6">
              <FlaskConical className="w-5 h-5 text-indigo-400" />
              <h3 className="text-lg font-bold">Textbook Context</h3>
            </div>
            <div className="space-y-4">
              {data.ragContent && data.ragContent.length > 0 ? (
                data.ragContent.map((item, i) => (
                  <div
                    key={i}
                    className="p-5 rounded-2xl bg-secondary border border-border hover:bg-secondary/80 transition-all animate-in fade-in slide-in-from-right-4 duration-500"
                    style={{ animationDelay: `${i * 200}ms` }}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_var(--primary)]" />
                      <h4 className="text-xs font-bold text-primary uppercase tracking-wider">
                        {item.title}
                      </h4>
                    </div>
                    <p className="text-sm text-muted-foreground/90 leading-relaxed italic border-l-2 border-border pl-4">
                      "{item.content}"
                    </p>
                  </div>
                ))
              ) : (
                <div className="p-8 rounded-2xl bg-secondary border border-border text-center">
                  <p className="text-sm text-muted-foreground italic">
                    No textbook excerpts found for this topic. I'll rely on general AI knowledge.
                  </p>
                </div>
              )}
            </div>
          </section>
        </TabsContent>

        <TabsContent
          value="chat"
          className="flex-1 overflow-y-auto pr-2 custom-scrollbar flex flex-col gap-4 outline-none"
        >
          <div className="flex flex-col gap-4 p-2">
            <ChatBubble
              role="ai"
              content={`Hello! I've analyzed your question. Here's a quick summary:\n\n${explanationText.split("\n")[0] || "No explanation available yet."}...`}
            />
            <div className="glass-strong rounded-2xl p-6 border-dashed border-border text-center">
              <p className="text-sm text-muted-foreground">
                The interactive chat feature is being synchronized. For now, please refer to the
                detailed Analysis tab for full insights.
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
