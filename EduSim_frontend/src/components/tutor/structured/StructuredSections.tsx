import React from "react";
import { BlockMath, InlineMath } from "@/components/math/Katex";
import { TutorMarkdownRenderer } from "../TutorMarkdownRenderer";
import { BookOpen, Key, Target, FlaskConical, FunctionSquare, Calculator, Lightbulb, CheckCircle2, Search } from "lucide-react";

interface SectionProps {
  content?: string;
  items?: string[];
  title?: string;
}

const renderMarkdownWithMath = (text: string) => {
  // Simple heuristic: if it's already using markdown we use TutorMarkdownRenderer
  // But for simple texts or lists, we can just use TutorMarkdownRenderer directly
  return <TutorMarkdownRenderer content={text} density="compact" />;
};

export function IntroductionSection({ content }: SectionProps) {
  if (!content) return null;
  return (
    <div className="mb-6 space-y-3">
      <div className="flex items-center gap-2 text-violet-400 mb-2">
        <BookOpen className="w-5 h-5" />
        <h4 className="text-lg font-bold">Introduction</h4>
      </div>
      <div className="pl-7 border-l-2 border-violet-500/30">
        {renderMarkdownWithMath(content)}
      </div>
    </div>
  );
}

export function DefinitionSection({ content }: SectionProps) {
  if (!content) return null;
  return (
    <div className="mb-6 space-y-3">
      <div className="flex items-center gap-2 text-blue-400 mb-2">
        <Target className="w-5 h-5" />
        <h4 className="text-lg font-bold">Definition</h4>
      </div>
      <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
        {renderMarkdownWithMath(content)}
      </div>
    </div>
  );
}

export function KeyConceptsSection({ items }: SectionProps) {
  if (!items || items.length === 0) return null;
  return (
    <div className="mb-6 space-y-3">
      <div className="flex items-center gap-2 text-emerald-400 mb-3">
        <Key className="w-5 h-5" />
        <h4 className="text-lg font-bold">Key Concepts</h4>
      </div>
      <ul className="grid grid-cols-1 gap-3">
        {items.map((item, idx) => (
          <li key={idx} className="flex gap-3 items-start bg-white/5 p-3 rounded-xl border border-white/10">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-sm text-foreground/90">{renderMarkdownWithMath(item)}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function PropertiesSection({ items }: SectionProps) {
  if (!items || items.length === 0) return null;
  return (
    <div className="mb-6 space-y-3">
      <div className="flex items-center gap-2 text-orange-400 mb-3">
        <FlaskConical className="w-5 h-5" />
        <h4 className="text-lg font-bold">Properties & Characteristics</h4>
      </div>
      <ul className="list-disc list-inside space-y-2 text-foreground/80 pl-2">
        {items.map((item, idx) => (
          <li key={idx}>{renderMarkdownWithMath(item)}</li>
        ))}
      </ul>
    </div>
  );
}

export function FormulaSection({ formula }: { formula?: { expression?: string; meaning?: string; variables?: Record<string, string> } }) {
  if (!formula || (!formula.expression && !formula.meaning)) return null;
  return (
    <div className="mb-6 space-y-4 p-5 rounded-2xl bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 border border-violet-500/20">
      <div className="flex items-center gap-2 text-fuchsia-400 mb-2">
        <FunctionSquare className="w-5 h-5" />
        <h4 className="text-lg font-bold">Formula</h4>
      </div>

      {formula.expression && (
        <div className="py-4 text-center overflow-x-auto custom-scrollbar bg-black/20 rounded-xl">
          <BlockMath math={formula.expression} />
        </div>
      )}

      {formula.meaning && (
        <p className="text-sm text-foreground/90 italic text-center">
          {formula.meaning}
        </p>
      )}

      {formula.variables && Object.keys(formula.variables).length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <h5 className="text-sm font-semibold text-muted-foreground mb-2">Variables:</h5>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {Object.entries(formula.variables).map(([sym, desc]) => (
              <div key={sym} className="flex gap-2 text-sm">
                <span className="font-bold text-violet-300 w-8 text-right"><InlineMath math={sym} /></span>
                <span className="text-muted-foreground">: {desc}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function DerivationSection({ content }: SectionProps) {
  if (!content) return null;
  return (
    <div className="mb-6 space-y-3">
      <div className="flex items-center gap-2 text-slate-400 mb-2">
        <Calculator className="w-5 h-5" />
        <h4 className="text-lg font-bold">Derivation</h4>
      </div>
      <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50 text-sm">
        {renderMarkdownWithMath(content)}
      </div>
    </div>
  );
}

export function SolvedExampleSection({ content }: SectionProps) {
  if (!content) return null;
  return (
    <div className="mb-6 space-y-3">
      <div className="flex items-center gap-2 text-green-400 mb-2">
        <Lightbulb className="w-5 h-5" />
        <h4 className="text-lg font-bold">Solved Example</h4>
      </div>
      <div className="p-5 rounded-xl bg-green-500/10 border border-green-500/20">
        {renderMarkdownWithMath(content)}
      </div>
    </div>
  );
}

export function ApplicationsSection({ items }: SectionProps) {
  if (!items || items.length === 0) return null;
  return (
    <div className="mb-6 space-y-3">
      <div className="flex items-center gap-2 text-pink-400 mb-3">
        <Target className="w-5 h-5" />
        <h4 className="text-lg font-bold">Applications & Industry Usage</h4>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {items.map((item, idx) => (
          <div key={idx} className="bg-white/5 p-3 rounded-xl border border-white/10 text-sm">
            {renderMarkdownWithMath(item)}
          </div>
        ))}
      </div>
    </div>
  );
}

export function SummarySection({ content }: SectionProps) {
  if (!content) return null;
  return (
    <div className="mb-6 space-y-3">
      <div className="flex items-center gap-2 text-yellow-400 mb-2">
        <BookOpen className="w-5 h-5" />
        <h4 className="text-lg font-bold">Summary</h4>
      </div>
      <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
        {renderMarkdownWithMath(content)}
      </div>
    </div>
  );
}

export function SuggestedQuestionsSection({ items }: SectionProps) {
  if (!items || items.length === 0) return null;
  return (
    <div className="mb-6 space-y-3">
      <div className="flex items-center gap-2 text-cyan-400 mb-3">
        <Search className="w-5 h-5" />
        <h4 className="text-lg font-bold">Suggested Questions</h4>
      </div>
      <div className="flex flex-col gap-2">
        {items.map((item, idx) => (
          <button key={idx} className="text-left p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 hover:bg-cyan-500/20 transition-colors text-sm font-medium text-cyan-100">
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}
