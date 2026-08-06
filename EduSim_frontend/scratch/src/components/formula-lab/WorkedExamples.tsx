import React from "react";
import { DynamicParsedFormula } from "@/utils/DynamicFormulaExtractor";
import ReactMarkdown from "react-markdown";

const WorkedExamples: React.FC<{ formula: DynamicParsedFormula | null }> = ({ formula }) => {
  const examples = Array.isArray(formula?.examples) ? formula.examples : [];
  if (!formula || examples.length === 0) return null;

  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl space-y-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-muted-foreground">Worked Examples</p>
        <h3 className="mt-2 text-xl font-bold">Step-by-step practice</h3>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {examples.map((example, idx) => (
          <div key={idx} className="rounded-3xl border border-white/10 bg-black/10 p-5">
            <h4 className="font-bold">{example.title}</h4>
            <div className="mt-4 space-y-2 text-sm leading-6 text-foreground/90 markdown-body prose prose-invert max-w-none">
               <ReactMarkdown>{example.content}</ReactMarkdown>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WorkedExamples;
