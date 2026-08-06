import React from "react";
import { DynamicParsedFormula } from "@/utils/DynamicFormulaExtractor";
import { TutorMarkdownRenderer } from "@/components/tutor/TutorMarkdownRenderer";

const AIInsightPanel: React.FC<{ formula: DynamicParsedFormula | null }> = ({ formula }) => {
  if (!formula) return <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 text-sm text-muted-foreground">AI insights will appear here once a formula is selected.</div>;

  const relatedTopics = Array.isArray(formula.relatedTopics) ? formula.relatedTopics : [];
  const description = formula.description || "";

  if (!description && relatedTopics.length === 0) return null;

  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl space-y-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-muted-foreground">AI Insights</p>
        <h3 className="mt-2 text-xl font-bold">Related Context</h3>
      </div>
      <div className="grid gap-3">
        {description && (
          <div className="rounded-2xl border border-white/10 bg-black/10 p-4 text-sm leading-6 text-foreground/90">
             <span className="font-semibold text-violet-300 block mb-3">Context</span>
             <TutorMarkdownRenderer content={description} density="compact" />
          </div>
        )}
        {relatedTopics.length > 0 && (
          <div className="rounded-2xl border border-white/10 bg-black/10 p-4 text-sm leading-6 text-foreground/90">
             <span className="font-semibold text-violet-300 block mb-1">Related Topics</span>
             <ul className="list-disc list-inside space-y-1">
               {relatedTopics.map((topic) => (
                 <li key={topic}>{topic}</li>
               ))}
             </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIInsightPanel;
