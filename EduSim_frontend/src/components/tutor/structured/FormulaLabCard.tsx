import React from "react";
import { BlockMath, InlineMath } from "@/components/math/Katex";
import { Link, useParams } from "@tanstack/react-router";
import { Activity, FunctionSquare, Atom } from "lucide-react";
import "katex/dist/katex.min.css";

interface FormulaData {
  expression?: string;
  meaning?: string;
  variables?: Record<string, string>;
}

interface FormulaLabCardProps {
  formula?: FormulaData;
}

export function FormulaLabCard({ formula }: FormulaLabCardProps) {
  const params = useParams({ strict: false }) as any;
  const classId = params.classId || "9";
  const subject = params.subject || "physics";

  if (!formula || (!formula.expression && !formula.meaning)) return null;

  const topicName = formula.meaning || "Formula";
  const hasVariables = formula.variables && Object.keys(formula.variables).length > 0;

  return (
    <div className="w-full relative overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/60 p-6 sm:p-8 backdrop-blur-2xl shadow-xl transition-all duration-300 hover:border-violet-500/40 hover:shadow-violet-500/5">
      {/* Dynamic background lighting */}
      <div className="absolute -right-16 -top-16 w-48 h-48 bg-violet-600/10 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute -left-16 -bottom-16 w-48 h-48 bg-fuchsia-600/10 blur-[100px] rounded-full pointer-events-none" />

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-violet-500/15 border border-violet-500/20 text-violet-400">
          <FunctionSquare className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-violet-400/80">Interactive Lab</span>
          <h3 className="text-base sm:text-lg font-black tracking-tight text-white">{formula.meaning || "Key Equation"}</h3>
        </div>
      </div>

      {/* Formula Display with centering & KaTeX */}
      {formula.expression && (
        <div className="my-6 py-5 px-4 overflow-x-auto custom-scrollbar bg-black/40 rounded-2xl border border-white/5 shadow-inner text-center">
          <div className="text-xl sm:text-2xl font-bold text-white leading-normal">
            <BlockMath math={formula.expression} />
          </div>
        </div>
      )}

      {/* Variables Grid */}
      {hasVariables && (
        <div className="space-y-3 mt-6">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">Variables Breakdown</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(formula.variables!).map(([sym, desc]) => (
              <div
                key={sym}
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all"
              >
                <span className="font-mono text-sm font-bold text-violet-300 shrink-0">
                  <InlineMath math={sym} />
                </span>
                <span className="text-slate-600 text-xs">→</span>
                <span className="text-xs text-slate-300 truncate" title={desc}>
                  {desc}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Explore Button */}
      <div className="mt-8 pt-6 border-t border-white/5 flex flex-col sm:flex-row justify-end gap-3">
        <Link
          to="/formula-lab/$topic"
          params={{ topic: topicName }}
          search={{ 
            classId, 
            subject,
            formulaExpression: formula.expression,
            formulaMeaning: formula.meaning
          }}
          className="group relative inline-flex items-center gap-2.5 rounded-[2rem] bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 px-6 py-3 text-xs font-bold text-white transition-all hover:-translate-y-0.5 active:scale-95 shadow-lg shadow-violet-500/25 hover:shadow-violet-500/35 w-full sm:w-auto justify-center"
        >
          <Activity className="h-4 w-4" />
          <span>Explore in Formula Lab</span>
        </Link>
        <Link
          to="/sandbox/$simulationId"
          params={{ simulationId: "default" }}
          search={{ query: formula.meaning ? `Explain ${formula.meaning}` : (formula.expression ? `Explain ${formula.expression}` : "Physics Simulation") }}
          className="group relative inline-flex items-center gap-2.5 rounded-[2rem] bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] hover:border-white/20 px-6 py-3 text-xs font-bold text-white transition-all hover:-translate-y-0.5 active:scale-95 shadow-lg w-full sm:w-auto justify-center"
        >
          <Atom className="h-4 w-4 text-violet-400" />
          <span>Create Simulation</span>
        </Link>
      </div>
    </div>
  );
}

export default FormulaLabCard;
